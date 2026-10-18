import { Request, Response } from 'express';
import { CropVariety, ActivityLog } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';

export const getVarieties = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, cropType, growingSeason, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter: any = {};

    if (search && typeof search === 'string' && search !== 'undefined' && search.trim() !== '') {
      filter.$or = [
        { cropName: { $regex: search.trim(), $options: 'i' } },
        { varietyName: { $regex: search.trim(), $options: 'i' } },
        { biotechTraits: { $regex: search.trim(), $options: 'i' } },
        { diseaseResistanceTraits: { $regex: search.trim(), $options: 'i' } },
        { recommendedRegions: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (cropType && typeof cropType === 'string' && cropType !== 'ALL' && cropType !== 'undefined' && cropType.trim() !== '') {
      filter.cropType = { $regex: new RegExp(`^${cropType.trim()}$`, 'i') };
    }

    if (growingSeason && typeof growingSeason === 'string' && growingSeason !== 'ALL' && growingSeason !== 'undefined' && growingSeason.trim() !== '') {
      filter.growingSeason = { $regex: new RegExp(`^${growingSeason.trim()}$`, 'i') };
    }

    const sortOption: any = {};
    if (sortBy === 'yield') {
      sortOption.expectedYieldMax = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'maturity') {
      sortOption.maturityDays = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOption[sortBy as string] = sortOrder === 'asc' ? 1 : -1;
    }

    const varieties = await CropVariety.find(filter).sort(sortOption);

    const formatted = varieties.map(v => ({
      id: v._id.toString(),
      cropName: v.cropName,
      varietyName: v.varietyName,
      cropType: v.cropType,
      growingSeason: v.growingSeason,
      soilRequirements: v.soilRequirements,
      expectedYieldMin: v.expectedYieldMin,
      expectedYieldMax: v.expectedYieldMax,
      yieldUnit: v.yieldUnit,
      diseaseResistanceTraits: v.diseaseResistanceTraits,
      biotechTraits: v.biotechTraits,
      recommendedRegions: v.recommendedRegions,
      description: v.description,
      maturityDays: v.maturityDays,
      imageUrl: v.imageUrl,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      _count: {
        diseaseCases: 1,
        observations: 2,
        recommendations: 2,
      }
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching crop varieties:', error);
    res.status(500).json({ error: 'Failed to fetch crop varieties' });
  }
};

export const getVarietyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const variety = await CropVariety.findById(id);

    if (!variety) {
      res.status(404).json({ error: 'Crop variety not found' });
      return;
    }

    res.json({
      id: variety._id.toString(),
      cropName: variety.cropName,
      varietyName: variety.varietyName,
      cropType: variety.cropType,
      growingSeason: variety.growingSeason,
      soilRequirements: variety.soilRequirements,
      expectedYieldMin: variety.expectedYieldMin,
      expectedYieldMax: variety.expectedYieldMax,
      yieldUnit: variety.yieldUnit,
      diseaseResistanceTraits: variety.diseaseResistanceTraits,
      biotechTraits: variety.biotechTraits,
      recommendedRegions: variety.recommendedRegions,
      description: variety.description,
      maturityDays: variety.maturityDays,
      imageUrl: variety.imageUrl,
      createdAt: variety.createdAt,
      updatedAt: variety.updatedAt,
      _count: {
        diseaseCases: 1,
        observations: 2,
        recommendations: 2,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch crop variety' });
  }
};

export const createVariety = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      cropName,
      varietyName,
      cropType,
      growingSeason,
      soilRequirements,
      expectedYieldMin,
      expectedYieldMax,
      yieldUnit = 'Quintals/Acre',
      diseaseResistanceTraits,
      biotechTraits,
      recommendedRegions,
      description,
      maturityDays,
      imageUrl,
    } = req.body;

    if (!cropName || !varietyName || !cropType || !growingSeason) {
      res.status(400).json({ error: 'Crop name, variety name, crop type, and growing season are required.' });
      return;
    }

    const variety = await CropVariety.create({
      cropName,
      varietyName,
      cropType,
      growingSeason,
      soilRequirements: soilRequirements || 'Standard well-drained loamy soil, pH 6.0 - 7.5',
      expectedYieldMin: parseFloat(expectedYieldMin) || 10.0,
      expectedYieldMax: parseFloat(expectedYieldMax) || 20.0,
      yieldUnit,
      diseaseResistanceTraits: diseaseResistanceTraits || 'Standard Field Tolerance',
      biotechTraits: biotechTraits || 'Conventional Elite Line',
      recommendedRegions: recommendedRegions || 'Universal Agro-Climatic Zones',
      description: description || 'High performance crop variety with superior field resilience.',
      maturityDays: parseInt(maturityDays, 10) || 120,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
    });

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'CREATE_VARIETY',
        module: 'Crop Variety Management',
        details: `Added new crop variety: ${variety.varietyName} (${variety.cropName})`,
      });
    }

    res.status(201).json({
      id: variety._id.toString(),
      ...variety.toObject(),
    });
  } catch (error: any) {
    console.error('Error creating crop variety:', error);
    res.status(500).json({ error: 'Failed to create crop variety' });
  }
};

export const updateVariety = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await CropVariety.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      res.status(404).json({ error: 'Crop variety not found' });
      return;
    }

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'UPDATE_VARIETY',
        module: 'Crop Variety Management',
        details: `Updated crop variety: ${updated.varietyName}`,
      });
    }

    res.json({
      id: updated._id.toString(),
      ...updated.toObject(),
    });
  } catch (error: any) {
    console.error('Error updating crop variety:', error);
    res.status(500).json({ error: 'Failed to update crop variety' });
  }
};

export const deleteVariety = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const variety = await CropVariety.findByIdAndDelete(id);
    if (!variety) {
      res.status(404).json({ error: 'Crop variety not found' });
      return;
    }

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'DELETE_VARIETY',
        module: 'Crop Variety Management',
        details: `Deleted crop variety: ${variety.varietyName}`,
      });
    }

    res.json({ message: 'Crop variety deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting variety:', error);
    res.status(500).json({ error: 'Failed to delete variety' });
  }
};
