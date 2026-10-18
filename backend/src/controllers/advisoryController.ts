import { Request, Response } from 'express';
import { FarmerAdvisory, Farmer, User, Notification, ActivityLog } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAdvisories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { farmerId, category, priority, isRead, search } = req.query;

    const filter: any = {};

    // If logged in as a farmer, strictly limit advisories to their own farm profile
    if (req.user && req.user.role && req.user.role.toLowerCase() === 'farmer') {
      const farmerProfile = await Farmer.findOne({ userId: req.user.id });
      if (farmerProfile) {
        filter.farmerId = farmerProfile._id;
      }
    } else if (farmerId && typeof farmerId === 'string' && farmerId !== 'undefined' && farmerId !== '') {
      filter.farmerId = farmerId;
    }

    if (category && typeof category === 'string' && category !== 'ALL' && category !== 'undefined' && category !== '') {
      filter.category = category;
    }

    if (priority && typeof priority === 'string' && priority !== 'ALL' && priority !== 'undefined' && priority !== '') {
      filter.priority = { $regex: new RegExp(`^${priority}$`, 'i') };
    }

    if (isRead !== undefined && isRead !== 'ALL' && isRead !== 'undefined' && isRead !== '') {
      filter.isRead = isRead === 'true';
    }

    if (search && typeof search === 'string' && search !== 'undefined' && search.trim() !== '') {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { message: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const advisories = await FarmerAdvisory.find(filter)
      .populate('farmerId')
      .populate('advisorId', 'name role')
      .sort({ createdAt: -1 });

    const formatted = advisories.map(a => {
      const farmer: any = a.farmerId;
      const advisor: any = a.advisorId;

      return {
        id: a._id.toString(),
        farmerId: farmer?._id?.toString() || '',
        farmer: farmer ? {
          id: farmer._id.toString(),
          fullName: farmer.fullName,
          phone: farmer.phone,
          state: farmer.state,
          preferredLanguage: farmer.preferredLanguage,
        } : undefined,
        advisorId: advisor?._id?.toString() || '',
        advisor: advisor ? {
          id: advisor._id.toString(),
          name: advisor.name,
          role: advisor.role,
        } : undefined,
        title: a.title,
        category: a.category,
        message: a.message,
        priority: (a.priority || 'ROUTINE').toUpperCase(),
        isRead: a.isRead,
        readAt: a.readAt,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      };
    });

    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching advisories:', error);
    res.status(500).json({ error: 'Failed to fetch advisories' });
  }
};

export const createAdvisory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { farmerId, title, category, message, priority = 'ROUTINE' } = req.body;

    if (!farmerId || !title || !category || !message) {
      res.status(400).json({ error: 'Farmer, title, category, and message are required.' });
      return;
    }

    const advisorUser = req.user ? await User.findById(req.user.id) : await User.findOne({ role: { $in: ['agronomist', 'AGRONOMIST', 'biotech_expert', 'BIOTECH_EXPERT', 'admin', 'ADMIN'] } });
    const advisorId = advisorUser?._id;

    if (!advisorId) {
      res.status(400).json({ error: 'Advisor identity required' });
      return;
    }

    const advisory = await FarmerAdvisory.create({
      farmerId,
      advisorId,
      title,
      category,
      message,
      priority: priority.toUpperCase(),
      isRead: false,
    });

    const farmer = await Farmer.findById(farmerId);
    if (farmer && farmer.userId) {
      await Notification.create({
        recipientUserId: farmer.userId,
        type: 'NEW_ADVISORY',
        title: `New Advisory: ${title}`,
        message: message.substring(0, 120) + '...',
        severity: priority === 'URGENT' ? 'DANGER' : priority === 'IMPORTANT' ? 'WARNING' : 'INFO',
        linkUrl: '/advisories',
      });
    }

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'DISPATCH_ADVISORY',
        module: 'Farmer Advisory Services',
        details: `Sent ${priority} advisory to ${farmer?.fullName || 'Farmer'}: "${title}"`,
      });
    }

    res.status(201).json({
      id: advisory._id.toString(),
      ...advisory.toObject(),
    });
  } catch (error: any) {
    console.error('Error creating advisory:', error);
    res.status(500).json({ error: 'Failed to dispatch advisory message' });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const advisory = await FarmerAdvisory.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    res.json(advisory);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark advisory as read' });
  }
};

export const deleteAdvisory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await FarmerAdvisory.findByIdAndDelete(id);
    res.json({ message: 'Advisory deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete advisory' });
  }
};
