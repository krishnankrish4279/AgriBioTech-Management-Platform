import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agribiotech';

let demoUsersInitialized = false;

export const ensureDemoUsers = async (): Promise<void> => {
  if (demoUsersInitialized) return;
  demoUsersInitialized = true;

  try {
    const { User } = await import('../models');
    const bcrypt = (await import('bcryptjs')).default;

    const demoUsers = [
      {
        name: 'Arjun Mehta',
        email: 'admin@agribiotech.demo',
        password: 'Admin@123',
        role: 'admin',
        phone: '+91-98111-00001',
      },
      {
        name: 'Priya Sharma',
        email: 'agronomist@agribiotech.demo',
        password: 'Agronomist@123',
        role: 'agronomist',
        phone: '+91-98222-00002',
      },
      {
        name: 'Dr. Rahul Verma',
        email: 'scientist@agribiotech.demo',
        password: 'Scientist@123',
        role: 'biotech_expert',
        phone: '+91-98333-00003',
      },
      {
        name: 'Ramesh Kumar',
        email: 'farmer@agribiotech.demo',
        password: 'Farmer@123',
        role: 'farmer',
        phone: '+91-98444-00004',
      },
    ];

    let salt: string | null = null;

    for (const demo of demoUsers) {
      const existing = await User.findOne({ email: demo.email.toLowerCase() });
      if (!existing) {
        if (!salt) salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(demo.password, salt);
        await User.create({
          name: demo.name,
          email: demo.email.toLowerCase(),
          passwordHash: hash,
          role: demo.role,
          phone: demo.phone,
        });
        console.log(`[Demo User] Initialized ${demo.email} (${demo.role})`);
      }
    }

    const { DiseaseReport } = await import('../models');
    await DiseaseReport.updateMany({ isDemo: { $exists: false } }, { $set: { isDemo: true } });

    // Safely backfill any existing disease reports lacking coordinates using their verified farm records
    const unmappedReports = await DiseaseReport.find({
      $or: [
        { latitude: { $exists: false } },
        { latitude: null },
        { latitude: 0 },
        { longitude: { $exists: false } },
        { longitude: null },
        { longitude: 0 },
      ]
    }).populate('farmId');

    for (const report of unmappedReports) {
      const f: any = report.farmId;
      if (f && typeof f.latitude === 'number' && typeof f.longitude === 'number' && !isNaN(f.latitude) && !isNaN(f.longitude) && !(f.latitude === 0 && f.longitude === 0)) {
        await DiseaseReport.updateOne(
          { _id: report._id },
          {
            $set: {
              latitude: f.latitude,
              longitude: f.longitude,
              locationAddress: report.locationAddress || f.locationAddress,
            }
          }
        );
        console.log(`[GIS Safe Sync] Linked verified farm GPS [${f.latitude}, ${f.longitude}] to report "${report.diseaseName}" (${report._id})`);
      }
    }
  } catch (err: any) {
    console.error('Error ensuring demo users and data:', err.message);
  }
};

export const sanitizeMongoUri = (rawUri: string): string => {
  try {
    const trimmed = rawUri.trim();
    if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
      return trimmed;
    }
    const scheme = trimmed.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://';
    const remainder = trimmed.slice(scheme.length);
    const atIndex = remainder.lastIndexOf('@');
    if (atIndex === -1) return trimmed; // No user credentials

    const userInfo = remainder.slice(0, atIndex);
    const hostAndParams = remainder.slice(atIndex + 1);
    const colonIndex = userInfo.indexOf(':');
    if (colonIndex === -1) return trimmed; // No password

    const username = userInfo.slice(0, colonIndex);
    const rawPassword = userInfo.slice(colonIndex + 1);
    // Safely encode special characters (e.g., @, #, ?, %) while preserving existing URL-encoding
    const encodedPassword = encodeURIComponent(decodeURIComponent(rawPassword));
    return `${scheme}${username}:${encodedPassword}@${hostAndParams}`;
  } catch {
    return rawUri.trim();
  }
};

export const getMongoUri = (): string => {
  let uri = (process.env.MONGODB_URI || '').trim();
  uri = uri.replace(/^["']|["']$/g, '').trim();
  if (uri) {
    return sanitizeMongoUri(uri);
  }
  return 'mongodb://localhost:27017/agribiotech';
};

let cachedPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) {
    if (!demoUsersInitialized) {
      demoUsersInitialized = true;
      await ensureDemoUsers();
    }
    return;
  }

  const uri = getMongoUri();

  // If in production/Vercel and MONGODB_URI is missing or pointing to localhost, fail fast with a clear error
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    if (!process.env.MONGODB_URI || uri.includes('localhost') || uri.includes('127.0.0.1')) {
      const msg = 'MONGODB_URI is not configured in Vercel environment variables. Please add your MongoDB Atlas connection string in Vercel project settings.';
      console.error(`❌ [Database Config Error] ${msg}`);
      throw new Error(msg);
    }
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || 'agribiotech',
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 30000,
      family: 4, // Force IPv4 to avoid IPv6 SRV DNS resolution failures in AWS Lambda/Vercel
    });
  }

  try {
    const conn = await cachedPromise;
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    if (!demoUsersInitialized) {
      demoUsersInitialized = true;
      await ensureDemoUsers();
    }
  } catch (error: any) {
    cachedPromise = null;
    console.error(`❌ MongoDB connection error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;
