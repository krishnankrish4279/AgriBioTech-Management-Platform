import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { DiseaseReport, Disease, Farm, Farmer, User, Notification, FarmerAdvisory, ActivityLog, BiotechnologyRecommendation } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';

export const getDiseasesCatalog = async (_req: Request, res: Response): Promise<void> => {
  try {
    let diseases = await Disease.find().sort({ diseaseName: 1 });
    if (diseases.length === 0) {
      const defaultDiseases = [
        {
          diseaseName: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
          pathogenType: 'BACTERIAL',
          cropAffiliation: 'Rice (Paddy)',
          commonSymptoms: 'Water-soaked lesions on leaf margins, yellowing and wilting.',
          severityLevelDefault: 'HIGH',
          recommendedBiotechSolution: 'Copper bactericide bio-formulation + Pseudomonas fluorescens biocontrol',
          preventionProtocol: 'Balanced nitrogen fertilization and resistant cultivar adoption',
        },
        {
          diseaseName: 'Rice Blast (Magnaporthe oryzae)',
          pathogenType: 'FUNGAL',
          cropAffiliation: 'Rice (Paddy)',
          commonSymptoms: 'Diamond-shaped necrotic lesions with grey/white centers on leaves and panicles.',
          severityLevelDefault: 'CRITICAL',
          recommendedBiotechSolution: 'Tricyclazole 75% WP + Trichoderma harzianum seed treatment',
          preventionProtocol: 'Avoid excessive nitrogen; ensure flood irrigation continuity',
        },
        {
          diseaseName: 'Cotton Pink Bollworm (Pectinophora gossypiella)',
          pathogenType: 'PEST',
          cropAffiliation: 'Cotton',
          commonSymptoms: 'Rosetted flowers, bored bolls with internal fiber staining.',
          severityLevelDefault: 'CRITICAL',
          recommendedBiotechSolution: 'Pheromone lures + Bacillus thuringiensis (Bt) Cry1Ac/Cry2Ab dual-toxin stack',
          preventionProtocol: 'Maintain non-Bt refuge crops, timely destruction of cotton crop residue',
        },
        {
          diseaseName: 'Yellow Rust / Stripe Rust (Puccinia striiformis)',
          pathogenType: 'FUNGAL',
          cropAffiliation: 'Wheat',
          commonSymptoms: 'Yellow-orange pustules in linear stripes along leaf veins.',
          severityLevelDefault: 'HIGH',
          recommendedBiotechSolution: 'Propiconazole 25% EC + bio-fungicidal Bacillus subtilis spray',
          preventionProtocol: 'Plant certified rust-resistant wheat lines (HD-3086 / DBW-187)',
        },
        {
          diseaseName: 'Tomato Leaf Curl Virus (ToLCV)',
          pathogenType: 'VIRAL',
          cropAffiliation: 'Tomato / Vegetables',
          commonSymptoms: 'Severe curling, puckering of leaves, stunting and floral abortion.',
          severityLevelDefault: 'HIGH',
          recommendedBiotechSolution: 'Imidacloprid vector control + neem oil extract 10,000 ppm',
          preventionProtocol: 'Use yellow sticky traps to intercept Bemisia tabaci vector',
        },
        {
          diseaseName: 'Red Rot of Sugarcane (Colletotrichum falcatum)',
          pathogenType: 'FUNGAL',
          cropAffiliation: 'Sugarcane',
          commonSymptoms: 'Red discoloration with white transverse patches in pith tissue.',
          severityLevelDefault: 'HIGH',
          recommendedBiotechSolution: 'Carbendazim sett dip + Trichoderma viride enriched organic compost',
          preventionProtocol: 'Use certified healthy seed canes and hot water treatment at 52°C',
        }
      ];
      await Disease.insertMany(defaultDiseases);
      diseases = await Disease.find().sort({ diseaseName: 1 });
    }

    const formatted = diseases.map(d => ({
      id: d._id.toString(),
      diseaseName: d.diseaseName,
      pathogenType: d.pathogenType,
      cropAffiliation: d.cropAffiliation,
      commonSymptoms: d.commonSymptoms,
      severityLevelDefault: d.severityLevelDefault,
      recommendedBiotechSolution: d.recommendedBiotechSolution,
      preventionProtocol: d.preventionProtocol,
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch disease catalog' });
  }
};

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const getDiseaseCases = async (req: Request, res: Response): Promise<void> => {
  try {
    const { severity, status, search, cropVarietyId, farmId, farmerId, reportedById, lat, lng, radiusKm } = req.query;

    const filter: any = {};

    if (severity && typeof severity === 'string' && severity !== 'ALL' && severity !== 'undefined' && severity !== '') {
      filter.severity = { $regex: new RegExp(`^${severity}$`, 'i') };
    }

    if (status && typeof status === 'string' && status !== 'ALL' && status !== 'undefined' && status !== '') {
      filter.status = { $regex: new RegExp(`^${status}$`, 'i') };
    }

    if (cropVarietyId && typeof cropVarietyId === 'string' && cropVarietyId !== 'undefined' && cropVarietyId !== '') {
      filter.cropVarietyId = cropVarietyId;
    }

    if (farmId && typeof farmId === 'string' && farmId !== 'undefined' && farmId !== '') {
      filter.farmId = farmId;
    }

    if (farmerId && typeof farmerId === 'string' && farmerId !== 'undefined' && farmerId !== '') {
      const farmerFarms = await Farm.find({ farmerId }).select('_id');
      const farmIds = farmerFarms.map((f: any) => f._id);
      filter.$or = [
        { farmId: { $in: farmIds } },
        { reportedById: farmerId }
      ];
    }

    if (reportedById && typeof reportedById === 'string' && reportedById !== 'undefined' && reportedById !== '') {
      filter.reportedById = reportedById;
    }

    if (search && typeof search === 'string' && search !== 'undefined' && search.trim() !== '') {
      filter.$or = [
        { diseaseName: { $regex: search.trim(), $options: 'i' } },
        { symptoms: { $regex: search.trim(), $options: 'i' } },
        { problemType: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const cases = await DiseaseReport.find(filter)
      .populate({
        path: 'farmId',
        populate: { path: 'farmerId' }
      })
      .populate('cropVarietyId')
      .populate('reportedById', 'name email role phone')
      .populate('assignedAdvisorId', 'name email role phone')
      .sort({ dateObserved: -1 });

    const formatted = cases.map((c: any) => {
      const farm: any = c.farmId;
      const variety: any = c.cropVarietyId;
      const reporter: any = c.reportedById;
      const advisor: any = c.assignedAdvisorId;
      const farmer: any = farm?.farmerId;

      const rawDoc = c as any;
      const farmName = farm?.farmName || (typeof rawDoc.farm === 'string' ? rawDoc.farm : rawDoc.farm?.farmName) || 'Farm Plot';
      const locationAddress = farm?.locationAddress || c.locationAddress || rawDoc.farm?.locationAddress || 'N/A';
      const crop = variety?.cropName || farm?.currentCrop || c.crop || 'Unknown';
      const cropVarietyName = variety?.varietyName || c.cropVariety || '';

      const farmLat = typeof farm?.latitude === 'number' && !isNaN(farm.latitude)
        ? farm.latitude
        : (farm?.latitude !== undefined && farm?.latitude !== null && farm?.latitude !== '' ? parseFloat(farm.latitude) : undefined);
      const farmLng = typeof farm?.longitude === 'number' && !isNaN(farm.longitude)
        ? farm.longitude
        : (farm?.longitude !== undefined && farm?.longitude !== null && farm?.longitude !== '' ? parseFloat(farm.longitude) : undefined);

      const rawLat = c.latitude;
      const rawLng = c.longitude;
      const parsedLat = typeof rawLat === 'number' && !isNaN(rawLat)
        ? rawLat
        : (rawLat !== undefined && rawLat !== null && rawLat !== '' ? parseFloat(rawLat) : undefined);
      const parsedLng = typeof rawLng === 'number' && !isNaN(rawLng)
        ? rawLng
        : (rawLng !== undefined && rawLng !== null && rawLng !== '' ? parseFloat(rawLng) : undefined);
      const validLat = parsedLat !== undefined && !isNaN(parsedLat) && parsedLat !== 0 ? parsedLat : undefined;
      const validLng = parsedLng !== undefined && !isNaN(parsedLng) && parsedLng !== 0 ? parsedLng : undefined;

      const resolvedLat = validLat ?? (farmLat !== undefined && !isNaN(farmLat) && farmLat !== 0 ? farmLat : undefined);
      const resolvedLng = validLng ?? (farmLng !== undefined && !isNaN(farmLng) && farmLng !== 0 ? farmLng : undefined);

      const reqUser = (req as AuthenticatedRequest).user;
      const isPrivileged = reqUser && (reqUser.role === 'admin' || reqUser.role === 'agronomist');
      const isOwnFarmer = reqUser && farmer?.userId && farmer.userId.toString() === reqUser.id;
      const allowFarmerContact = isPrivileged || isOwnFarmer;

      return {
        id: c._id.toString(),
        cropVarietyId: variety?._id?.toString() || null,
        cropVariety: variety ? {
          id: variety._id.toString(),
          cropName: variety.cropName,
          varietyName: variety.varietyName,
          biotechTraits: variety.biotechTraits,
          diseaseResistanceTraits: variety.diseaseResistanceTraits,
        } : (cropVarietyName ? { id: '', cropName: crop, varietyName: cropVarietyName } : undefined),
        crop,
        farmId: farm?._id?.toString() || '',
        farm: farm ? {
          id: farm._id.toString(),
          farmName: farm.farmName,
          locationAddress: farm.locationAddress,
          latitude: farm.latitude,
          longitude: farm.longitude,
          lat: farm.latitude,
          lng: farm.longitude,
          farmerId: farmer?._id?.toString(),
          farmer: farmer ? {
            id: farmer._id.toString(),
            fullName: farmer.fullName,
            phone: allowFarmerContact ? farmer.phone : undefined,
            preferredLanguage: farmer.preferredLanguage,
          } : undefined
        } : { farmName, locationAddress },
        locationAddress,
        reportedById: reporter?._id?.toString() || '',
        reportedBy: reporter ? {
          id: reporter._id.toString(),
          name: reporter.name,
          role: reporter.role,
        } : undefined,
        assignedAdvisorId: advisor?._id?.toString() || undefined,
        assignedAdvisor: advisor ? {
          id: advisor._id.toString(),
          name: advisor.name,
          role: advisor.role,
          email: advisor.email,
          phone: isPrivileged ? advisor.phone : undefined,
        } : undefined,
        diseaseName: c.diseaseName,
        problemType: c.problemType,
        affectedArea: c.affectedArea,
        symptoms: c.symptoms,
        severity: (c.severity || 'MEDIUM').toUpperCase(),
        latitude: resolvedLat,
        longitude: resolvedLng,
        lat: resolvedLat,
        lng: resolvedLng,
        dateObserved: c.dateObserved,
        status: (c.status || 'ACTIVE').toUpperCase(),
        imageUrl: c.imageUrl,
        recommendedTreatment: c.recommendedTreatment,
        resolvedAt: c.resolvedAt,
        isDemo: c.isDemo !== undefined && c.isDemo !== null ? Boolean(c.isDemo) : true,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    const userLat = lat !== undefined && lat !== null && lat !== '' ? parseFloat(lat as string) : NaN;
    const userLng = lng !== undefined && lng !== null && lng !== '' ? parseFloat(lng as string) : NaN;
    const maxRadius = radiusKm ? parseFloat(radiusKm as string) : 10;

    let result = formatted;
    if (!isNaN(userLat) && !isNaN(userLng)) {
      result = result
        .filter((c: any) => c.latitude !== undefined && c.longitude !== undefined)
        .map((c: any) => ({
          ...c,
          distanceKm: calculateHaversineDistance(userLat, userLng, c.latitude, c.longitude),
        }))
        .filter((c: any) => c.distanceKm <= maxRadius)
        .sort((a: any, b: any) => a.distanceKm - b.distanceKm);
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching disease cases:', error);
    res.status(500).json({ error: 'Failed to fetch disease cases' });
  }
};

export const getDiseaseCaseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'Disease case not found' });
      return;
    }
    const c: any = await DiseaseReport.findById(id)
      .populate({
        path: 'farmId',
        populate: { path: 'farmerId' }
      })
      .populate('cropVarietyId')
      .populate('reportedById', 'name email role phone')
      .populate('assignedAdvisorId', 'name email role phone');

    if (!c) {
      res.status(404).json({ error: 'Disease case not found' });
      return;
    }

    const farm: any = c.farmId;
    const variety: any = c.cropVarietyId;
    const reporter: any = c.reportedById;
    const advisor: any = c.assignedAdvisorId;
    const farmer: any = farm?.farmerId;

    const rawDoc = c as any;
    const farmName = farm?.farmName || (typeof rawDoc.farm === 'string' ? rawDoc.farm : rawDoc.farm?.farmName) || 'Farm Plot';
    const locationAddress = farm?.locationAddress || c.locationAddress || rawDoc.farm?.locationAddress || 'N/A';
    const crop = variety?.cropName || farm?.currentCrop || c.crop || 'Unknown';
    const cropVarietyName = variety?.varietyName || c.cropVariety || '';

    const farmLat = typeof farm?.latitude === 'number' && !isNaN(farm.latitude)
      ? farm.latitude
      : (farm?.latitude !== undefined && farm?.latitude !== null && farm?.latitude !== '' ? parseFloat(farm.latitude) : undefined);
    const farmLng = typeof farm?.longitude === 'number' && !isNaN(farm.longitude)
      ? farm.longitude
      : (farm?.longitude !== undefined && farm?.longitude !== null && farm?.longitude !== '' ? parseFloat(farm.longitude) : undefined);

    const rawLat = c.latitude;
    const rawLng = c.longitude;
    const parsedLat = typeof rawLat === 'number' && !isNaN(rawLat)
      ? rawLat
      : (rawLat !== undefined && rawLat !== null && rawLat !== '' ? parseFloat(rawLat) : undefined);
    const parsedLng = typeof rawLng === 'number' && !isNaN(rawLng)
      ? rawLng
      : (rawLng !== undefined && rawLng !== null && rawLng !== '' ? parseFloat(rawLng) : undefined);
    const validLat = parsedLat !== undefined && !isNaN(parsedLat) && parsedLat !== 0 ? parsedLat : undefined;
    const validLng = parsedLng !== undefined && !isNaN(parsedLng) && parsedLng !== 0 ? parsedLng : undefined;

    const resolvedLat = validLat ?? (farmLat !== undefined && !isNaN(farmLat) && farmLat !== 0 ? farmLat : undefined);
    const resolvedLng = validLng ?? (farmLng !== undefined && !isNaN(farmLng) && farmLng !== 0 ? farmLng : undefined);

    // Fetch any biotech recommendations created for this disease report or farmer
    const linkedRecommendations = await BiotechnologyRecommendation.find({
      $or: [
        { diseaseReportId: c._id },
        ...(farmer?._id ? [{ farmerId: farmer._id, targetIssue: { $regex: c.diseaseName || '', $options: 'i' } }] : [])
      ]
    }).populate('creatorId', 'name email role');

    const reqUser = (req as AuthenticatedRequest).user;
    const isPrivileged = reqUser && (reqUser.role === 'admin' || reqUser.role === 'agronomist');
    const isOwnFarmer = reqUser && farmer?.userId && farmer.userId.toString() === reqUser.id;
    const allowFarmerContact = isPrivileged || isOwnFarmer;

    res.json({
      id: c._id.toString(),
      cropVarietyId: variety?._id?.toString() || null,
      cropVariety: variety ? {
        id: variety._id.toString(),
        cropName: variety.cropName,
        varietyName: variety.varietyName,
        biotechTraits: variety.biotechTraits,
        diseaseResistanceTraits: variety.diseaseResistanceTraits,
      } : (cropVarietyName ? { id: '', cropName: crop, varietyName: cropVarietyName } : undefined),
      crop,
      farmId: farm?._id?.toString() || '',
      farm: farm ? {
        id: farm._id.toString(),
        farmName: farm.farmName,
        locationAddress: farm.locationAddress,
        latitude: farm.latitude,
        longitude: farm.longitude,
        lat: farm.latitude,
        lng: farm.longitude,
        farmerId: farmer?._id?.toString(),
        farmer: farmer ? {
          id: farmer._id.toString(),
          fullName: farmer.fullName,
          phone: allowFarmerContact ? farmer.phone : undefined,
          preferredLanguage: farmer.preferredLanguage,
        } : undefined
      } : { farmName, locationAddress },
      locationAddress,
      reportedById: reporter?._id?.toString() || '',
      reportedBy: reporter ? {
        id: reporter._id.toString(),
        name: reporter.name,
        role: reporter.role,
      } : undefined,
      assignedAdvisorId: advisor?._id?.toString() || undefined,
      assignedAdvisor: advisor ? {
        id: advisor._id.toString(),
        name: advisor.name,
        role: advisor.role,
        email: advisor.email,
        phone: isPrivileged ? advisor.phone : undefined,
      } : undefined,
      diseaseName: c.diseaseName,
      problemType: c.problemType,
      affectedArea: c.affectedArea,
      symptoms: c.symptoms,
      severity: (c.severity || 'MEDIUM').toUpperCase(),
      latitude: resolvedLat,
      longitude: resolvedLng,
      lat: resolvedLat,
      lng: resolvedLng,
      dateObserved: c.dateObserved,
      status: (c.status || 'ACTIVE').toUpperCase(),
      imageUrl: c.imageUrl,
      recommendedTreatment: c.recommendedTreatment,
      resolvedAt: c.resolvedAt,
      isDemo: c.isDemo !== undefined && c.isDemo !== null ? Boolean(c.isDemo) : true,
      recommendations: linkedRecommendations.map(r => ({
        id: r._id.toString(),
        recommendationType: r.recommendationType,
        title: r.title,
        productName: r.productName,
        targetIssue: r.targetIssue,
        reasoning: r.reasoning,
        dosage: r.dosage,
        applicationInstructions: r.applicationInstructions,
        isAutomatedSuggestion: r.isAutomatedSuggestion,
        createdAt: r.createdAt,
      })),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch disease case' });
  }
};

export const reportDiseaseCase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      farmId,
      cropVarietyId,
      diseaseName,
      severity,
      status,
      symptoms,
      latitude,
      longitude,
      lat,
      lng,
      crop,
      cropVariety,
      locationAddress,
      dateObserved,
      recommendedTreatment,
      imageUrl,
    } = req.body;

    if (!farmId || !diseaseName || !symptoms) {
      res.status(400).json({ error: 'Farm, disease name, and symptoms are required.' });
      return;
    }

    const farm = await Farm.findById(farmId).populate('farmerId');
    if (!farm) {
      res.status(404).json({ error: 'Selected farm not found' });
      return;
    }

    const rawLat = latitude ?? lat;
    const rawLng = longitude ?? lng;
    let caseLat = rawLat !== undefined && rawLat !== null && rawLat !== '' ? parseFloat(rawLat) : NaN;
    let caseLong = rawLng !== undefined && rawLng !== null && rawLng !== '' ? parseFloat(rawLng) : NaN;
    if ((isNaN(caseLat) || isNaN(caseLong)) && farm) {
      if (farm.latitude !== undefined && farm.latitude !== null && !isNaN(farm.latitude)) {
        caseLat = farm.latitude;
      }
      if (farm.longitude !== undefined && farm.longitude !== null && !isNaN(farm.longitude)) {
        caseLong = farm.longitude;
      }
    }

    const finalLat = !isNaN(caseLat) ? caseLat : undefined;
    const finalLng = !isNaN(caseLong) ? caseLong : undefined;

    const reporterUser = req.user ? await User.findById(req.user.id) : await User.findOne({ role: { $in: ['agronomist', 'AGRONOMIST', 'admin', 'ADMIN'] } });
    const reporterId = reporterUser?._id || farm.farmerId;

    const finalSeverity = severity ? String(severity).toUpperCase() : 'MEDIUM';
    const finalStatus = status ? String(status).toUpperCase() : 'ACTIVE';

    const newCase = await DiseaseReport.create({
      farmId,
      cropVarietyId: cropVarietyId || undefined,
      reportedById: reporterId,
      diseaseName,
      symptoms,
      severity: finalSeverity,
      latitude: finalLat,
      longitude: finalLng,
      dateObserved: dateObserved ? new Date(dateObserved) : new Date(),
      status: finalStatus,
      isDemo: false,
      crop: crop || undefined,
      cropVariety: cropVariety || undefined,
      locationAddress: locationAddress || farm.locationAddress || undefined,
      recommendedTreatment: recommendedTreatment || undefined,
      imageUrl: imageUrl || (req.file ? `/uploads/${req.file.filename}` : 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80'),
    });

    const farmer: any = farm.farmerId;

    // Trigger Outbreak Alerts if High or Critical
    const upperSev = (severity || '').toUpperCase();
    if (upperSev === 'CRITICAL' || upperSev === 'HIGH') {
      const adminUsers = await User.find({ role: { $in: ['admin', 'ADMIN'] } });
      for (const a of adminUsers) {
        await Notification.create({
          recipientUserId: a._id,
          type: 'OUTBREAK_ALERT',
          title: `🚨 Outbreak Alert: ${diseaseName} (${upperSev})`,
          message: `New ${upperSev} severity disease case reported at ${farm.farmName} (${farmer?.fullName || 'Farmer'}).`,
          severity: upperSev === 'CRITICAL' ? 'DANGER' : 'WARNING',
          linkUrl: '/diseases',
        });
      }

      if (farmer) {
        await FarmerAdvisory.create({
          farmerId: farmer._id,
          advisorId: reporterId,
          title: `⚠️ Alert: ${diseaseName} Detected on ${farm.farmName}`,
          category: 'DISEASE_ALERT',
          message: `Dear ${farmer.fullName}, a ${upperSev.toLowerCase()} severity occurrence of ${diseaseName} was reported on your farm. Symptoms: "${symptoms}". Suggested protocol: ${recommendedTreatment || 'Please deploy biological barrier control and inspect the field.'}`,
          priority: upperSev === 'CRITICAL' ? 'URGENT' : 'IMPORTANT',
        });
      }
    }

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'REPORT_DISEASE',
        module: 'Disease Surveillance',
        details: `Reported ${upperSev} severity ${diseaseName} on ${farm.farmName}`,
      });
    }

    res.status(201).json({
      id: newCase._id.toString(),
      ...newCase.toObject(),
      latitude: newCase.latitude,
      longitude: newCase.longitude,
      lat: newCase.latitude,
      lng: newCase.longitude,
    });
  } catch (error: any) {
    console.error('Error reporting disease case:', error);
    res.status(500).json({ error: 'Failed to record disease case' });
  }
};

export const reportFarmerProblem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      farmId,
      crop,
      cropVarietyId,
      problemType,
      symptoms,
      description,
      affectedArea = 'Not sure',
      imageUrl,
    } = req.body;

    if (!farmId || !problemType) {
      res.status(400).json({ error: 'Farm and problem type are required.' });
      return;
    }

    const farm = await Farm.findById(farmId).populate('farmerId');
    if (!farm) {
      res.status(404).json({ error: 'Selected farm not found' });
      return;
    }

    // Automatically obtain farm GPS coordinates from the farmer's existing farm/location data
    const farmLat = farm.latitude !== undefined && farm.latitude !== null && !isNaN(farm.latitude) ? farm.latitude : undefined;
    const farmLng = farm.longitude !== undefined && farm.longitude !== null && !isNaN(farm.longitude) ? farm.longitude : undefined;

    // Link report to the logged-in user / farmer
    const reporterUser = req.user ? await User.findById(req.user.id) : null;
    const farmer: any = farm.farmerId;
    const reporterId = reporterUser?._id || farmer?.userId || farm.farmerId;

    // Assign an agronomist advisor for review
    const agronomistAdvisor = await User.findOne({ role: { $in: ['agronomist', 'AGRONOMIST'] } }) ||
                              await User.findOne({ role: { $in: ['admin', 'ADMIN'] } });

    // Derive initial severity from reporter input or affected area selection
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
    if (req.body.severity && ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(String(req.body.severity).toUpperCase())) {
      severity = String(req.body.severity).toUpperCase() as any;
    } else {
      const areaLower = (affectedArea || '').toLowerCase();
      if (areaLower.includes('most') || areaLower.includes('field') || areaLower.includes('widespread')) {
        severity = 'HIGH';
      } else if (areaLower.includes('some')) {
        severity = 'MEDIUM';
      } else if (areaLower.includes('small') || areaLower.includes('isolated') || areaLower.includes('few')) {
        severity = 'LOW';
      }
    }

    const initialStatus = req.body.status && ['REPORTED', 'INVESTIGATING', 'ACTIVE', 'CONTAINED', 'RESOLVED'].includes(String(req.body.status).toUpperCase())
      ? String(req.body.status).toUpperCase()
      : 'REPORTED';

    const userDescription = (description || symptoms || '').trim();
    const finalSymptoms = userDescription
      ? `${userDescription} (Affected Area: ${affectedArea})`
      : `Problem observed: ${problemType} (Affected Area: ${affectedArea})`;

    const uploadedImageUrl = imageUrl || (req.file ? `/uploads/${req.file.filename}` : undefined);

    // Save report in MongoDB linked to farm and farmer
    // Do NOT allow the farmer to prescribe a biotech treatment
    const newReport = await DiseaseReport.create({
      farmId,
      cropVarietyId: cropVarietyId || farm.cropVarietyId || undefined,
      reportedById: reporterId,
      diseaseName: problemType,
      problemType,
      symptoms: finalSymptoms,
      affectedArea,
      severity,
      latitude: farmLat,
      longitude: farmLng,
      dateObserved: new Date(),
      status: initialStatus,
      isDemo: false,
      crop: crop || farm.currentCrop || 'Field Crop',
      locationAddress: farm.locationAddress,
      assignedAdvisorId: agronomistAdvisor?._id || undefined,
      recommendedTreatment: undefined, // Agronomist/Biotech Expert will provide this upon review
      imageUrl: uploadedImageUrl,
    });

    // Create notifications for Agronomists and Admins to review the report
    const staffUsers = await User.find({ role: { $in: ['agronomist', 'AGRONOMIST', 'admin', 'ADMIN', 'biotech_expert', 'BIOTECH_EXPERT'] } });
    for (const staff of staffUsers) {
      await Notification.create({
        recipientUserId: staff._id,
        type: 'OUTBREAK_ALERT',
        title: `📋 New Farmer Crop Problem: ${problemType}`,
        message: `${farmer?.fullName || 'Farmer'} reported "${problemType}" at ${farm.farmName} (${affectedArea}). Needs diagnosis and treatment prescription.`,
        severity: severity === 'HIGH' ? 'WARNING' : 'INFO',
        linkUrl: '/diseases',
      });
    }

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'REPORT_CROP_PROBLEM',
        module: 'Farmer Advisory',
        details: `Farmer reported ${problemType} on ${farm.farmName}`,
      });
    }

    res.status(201).json({
      id: newReport._id.toString(),
      reportId: newReport._id.toString(),
      submittedDate: newReport.dateObserved,
      dateObserved: newReport.dateObserved,
      status: initialStatus,
      severity: newReport.severity,
      problemType: newReport.problemType,
      diseaseName: newReport.diseaseName,
      affectedArea: newReport.affectedArea,
      crop: newReport.crop,
      farmId: farm._id.toString(),
      farmName: farm.farmName,
      locationAddress: farm.locationAddress,
      latitude: farmLat,
      longitude: farmLng,
      imageUrl: newReport.imageUrl,
      assignedAdvisor: agronomistAdvisor ? {
        id: agronomistAdvisor._id.toString(),
        name: agronomistAdvisor.name,
        role: agronomistAdvisor.role,
        email: agronomistAdvisor.email,
        phone: agronomistAdvisor.phone,
      } : {
        name: 'Field Agronomist',
        role: 'agronomist',
      },
      recommendation: null,
      recommendedTreatment: null,
      message: 'Report submitted successfully.',
    });
  } catch (error: any) {
    console.error('Error reporting farmer problem:', error);
    res.status(500).json({ error: 'Failed to record crop problem report' });
  }
};

export const updateDiseaseCase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'Disease case not found' });
      return;
    }
    const { status, severity, symptoms, diseaseName, recommendedTreatment, resolvedAt, latitude, longitude, lat, lng, assignedAdvisorId, syncWithFarmLocation } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status.toUpperCase();
    if (severity) updateData.severity = severity.toUpperCase();
    if (diseaseName) updateData.diseaseName = diseaseName;
    if (symptoms) updateData.symptoms = symptoms;
    if (assignedAdvisorId) updateData.assignedAdvisorId = assignedAdvisorId;
    if (recommendedTreatment !== undefined) updateData.recommendedTreatment = recommendedTreatment;
    if (status === 'RESOLVED') {
      updateData.resolvedAt = resolvedAt ? new Date(resolvedAt) : new Date();
    }
    const rawLat = latitude ?? lat;
    const rawLng = longitude ?? lng;
    if (rawLat !== undefined && rawLat !== null && rawLat !== '') {
      const parsedLat = parseFloat(rawLat);
      if (!isNaN(parsedLat)) updateData.latitude = parsedLat;
    }
    if (rawLng !== undefined && rawLng !== null && rawLng !== '') {
      const parsedLng = parseFloat(rawLng);
      if (!isNaN(parsedLng)) updateData.longitude = parsedLng;
    }

    if (syncWithFarmLocation) {
      const existing = await DiseaseReport.findById(id).populate('farmId');
      const farm: any = existing?.farmId;
      if (existing && farm && typeof farm.latitude === 'number' && typeof farm.longitude === 'number' && !isNaN(farm.latitude) && !isNaN(farm.longitude)) {
        updateData.latitude = farm.latitude;
        updateData.longitude = farm.longitude;
        if (!existing.locationAddress && farm.locationAddress) {
          updateData.locationAddress = farm.locationAddress;
        }
      }
    }

    const updated = await DiseaseReport.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      res.status(404).json({ error: 'Disease case not found' });
      return;
    }

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'UPDATE_DISEASE_STATUS',
        module: 'Disease Surveillance',
        details: `Updated case ${updated.diseaseName} to status ${updated.status}`,
      });
    }

    res.json({
      id: updated._id.toString(),
      ...updated.toObject(),
      latitude: updated.latitude,
      longitude: updated.longitude,
      lat: updated.latitude,
      lng: updated.longitude,
    });
  } catch (error: any) {
    console.error('Error updating disease case:', error);
    res.status(500).json({ error: 'Failed to update disease case' });
  }
};

/**
 * Safely synchronize any existing disease reports lacking geographic coordinates
 * with the verified coordinates of their linked farms. Never assigns invented coordinates.
 */
export const syncDiseaseCoordinates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const unmappedReports = await DiseaseReport.find({
      $or: [
        { latitude: { $exists: false } },
        { latitude: null },
        { latitude: 0 },
        { longitude: { $exists: false } },
        { longitude: null },
        { longitude: 0 },
      ]
    }).populate('farmId');

    let updatedCount = 0;
    const details: any[] = [];
    const unresolvable: any[] = [];

    for (const r of unmappedReports) {
      const f: any = r.farmId;
      if (f && typeof f.latitude === 'number' && typeof f.longitude === 'number' && !isNaN(f.latitude) && !isNaN(f.longitude) && !(f.latitude === 0 && f.longitude === 0)) {
        await DiseaseReport.updateOne(
          { _id: r._id },
          {
            $set: {
              latitude: f.latitude,
              longitude: f.longitude,
              locationAddress: r.locationAddress || f.locationAddress
            }
          }
        );
        updatedCount++;
        details.push({
          reportId: r._id.toString(),
          diseaseName: r.diseaseName,
          farmName: f.farmName,
          syncedCoordinates: { latitude: f.latitude, longitude: f.longitude },
        });
      } else {
        unresolvable.push({
          reportId: r._id.toString(),
          diseaseName: r.diseaseName,
          reason: 'Linked farm does not have verified geographic coordinates in database',
        });
      }
    }

    res.json({
      message: `Successfully synchronized ${updatedCount} disease report(s) with verified farm coordinates.`,
      updatedCount,
      totalUnmappedFound: unmappedReports.length,
      details,
      unresolvable,
    });
  } catch (error: any) {
    console.error('Error synchronizing disease coordinates:', error);
    res.status(500).json({ error: 'Failed to synchronize disease coordinates with farm records' });
  }
};

export const deleteDiseaseCase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'Disease case not found' });
      return;
    }
    const deleted = await DiseaseReport.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: 'Disease case not found' });
      return;
    }
    res.json({ message: 'Disease case deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete disease case' });
  }
};
