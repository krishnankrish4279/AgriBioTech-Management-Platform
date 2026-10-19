import { Request, Response } from 'express';
import { FieldObservation, Farm, CropVariety, User, ActivityLog } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';

export const getObservations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { farmId, cropVarietyId, observerId, growthStage, search } = req.query;

    const filter: any = {};

    if (farmId && typeof farmId === 'string' && farmId !== 'undefined' && farmId !== '') {
      filter.farmId = farmId;
    }

    if (cropVarietyId && typeof cropVarietyId === 'string' && cropVarietyId !== 'undefined' && cropVarietyId !== '') {
      filter.cropVarietyId = cropVarietyId;
    }

    if (observerId && typeof observerId === 'string' && observerId !== 'undefined' && observerId !== '') {
      filter.observerId = observerId;
    }

    if (growthStage && typeof growthStage === 'string' && growthStage !== 'ALL' && growthStage !== 'undefined' && growthStage !== '') {
      filter.growthStage = growthStage;
    }

    if (search && typeof search === 'string' && search !== 'undefined' && search.trim() !== '') {
      filter.$or = [
        { notes: { $regex: search.trim(), $options: 'i' } },
        { pestSymptoms: { $regex: search.trim(), $options: 'i' } },
        { soilHealthNotes: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const observations = await FieldObservation.find(filter)
      .populate({
        path: 'farmId',
        populate: { path: 'farmerId' }
      })
      .populate('cropVarietyId')
      .populate('observerId', 'name role')
      .sort({ observationDate: -1 });

    const formatted = observations.map(obs => {
      const farm: any = obs.farmId;
      const variety: any = obs.cropVarietyId;
      const observer: any = obs.observerId;
      const farmer: any = farm?.farmerId;

      return {
        id: obs._id.toString(),
        farmId: farm?._id?.toString() || '',
        farm: farm ? {
          id: farm._id.toString(),
          farmName: farm.farmName,
          farmer: farmer ? {
            id: farmer._id.toString(),
            fullName: farmer.fullName,
            phone: farmer.phone,
          } : undefined
        } : undefined,
        cropVarietyId: variety?._id?.toString(),
        cropVariety: variety ? {
          id: variety._id.toString(),
          cropName: variety.cropName,
          varietyName: variety.varietyName,
        } : undefined,
        observerId: observer?._id?.toString(),
        observer: observer ? {
          id: observer._id.toString(),
          name: observer.name,
          role: observer.role,
        } : undefined,
        observationDate: obs.observationDate,
        growthStage: obs.growthStage,
        plantHealthScore: obs.plantHealthScore,
        soilMoisture: obs.soilMoisture,
        soilHealthNotes: obs.soilHealthNotes,
        weatherCondition: obs.weatherCondition,
        pestSymptoms: obs.pestSymptoms,
        notes: obs.notes,
        photoUrl: obs.photoUrl,
        latitude: obs.latitude,
        longitude: obs.longitude,
        createdAt: obs.createdAt,
        updatedAt: obs.updatedAt,
      };
    });

    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching observations:', error);
    res.status(500).json({ error: 'Failed to fetch field observations' });
  }
};

export const getObservationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const obs = await FieldObservation.findById(id)
      .populate({
        path: 'farmId',
        populate: { path: 'farmerId' }
      })
      .populate('cropVarietyId')
      .populate('observerId', 'name role email');

    if (!obs) {
      res.status(404).json({ error: 'Field observation not found' });
      return;
    }

    const farm: any = obs.farmId;
    const variety: any = obs.cropVarietyId;
    const observer: any = obs.observerId;

    res.json({
      id: obs._id.toString(),
      farm: farm ? {
        id: farm._id.toString(),
        farmName: farm.farmName,
        farmer: farm.farmerId,
      } : undefined,
      cropVariety: variety,
      observer,
      observationDate: obs.observationDate,
      growthStage: obs.growthStage,
      plantHealthScore: obs.plantHealthScore,
      soilMoisture: obs.soilMoisture,
      soilHealthNotes: obs.soilHealthNotes,
      weatherCondition: obs.weatherCondition,
      pestSymptoms: obs.pestSymptoms,
      notes: obs.notes,
      photoUrl: obs.photoUrl,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch field observation' });
  }
};

export const recordObservation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      farmId,
      cropVarietyId,
      observationDate,
      growthStage,
      plantHealthScore,
      soilMoisture,
      soilHealthNotes,
      weatherCondition,
      pestSymptoms,
      notes,
      latitude,
      longitude,
      photoUrl,
    } = req.body;

    if (!farmId || !growthStage || !notes) {
      res.status(400).json({ error: 'Farm, growth stage, and observation notes are required.' });
      return;
    }

    const farm = await Farm.findById(farmId);
    if (!farm) {
      res.status(404).json({ error: 'Selected farm not found' });
      return;
    }

    let obsLat = parseFloat(latitude);
    let obsLong = parseFloat(longitude);
    if (isNaN(obsLat) || isNaN(obsLong)) {
      obsLat = farm.latitude;
      obsLong = farm.longitude;
    }

    const observerId = req.user?.id || (await User.findOne({ role: { $in: ['agronomist', 'AGRONOMIST', 'admin', 'ADMIN'] } }))?._id;

    const cleanCropVarietyId = (cropVarietyId && typeof cropVarietyId === 'string' && cropVarietyId.trim() !== '' && cropVarietyId !== 'undefined' && cropVarietyId !== 'null')
      ? cropVarietyId.trim()
      : undefined;

    const obs = await FieldObservation.create({
      farmId,
      cropVarietyId: cleanCropVarietyId,
      observerId,
      observationDate: observationDate ? new Date(observationDate) : new Date(),
      growthStage,
      plantHealthScore: parseInt(plantHealthScore, 10) || 8,
      soilMoisture: soilMoisture || 'OPTIMAL',
      soilHealthNotes: soilHealthNotes || 'Adequate organic carbon and microbial presence.',
      weatherCondition: weatherCondition || 'SUNNY',
      pestSymptoms: pestSymptoms || undefined,
      notes,
      photoUrl: photoUrl || (req.file ? `/uploads/${req.file.filename}` : 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80'),
      latitude: obsLat,
      longitude: obsLong,
    });

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'LOG_OBSERVATION',
        module: 'Field Observation Management',
        details: `Recorded field visit at ${farm.farmName} (Health Score: ${obs.plantHealthScore}/10)`,
      });
    }

    res.status(201).json({
      id: obs._id.toString(),
      ...obs.toObject(),
    });
  } catch (error: any) {
    console.error('Error recording observation:', error);
    res.status(500).json({ error: 'Failed to record field observation' });
  }
};

export const updateObservation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await FieldObservation.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      res.status(404).json({ error: 'Field observation not found' });
      return;
    }
    res.json({
      id: updated._id.toString(),
      ...updated.toObject(),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update field observation' });
  }
};

export const deleteObservation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await FieldObservation.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: 'Field observation not found' });
      return;
    }
    res.json({ message: 'Field observation deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete field observation' });
  }
};
