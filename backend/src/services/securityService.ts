import mongoose from 'mongoose';
import { SecurityEvent, Notification, ActivityLog, User } from '../models';

export interface RecordSecurityEventParams {
  userId?: string;
  userName?: string;
  userRole?: string;
  attemptedResource: string;
  targetRole?: string;
  requestedRoute: string;
  outcome: 'denied' | 'allowed';
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  targetUserId?: string;
}

// In-memory rate limiting cache to suppress rapid duplicate notification storms
const notificationRateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 30000; // 30 seconds

export const recordSecurityEvent = async (params: RecordSecurityEventParams) => {
  try {
    const {
      userId,
      userName,
      userRole,
      attemptedResource,
      targetRole,
      requestedRoute,
      outcome,
      ipAddress,
      userAgent,
      details,
      targetUserId,
    } = params;

    const eventUserObjId = userId && mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : undefined;
    const targetUserObjId = targetUserId && mongoose.Types.ObjectId.isValid(targetUserId) ? new mongoose.Types.ObjectId(targetUserId) : undefined;

    // 1. Persist the Security Event
    await SecurityEvent.create({
      userId: eventUserObjId,
      userName: userName || (userRole ? `User (${userRole})` : 'Anonymous'),
      userRole: userRole || 'unknown',
      attemptedResource,
      targetRole,
      requestedRoute,
      outcome,
      ipAddress,
      userAgent,
      details: details || `Access ${outcome} for ${requestedRoute}`,
      targetUserId: targetUserObjId,
      timestamp: new Date(),
    });

    // 2. Persist audit trail in ActivityLog
    await ActivityLog.create({
      userId: eventUserObjId,
      action: outcome === 'denied' ? 'SECURITY_ACCESS_DENIED' : 'SECURITY_ACCESS_ALLOWED',
      module: 'Access Control',
      details: `[${outcome.toUpperCase()}] Role '${userRole || 'anonymous'}' attempted access to '${attemptedResource}'. Target: [${targetRole || 'N/A'}]`,
    });

    // 3. If access was denied, dispatch security notifications to Admin (and affected account owner)
    if (outcome === 'denied') {
      const targetLabel = targetRole
        ? targetRole
            .split(',')
            .map(r => r.trim().toLowerCase())
            .map(r => r === 'biotech_expert' ? 'Biotech Expert' : r.charAt(0).toUpperCase() + r.slice(1))
            .join(' / ')
        : 'Restricted';

      const alertMessage = `Security Alert: A user attempted to access a restricted ${targetLabel} resource. Access was denied.`;

      // Rate limit check: deduplicate if identical attempt notification occurred within window
      const dedupeKey = `admin_${targetLabel}_${requestedRoute}`;
      const now = Date.now();
      const lastSent = notificationRateLimitMap.get(dedupeKey);

      if (!lastSent || now - lastSent > RATE_LIMIT_WINDOW_MS) {
        notificationRateLimitMap.set(dedupeKey, now);

        // Find all administrators in MongoDB
        const admins = await User.find({ role: { $in: ['admin', 'ADMIN'] } }).lean();

        for (const admin of admins) {
          await Notification.create({
            recipientUserId: admin._id,
            type: 'SECURITY_ALERT',
            title: 'Security Alert: Access Denied',
            message: alertMessage,
            severity: 'DANGER',
            linkUrl: '/dashboard/admin',
          });
        }
      }

      // If targeted a specific account, notify that account owner
      if (targetUserObjId) {
        const targetDedupeKey = `target_${targetUserObjId.toString()}_${requestedRoute}`;
        const lastTargetSent = notificationRateLimitMap.get(targetDedupeKey);

        if (!lastTargetSent || now - lastTargetSent > RATE_LIMIT_WINDOW_MS) {
          notificationRateLimitMap.set(targetDedupeKey, now);

          await Notification.create({
            recipientUserId: targetUserObjId,
            type: 'SECURITY_ALERT',
            title: 'Security Alert: Unauthorized Account Access Attempt',
            message: `Security Alert: An unauthorized attempt to access your private account was detected and denied.`,
            severity: 'DANGER',
            linkUrl: '/dashboard/farmer',
          });
        }
      }
    }
  } catch (err) {
    console.error('Error recording security event:', err);
  }
};
