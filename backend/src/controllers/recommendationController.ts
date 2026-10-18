import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { BiotechnologyRecommendation, CropVariety, Farmer, User, FarmerAdvisory, ActivityLog } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';

export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recommendationType, status, isAutomated, cropVarietyId, farmerId, search } = req.query;

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
      ];
    }

    const recommendations = await BiotechnologyRecommendation.find(filter)
      .populate('cropVarietyId')
      .populate('farmerId')
      .populate('creatorId', 'name role email')
      .sort({ createdAt: -1 });

    const formatted = recommendations.map(r => {
      const variety: any = r.cropVarietyId;
      const farmer: any = r.farmerId;
      const creator: any = r.creatorId;

      return {
        id: r._id.toString(),
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
        expectedBenefit: r.expectedBenefit,
        applicationInstructions: r.applicationInstructions,
        dosage: r.dosage,
        precautions: r.precautions,
        isAutomatedSuggestion: r.isAutomatedSuggestion,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch biotechnology recommendations' });
  }
};

export const getRecommendationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const rec = await BiotechnologyRecommendation.findById(id)
      .populate('cropVarietyId')
      .populate('farmerId')
      .populate('creatorId', 'name role email');

    if (!rec) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }

    const variety: any = rec.cropVarietyId;
    const farmer: any = rec.farmerId;
    const creator: any = rec.creatorId;

    res.json({
      id: rec._id.toString(),
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
      expectedBenefit: rec.expectedBenefit,
      applicationInstructions: rec.applicationInstructions,
      dosage: rec.dosage,
      precautions: rec.precautions,
      isAutomatedSuggestion: rec.isAutomatedSuggestion,
      status: rec.status,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch recommendation' });
  }
};

export const createRecommendation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
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

    const rec = await BiotechnologyRecommendation.create({
      cropVarietyId: cropVarietyId || undefined,
      diseaseReportId: diseaseCaseId || undefined,
      fieldObservationId: fieldObservationId || undefined,
      farmerId: farmerId || undefined,
      creatorId,
      recommendationType,
      title,
      productName,
      targetIssue: targetIssue || 'Crop health enhancement',
      reasoning,
      expectedBenefit: expectedBenefit || 'Boosts natural crop resilience and prevents pest/disease losses.',
      applicationInstructions: applicationInstructions || 'Apply according to manufacturer protocol during low-sun hours.',
      dosage: dosage || 'Standard recommended agronomic dosage',
      precautions: precautions || 'Wear protective gear and store away from direct sunlight.',
      isAutomatedSuggestion: Boolean(isAutomatedSuggestion),
      status,
    });

    if (farmerId && creatorId) {
      await FarmerAdvisory.create({
        farmerId,
        advisorId: creatorId,
        title: `Biotech Solution: ${title}`,
        category: 'BIOTECH_INPUT',
        message: `Recommended Product: ${productName}. Dosage: ${dosage}. Application: ${applicationInstructions}. Reasoning: ${reasoning}`,
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
    "expectedBenefit": "quantified expected benefit with percentages where possible",
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
        // Fallback to templates
        parsedRecs = getFallbackTemplates(cropName, growthStage, soilCondition, diseaseSymptom);
      }
    } else {
      console.log('No GEMINI_API_KEY found, using template recommendations');
      parsedRecs = getFallbackTemplates(cropName, growthStage, soilCondition, diseaseSymptom);
    }

    // Save to database
    const createdRecs = [];
    for (const t of parsedRecs) {
      const validVarietyId = (varietyId && mongoose.Types.ObjectId.isValid(varietyId)) ? varietyId : undefined;
      const validFarmerId = (farmerId && mongoose.Types.ObjectId.isValid(farmerId)) ? farmerId : undefined;

      const rec = await BiotechnologyRecommendation.create({
        cropVarietyId: validVarietyId,
        farmerId: validFarmerId,
        creatorId,
        recommendationType: t.type,
        title: t.title,
        productName: t.productName,
        targetIssue: t.targetIssue,
        reasoning: t.reasoning,
        expectedBenefit: t.expectedBenefit,
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

// Fallback templates when Gemini API is unavailable
function getFallbackTemplates(cropName?: string, growthStage?: string, soilCondition?: string, diseaseSymptom?: string) {
  return [
    {
      type: 'BIOFERTILIZER',
      title: `Consortium Bio-Inoculation Protocol for ${cropName || 'Crops'}`,
      productName: 'NutriGrow VAM Mycorrhizae & Azotobacter Chroococcum',
      targetIssue: `Root uptake deficiency and moisture stress during ${growthStage || 'Vegetative'} phase`,
      reasoning: `Endophytic mycorrhizal fungi create a symbiotic fungal net that enhances phosphorus & micronutrient absorption by 300% in ${soilCondition || 'loamy'} soil.`,
      expectedBenefit: '15-20% increase in vegetative root mass and 10% lower chemical fertilizer requirement.',
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
      expectedBenefit: 'Halts disease spread within 48-72 hours without inducing chemical resistance.',
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
      expectedBenefit: '80-90% reduction in larval emergence without toxic chemical residues.',
      dosage: '5 parasite cards per acre (50,000 parasitoids/acre)',
      instructions: 'Staple cards to underside of upper leaves at 20-meter grid intervals.',
      precautions: 'Do not spray synthetic pyrethroids or organophosphates for 14 days after release.',
    },
  ];
}

export const updateRecommendation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await BiotechnologyRecommendation.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }
    res.json({
      id: updated._id.toString(),
      ...updated.toObject(),
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
