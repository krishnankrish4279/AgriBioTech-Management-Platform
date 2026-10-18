import { Request, Response } from 'express';
import {
  User,
  Farmer,
  Farm,
  CropVariety,
  DiseaseReport,
  BiotechnologyRecommendation,
  FieldObservation,
  FarmerAdvisory,
  ActivityLog,
} from '../models';

export const getDashboardStatistics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalFarmers,
      totalFarms,
      totalVarieties,
      totalDiseaseCases,
      criticalDiseaseCases,
      totalRecommendations,
      totalObservations,
      totalAdvisories,
    ] = await Promise.all([
      User.countDocuments(),
      Farmer.countDocuments(),
      Farm.countDocuments(),
      CropVariety.countDocuments(),
      DiseaseReport.countDocuments(),
      DiseaseReport.countDocuments({
        severity: { $in: ['CRITICAL', 'HIGH', 'critical', 'high'] },
        status: { $in: ['ACTIVE', 'active'] },
      }),
      BiotechnologyRecommendation.countDocuments({ status: { $in: ['ACTIVE', 'active'] } }),
      FieldObservation.countDocuments(),
      FarmerAdvisory.countDocuments(),
    ]);

    const activeOutbreakDocs = await DiseaseReport.find({ status: { $in: ['ACTIVE', 'active'] } })
      .populate('farmId')
      .populate('cropVarietyId')
      .sort({ dateObserved: -1 })
      .limit(4)
      .lean();

    const activeOutbreaks = activeOutbreakDocs.map(c => {
      const farm: any = c.farmId;
      const variety: any = c.cropVarietyId;
      return {
        id: c._id.toString(),
        diseaseName: c.diseaseName,
        symptoms: c.symptoms,
        severity: (c.severity || 'MEDIUM').toUpperCase(),
        latitude: c.latitude,
        longitude: c.longitude,
        dateObserved: c.dateObserved,
        status: (c.status || 'ACTIVE').toUpperCase(),
        farm: {
          farmName: farm?.farmName || 'Monitored Plot',
          locationAddress: farm?.locationAddress || 'Agricultural Zone',
        },
        cropVariety: variety ? {
          varietyName: variety.varietyName,
          cropName: variety.cropName,
        } : undefined,
      };
    });

    res.json({
      totalUsers,
      totalFarmers,
      totalFarms,
      totalVarieties,
      totalDiseaseCases,
      criticalDiseaseCases,
      totalRecommendations,
      totalObservations,
      totalAdvisories,
      activeOutbreaks,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard statistics from MongoDB:', error);
    res.status(500).json({ error: 'Failed to calculate dashboard statistics' });
  }
};

export const getDashboardDiseaseTrends = async (_req: Request, res: Response): Promise<void> => {
  try {
    const monthlyDiseaseTrends = [
      { month: 'Mar', Cotton: 1, Chilli: 0, Wheat: 2, Rice: 0, Tomato: 0, Maize: 1 },
      { month: 'Apr', Cotton: 2, Chilli: 1, Wheat: 3, Rice: 1, Tomato: 1, Maize: 1 },
      { month: 'May', Cotton: 3, Chilli: 2, Wheat: 4, Rice: 1, Tomato: 2, Maize: 2 },
      { month: 'Jun', Cotton: 5, Chilli: 4, Wheat: 2, Rice: 3, Tomato: 2, Maize: 3 },
      { month: 'Jul', Cotton: 6, Chilli: 5, Wheat: 1, Rice: 4, Tomato: 3, Maize: 2 },
      { month: 'Aug', Cotton: 4, Chilli: 3, Wheat: 2, Rice: 2, Tomato: 1, Maize: 1 },
    ];

    res.json({ trends: monthlyDiseaseTrends });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch disease trends' });
  }
};

export const getAnalyticsCharts = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Severity Distribution
    const severityCounts = await DiseaseReport.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    // 2. Crop Type Distribution
    const cropTypeCounts = await CropVariety.aggregate([
      { $group: { _id: '$cropType', count: { $sum: 1 } } }
    ]);

    // 3. Recommendation Type Breakdown
    const recTypeCounts = await BiotechnologyRecommendation.aggregate([
      { $group: { _id: '$recommendationType', count: { $sum: 1 } } }
    ]);

    // 4. Growth Stage Observations
    const growthStageCounts = await FieldObservation.aggregate([
      { $group: { _id: '$growthStage', count: { $sum: 1 } } }
    ]);

    // 5. Crop Variety Yield Benchmarks
    const varieties = await CropVariety.find().select('cropName varietyName expectedYieldMin expectedYieldMax maturityDays yieldUnit').limit(6).lean();

    const monthlyDiseaseTrends = [
      { month: 'Mar', Wheat: 2, Rice: 0, Cotton: 1, Maize: 1, Tomato: 0 },
      { month: 'Apr', Wheat: 4, Rice: 1, Cotton: 2, Maize: 2, Tomato: 1 },
      { month: 'May', Wheat: 6, Rice: 2, Cotton: 3, Maize: 4, Tomato: 2 },
      { month: 'Jun', Wheat: 3, Rice: 4, Cotton: 5, Maize: 3, Tomato: 3 },
      { month: 'Jul', Wheat: 1, Rice: 7, Cotton: 6, Maize: 5, Tomato: 4 },
      { month: 'Aug', Wheat: 2, Rice: 5, Cotton: 4, Maize: 2, Tomato: 3 },
    ];

    res.json({
      severityDistribution: severityCounts.map(s => ({ name: (s._id || 'MEDIUM').toUpperCase(), count: s.count })),
      cropTypeDistribution: cropTypeCounts.map(c => ({ name: c._id || 'CEREAL', count: c.count })),
      recommendationTypeDistribution: recTypeCounts.map(r => ({ name: r._id || 'BIOFERTILIZER', count: r.count })),
      growthStageDistribution: growthStageCounts.map(g => ({ name: g._id || 'VEGETATIVE', count: g.count })),
      varietiesYieldComparison: varieties.map(v => ({
        name: v.varietyName.length > 18 ? v.varietyName.substring(0, 18) + '...' : v.varietyName,
        minYield: v.expectedYieldMin,
        maxYield: v.expectedYieldMax,
        avgYield: (v.expectedYieldMin + v.expectedYieldMax) / 2,
        maturityDays: v.maturityDays,
      })),
      monthlyDiseaseTrends,
    });
  } catch (error: any) {
    console.error('Error fetching analytics from MongoDB:', error);
    res.status(500).json({ error: 'Failed to fetch analytics datasets' });
  }
};
