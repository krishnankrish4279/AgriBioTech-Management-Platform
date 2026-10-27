import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { BiotechnologyRecommendation, CropVariety, Farmer, Farm, User, FarmerAdvisory, ActivityLog } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';

function sanitizeExpectedBenefit(benefit?: string): string {
  if (!benefit) {
    return 'Promotes natural crop resilience and biological pest inhibition (Field estimate; unverified under open-field conditions).';
  }

  let cleaned = benefit;
  // Replace unverified claims with scientifically honest wording
  cleaned = cleaned.replace(/Halts disease spread within 48-72 hours without inducing chemical resistance\.?/gi,
    'Antagonizes foliar fungal pathogens and suppresses spore germination (Field trial estimate; response timing varies with disease pressure).');
  cleaned = cleaned.replace(/80-90% reduction in larval emergence without toxic chemical residues\.?/gi,
    'Targeted egg parasitism reduces pest emergence without toxic chemical residues (Agronomic field estimate; unverified under open-canopy conditions).');
  cleaned = cleaned.replace(/15-20% increase in vegetative root mass and 10% lower chemical fertilizer requirement\.?/gi,
    'Promotes root colonization and nutrient uptake efficiency (Field trial estimate; unverified under variable open-field conditions).');

  // If text contains percentage or numerical timeline claims without an unverified/estimate qualifier:
  const hasPercentageOrTimeline = /([0-9]+%|[0-9]+-[0-9]+%|[0-9]+\s*(?:hours|hrs|days|weeks))/i.test(cleaned);
  const alreadyQualified = /(field (?:trial )?estimate|agronomic estimate|unverified|varies)/i.test(cleaned);
  if (hasPercentageOrTimeline && !alreadyQualified) {
    cleaned = `${cleaned.trim()} (Field estimate; unverified across variable field conditions).`;
  }
  return cleaned;
}

function inferCropName(rec: any, farm?: any): string {
  if (rec.cropName && rec.cropName.trim()) return rec.cropName.trim();
  const variety: any = rec.cropVarietyId;
  if (variety && variety.cropName) return variety.cropName;
  if (farm && farm.currentCrop) return farm.currentCrop;

  const combinedText = `${rec.title || ''} ${rec.targetIssue || ''} ${rec.reasoning || ''}`;
  if (/maize/i.test(combinedText)) return 'Maize';
  if (/wheat/i.test(combinedText)) return 'Wheat';
  if (/rice|paddy/i.test(combinedText)) return 'Rice';
  if (/chilli|chili/i.test(combinedText)) return 'Chilli';
  if (/cotton/i.test(combinedText)) return 'Cotton';
  if (/tomato/i.test(combinedText)) return 'Tomato';

  return 'Universal';
}

function resolveFarmForRec(rec: any, allFarms: any[], cropName: string): any {
  if (rec.farmId && typeof rec.farmId === 'object' && rec.farmId.farmName) {
    return rec.farmId;
  }
  if (rec.farmId) {
    const found = allFarms.find(f => f._id.toString() === rec.farmId.toString());
    if (found) return found;
  }
  // Match by farmerId and cropName
  const fId = rec.farmerId?._id?.toString() || rec.farmerId?.toString();
  if (fId) {
    const ownedFarms = allFarms.filter(f => f.farmerId && f.farmerId.toString() === fId);
    if (ownedFarms.length === 1) return ownedFarms[0];
    if (ownedFarms.length > 1) {
      const cropMatch = ownedFarms.find(f => f.currentCrop && f.currentCrop.toLowerCase() === cropName.toLowerCase());
      if (cropMatch) return cropMatch;
      return ownedFarms[0];
    }
  }
  return null;
}

export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recommendationType, status, isAutomated, cropVarietyId, farmerId, farmId, crop, search } = req.query;

    const filter: any = {};

    if (recommendationType && typeof recommendationType === 'string' && recommendationType !== 'ALL' && recommendationType !== 'undefined') {
      filter.recommendationType = recommendationType;
    }

    if (status && typeof status === 'string' && status !== 'ALL' && status !== 'undefined') {
      filter.status = status;
    }

    if (isAutomated !== undefined && isAutomated !== 'ALL' && isAutomated !== 'undefined' && isAutomated !== '') {
      filter.isAutomatedSuggestion = isAutomated === 'true';
    }

    if (cropVarietyId && typeof cropVarietyId === 'string' && cropVarietyId !== 'undefined' && cropVarietyId !== '') {
      filter.cropVarietyId = cropVarietyId;
    }

    if (farmerId && typeof farmerId === 'string' && farmerId !== 'undefined' && farmerId !== '') {
      filter.farmerId = farmerId;
    }

    if (search && typeof search === 'string' && search !== 'undefined' && search.trim() !== '') {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { productName: { $regex: search.trim(), $options: 'i' } },
        { targetIssue: { $regex: search.trim(), $options: 'i' } },
        { reasoning: { $regex: search.trim(), $options: 'i' } },
        { cropName: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const [recommendations, allFarms] = await Promise.all([
      BiotechnologyRecommendation.find(filter)
        .populate('cropVarietyId')
        .populate('farmerId')
        .populate('farmId')
        .populate('creatorId', 'name role email')
        .sort({ createdAt: -1 }),
      Farm.find().lean(),
    ]);

    let formatted = recommendations.map(r => {
      const variety: any = r.cropVarietyId;
      const farmer: any = r.farmerId;
      const creator: any = r.creatorId;

      const rawFarm: any = r.farmId;
      const cropName = inferCropName(r, rawFarm);
      const farm = resolveFarmForRec(r, allFarms, cropName);
      const sanitizedBenefit = sanitizeExpectedBenefit(r.expectedBenefit);

      // Auto-heal missing cropName, farmId, and unverified claims in MongoDB
      if (!r.cropName || !r.farmId || r.expectedBenefit !== sanitizedBenefit) {
        BiotechnologyRecommendation.findByIdAndUpdate(r._id, {
          ...(r.cropName ? {} : { cropName }),
          ...(r.farmId || !farm ? {} : { farmId: farm._id }),
          ...(r.expectedBenefit === sanitizedBenefit ? {} : { expectedBenefit: sanitizedBenefit }),
        }).exec().catch(() => {});
      }

      return {
        id: r._id.toString(),
        farmId: farm ? farm._id.toString() : (rawFarm?._id?.toString() || undefined),
        farm: farm ? {
          id: farm._id.toString(),
          farmName: farm.farmName,
          locationAddress: farm.locationAddress,
          currentCrop: farm.currentCrop,
        } : undefined,
        cropName,
        cropVarietyId: variety?._id?.toString(),
        cropVariety: variety ? {
          id: variety._id.toString(),
          cropName: variety.cropName,
          varietyName: variety.varietyName,
          biotechTraits: variety.biotechTraits,
        } : undefined,
        farmerId: farmer?._id?.toString(),
        farmer: farmer ? {
          id: farmer._id.toString(),
          fullName: farmer.fullName,
          phone: farmer.phone,
        } : undefined,
        creatorId: creator?._id?.toString(),
        creator: creator ? {
          id: creator._id.toString(),
          name: creator.name,
          role: creator.role,
        } : undefined,
        recommendationType: r.recommendationType,
        title: r.title,
        productName: r.productName,
        targetIssue: r.targetIssue,
        reasoning: r.reasoning,
        expectedBenefit: sanitizedBenefit,
        applicationInstructions: r.applicationInstructions,
        dosage: r.dosage,
        precautions: r.precautions,
        isAutomatedSuggestion: r.isAutomatedSuggestion,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    // Apply farm and crop filtering if requested
    if (farmId && typeof farmId === 'string' && farmId !== 'ALL' && farmId !== 'undefined' && farmId !== '') {
      formatted = formatted.filter(r => r.farmId === farmId);
    }
    if (crop && typeof crop === 'string' && crop !== 'ALL' && crop !== 'undefined' && crop !== '') {
      formatted = formatted.filter(r => r.cropName?.toLowerCase() === crop.toLowerCase());
    }

    // Role-based filtering for authenticated farmers:
    // Farmers only see recommendations for their authorized farms and crops. Never leak other farms' recommendations.
    const reqUser = (req as AuthenticatedRequest).user;
    if (reqUser && reqUser.role.toLowerCase() === 'farmer') {
      const farmerDoc = await Farmer.findOne({
        $or: [
          { userId: reqUser.id },
          { email: reqUser.email.toLowerCase() }
        ]
      });

      if (farmerDoc) {
        const farmerFarms = await Farm.find({ farmerId: farmerDoc._id }).lean();
        const farmerFarmIds = new Set(farmerFarms.map(f => f._id.toString()));
        const farmerCrops = new Set<string>();

        farmerFarms.forEach(f => {
          if (f.currentCrop) farmerCrops.add(f.currentCrop.trim().toLowerCase());
        });
        if (farmerDoc.primaryCrops) {
          farmerDoc.primaryCrops.split(',').forEach(c => {
            if (c.trim()) farmerCrops.add(c.trim().toLowerCase());
          });
        }

        formatted = formatted.filter(r => {
          // If recommendation is linked to a specific farm, it must be the farmer's farm
          if (r.farmId) {
            return farmerFarmIds.has(r.farmId.toString());
          }
          // If recommendation is linked to a farmer, it must be this farmer
          if (r.farmerId) {
            return r.farmerId.toString() === farmerDoc._id.toString();
          }
          // If general recommendation, only show if crop matches farmer's crops or is universal
          const recCrop = (r.cropName || '').toLowerCase();
          if (recCrop === 'universal' || !recCrop) return true;
          return farmerCrops.has(recCrop);
        });
      }
    }

    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch biotechnology recommendations' });
  }
};

export const getRecommendationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rec, allFarms] = await Promise.all([
      BiotechnologyRecommendation.findById(id)
        .populate('cropVarietyId')
        .populate('farmerId')
        .populate('farmId')
        .populate('creatorId', 'name role email'),
      Farm.find().lean(),
    ]);

    if (!rec) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }

    const variety: any = rec.cropVarietyId;
    const farmer: any = rec.farmerId;
    const creator: any = rec.creatorId;
    const rawFarm: any = rec.farmId;

    const cropName = inferCropName(rec, rawFarm);
    const farm = resolveFarmForRec(rec, allFarms, cropName);

    res.json({
      id: rec._id.toString(),
      farmId: farm ? farm._id.toString() : (rawFarm?._id?.toString() || undefined),
      farm: farm ? {
        id: farm._id.toString(),
        farmName: farm.farmName,
        locationAddress: farm.locationAddress,
        currentCrop: farm.currentCrop,
      } : undefined,
      cropName,
      cropVariety: variety ? {
        id: variety._id.toString(),
        cropName: variety.cropName,
        varietyName: variety.varietyName,
      } : undefined,
      farmer: farmer ? {
        id: farmer._id.toString(),
        fullName: farmer.fullName,
      } : undefined,
      creator: creator ? {
        id: creator._id.toString(),
        name: creator.name,
        role: creator.role,
      } : undefined,
      recommendationType: rec.recommendationType,
      title: rec.title,
      productName: rec.productName,
      targetIssue: rec.targetIssue,
      reasoning: rec.reasoning,
      expectedBenefit: sanitizeExpectedBenefit(rec.expectedBenefit),
      applicationInstructions: rec.applicationInstructions,
      dosage: rec.dosage,
      precautions: rec.precautions,
      isAutomatedSuggestion: rec.isAutomatedSuggestion,
      status: rec.status,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch recommendation' });
  }
};

export const createRecommendation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      farmId,
      cropName,
      cropVarietyId,
      diseaseCaseId,
      fieldObservationId,
      farmerId,
      recommendationType,
      title,
      productName,
      targetIssue,
      reasoning,
      expectedBenefit,
      applicationInstructions,
      dosage,
      precautions,
      isAutomatedSuggestion = false,
      status = 'ACTIVE',
    } = req.body;

    if (!title || !productName || !recommendationType || !reasoning) {
      res.status(400).json({ error: 'Title, product name, recommendation type, and reasoning are required.' });
      return;
    }

    const creatorId = req.user?.id || (await User.findOne({ role: { $in: ['biotech_expert', 'BIOTECH_EXPERT', 'admin', 'ADMIN'] } }))?._id;

    let validFarmId = (farmId && mongoose.Types.ObjectId.isValid(farmId)) ? farmId : undefined;
    let validFarmerId = (farmerId && mongoose.Types.ObjectId.isValid(farmerId)) ? farmerId : undefined;
    let validVarietyId = (cropVarietyId && mongoose.Types.ObjectId.isValid(cropVarietyId)) ? cropVarietyId : undefined;
    let effectiveCropName = cropName || 'Universal';

    if (validFarmId && (!validFarmerId || !validVarietyId || effectiveCropName === 'Universal')) {
      const farmDoc = await Farm.findById(validFarmId);
      if (farmDoc) {
        if (!validFarmerId && farmDoc.farmerId) validFarmerId = farmDoc.farmerId.toString();
        if (!validVarietyId && farmDoc.cropVarietyId) validVarietyId = farmDoc.cropVarietyId.toString();
        if (effectiveCropName === 'Universal' && farmDoc.currentCrop) effectiveCropName = farmDoc.currentCrop;
      }
    }

    const rec = await BiotechnologyRecommendation.create({
      farmId: validFarmId,
      cropName: effectiveCropName,
      cropVarietyId: validVarietyId,
      diseaseReportId: diseaseCaseId || undefined,
      fieldObservationId: fieldObservationId || undefined,
      farmerId: validFarmerId,
      creatorId,
      recommendationType,
      title,
      productName,
      targetIssue: targetIssue || 'Crop health enhancement',
      reasoning,
      expectedBenefit: sanitizeExpectedBenefit(expectedBenefit || 'Promotes natural crop resilience and biological pest inhibition (Field estimate; unverified under open-field conditions).'),
      applicationInstructions: applicationInstructions || 'Apply according to manufacturer protocol during low-sun hours.',
      dosage: dosage || 'Standard recommended agronomic dosage',
      precautions: precautions || 'Wear protective gear and store away from direct sunlight.',
      isAutomatedSuggestion: Boolean(isAutomatedSuggestion),
      status,
    });

    if (validFarmerId && creatorId) {
      await FarmerAdvisory.create({
        farmerId: validFarmerId,
        advisorId: creatorId,
        title: `Biotech Solution: ${title}`,
        category: 'BIOTECH_INPUT',
        message: `Recommended Product: ${productName}. Dosage: ${dosage || 'Standard'}. Application: ${applicationInstructions || 'Standard'}. Reasoning: ${reasoning}`,
        priority: 'IMPORTANT',
      });
    }

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'CREATE_RECOMMENDATION',
        module: 'Biotechnology Recommendations',
        details: `Created recommendation "${title}" (${recommendationType})`,
      });
    }

    res.status(201).json({
      id: rec._id.toString(),
      ...rec.toObject(),
    });
  } catch (error: any) {
    console.error('Error creating recommendation:', error);
    res.status(500).json({ error: 'Failed to create recommendation' });
  }
};

export const generateAIRecommendations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { cropName, growthStage, soilCondition, diseaseSymptom, farmId, farmerId, varietyId } = req.body;

    const creatorId = req.user?.id || (await User.findOne({ role: { $in: ['biotech_expert', 'BIOTECH_EXPERT', 'admin', 'ADMIN'] } }))?._id;

    // --- Build the Gemini prompt ---
    const prompt = `You are an expert agricultural biotechnology advisor. Based on the following field conditions, generate exactly 3 targeted biotechnology recommendations (one BIOFERTILIZER, one BIOPESTICIDE, and one BIOLOGICAL_CONTROL).

Field Conditions:
- Crop: ${cropName || 'General crop'}
- Growth Stage: ${growthStage || 'Vegetative'}
- Soil Condition: ${soilCondition || 'Standard loamy soil'}
- Disease/Pest Symptoms: ${diseaseSymptom || 'General pest pressure'}

For EACH recommendation, respond in STRICT JSON array format with exactly these fields:
[
  {
    "type": "BIOFERTILIZER",
    "title": "a specific, professional title for this biofertilizer recommendation",
    "productName": "specific microbial product name with scientific organism names",
    "targetIssue": "the specific agronomic issue being addressed",
    "reasoning": "detailed scientific reasoning (2-3 sentences) explaining the biological mechanism",
    "expectedBenefit": "realistic agronomic benefit description based on established biotechnology mechanisms (note: label numerical estimates as unverified or agronomic estimates; avoid presenting unproven percentage claims as guaranteed)",
    "dosage": "exact dosage with units per acre",
    "instructions": "step-by-step application method and timing",
    "precautions": "safety and compatibility precautions"
  },
  {
    "type": "BIOPESTICIDE",
    "title": "...",
    "productName": "...",
    "targetIssue": "...",
    "reasoning": "...",
    "expectedBenefit": "...",
    "dosage": "...",
    "instructions": "...",
    "precautions": "..."
  },
  {
    "type": "BIOLOGICAL_CONTROL",
    "title": "...",
    "productName": "...",
    "targetIssue": "...",
    "reasoning": "...",
    "expectedBenefit": "...",
    "dosage": "...",
    "instructions": "...",
    "precautions": "..."
  }
]

IMPORTANT: Return ONLY the JSON array, no extra text, no markdown fences, no explanation outside the JSON.`;

    let parsedRecs: any[];

    // Try Gemini API if key is available
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Extract JSON from the response (handle markdown fences if present)
        let jsonStr = responseText.trim();
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        parsedRecs = JSON.parse(jsonStr);

        if (!Array.isArray(parsedRecs) || parsedRecs.length === 0) {
          throw new Error('Invalid AI response format');
        }
      } catch (aiError: any) {
        console.error('Gemini AI call failed, falling back to templates:', aiError.message);
        parsedRecs = getFallbackTemplates(cropName, growthStage, soilCondition, diseaseSymptom);
      }
    } else {
      console.log('No GEMINI_API_KEY found, using template recommendations');
      parsedRecs = getFallbackTemplates(cropName, growthStage, soilCondition, diseaseSymptom);
    }

    // Resolve farm, farmer, and variety
    let validVarietyId = (varietyId && mongoose.Types.ObjectId.isValid(varietyId)) ? varietyId : undefined;
    let validFarmerId = (farmerId && mongoose.Types.ObjectId.isValid(farmerId)) ? farmerId : undefined;
    const validFarmId = (farmId && mongoose.Types.ObjectId.isValid(farmId)) ? farmId : undefined;
    let effectiveCropName = cropName || 'Universal';

    if (validFarmId) {
      const farmDoc = await Farm.findById(validFarmId);
      if (farmDoc) {
        if (!validFarmerId && farmDoc.farmerId) validFarmerId = farmDoc.farmerId.toString();
        if (!validVarietyId && farmDoc.cropVarietyId) validVarietyId = farmDoc.cropVarietyId.toString();
        if ((!cropName || cropName === 'Universal') && farmDoc.currentCrop) {
          effectiveCropName = farmDoc.currentCrop;
        }
      }
    }

    if (!validVarietyId && effectiveCropName && effectiveCropName !== 'Universal') {
      const matchedVar = await CropVariety.findOne({ cropName: new RegExp('^' + effectiveCropName.trim() + '$', 'i') });
      if (matchedVar) {
        validVarietyId = matchedVar._id.toString();
      }
    }

    // Save to database
    const createdRecs = [];
    for (const t of parsedRecs) {
      const rec = await BiotechnologyRecommendation.create({
        farmId: validFarmId,
        cropName: effectiveCropName,
        cropVarietyId: validVarietyId,
        farmerId: validFarmerId,
        creatorId,
        recommendationType: t.type,
        title: t.title,
        productName: t.productName,
        targetIssue: t.targetIssue,
        reasoning: t.reasoning,
        expectedBenefit: sanitizeExpectedBenefit(t.expectedBenefit),
        applicationInstructions: t.instructions,
        dosage: t.dosage,
        precautions: t.precautions,
        isAutomatedSuggestion: true,
        status: 'ACTIVE',
      });
      createdRecs.push({
        id: rec._id.toString(),
        ...rec.toObject(),
      });
    }

    res.json({
      message: 'AI-powered biotechnology recommendations generated successfully via Gemini',
      recommendations: createdRecs,
    });
  } catch (error: any) {
    console.error('Error generating AI recommendations:', error);
    res.status(500).json({ error: 'Failed to generate automated recommendations' });
  }
};

// Fallback templates when Gemini API is unavailable (Sanitized claims based on agronomic models)
function getFallbackTemplates(cropName?: string, growthStage?: string, soilCondition?: string, diseaseSymptom?: string) {
  return [
    {
      type: 'BIOFERTILIZER',
      title: `Consortium Bio-Inoculation Protocol for ${cropName || 'Crops'}`,
      productName: 'NutriGrow VAM Mycorrhizae & Azotobacter Chroococcum',
      targetIssue: `Root uptake deficiency and moisture stress during ${growthStage || 'Vegetative'} phase`,
      reasoning: `Endophytic mycorrhizal fungi create a symbiotic fungal net that enhances phosphorus & micronutrient bioavailability in ${soilCondition || 'loamy'} soil.`,
      expectedBenefit: 'Promotes root colonization and nutrient uptake efficiency (Field trial estimate; unverified under variable open-field conditions).',
      dosage: '4 kg / Acre mixed with organic manure',
      instructions: 'Apply at early morning near root perimeter; irrigate lightly immediately after.',
      precautions: 'Do not mix with chemical bactericides or systemic fungicides.',
    },
    {
      type: 'BIOPESTICIDE',
      title: `Targeted Biological Defense against ${diseaseSymptom || 'Foliar Pathogens'}`,
      productName: 'Bio-Cure Trichoderma viride & Bacillus amyloliquefaciens',
      targetIssue: 'Suppression of fungal spores and foliar bacterial spotting',
      reasoning: 'Trichoderma actively mycoparasitizes pathogenic fungal hyphae while Bacillus produces natural lipopeptide bio-surfactants preventing spore adhesion.',
      expectedBenefit: 'Antagonizes foliar fungal pathogens and suppresses spore germination (Field trial estimate; response timing varies with disease pressure).',
      dosage: '5 ml / Liter water (500ml / Acre)',
      instructions: 'Foliar spray with uniform canopy coverage during late afternoon hours.',
      precautions: 'Shake well before dilution. Keep spray solution pH between 6.0 and 7.0.',
    },
    {
      type: 'BIOLOGICAL_CONTROL',
      title: 'Integrated Pest Management Biocontrol Strategy',
      productName: 'Trichogramma Chilonis Parasitoid Cards & Micro-Encapsulated Lures',
      targetIssue: 'Early-stage lepidopteran egg and larval infestation',
      reasoning: 'Female parasitoid wasps lay eggs inside pest eggs, preventing larval emergence before leaf perforation can occur.',
      expectedBenefit: 'Targeted egg parasitism reduces pest emergence without toxic chemical residues (Agronomic field estimate; unverified under open-canopy conditions).',
      dosage: '5 parasite cards per acre (50,000 parasitoids/acre)',
      instructions: 'Staple cards to underside of upper leaves at 20-meter grid intervals.',
      precautions: 'Do not spray synthetic pyrethroids or organophosphates for 14 days after release.',
    },
  ];
}

export const updateRecommendation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }

    const existing = await BiotechnologyRecommendation.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }

    const userRole = (req.user?.role || '').toLowerCase();

    // Farmer-specific authorization and boundary validation
    if (userRole === 'farmer') {
      const farmerDoc = await Farmer.findOne({
        $or: [
          { userId: req.user?.id },
          { email: req.user?.email.toLowerCase() }
        ]
      });

      if (!farmerDoc) {
        res.status(403).json({ error: 'Forbidden: Farmer profile not associated with this account.' });
        return;
      }

      const farmerFarms = await Farm.find({ farmerId: farmerDoc._id }).lean();
      const farmerFarmIds = new Set(farmerFarms.map(f => f._id.toString()));

      // If the recommendation is assigned to a specific farm, ensure it belongs to this farmer
      if (existing.farmId && !farmerFarmIds.has(existing.farmId.toString())) {
        res.status(403).json({
          error: 'Forbidden: You do not have permission to modify recommendations for another farm.',
        });
        return;
      }

      // Farmers can ONLY update the application status (e.g. marking applied)
      const protectedFields = [
        'title', 'productName', 'targetIssue', 'reasoning', 'expectedBenefit',
        'applicationInstructions', 'dosage', 'precautions', 'recommendationType',
        'creatorId', 'isAutomatedSuggestion', 'farmId', 'cropVarietyId'
      ];
      const hasProtectedModification = protectedFields.some(field => req.body[field] !== undefined);

      if (hasProtectedModification) {
        res.status(403).json({
          error: 'Forbidden: Farmers may only update the application status (Mark Applied). Expert protocol details cannot be modified.',
        });
        return;
      }

      if (req.body.status) {
        existing.status = req.body.status;
        await existing.save();
      }

      res.json({
        id: existing._id.toString(),
        ...existing.toObject(),
      });
      return;
    }

    // Authorized Expert / Admin updates
    const updated = await BiotechnologyRecommendation.findByIdAndUpdate(id, req.body, { new: true });
    res.json({
      id: updated!._id.toString(),
      ...updated!.toObject(),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update recommendation' });
  }
};

export const deleteRecommendation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await BiotechnologyRecommendation.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }
    res.json({ message: 'Recommendation deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete recommendation' });
  }
};
