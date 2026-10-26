import { Router } from 'express';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

import * as authController from '../controllers/authController';
import * as varietyController from '../controllers/varietyController';
import * as diseaseController from '../controllers/diseaseController';
import * as recommendationController from '../controllers/recommendationController';
import * as observationController from '../controllers/observationController';
import * as farmerController from '../controllers/farmerController';
import * as advisoryController from '../controllers/advisoryController';
import * as notificationController from '../controllers/notificationController';
import * as analyticsController from '../controllers/analyticsController';

const router = Router();

// Image upload standalone route
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file uploaded' });
    return;
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.filename });
});

// Authentication & User Management Routes
router.post('/auth/login', authController.login);
router.post('/auth/demo-login', authController.demoLogin);
router.post('/auth/register', authController.register);
router.post('/auth/register-admin', authController.registerAdmin);
router.get('/auth/me', authenticate, authController.getMe);
router.get('/auth/users', authenticate, requireRole(['admin']), authController.getUsers);

// Admin User Management CRUD
router.get('/users', authenticate, requireRole(['admin']), authController.getUsers);
router.post('/users', authenticate, requireRole(['admin']), authController.createUser);
router.put('/users/:id', authenticate, requireRole(['admin']), authController.updateUser);
router.delete('/users/:id', authenticate, requireRole(['admin']), authController.deleteUser);
router.post('/admin/seed', authenticate, requireRole(['admin']), async (_req, res) => {
  try {
    const { ensureDemoUsers } = await import('../config/database');
    await ensureDemoUsers(true);
    res.json({ success: true, message: 'Production demo data and user hashes successfully synchronized.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to seed demo data', message: err.message });
  }
});

// Crop Variety Management (CRUD)
router.get('/varieties', optionalAuth, varietyController.getVarieties);
router.get('/varieties/:id', optionalAuth, varietyController.getVarietyById);
router.post('/varieties', authenticate, requireRole(['admin', 'biotech_expert']), varietyController.createVariety);
router.put('/varieties/:id', authenticate, requireRole(['admin', 'biotech_expert']), varietyController.updateVariety);
router.delete('/varieties/:id', authenticate, requireRole(['admin', 'biotech_expert']), varietyController.deleteVariety);

// Disease Surveillance & Reports (CRUD)
router.get('/diseases', optionalAuth, diseaseController.getDiseaseCases);
router.post('/diseases', authenticate, upload.single('image'), diseaseController.reportDiseaseCase);
router.post('/diseases/farmer-report', authenticate, upload.single('image'), diseaseController.reportFarmerProblem);
router.get('/diseases/catalog', optionalAuth, diseaseController.getDiseasesCatalog);
router.get('/diseases/cases', optionalAuth, diseaseController.getDiseaseCases);
router.get('/diseases/cases/:id', optionalAuth, diseaseController.getDiseaseCaseById);
router.get('/diseases/:id', optionalAuth, diseaseController.getDiseaseCaseById);
router.get('/disease-surveillance/:id', optionalAuth, diseaseController.getDiseaseCaseById);
router.post('/diseases/cases', authenticate, upload.single('image'), diseaseController.reportDiseaseCase);
router.put('/diseases/cases/:id', authenticate, requireRole(['admin', 'agronomist', 'biotech_expert']), diseaseController.updateDiseaseCase);
router.put('/diseases/:id', authenticate, requireRole(['admin', 'agronomist', 'biotech_expert']), diseaseController.updateDiseaseCase);
router.delete('/diseases/cases/:id', authenticate, requireRole(['admin', 'agronomist']), diseaseController.deleteDiseaseCase);
router.delete('/diseases/:id', authenticate, requireRole(['admin', 'agronomist']), diseaseController.deleteDiseaseCase);
router.post('/diseases/sync-coordinates', optionalAuth, diseaseController.syncDiseaseCoordinates);

// Biotechnology Recommendations (CRUD)
router.get('/recommendations', optionalAuth, recommendationController.getRecommendations);
router.get('/recommendations/:id', optionalAuth, recommendationController.getRecommendationById);
router.post('/recommendations', authenticate, requireRole(['admin', 'biotech_expert']), recommendationController.createRecommendation);
router.post('/recommendations/generate-ai', authenticate, requireRole(['admin', 'biotech_expert']), recommendationController.generateAIRecommendations);
router.put('/recommendations/:id', authenticate, requireRole(['admin', 'biotech_expert', 'agronomist', 'farmer']), recommendationController.updateRecommendation);
router.delete('/recommendations/:id', authenticate, requireRole(['admin', 'biotech_expert']), recommendationController.deleteRecommendation);

// Field Observations (CRUD)
router.get('/observations', optionalAuth, observationController.getObservations);
router.get('/observations/:id', optionalAuth, observationController.getObservationById);
router.post('/observations', authenticate, requireRole(['admin', 'agronomist']), upload.single('photo'), observationController.recordObservation);
router.put('/observations/:id', authenticate, requireRole(['admin', 'agronomist']), observationController.updateObservation);
router.delete('/observations/:id', authenticate, requireRole(['admin', 'agronomist']), observationController.deleteObservation);

// Farmer & Farm Management (CRUD)
router.get('/farmers', authenticate, requireRole(['admin', 'agronomist']), farmerController.getFarmers);
router.get('/farmers/:id', authenticate, farmerController.getFarmerById);
router.post('/farmers', authenticate, requireRole(['admin', 'agronomist']), farmerController.createFarmer);
router.put('/farmers/:id', authenticate, requireRole(['admin', 'agronomist']), farmerController.updateFarmer);
router.delete('/farmers/:id', authenticate, requireRole(['admin', 'agronomist']), farmerController.deleteFarmer);
router.get('/farms', optionalAuth, farmerController.getFarmsList);
router.post('/farms', authenticate, requireRole(['admin', 'agronomist']), farmerController.addFarmPlot);

// Farmer Advisories (CRUD)
router.get('/advisories', optionalAuth, advisoryController.getAdvisories);
router.post('/advisories', authenticate, requireRole(['admin', 'agronomist']), advisoryController.createAdvisory);
router.patch('/advisories/:id/read', optionalAuth, advisoryController.markAsRead);
router.delete('/advisories/:id', authenticate, requireRole(['admin', 'agronomist']), advisoryController.deleteAdvisory);

// Notifications & Activity Stream
router.get('/notifications', optionalAuth, notificationController.getNotifications);
router.patch('/notifications/:id/read', optionalAuth, notificationController.markNotificationRead);
router.post('/notifications/read-all', optionalAuth, notificationController.markAllNotificationsRead);
router.get('/activities', optionalAuth, notificationController.getRecentActivities);

// Role-Protected Dashboard Endpoints (Enforces cross-role isolation)
router.get('/dashboard/admin', authenticate, requireRole(['admin']), analyticsController.getDashboardStatistics);
router.get('/dashboard/agronomist', authenticate, requireRole(['agronomist']), analyticsController.getDashboardStatistics);
router.get('/dashboard/biotech', authenticate, requireRole(['biotech_expert']), analyticsController.getDashboardStatistics);
router.get('/dashboard/farmer', authenticate, requireRole(['farmer']), advisoryController.getAdvisories);

// Dashboard & Analytics Endpoints
router.get('/dashboard/statistics', optionalAuth, analyticsController.getDashboardStatistics);
router.get('/dashboard/disease-trends', optionalAuth, analyticsController.getDashboardDiseaseTrends);
router.get('/dashboard/recent-activities', optionalAuth, notificationController.getRecentActivities);
router.get('/analytics/kpis', optionalAuth, analyticsController.getDashboardStatistics);
router.get('/analytics/charts', optionalAuth, analyticsController.getAnalyticsCharts);

// Security Event Recording & Audit API
router.post('/security/events', authenticate, async (req: any, res: any) => {
  try {
    const { recordSecurityEvent } = await import('../services/securityService');
    const { attemptedResource, targetRole, requestedRoute, outcome = 'denied', details, targetUserId } = req.body;

    await recordSecurityEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      attemptedResource: attemptedResource || requestedRoute || 'unknown',
      targetRole: targetRole || 'restricted',
      requestedRoute: requestedRoute || attemptedResource || 'unknown',
      outcome: outcome === 'allowed' ? 'allowed' : 'denied',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: details || `Frontend guard reported security event for ${requestedRoute}`,
      targetUserId,
    });

    res.status(201).json({ success: true, message: 'Security event recorded' });
  } catch (error: any) {
    console.error('Error logging security event endpoint:', error);
    res.status(500).json({ error: 'Failed to record security event' });
  }
});

router.get('/security/events', authenticate, requireRole(['admin']), async (_req: any, res: any) => {
  try {
    const { SecurityEvent } = await import('../models');
    const events = await SecurityEvent.find().sort({ timestamp: -1 }).limit(50).lean();
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

export default router;
