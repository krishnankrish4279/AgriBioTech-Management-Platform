const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agribiotech';

// Inline Schemas for standalone runner
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'agronomist', 'biotech_expert', 'farmer'] },
  phone: String,
  avatarUrl: String,
}, { timestamps: true });

const FarmerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  state: { type: String, required: true },
  district: { type: String, required: true },
  village: String,
  farmSizeAcres: { type: Number, default: 1.0 },
  preferredLanguage: { type: String, default: 'English' },
  farmingExperienceYears: { type: Number, default: 5 },
  primaryCrops: { type: String, required: true },
}, { timestamps: true });

const FarmSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  farmName: { type: String, required: true },
  locationAddress: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  totalAreaAcres: { type: Number, required: true },
  soilType: { type: String, required: true },
  irrigationType: { type: String, required: true },
  currentCrop: String,
  cropVarietyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CropVariety' },
}, { timestamps: true });

const CropVarietySchema = new mongoose.Schema({
  cropName: { type: String, required: true },
  varietyName: { type: String, required: true },
  cropType: { type: String, required: true },
  growingSeason: { type: String, required: true },
  soilRequirements: { type: String, required: true },
  expectedYieldMin: { type: Number, required: true },
  expectedYieldMax: { type: Number, required: true },
  yieldUnit: { type: String, default: 'Quintals/Acre' },
  diseaseResistanceTraits: { type: String, required: true },
  biotechTraits: { type: String, required: true },
  recommendedRegions: { type: String, required: true },
  description: { type: String, required: true },
  maturityDays: { type: Number, default: 120 },
  imageUrl: String,
}, { timestamps: true });

const DiseaseReportSchema = new mongoose.Schema({
  cropVarietyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CropVariety' },
  farmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
  reportedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  diseaseName: { type: String, required: true },
  symptoms: { type: String, required: true },
  severity: { type: String, required: true, default: 'MEDIUM' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  dateObserved: { type: Date, default: Date.now },
  status: { type: String, required: true, default: 'ACTIVE' },
  imageUrl: String,
  recommendedTreatment: String,
  resolvedAt: Date,
}, { timestamps: true });

const FieldObservationSchema = new mongoose.Schema({
  farmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
  cropVarietyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CropVariety' },
  observerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  observationDate: { type: Date, default: Date.now },
  growthStage: { type: String, required: true },
  plantHealthScore: { type: Number, required: true, min: 1, max: 10, default: 8 },
  soilMoisture: { type: String, required: true },
  soilHealthNotes: String,
  weatherCondition: { type: String, required: true },
  pestSymptoms: String,
  notes: { type: String, required: true },
  photoUrl: String,
  latitude: Number,
  longitude: Number,
}, { timestamps: true });

const BiotechnologyRecommendationSchema = new mongoose.Schema({
  cropVarietyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CropVariety' },
  diseaseReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiseaseReport' },
  fieldObservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'FieldObservation' },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recommendationType: { type: String, required: true },
  title: { type: String, required: true },
  productName: { type: String, required: true },
  targetIssue: { type: String, required: true },
  reasoning: { type: String, required: true },
  expectedBenefit: { type: String, required: true },
  applicationInstructions: { type: String, required: true },
  dosage: { type: String, required: true },
  precautions: { type: String, required: true },
  isAutomatedSuggestion: { type: Boolean, default: false },
  status: { type: String, default: 'ACTIVE' },
}, { timestamps: true });

const FarmerAdvisorySchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, default: 'ROUTINE' },
  isRead: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
  recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, default: 'INFO' },
  isRead: { type: Boolean, default: false },
  linkUrl: String,
}, { timestamps: true });

const ActivityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  module: { type: String, required: true },
  details: { type: String, required: true },
}, { timestamps: true });

const DiseaseSchema = new mongoose.Schema({
  diseaseName: { type: String, required: true, unique: true },
  pathogenType: { type: String, required: true },
  cropAffiliation: { type: String, required: true },
  commonSymptoms: { type: String, required: true },
  severityLevelDefault: { type: String, default: 'HIGH' },
  recommendedBiotechSolution: { type: String, required: true },
  preventionProtocol: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Farmer = mongoose.models.Farmer || mongoose.model('Farmer', FarmerSchema);
const Farm = mongoose.models.Farm || mongoose.model('Farm', FarmSchema);
const CropVariety = mongoose.models.CropVariety || mongoose.model('CropVariety', CropVarietySchema);
const DiseaseReport = mongoose.models.DiseaseReport || mongoose.model('DiseaseReport', DiseaseReportSchema);
const FieldObservation = mongoose.models.FieldObservation || mongoose.model('FieldObservation', FieldObservationSchema);
const BiotechnologyRecommendation = mongoose.models.BiotechnologyRecommendation || mongoose.model('BiotechnologyRecommendation', BiotechnologyRecommendationSchema);
const FarmerAdvisory = mongoose.models.FarmerAdvisory || mongoose.model('FarmerAdvisory', FarmerAdvisorySchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
const Disease = mongoose.models.Disease || mongoose.model('Disease', DiseaseSchema);

async function runSeed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected successfully');

  console.log('Clearing demo collections...');
  await Promise.all([
    User.deleteMany({}),
    Farmer.deleteMany({}),
    Farm.deleteMany({}),
    CropVariety.deleteMany({}),
    DiseaseReport.deleteMany({}),
    Disease.deleteMany({}),
    FieldObservation.deleteMany({}),
    BiotechnologyRecommendation.deleteMany({}),
    FarmerAdvisory.deleteMany({}),
    Notification.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);

  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Admin@123', salt);
  const agroHash = await bcrypt.hash('Agronomist@123', salt);
  const scientistHash = await bcrypt.hash('Scientist@123', salt);
  const farmerHash = await bcrypt.hash('Farmer@123', salt);

  const admin = await User.create({
    name: 'Arjun Mehta',
    email: 'admin@agribiotech.demo',
    passwordHash: adminHash,
    role: 'admin',
    phone: '+91-98111-00001',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  const agronomist = await User.create({
    name: 'Priya Sharma',
    email: 'agronomist@agribiotech.demo',
    passwordHash: agroHash,
    role: 'agronomist',
    phone: '+91-98222-00002',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  });

  const scientist = await User.create({
    name: 'Dr. Rahul Verma',
    email: 'scientist@agribiotech.demo',
    passwordHash: scientistHash,
    role: 'biotech_expert',
    phone: '+91-98333-00003',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  });

  const farmerUser = await User.create({
    name: 'Ramesh Kumar',
    email: 'farmer@agribiotech.demo',
    passwordHash: farmerHash,
    role: 'farmer',
    phone: '+91-98444-00004',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  });

  const farmer1 = await Farmer.create({
    userId: farmerUser._id,
    fullName: 'Ramesh Kumar',
    phone: '+91-98444-00004',
    email: 'farmer@agribiotech.demo',
    state: 'Tamil Nadu',
    district: 'Kanchipuram',
    village: 'Sriperumbudur',
    farmSizeAcres: 12.0,
    preferredLanguage: 'Tamil',
    farmingExperienceYears: 14,
    primaryCrops: 'Cotton, Chilli',
  });

  const farmer2 = await Farmer.create({
    fullName: 'Lakshmi Devi',
    phone: '+91-98555-00005',
    email: 'lakshmi.devi@farm.demo',
    state: 'Tamil Nadu',
    district: 'Villupuram',
    village: 'Tindivanam',
    farmSizeAcres: 8.0,
    preferredLanguage: 'Tamil',
    farmingExperienceYears: 10,
    primaryCrops: 'Chilli, Rice',
  });

  const farmer3 = await Farmer.create({
    fullName: 'Suresh Kumar',
    phone: '+91-98666-00006',
    email: 'suresh.kumar@farm.demo',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    village: 'Pollachi',
    farmSizeAcres: 15.0,
    preferredLanguage: 'Tamil',
    farmingExperienceYears: 18,
    primaryCrops: 'Cotton, Maize',
  });

  const farmer4 = await Farmer.create({
    fullName: 'Anitha Raman',
    phone: '+91-98777-00007',
    email: 'anitha.raman@farm.demo',
    state: 'Tamil Nadu',
    district: 'Madurai',
    village: 'Melur',
    farmSizeAcres: 6.0,
    preferredLanguage: 'Tamil',
    farmingExperienceYears: 8,
    primaryCrops: 'Rice, Tomato',
  });

  const varietyBtCotton = await CropVariety.create({
    cropName: 'Cotton',
    varietyName: 'Bt Cotton (BollGuard-III BioShield)',
    cropType: 'CASH_CROP',
    growingSeason: 'KHARIF',
    soilRequirements: 'Deep black cotton regur soil, well-drained red loam, pH 6.5 - 8.0',
    expectedYieldMin: 14.5,
    expectedYieldMax: 19.5,
    yieldUnit: 'Quintals/Acre',
    diseaseResistanceTraits: 'Cotton Leaf Curl Virus Resistant',
    biotechTraits: 'Triple Toxin Cry1Ac + Cry2Ab2 + Vip3Aa',
    recommendedRegions: 'Southern Cotton Zones (Tamil Nadu - Coimbatore, Kanchipuram, Salem, Madurai)',
    description: 'Next-generation transgenic cotton with stacked Cry and Vip genes against Bollworms.',
    maturityDays: 155,
    imageUrl: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop&q=80',
  });

  const varietyWheat = await CropVariety.create({
    cropName: 'Wheat',
    varietyName: 'HD-2967 Wheat Bio-Resilience',
    cropType: 'CEREAL',
    growingSeason: 'RABI',
    soilRequirements: 'Well-drained alluvial loam, pH 6.2 - 7.5',
    expectedYieldMin: 24.0,
    expectedYieldMax: 30.5,
    yieldUnit: 'Quintals/Acre',
    diseaseResistanceTraits: 'Yellow Rust (Yr18) Immune',
    biotechTraits: 'High Biomass Stay-Green Trait, Zinc Biofortified',
    recommendedRegions: 'North Western & Central Plains Zones, Southern Research Stations',
    description: 'High-yielding semi-dwarf wheat with robust tillering and broad adaptability.',
    maturityDays: 140,
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
  });

  const varietyRice = await CropVariety.create({
    cropName: 'Rice',
    varietyName: 'IR64 Rice (Sub1A Bio-Enhanced)',
    cropType: 'CEREAL',
    growingSeason: 'KHARIF',
    soilRequirements: 'Heavy clay loam with high moisture retention',
    expectedYieldMin: 28.0,
    expectedYieldMax: 35.0,
    yieldUnit: 'Quintals/Acre',
    diseaseResistanceTraits: 'Bacterial Blight and Blast Resistant',
    biotechTraits: 'Sub1A Submergence Flash Flood Tolerance',
    recommendedRegions: 'Palar & Cauvery River Basins, Tamil Nadu Delta Agro-Climatic Belts',
    description: 'Survives 14-day underwater flash flooding while preserving slender grain quality.',
    maturityDays: 120,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
  });

  const varietyChilli = await CropVariety.create({
    cropName: 'Chilli',
    varietyName: 'Hybrid Chilli (Teja Bio-Shield F1)',
    cropType: 'HORTICULTURE',
    growingSeason: 'YEAR_ROUND',
    soilRequirements: 'Well-drained rich sandy loam with organic compost',
    expectedYieldMin: 30.0,
    expectedYieldMax: 42.0,
    yieldUnit: 'Quintals/Acre',
    diseaseResistanceTraits: 'Chilli Leaf Curl Virus Tolerant',
    biotechTraits: 'High Capsaicin (0.85%), Deep Red ASTA Color Value',
    recommendedRegions: 'Tamil Nadu Chilli Corridor (Tiruvallur, Ramanathapuram, Thoothukudi, Villupuram)',
    description: 'High-pungency commercial chilli hybrid with thick pericarp and glossy red pods.',
    maturityDays: 160,
    imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
  });

  const varietyTomato = await CropVariety.create({
    cropName: 'Tomato',
    varietyName: 'BT Tomato (Arka Tri-Shield BioGuard)',
    cropType: 'HORTICULTURE',
    growingSeason: 'YEAR_ROUND',
    soilRequirements: 'Rich sandy loam, pH 6.0 - 6.8',
    expectedYieldMin: 220.0,
    expectedYieldMax: 290.0,
    yieldUnit: 'Quintals/Acre',
    diseaseResistanceTraits: 'Triple Resistant: ToLCV, Bacterial Wilt, Late Blight',
    biotechTraits: 'Cry1Ac Fruit Borer Defense + High Lycopene',
    recommendedRegions: 'Peninsular Horticulture Zones (Madurai, Dindigul, Krishnagiri, Dharmapuri)',
    description: 'Indeterminate transgenic hybrid with fruit borer and viral wilt defense.',
    maturityDays: 135,
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
  });

  const varietyMaize = await CropVariety.create({
    cropName: 'Maize',
    varietyName: 'Drought Resistant Maize (DroughtGuard-X)',
    cropType: 'CEREAL',
    growingSeason: 'YEAR_ROUND',
    soilRequirements: 'Well aerated sandy loam, pH 6.0 - 7.2',
    expectedYieldMin: 34.0,
    expectedYieldMax: 42.0,
    yieldUnit: 'Quintals/Acre',
    diseaseResistanceTraits: 'Turcicum Leaf Blight Resistant',
    biotechTraits: 'CspB Cold/Drought Shock Protein Trait',
    recommendedRegions: 'Kongu Plateau & Deccan Belts (Coimbatore, Tiruppur, Perambalur)',
    description: 'Maintains 85% photosynthetic efficiency during 25-day dry spells.',
    maturityDays: 105,
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80',
  });

  const farm1 = await Farm.create({
    farmerId: farmer1._id,
    farmName: 'Kanchipuram Bio-Cotton Research Plot',
    locationAddress: 'Sriperumbudur High Road, Kanchipuram, Tamil Nadu',
    latitude: 12.9675,
    longitude: 79.9416,
    totalAreaAcres: 7.0,
    soilType: 'Deep Black Regur Soil',
    irrigationType: 'Drip & Borewell',
    currentCrop: 'Cotton',
    cropVarietyId: varietyBtCotton._id,
  });

  const farm2 = await Farm.create({
    farmerId: farmer1._id,
    farmName: 'Tiruvallur Green Chilli Haven',
    locationAddress: 'Poonamallee Bypass Road, Tiruvallur, Tamil Nadu',
    latitude: 13.1432,
    longitude: 79.9080,
    totalAreaAcres: 5.0,
    soilType: 'Red Sandy Loam',
    irrigationType: 'Micro-Sprinkler & Borewell',
    currentCrop: 'Chilli',
    cropVarietyId: varietyChilli._id,
  });

  const farm3 = await Farm.create({
    farmerId: farmer2._id,
    farmName: 'Villupuram Delta Paddy & Bio-Plot',
    locationAddress: 'Gingee Road, Tindivanam, Villupuram, Tamil Nadu',
    latitude: 11.9401,
    longitude: 79.4861,
    totalAreaAcres: 8.0,
    soilType: 'Alluvial Heavy Clay Loam',
    irrigationType: 'Canal Lift Irrigation',
    currentCrop: 'Rice',
    cropVarietyId: varietyRice._id,
  });

  const farm4 = await Farm.create({
    farmerId: farmer3._id,
    farmName: 'Kongu Valley Cotton & Maize Plot',
    locationAddress: 'Pollachi Agro-Corridor, Coimbatore, Tamil Nadu',
    latitude: 10.6609,
    longitude: 77.0048,
    totalAreaAcres: 15.0,
    soilType: 'Medium Black Clay Loam',
    irrigationType: 'Borewell & Checkdam Lift',
    currentCrop: 'Maize',
    cropVarietyId: varietyMaize._id,
  });

  const farm5 = await Farm.create({
    farmerId: farmer4._id,
    farmName: 'Pandyan Valley Bio-Horticulture Estate',
    locationAddress: 'Melur Agricultural Road, Madurai, Tamil Nadu',
    latitude: 10.0308,
    longitude: 78.3364,
    totalAreaAcres: 6.0,
    soilType: 'Fertile Riverine Alluvium',
    irrigationType: 'Automated Drip Fertigation',
    currentCrop: 'Tomato',
    cropVarietyId: varietyTomato._id,
  });

  const farm6 = await Farm.create({
    farmerId: farmer1._id,
    farmName: 'Chennai Urban BioTech Demonstration Center',
    locationAddress: 'Madhavaram Milk Colony, Chennai, Tamil Nadu',
    latitude: 13.0827,
    longitude: 80.2707,
    totalAreaAcres: 4.0,
    soilType: 'Coastal Alluvial Loam',
    irrigationType: 'Automated Drip Fertigation',
    currentCrop: 'Rice',
    cropVarietyId: varietyRice._id,
  });

  const case1 = await DiseaseReport.create({
    cropVarietyId: varietyBtCotton._id,
    farmId: farm1._id,
    reportedById: agronomist._id,
    diseaseName: 'Cotton Pink Bollworm (Pectinophora gossypiella)',
    symptoms: 'Rosetted floral buds in 8% of sampled blocks; early larvae found.',
    severity: 'HIGH',
    latitude: 12.9682,
    longitude: 79.9425,
    crop: 'Cotton',
    cropVariety: 'Bt Cotton (BollGuard-III BioShield)',
    locationAddress: 'Sriperumbudur High Road, Kanchipuram, Tamil Nadu',
    dateObserved: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    status: 'INVESTIGATING',
    recommendedTreatment: 'Install 8 pheromone PB-Rope traps/acre; spray Beauveria bassiana 4ml/L.',
  });

  const case2 = await DiseaseReport.create({
    cropVarietyId: varietyChilli._id,
    farmId: farm2._id,
    reportedById: agronomist._id,
    diseaseName: 'Chilli Leaf Curl Virus (ChiLCV)',
    symptoms: 'Upward leaf curling, stunted bushy canopy, heavy whitefly activity.',
    severity: 'CRITICAL',
    latitude: 13.1440,
    longitude: 79.9088,
    crop: 'Chilli',
    cropVariety: 'Hybrid Chilli (Teja Bio-Shield F1)',
    locationAddress: 'Poonamallee Bypass Road, Tiruvallur, Tamil Nadu',
    dateObserved: new Date(Date.now() - 1 * 24 * 3600 * 1000),
    status: 'ACTIVE',
    recommendedTreatment: 'Quarantine quadrant; spray Neem Azadirachtin + Lecanicillium lecanii.',
  });

  const case3 = await DiseaseReport.create({
    cropVarietyId: varietyWheat._id,
    farmId: farm4._id,
    reportedById: agronomist._id,
    diseaseName: 'Wheat Yellow / Stripe Rust (Puccinia striiformis)',
    symptoms: 'Yellow linear pustule stripes spreading across flag leaves.',
    severity: 'HIGH',
    latitude: 10.6615,
    longitude: 77.0055,
    crop: 'Wheat',
    cropVariety: 'HD-2967 Wheat Bio-Resilience',
    locationAddress: 'Pollachi Agro-Corridor, Coimbatore, Tamil Nadu',
    dateObserved: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    status: 'ACTIVE',
    recommendedTreatment: 'Foliar application of Bacillus subtilis strain Th-82 (5ml/L).',
  });

  const case4 = await DiseaseReport.create({
    cropVarietyId: varietyTomato._id,
    farmId: farm5._id,
    reportedById: scientist._id,
    diseaseName: 'Tomato Late Blight (Phytophthora infestans)',
    symptoms: 'Small water-soaked necrotic lesions on lower leaves.',
    severity: 'MEDIUM',
    latitude: 10.0315,
    longitude: 78.3372,
    crop: 'Tomato',
    cropVariety: 'BT Tomato (Arka Tri-Shield BioGuard)',
    locationAddress: 'Melur Agricultural Road, Madurai, Tamil Nadu',
    dateObserved: new Date(Date.now() - 6 * 24 * 3600 * 1000),
    status: 'CONTAINED',
    recommendedTreatment: 'Prune affected leaves; apply Trichoderma viride bio-fungicide.',
  });

  const case5 = await DiseaseReport.create({
    cropVarietyId: varietyRice._id,
    farmId: farm6._id,
    reportedById: scientist._id,
    diseaseName: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
    symptoms: 'Water-soaked translucent lesions along leaf tips on pilot nursery plot.',
    severity: 'LOW',
    latitude: 13.0827,
    longitude: 80.2707,
    crop: 'Rice',
    cropVariety: 'IR64 Rice (Sub1A Bio-Enhanced)',
    locationAddress: 'Madhavaram Milk Colony, Chennai, Tamil Nadu',
    dateObserved: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    status: 'RESOLVED',
    recommendedTreatment: 'Foliar spray with Pseudomonas fluorescens bio-agent at 5ml/L.',
  });

  const case6 = await DiseaseReport.create({
    cropVarietyId: varietyChilli._id,
    farmId: farm3._id,
    reportedById: agronomist._id,
    diseaseName: 'Chilli Anthracnose / Fruit Rot (Colletotrichum capsici)',
    symptoms: 'Circular sunken spots on developing pods with concentric rings across 1 acre.',
    severity: 'MEDIUM',
    latitude: 11.9412,
    longitude: 79.4870,
    crop: 'Chilli',
    cropVariety: 'Hybrid Chilli (Teja Bio-Shield F1)',
    locationAddress: 'Gingee Road, Tindivanam, Villupuram, Tamil Nadu',
    dateObserved: new Date(Date.now() - 4 * 24 * 3600 * 1000),
    status: 'ACTIVE',
    recommendedTreatment: 'Apply Trichoderma harzianum bio-fungicide foliar spray + balanced potassium.',
  });

  await FieldObservation.create([
    {
      farmId: farm1._id,
      cropVarietyId: varietyBtCotton._id,
      observerId: agronomist._id,
      growthStage: 'FLOWERING',
      plantHealthScore: 8,
      soilMoisture: 'OPTIMAL',
      weatherCondition: 'SUNNY',
      notes: 'Boll formation vigorous with average 24 bolls per plant.',
      latitude: 12.9675,
      longitude: 79.9416,
    },
    {
      farmId: farm2._id,
      cropVarietyId: varietyChilli._id,
      observerId: agronomist._id,
      growthStage: 'VEGETATIVE',
      plantHealthScore: 6,
      soilMoisture: 'MODERATE',
      weatherCondition: 'HUMID_OVERCAST',
      notes: 'Whitefly nymphs detected triggering mild leaf curl.',
      latitude: 13.1432,
      longitude: 79.9080,
    },
    {
      farmId: farm3._id,
      cropVarietyId: varietyRice._id,
      observerId: agronomist._id,
      growthStage: 'GRAIN_FILLING',
      plantHealthScore: 9,
      soilMoisture: 'OPTIMAL',
      weatherCondition: 'SUNNY',
      notes: 'Panicle density exceeds baseline by 15%.',
      latitude: 11.9401,
      longitude: 79.4861,
    },
    {
      farmId: farm4._id,
      cropVarietyId: varietyMaize._id,
      observerId: agronomist._id,
      growthStage: 'FLOWERING',
      plantHealthScore: 8,
      soilMoisture: 'MODERATE',
      weatherCondition: 'DRY_WINDY',
      notes: 'Cob emergence synchronized. DroughtGuard-X showing good green area.',
      latitude: 10.6609,
      longitude: 77.0048,
    },
    {
      farmId: farm5._id,
      cropVarietyId: varietyTomato._id,
      observerId: scientist._id,
      growthStage: 'MATURITY',
      plantHealthScore: 9,
      soilMoisture: 'OPTIMAL',
      weatherCondition: 'SUNNY',
      notes: 'First harvest yield recorded: 78 Quintals from 2 acres.',
      latitude: 10.0308,
      longitude: 78.3364,
    }
  ]);

  await BiotechnologyRecommendation.create([
    {
      cropVarietyId: varietyRice._id,
      farmerId: farmer2._id,
      creatorId: scientist._id,
      recommendationType: 'BIOFERTILIZER',
      title: 'Consortium Bio-Inoculant & VAM Mycorrhizae Application',
      productName: 'Nutri-BioSync VAM & Azospirillum Consortium',
      targetIssue: 'Grain filling nutrient uptake and root phosphorus mobilization',
      reasoning: 'VAM hyphae extend root absorption surface by 400%.',
      expectedBenefit: 'Increases grain weight by 10-14%.',
      applicationInstructions: 'Broadcast 4 kg/acre with vermicompost.',
      dosage: '4 kg per Acre',
      precautions: 'Store in cool shaded storage below 30°C.',
      status: 'ACTIVE',
    },
    {
      cropVarietyId: varietyWheat._id,
      diseaseReportId: case3._id,
      farmerId: farmer3._id,
      creatorId: scientist._id,
      recommendationType: 'BIOPESTICIDE',
      title: 'Targeted Bacillus subtilis Bio-Fungicide Protocol for Yellow Rust',
      productName: 'Bio-Shield FungStop Ultra (Bacillus subtilis)',
      targetIssue: 'Yellow Stripe Rust Outbreak in Wheat Canopy',
      reasoning: 'Synthesizes cyclic lipopeptides bursting spore germ tubes.',
      expectedBenefit: 'Halts yellow rust spore propagation within 48h.',
      applicationInstructions: 'Dilute 5ml/L and spray late afternoon.',
      dosage: '1.5 Liters/Acre in 150L water',
      precautions: 'Do not tank mix with copper hydroxide.',
      status: 'ACTIVE',
    },
    {
      cropVarietyId: varietyBtCotton._id,
      diseaseReportId: case1._id,
      farmerId: farmer1._id,
      creatorId: scientist._id,
      recommendationType: 'BIOLOGICAL_CONTROL',
      title: 'Gossyplure Pheromone Mating Disruption & Trichogramma Parasitoids',
      productName: 'Gossyplure Bio-Rope & Trichogramma Cards',
      targetIssue: 'Pink Bollworm Infestation Suppression in Flowering Cotton',
      reasoning: 'Pheromone confuses moths and wasps parasitize egg clutches.',
      expectedBenefit: 'Prevents green boll damage and lint staining.',
      applicationInstructions: 'Fasten 100 bio-ropes/acre; staple 5 cards/acre.',
      dosage: '100 dispensers/acre + 50,000 parasitoids/acre',
      precautions: 'Avoid synthetic pyrethroid sprays.',
      status: 'ACTIVE',
    },
    {
      cropVarietyId: varietyChilli._id,
      diseaseReportId: case2._id,
      farmerId: farmer1._id,
      creatorId: scientist._id,
      recommendationType: 'BIOPESTICIDE',
      title: 'Botanical Azadirachtin & Entomopathogenic Bio-Shield for ChiLCV Vector',
      productName: 'Neem-Aza 10,000 ppm & Lecanicillium lecanii',
      targetIssue: 'Chilli Leaf Curl Virus Whitefly Vector Infestation',
      reasoning: 'Disrupts vector molting and fungal spores collapse population.',
      expectedBenefit: 'Reduces viral transmission vector density by 80%.',
      applicationInstructions: 'Spray early morning at 2ml/L Neem + 4g/L Lecanicillium.',
      dosage: '500ml Neem-Aza + 1kg Lecanicillium/Acre',
      precautions: 'Maintain pH 6.0 - 7.0.',
      status: 'ACTIVE',
    },
    {
      cropVarietyId: varietyMaize._id,
      farmerId: farmer3._id,
      creatorId: scientist._id,
      recommendationType: 'VARIETY_SELECTION',
      title: 'Transition to Drought-Resilient Maize Hybrid for Semi-Arid Season',
      productName: 'CRISPR-Maize DroughtGuard-X Hybrid Seeds',
      targetIssue: 'Predicted 3-week mid-season rain deficit in Coimbatore & Kongu belt',
      reasoning: 'CspB shock protein maintains cellular translation.',
      expectedBenefit: 'Maintains 85% normal yield under water deficit.',
      applicationInstructions: 'Treat seed with Trichoderma viride before sowing.',
      dosage: '8 kg Seed / Acre',
      precautions: 'Sow at 4-5 cm depth.',
      status: 'ACTIVE',
    },
    {
      cropVarietyId: varietyTomato._id,
      farmerId: farmer4._id,
      creatorId: scientist._id,
      recommendationType: 'SOIL_ENHANCEMENT',
      title: 'Liquid Bio-NPK Consortium Soil Drenching Protocol',
      productName: 'Bio-NPK Gold Liquid Consortia',
      targetIssue: 'Soil biological rejuvenation and potash mobilization',
      reasoning: 'Microbes fix nitrogen and solubilize rock phosphate & potash.',
      expectedBenefit: 'Increases tomato average weight by 12%.',
      applicationInstructions: 'Inject via drip fertigation venturi.',
      dosage: '1 Liter per Acre',
      precautions: 'Flush drip lines after application.',
      status: 'ACTIVE',
    },
    {
      cropVarietyId: varietyTomato._id,
      farmerId: farmer4._id,
      creatorId: scientist._id,
      recommendationType: 'CROP_MANAGEMENT',
      title: 'Integrated Biological Barrier & Yellow Trap Buffer Strategy',
      productName: 'Micro-Encapsulated Lures & Yellow Traps Stack',
      targetIssue: 'Early-stage viral vector and borer prevention',
      reasoning: 'Visual and chemical attraction traps intercept adults.',
      expectedBenefit: '90% drop in early vector introduction.',
      applicationInstructions: 'Install along field borders at canopy height.',
      dosage: '15 traps per acre',
      precautions: 'Replace sticky cards every 20 days.',
      status: 'ACTIVE',
    }
  ]);

  await FarmerAdvisory.create([
    {
      farmerId: farmer1._id,
      advisorId: agronomist._id,
      title: '🚨 Cotton Pest Alert: Pink Bollworm Pheromone Trapping Required on Plot 1',
      category: 'DISEASE_ALERT',
      message: 'Dear Ramesh Kumar, field surveillance on your Kanchipuram Cotton plot confirmed early Pink Bollworm presence. Please deploy the allocated 100 Gossyplure Bio-Ropes per acre immediately.',
      priority: 'URGENT',
      isRead: false,
    },
    {
      farmerId: farmer1._id,
      advisorId: agronomist._id,
      title: '⚠️ Chilli Leaf Curl Alert: Whitefly Vector Spray Schedule',
      category: 'DISEASE_ALERT',
      message: 'Ramesh Kumar, active whitefly populations observed on your Tiruvallur chilli plot. Apply Neem Azadirachtin + Lecanicillium lecanii bio-insecticide in the morning.',
      priority: 'URGENT',
      isRead: false,
    },
    {
      farmerId: farmer2._id,
      advisorId: agronomist._id,
      title: '🌾 Villupuram Paddy Irrigation & Bio-Inoculation Schedule',
      category: 'IRRIGATION',
      message: 'Lakshmi Devi, your IR64 rice is in peak grain-filling stage. Maintain 3-5 cm standing water depth in fields for the next 10 days.',
      priority: 'IMPORTANT',
      isRead: true,
      readAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
    },
    {
      farmerId: farmer4._id,
      advisorId: scientist._id,
      title: '🍅 Tomato Fruiting Phase: Bio-NPK Fertigation Guidance',
      category: 'NUTRIENT_MANAGEMENT',
      message: 'Anitha Raman, your BT Tomato crop has entered peak harvest. Apply 1L/acre Bio-NPK microbial consortia through your drip system.',
      priority: 'IMPORTANT',
      isRead: true,
      readAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    },
    {
      farmerId: farmer3._id,
      advisorId: agronomist._id,
      title: '🌤️ Coimbatore Agro-Meteorology: Furrow Irrigation Window for Maize',
      category: 'WEATHER_ACTION',
      message: 'Suresh Kumar, forecast indicates clear dry conditions over the next 5 days. Schedule deep furrow irrigation for your DroughtGuard-X maize plots.',
      priority: 'ROUTINE',
      isRead: false,
    }
  ]);

  await Notification.create([
    {
      recipientUserId: admin._id,
      type: 'OUTBREAK_ALERT',
      title: '🚨 Critical Disease Outbreak Logged',
      message: 'Critical Chilli Leaf Curl Virus outbreak confirmed at Tiruvallur Green Chilli Haven.',
      severity: 'DANGER',
      linkUrl: '/diseases',
    },
    {
      recipientUserId: farmerUser._id,
      type: 'NEW_RECOMMENDATION',
      title: '🧬 New Biotech Solution Prescribed',
      message: 'Dr. Rahul Verma prescribed Gossyplure Mating Disruption & Trichogramma Cards for your cotton plot.',
      severity: 'INFO',
      linkUrl: '/recommendations',
    }
  ]);

  await ActivityLog.create([
    {
      userId: agronomist._id,
      action: 'REPORT_DISEASE',
      module: 'Disease Surveillance',
      details: 'Reported Critical severity Chilli Leaf Curl Virus on Tiruvallur Green Chilli Haven.',
    },
    {
      userId: scientist._id,
      action: 'CREATE_RECOMMENDATION',
      module: 'Biotechnology Recommendations',
      details: 'Prescribed Bio-Shield FungStop Ultra protocol for Wheat Yellow Rust suppression.',
    },
    {
      userId: admin._id,
      action: 'REGISTER_VARIETY',
      module: 'Crop Variety Management',
      details: 'Registered new crop cultivar: Bt Cotton (BollGuard-III BioShield).',
    }
  ]);

  console.log('\n=============================================================');
  console.log('✅ ALL MONGODB DEMO ACCOUNTS AND DATA SEEDED SUCCESSFULLY!');
  console.log('=============================================================');
  console.log('DEMO LOGIN CREDENTIALS:\n');
  console.log('Registered accounts initialized with secure bcrypt password hashes.');
  console.log('Users: admin@agribiotech.demo, agronomist@agribiotech.demo, scientist@agribiotech.demo, farmer@agribiotech.demo');
  console.log('=============================================================\n');

  await mongoose.disconnect();
  console.log('MongoDB connection closed.');
}

runSeed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
