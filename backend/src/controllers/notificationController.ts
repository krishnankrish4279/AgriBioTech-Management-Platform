import { Request, Response } from 'express';
import { Notification, ActivityLog } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user ? req.user.id : undefined;

    const filter: any = {};
    if (userId) {
      filter.recipientUserId = userId;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

    const formatted = notifications.map(n => ({
      id: n._id.toString(),
      recipientUserId: n.recipientUserId.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      severity: n.severity,
      isRead: n.isRead,
      linkUrl: n.linkUrl,
      createdAt: n.createdAt,
    }));

    res.json({
      notifications: formatted,
      unreadCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    await Notification.updateMany(
      userId ? { recipientUserId: userId, isRead: false } : { isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

export const getRecentActivities = async (_req: Request, res: Response): Promise<void> => {
  try {
    const activities = await ActivityLog.find()
      .populate('userId', 'name role avatarUrl')
      .sort({ createdAt: -1 })
      .limit(15);

    const formatted = activities.map(act => {
      const user: any = act.userId;
      return {
        id: act._id.toString(),
        userId: user?._id?.toString(),
        user: user ? {
          id: user._id.toString(),
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
        } : undefined,
        action: act.action,
        module: act.module,
        details: act.details,
        createdAt: act.createdAt,
      };
    });

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
};
