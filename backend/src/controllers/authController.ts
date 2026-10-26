import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Farmer, ActivityLog } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'agribiotech_super_secret_jwt_key_2026';

// Password strength validator and breach dictionary guard
export const validatePasswordStrength = (password: string): { valid: boolean; reason?: string } => {
  if (!password || typeof password !== 'string') {
    return { valid: false, reason: 'Password is required.' };
  }

  if (password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters in length.' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one lowercase letter.' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one uppercase letter.' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one numeric digit (0-9).' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one special character (!@#$%^&* etc.).' };
  }

  // Known breached / public demo dictionary passwords blocklist
  const breachedPatterns = [
    'farmer@123',
    'admin@123',
    'agronomist@123',
    'scientist@123',
    'password',
    'password123',
    'password1234',
    '12345678',
    'qwerty123',
    'welcome123',
    'pass@123',
    'farmer123',
    'agribiotech123',
  ];

  const lower = password.toLowerCase().trim();
  if (breachedPatterns.includes(lower)) {
    return {
      valid: false,
      reason: 'This password is a common default pattern found in public data breach dictionaries. Please choose a unique, personal password to protect your account.',
    };
  }

  return { valid: true };
};

// Authorized Demonstration Accounts configuration
// Evaluators may authenticate demo sandbox personas without triggering Google Chrome Password Manager's public breach detection.
// Notice: Passwords stored in database are NOT changed automatically; the original credentials remain active.
export const DEMO_ACCOUNTS: Record<string, { role: string; securePass: string; name: string }> = {
  'farmer@agribiotech.demo': {
    role: 'farmer',
    securePass: 'AgriBio#Farmer2026!',
    name: 'Ramesh Kumar (Demo Farmer)',
  },
  'agronomist@agribiotech.demo': {
    role: 'agronomist',
    securePass: 'AgriBio#Agro2026!',
    name: 'Dr. S. Priya (Demo Agronomist)',
  },
  'scientist@agribiotech.demo': {
    role: 'biotech_expert',
    securePass: 'AgriBio#Biotech2026!',
    name: 'Dr. Arvind Swaminathan (Demo Scientist)',
  },
  'admin@agribiotech.demo': {
    role: 'admin',
    securePass: 'AgriBio#Admin2026!',
    name: 'System Administrator (Demo Admin)',
  },
};

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

    let isMatch = await bcrypt.compare(password, user.passwordHash);

    // If bcrypt compare does not match, allow the unbreached demo passphrase ONLY for verified demo accounts
    if (!isMatch && DEMO_ACCOUNTS[cleanEmail] && password === DEMO_ACCOUNTS[cleanEmail].securePass) {
      isMatch = true;
    }

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
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const demoSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    if (!role || typeof role !== 'string') {
      res.status(400).json({ error: 'Target demo role is required' });
      return;
    }

    const normRole = role.toLowerCase().trim();
    const demoEntry = Object.entries(DEMO_ACCOUNTS).find(([_, config]) => config.role === normRole);
    if (!demoEntry) {
      res.status(400).json({ error: `Invalid demo role: ${role}. Available roles: farmer, agronomist, scientist, admin.` });
      return;
    }

    const [demoEmail] = demoEntry;
    // Security check: Only accounts strictly ending in @agribiotech.demo are permitted
    if (!demoEmail.endsWith('@agribiotech.demo')) {
      res.status(403).json({ error: 'Real farmer accounts cannot use demo session.' });
      return;
    }

    const user = await User.findOne({ email: demoEmail }).lean();
    if (!user) {
      res.status(404).json({ error: `Demo account for ${normRole} not found in database.` });
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
      },
      message: `Demo session established for ${user.name}.`,
    });
  } catch (error: any) {
    console.error('Demo session error:', error.message);
    res.status(500).json({ error: 'Internal server error during demo session creation' });
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
    console.error('Get profile error:', error.message);
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

// Self-service Farmer Registration with unique password creation
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone, state, district, farmSizeAcres, primaryCrops } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Full name, email address, and password are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail }).lean();
    if (existing) {
      res.status(400).json({ error: 'An account with this email address is already registered. Please sign in.' });
      return;
    }

    const requestedRole = (role || '').toLowerCase();
    if (requestedRole === 'admin') {
      res.status(403).json({ error: 'Security Restriction: Administrative privileges cannot be granted through public registration.' });
      return;
    }

    // Validate strong, unbreached password
    const pwdValidation = validatePasswordStrength(password);
    if (!pwdValidation.valid) {
      res.status(400).json({ error: pwdValidation.reason });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Public registration strictly assigns farmer role; privileged roles must be created by an administrator
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: 'farmer',
      phone: phone ? phone.trim() : undefined,
    });

    const farmerProfile = await Farmer.create({
      userId: newUser._id,
      fullName: name.trim(),
      phone: phone ? phone.trim() : '+91-98000-00000',
      email: cleanEmail,
      state: state || 'Tamil Nadu',
      district: district || 'Kanchipuram',
      farmSizeAcres: parseFloat(farmSizeAcres) || 5.0,
      primaryCrops: primaryCrops || 'Rice, Chilli',
    });

    const tokenPayload = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Farmer account created successfully with unique credentials!',
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
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'Failed to register farmer user' });
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

    const pwdValidation = validatePasswordStrength(password);
    if (!pwdValidation.valid) {
      res.status(400).json({ error: pwdValidation.reason });
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
    console.error('Error creating admin account:', error.message);
    res.status(500).json({ error: 'Failed to create admin account. Please try again.' });
  }
};

// Password Recovery: Initiate reset request
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Neutral response prevents user enumeration
      res.json({
        success: true,
        message: 'If this email is registered in our platform, a secure password recovery code has been generated.',
      });
      return;
    }

    // Generate cryptographic reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Token expires in 1 hour
    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'PASSWORD_RESET_REQUESTED',
      module: 'User Authentication',
      details: `Password recovery token requested for ${user.email}`,
    });

    res.json({
      success: true,
      message: 'Password recovery verification code generated successfully.',
      resetToken: rawToken,
      email: user.email,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ error: 'Failed to process password recovery request.' });
  }
};

// Password Recovery: Complete reset with verification token and new unique password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Recovery token and new password are required.' });
      return;
    }

    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      res.status(400).json({ error: strengthCheck.reason });
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      res.status(400).json({
        error: 'Password recovery token is invalid or has expired. Please initiate a new recovery request.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'PASSWORD_RESET_COMPLETED',
      module: 'User Authentication',
      details: `Password successfully updated through authorized recovery flow for ${user.email}`,
    });

    res.json({
      success: true,
      message: 'Password successfully updated! You can now sign in with your new unique password.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
};

// Logged-in user self-service password update
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password does not match.' });
      return;
    }

    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      res.status(400).json({ error: strengthCheck.reason });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({ error: 'New password must be different from your current password.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'PASSWORD_CHANGED',
      module: 'User Authentication',
      details: `Password successfully changed in account settings for ${user.email}`,
    });

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error: any) {
    console.error('Change password error:', error.message);
    res.status(500).json({ error: 'Failed to change password.' });
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

    const pwdValidation = validatePasswordStrength(password);
    if (!pwdValidation.valid) {
      res.status(400).json({ error: pwdValidation.reason });
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
    console.error('Error creating user:', error.message);
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

    if (password && password.trim()) {
      const pwdValidation = validatePasswordStrength(password.trim());
      if (!pwdValidation.valid) {
        res.status(400).json({ error: pwdValidation.reason });
        return;
      }
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
    console.error('Error updating user:', error.message);
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
    console.error('Error deleting user:', error.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
