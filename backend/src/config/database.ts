import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agribiotech';

export const ensureDemoUsers = async (): Promise<void> => {
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

    const salt = await bcrypt.genSalt(10);

    for (const demo of demoUsers) {
      const existing = await User.findOne({ email: demo.email.toLowerCase() });
      if (!existing) {
        const hash = await bcrypt.hash(demo.password, salt);
        await User.create({
          name: demo.name,
          email: demo.email.toLowerCase(),
          passwordHash: hash,
          role: demo.role,
          phone: demo.phone,
        });
        console.log(`[Demo User] Created ${demo.email} (${demo.role})`);
      } else {
        // Ensure role is correct and password can be validated
        const isMatch = await bcrypt.compare(demo.password, existing.passwordHash);
        if (!isMatch || existing.role !== demo.role) {
          existing.passwordHash = await bcrypt.hash(demo.password, salt);
          existing.role = demo.role as any;
          await existing.save();
          console.log(`[Demo User] Updated credentials for ${demo.email}`);
        }
      }
    }

    const { DiseaseReport } = await import('../models');
    await DiseaseReport.updateMany({ isDemo: { $exists: false } }, { $set: { isDemo: true } });
  } catch (err: any) {
    console.error('Error ensuring demo users and data:', err.message);
  }
};

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    await ensureDemoUsers();
  } catch (error: any) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
