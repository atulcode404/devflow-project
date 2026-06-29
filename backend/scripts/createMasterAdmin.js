import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load env vars
dotenv.config();

const createMasterAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    const adminName = process.env.MASTER_ADMIN_NAME || 'Master Admin';
    const adminEmail = process.env.MASTER_ADMIN_EMAIL || 'admin@devflow.com';
    const adminPassword = process.env.MASTER_ADMIN_PASSWORD || 'strongpassword';
    const adminRole = process.env.MASTER_ADMIN_ROLE || 'master_admin';

    // Check if master admin already exists
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log(`Master Admin with email ${adminEmail} already exists!`);
      process.exit(0);
    }

    // Create master admin
    const masterAdmin = await User.create({
      fullName: adminName,
      email: adminEmail,
      password: adminPassword,
      role: adminRole,
      skills: ['Management', 'Security', 'Analytics'],
      headline: 'Platform Administrator',
    });

    if (masterAdmin) {
      console.log('Master Admin Account created successfully!');
      console.log(`Email: ${adminEmail}`);
      console.log(`Role: ${adminRole}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating Master Admin:', error.message);
    process.exit(1);
  }
};

createMasterAdmin();
