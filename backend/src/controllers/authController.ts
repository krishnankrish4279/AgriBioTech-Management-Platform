import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Farmer, ActivityLog } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'agribiotech_super_secret_jwt_key_2026';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).lean();
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const tokenPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    const farmerProfile = await Farmer.findOne({ userId: user._id }).lean();

    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        farmerProfile,
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const demoLogin = async (_req: Request, res: Response): Promise<void> => {
  res.status(403).json({
    error: 'Direct demo login without credentials has been disabled for security. Every user must authenticate by entering their registered email and password.'
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    const user = await User.findById(req.user.id).select('-passwordHash').lean();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const farmerProfile = await Farmer.findOne({ userId: user._id }).lean();

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      farmerProfile,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

export const getUsers = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    const formatted = users.map(u => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone, state, district, farmSizeAcres, primaryCrops } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email and password are required' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail }).lean();
    if (existing) {
      res.status(400).json({ error: 'Email is already registered' });
      return;
    }

    const requestedRole = (role || '').toLowerCase();
    if (requestedRole === 'admin') {
      res.status(403).json({ error: 'Security Restriction: Administrative privileges cannot be granted through public registration.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Public registration strictly assigns farmer role; privileged roles must be created by an administrator
    const newUser = await User.create({
      name,
      email: cleanEmail,
      passwordHash,
      role: 'farmer',
      phone: phone || undefined,
    });

    let farmerProfile = null;
    farmerProfile = await Farmer.create({
      userId: newUser._id,
      fullName: name,
      phone: phone || 'N/A',
      email: cleanEmail,
      state: state || 'Telangana',
      district: district || 'Warangal',
      farmSizeAcres: parseFloat(farmSizeAcres) || 5.0,
      primaryCrops: primaryCrops || 'Cotton, Chilli',
    });

    const tokenPayload = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        farmerProfile,
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const registerAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Full name, email address, and password are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    // Security Guard: Prevent unauthorized visitors from creating additional administrator accounts
    const adminCount = await User.countDocuments({ role: { $in: ['admin', 'ADMIN'] } });
    if (adminCount > 0) {
      let isExistingAdmin = false;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          if (decoded && (decoded.role || '').toLowerCase() === 'admin') {
            isExistingAdmin = true;
          }
        } catch {
          // invalid or expired token
        }
      }

      if (!isExistingAdmin) {
        res.status(403).json({
          error: 'Administrator accounts already exist. For security, additional administrators must be created by an authenticated administrator.'
        });
        return;
      }
    }

    // Check if email already registered
    const existing = await User.findOne({ email: cleanEmail }).lean();
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newAdmin = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: 'admin',
      phone: phone ? phone.trim() : undefined,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    // Record audit trail log
    await ActivityLog.create({
      userId: newAdmin._id,
      action: 'ADMIN_REGISTRATION',
      module: 'User Authentication',
      details: `New administrator registered: ${newAdmin.name} (${newAdmin.email})`,
    });

    const tokenPayload = {
      id: newAdmin._id.toString(),
      name: newAdmin.name,
      email: newAdmin.email,
      role: 'admin',
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Admin account created successfully!',
      token,
      user: {
        id: newAdmin._id.toString(),
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        avatarUrl: newAdmin.avatarUrl,
        phone: newAdmin.phone,
      }
    });
  } catch (error: any) {
    console.error('Error creating admin account:', error);
    res.status(500).json({ error: 'Failed to create admin account. Please try again.' });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'Name, email, password, and role are required' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      res.status(409).json({ error: 'A user with this email address already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role.toLowerCase(),
      phone: phone ? phone.trim() : undefined,
    });

    if (newUser.role === 'farmer') {
      const existingFarmer = await Farmer.findOne({ email: cleanEmail });
      if (!existingFarmer) {
        await Farmer.create({
          userId: newUser._id,
          fullName: newUser.name,
          phone: phone || '+91-98000-00000',
          email: cleanEmail,
          state: 'Tamil Nadu',
          district: 'Kanchipuram',
          farmSizeAcres: 5.0,
          primaryCrops: 'Rice, Cotton',
        });
      }
    }

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'CREATE_USER',
        module: 'User Management',
        details: `Created new user: ${newUser.name} (${newUser.email}) with role ${newUser.role}`,
      });
    }

    res.status(201).json({
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      avatarUrl: newUser.avatarUrl,
      createdAt: newUser.createdAt,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role.toLowerCase();
    if (phone !== undefined) user.phone = phone ? phone.trim() : undefined;

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    await user.save();

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'UPDATE_USER',
        module: 'User Management',
        details: `Updated user profile/role for ${user.name} (${user.email})`,
      });
    }

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      updatedAt: user.updatedAt,
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user && req.user.id === id) {
      res.status(400).json({ error: 'Cannot delete your own active administrator account' });
      return;
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'DELETE_USER',
        module: 'User Management',
        details: `Deleted user: ${user.name} (${user.email})`,
      });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

