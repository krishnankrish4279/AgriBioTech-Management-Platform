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
  } catch (err: any) {
    console.error('Error ensuring demo users and data:', err.message);
  }
};

const getMongoUri = (): string => {
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) {
    return process.env.MONGODB_URI.trim();
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
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 20000,
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
