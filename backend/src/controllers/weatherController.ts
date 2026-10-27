import { Request, Response } from 'express';
import { Farm, Farmer, FarmerAdvisory, User } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  fetchLiveWeather,
  generateFarmWeatherAdvisories,
  fetchRainViewerRadarMeta,
  WeatherObservation,
  FarmWeatherAdvisory,
} from '../services/weatherService';

export const getCurrentWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, locationName } = req.query;

    if (lat === undefined || lng === undefined || lat === '' || lng === '') {
      res.status(400).json({
        error: 'Missing coordinates',
        message: 'Please provide valid latitude and longitude query parameters (e.g. ?lat=12.9675&lng=79.9416).',
      });
      return;
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Latitude and longitude must be valid numerical values.',
      });
      return;
    }

    if (latitude === 0 && longitude === 0) {
      res.status(400).json({
        error: 'Uninitialized coordinates',
        message: 'Coordinates (0, 0) represent an uninitialized location. Please provide your true GPS position.',
      });
      return;
    }

    const weather = await fetchLiveWeather(latitude, longitude, locationName ? String(locationName) : undefined);
    res.json(weather);
  } catch (error: any) {
    console.error('Error fetching current weather:', error.message);
    res.status(502).json({
      error: 'Weather data unavailable',
      message: error.message || 'Unable to retrieve live weather data from meteorological service.',
    });
  }
};

export const getFarmWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const farm = await Farm.findById(id).populate('farmerId');

    if (!farm) {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }

    if (
      typeof farm.latitude !== 'number' ||
      typeof farm.longitude !== 'number' ||
      isNaN(farm.latitude) ||
      isNaN(farm.longitude) ||
      (farm.latitude === 0 && farm.longitude === 0)
    ) {
      res.status(422).json({
        error: 'Missing verified farm coordinates',
        message: `Farm "${farm.farmName}" does not have verified geographic coordinates in the database.`,
      });
      return;
    }

    const weather = await fetchLiveWeather(farm.latitude, farm.longitude, farm.farmName);
    const advisories = generateFarmWeatherAdvisories(
      {
        id: farm._id.toString(),
        farmName: farm.farmName,
        currentCrop: farm.currentCrop,
        locationAddress: farm.locationAddress,
        latitude: farm.latitude,
        longitude: farm.longitude,
      },
      weather
    );

    res.json({
      farm: {
        id: farm._id.toString(),
        farmName: farm.farmName,
        locationAddress: farm.locationAddress,
        latitude: farm.latitude,
        longitude: farm.longitude,
        currentCrop: farm.currentCrop,
        soilType: farm.soilType,
        irrigationType: farm.irrigationType,
      },
      weather,
      advisories,
    });
  } catch (error: any) {
    console.error('Error fetching farm weather:', error.message);
    res.status(502).json({
      error: 'Farm weather unavailable',
      message: error.message || 'Unable to retrieve weather for this farm location.',
    });
  }
};

export const getRegisteredFarmsWeather = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let filter: any = {};

    // If authenticated user is a farmer, only return their authorized farms
    if (req.user && req.user.role.toLowerCase() === 'farmer') {
      const farmerDoc = await Farmer.findOne({
        $or: [{ userId: req.user.id }, { email: req.user.email.toLowerCase() }],
      });
      if (farmerDoc) {
        filter.farmerId = farmerDoc._id;
      }
    }

    const farms = await Farm.find(filter).populate('farmerId');
    const validFarms = farms.filter(
      (f) =>
        typeof f.latitude === 'number' &&
        typeof f.longitude === 'number' &&
        !isNaN(f.latitude) &&
        !isNaN(f.longitude) &&
        !(f.latitude === 0 && f.longitude === 0)
    );

    const summaries = await Promise.all(
      validFarms.map(async (farm) => {
        try {
          const w = await fetchLiveWeather(farm.latitude, farm.longitude, farm.farmName);
          const advisories = generateFarmWeatherAdvisories(
            {
              id: farm._id.toString(),
              farmName: farm.farmName,
              currentCrop: farm.currentCrop,
              locationAddress: farm.locationAddress,
              latitude: farm.latitude,
              longitude: farm.longitude,
            },
            w
          );

          return {
            farmId: farm._id.toString(),
            farmName: farm.farmName,
            currentCrop: farm.currentCrop,
            locationAddress: farm.locationAddress,
            latitude: farm.latitude,
            longitude: farm.longitude,
            weather: {
              temperature: w.current.temperature,
              apparentTemperature: w.current.apparentTemperature,
              relativeHumidity: w.current.relativeHumidity,
              precipitation: w.current.precipitation,
              conditionText: w.current.conditionText,
              weatherCode: w.current.weatherCode,
              windSpeed: w.current.windSpeed,
              measurementPeriod: w.current.measurementPeriod,
              lastUpdated: w.lastUpdated,
            },
            advisories,
          };
        } catch (err: any) {
          return {
            farmId: farm._id.toString(),
            farmName: farm.farmName,
            currentCrop: farm.currentCrop,
            locationAddress: farm.locationAddress,
            latitude: farm.latitude,
            longitude: farm.longitude,
            weather: null,
            error: err.message,
            advisories: [],
          };
        }
      })
    );

    res.json(summaries);
  } catch (error: any) {
    console.error('Error fetching registered farms weather:', error);
    res.status(500).json({ error: 'Failed to fetch registered farms weather' });
  }
};

export const getWeatherAdvisories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let filter: any = {};

    if (req.user && req.user.role.toLowerCase() === 'farmer') {
      const farmerDoc = await Farmer.findOne({
        $or: [{ userId: req.user.id }, { email: req.user.email.toLowerCase() }],
      });
      if (farmerDoc) {
        filter.farmerId = farmerDoc._id;
      }
    }

    const farms = await Farm.find(filter);
    const validFarms = farms.filter(
      (f) =>
        typeof f.latitude === 'number' &&
        typeof f.longitude === 'number' &&
        !isNaN(f.latitude) &&
        !isNaN(f.longitude) &&
        !(f.latitude === 0 && f.longitude === 0)
    );

    const allAdvisories: FarmWeatherAdvisory[] = [];

    await Promise.all(
      validFarms.map(async (farm) => {
        try {
          const w = await fetchLiveWeather(farm.latitude, farm.longitude, farm.farmName);
          const advs = generateFarmWeatherAdvisories(
            {
              id: farm._id.toString(),
              farmName: farm.farmName,
              currentCrop: farm.currentCrop,
              locationAddress: farm.locationAddress,
              latitude: farm.latitude,
              longitude: farm.longitude,
            },
            w
          );
          allAdvisories.push(...advs);
        } catch {
          // ignore individual farm weather error
        }
      })
    );

    // Sort by priority (URGENT first, then IMPORTANT, then ROUTINE)
    const priorityWeight: Record<string, number> = { URGENT: 3, IMPORTANT: 2, ROUTINE: 1 };
    allAdvisories.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));

    res.json(allAdvisories);
  } catch (error: any) {
    console.error('Error fetching weather advisories:', error);
    res.status(500).json({ error: 'Failed to generate weather advisories' });
  }
};

export const syncWeatherAdvisoriesToDB = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const farms = await Farm.find().populate('farmerId');
    const validFarms = farms.filter(
      (f) =>
        typeof f.latitude === 'number' &&
        typeof f.longitude === 'number' &&
        !isNaN(f.latitude) &&
        !isNaN(f.longitude) &&
        !(f.latitude === 0 && f.longitude === 0)
    );

    const advisorUser =
      (await User.findOne({ role: { $in: ['agronomist', 'AGRONOMIST'] } })) ||
      (await User.findOne({ role: { $in: ['admin', 'ADMIN'] } }));

    if (!advisorUser) {
      res.status(500).json({ error: 'No agronomist or admin found to author automated advisories' });
      return;
    }

    let createdCount = 0;
    const syncedAdvisories: any[] = [];

    for (const farm of validFarms) {
      const farmer: any = farm.farmerId;
      if (!farmer) continue;

      try {
        const w = await fetchLiveWeather(farm.latitude, farm.longitude, farm.farmName);
        const advs = generateFarmWeatherAdvisories(
          {
            id: farm._id.toString(),
            farmName: farm.farmName,
            currentCrop: farm.currentCrop,
            locationAddress: farm.locationAddress,
            latitude: farm.latitude,
            longitude: farm.longitude,
          },
          w
        );

        for (const adv of advs) {
          // Check for duplicate recent active advisory within last 24 hours
          const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
          const existing = await FarmerAdvisory.findOne({
            farmerId: farmer._id,
            category: 'WEATHER_ACTION',
            title: adv.title,
            createdAt: { $gte: yesterday },
          });

          if (!existing) {
            const created = await FarmerAdvisory.create({
              farmerId: farmer._id,
              advisorId: advisorUser._id,
              title: adv.title,
              category: 'WEATHER_ACTION',
              message: `Observed Condition: ${adv.condition}. Measurement: ${adv.measurement}. Practical Advice: ${adv.advice}`,
              priority: adv.priority,
              isRead: false,
            });
            createdCount++;
            syncedAdvisories.push(created);
          }
        }
      } catch (err: any) {
        console.warn(`[Sync Weather] Could not process farm ${farm.farmName}:`, err.message);
      }
    }

    res.json({
      message: `Successfully synchronized ${createdCount} weather advisory(s).`,
      createdCount,
      syncedAdvisories,
    });
  } catch (error: any) {
    console.error('Error syncing weather advisories:', error);
    res.status(500).json({ error: 'Failed to sync weather advisories to database' });
  }
};

export const getRadarOverlayMeta = async (_req: Request, res: Response): Promise<void> => {
  try {
    const meta = await fetchRainViewerRadarMeta();
    res.json(meta);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch radar overlay metadata', message: error.message });
  }
};
