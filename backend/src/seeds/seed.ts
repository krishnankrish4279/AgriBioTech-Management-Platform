import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {
  User,
  Farmer,
  Farm,
  CropVariety,
  DiseaseReport,
  Disease,
  FieldObservation,
  BiotechnologyRecommendation,
  FarmerAdvisory,
  Notification,
  ActivityLog,
} from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agribiotech';

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected for seeding.');

  console.log('🌱 Clearing existing demo collections safely...');
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

  console.log('👤 Creating DEMO USERS with Bcrypt Hashing...');
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Admin@123', salt);
  const agroHash = await bcrypt.hash('Agronomist@123', salt);
  const scientistHash = await bcrypt.hash('Scientist@123', salt);
  const farmerHash = await bcrypt.hash('Ramesh@123', salt);

  // 1. Admin Director
  const admin = await User.create({
    name: 'Arjun Mehta',
    email: 'admin@agribiotech.demo',
    passwordHash: adminHash,
    role: 'admin',
    phone: '+91-98111-00001',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  // 2. Field Agronomist
  const agronomist = await User.create({
    name: 'Priya Sharma',
    email: 'agronomist@agribiotech.demo',
    passwordHash: agroHash,
    role: 'agronomist',
    phone: '+91-98222-00002',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  });

  // 3. Biotech Scientist
  const scientist = await User.create({
    name: 'Dr. Rahul Verma',
    email: 'scientist@agribiotech.demo',
    passwordHash: scientistHash,
    role: 'biotech_expert',
    phone: '+91-98333-00003',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  });

  // 4. Farmer
  const farmerUser = await User.create({
    name: 'Ramesh Kumar',
    email: 'farmer@agribiotech.demo',
    passwordHash: farmerHash,
    role: 'farmer',
    phone: '+91-98444-00004',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  });

  console.log('🌾 Creating 4 DEMO FARMERS (Tamil Nadu Agricultural Zones)...');
  // 1. Ramesh Kumar (Kanchipuram, Tamil Nadu)
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

  // 2. Lakshmi Devi (Villupuram, Tamil Nadu)
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

  // 3. Suresh Kumar (Coimbatore, Tamil Nadu)
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

  // 4. Anitha Raman (Madurai, Tamil Nadu)
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

  console.log('🧬 Creating 6 DEMO CROP VARIETIES...');
  // 1. Bt Cotton
  const varietyBtCotton = await CropVariety.create({
    cropName: 'Cotton',
    varietyName: 'Bt Cotton (BollGuard-III BioShield)',
    cropType: 'CASH_CROP',
    growingSeason: 'KHARIF',
    soilRequirements: 'Deep black cotton regur soil, well-drained red loam, pH 6.5 - 8.0',
    expectedYieldMin: 14.5,
    expectedYieldMax: 19.5,
    yieldUnit: 'Quintals/Acre',
    diseaseResistanceTraits: 'Cotton Leaf Curl Virus (CLCuD) Resistant, Bacterial Blight Immune',
    biotechTraits: 'Triple Toxin Cry1Ac + Cry2Ab2 + Vip3Aa (Systemic Lepidopteran Immunity)',
    recommendedRegions: 'Southern Cotton Zones (Tamil Nadu - Coimbatore, Kanchipuram, Salem, Madurai)',
    description: 'Next-generation transgenic cotton variety with stacked Cry and Vip genes delivering complete systemic defense against Pink and American Bollworms.',
    maturityDays: 155,
    imageUrl: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop&q=80',
  });

  // 2. HD-2967 Wheat
  const varietyWheat = await CropVariety.create({
    cropName: 'Wheat',
    varietyName: 'HD-2967 Wheat Bio-Resilience',
    cropType: 'CEREAL',
    growingSeason: 'RABI',
    soilRequirements: 'Well-drained alluvial loam to clay loam, pH 6.2 - 7.5',
    expectedYieldMin: 24.0,
    expectedYieldMax: 30.5,
    yieldUnit: 'Quintals/Acre',
    diseaseResistanceTraits: 'Yellow Rust (Yr18), Brown Rust, and Leaf Blight Resistant',
    biotechTraits: 'High Biomass Stay-Green Trait, Biofortified Protein 12.8%, Zinc (40 ppm)',
    recommendedRegions: 'North Western & Central Plains Zones, Southern Research Stations',
    description: 'Popular high-yielding semi-dwarf wheat cultivar with robust tillering, broad adaptability, and exceptional rust immunity.',
    maturityDays: 140,
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
  });

  // 3. IR64 Rice
  const varietyRice = await CropVariety.create({
    cropName: 'Rice',
    varietyName: 'IR64 Rice (Sub1A Bio-Enhanced)',
    cropType: 'CEREAL',
    growingSeason: 'KHARIF',
    soilRequirements: 'Heavy clay loam with high moisture retention, pH 5.5 - 7.0',
    expectedYieldMin: 28.0,
    expectedYieldMax: 35.0,
    yieldUnit: 'Quintals/Acre',
    diseaseResistanceTraits: 'Bacterial Leaf Blight (xa5, Xa21), Blast (Pi9) Resistant',
    biotechTraits: 'Sub1A Submergence Flash Flood Tolerance (14-day underwater survival)',
    recommendedRegions: 'Palar & Cauvery River Basins, Tamil Nadu Delta Agro-Climatic Belts',
    description: 'Semi-dwarf mega-variety engineered with the Sub1 gene to survive severe flash flooding while preserving premium slender grain milling quality.',
    maturityDays: 120,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
  });

  // 4. Hybrid Chilli
  const varietyChilli = await CropVariety.create({
    cropName: 'Chilli',
    varietyName: 'Hybrid Chilli (Teja Bio-Shield F1)',
    cropType: 'HORTICULTURE',
    growingSeason: 'YEAR_ROUND',
    soilRequirements: 'Well-drained rich sandy loam with organic compost, pH 6.0 - 7.0',
    expectedYieldMin: 30.0,
    expectedYieldMax: 42.0,
    yieldUnit: 'Quintals/Acre',
    diseaseResistanceTraits: 'Chilli Leaf Curl Virus (ChiLCV) Tolerant, Anthracnose Resistant',
    biotechTraits: 'High Capsaicin (0.85%), Deep Red ASTA Color Value 140, High Heat Tolerance',
    recommendedRegions: 'Tamil Nadu Chilli Corridor (Tiruvallur, Ramanathapuram, Thoothukudi, Villupuram)',
    description: 'High-pungency, heavy-bearing commercial chilli hybrid with thick pericarp, excellent virus tolerance, and attractive glossy red dry pods.',
    maturityDays: 160,
    imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
  });

  // 5. BT Tomato
  const varietyTomato = await CropVariety.create({
    cropName: 'Tomato',
    varietyName: 'BT Tomato (Arka Tri-Shield BioGuard)',
    cropType: 'HORTICULTURE',
    growingSeason: 'YEAR_ROUND',
    soilRequirements: 'Rich sandy loam to clay loam, rich in organic matter, pH 6.0 - 6.8',
    expectedYieldMin: 220.0,
    expectedYieldMax: 290.0,
    yieldUnit: 'Quintals/Acre',
    diseaseResistanceTraits: 'Triple Resistant: ToLCV (Ty2+Ty3), Bacterial Wilt (Ralstonia), Early/Late Blight',
    biotechTraits: 'Cry1Ac Lepidopteran Fruit Borer Defense + High Lycopene (+40%) & Firm Fruit Skin',
    recommendedRegions: 'Peninsular Horticulture Zones (Madurai, Dindigul, Krishnagiri, Dharmapuri)',
    description: 'Indeterminate transgenic hybrid offering robust resistance against tomato leaf curl viral epidemics, bacterial wilt, and devastating fruit borers.',
    maturityDays: 135,
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
  });

  // 6. Drought Resistant Maize
  const varietyMaize = await CropVariety.create({
    cropName: 'Maize',
    varietyName: 'Drought Resistant Maize (DroughtGuard-X)',
    cropType: 'CEREAL',
    growingSeason: 'YEAR_ROUND',
    soilRequirements: 'Well aerated sandy loam to silt loam, high organic matter, pH 6.0 - 7.2',
    expectedYieldMin: 34.0,
    expectedYieldMax: 42.0,
    yieldUnit: 'Quintals/Acre',
    diseaseResistanceTraits: 'Turcicum Leaf Blight, Charcoal Rot, Maydis Blight Resistant',
    biotechTraits: 'CspB Cold/Drought Shock Protein, Stomatal Transpiration Regulation Gene',
    recommendedRegions: 'Kongu Plateau & Deccan Belts (Coimbatore, Tiruppur, Perambalur)',
    description: 'Biotechnology hybrid engineered to maintain 85% photosynthetic efficiency during 25-day dry spells in vegetative and cob development phases.',
    maturityDays: 105,
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80',
  });

  console.log('🏡 Creating 6 DEMO FARMS in Tamil Nadu...');
  // Farm 1: Ramesh Kumar's Cotton in Kanchipuram
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

  // Farm 2: Ramesh Kumar's Chilli in Tiruvallur
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

  // Farm 3: Lakshmi Devi's Villupuram Farm
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

  // Farm 4: Suresh Kumar's Coimbatore Farm
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

  // Farm 5: Anitha Raman's Madurai Farm
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

  // Farm 6: Chennai Urban BioTech Demonstration Center
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

  console.log('🦠 Creating Pathogen Knowledge Catalog & 6 Tamil Nadu Disease Reports...');
  await Disease.create([
    {
      diseaseName: 'Cotton Pink Bollworm (Pectinophora gossypiella)',
      pathogenType: 'PEST',
      cropAffiliation: 'Cotton',
      commonSymptoms: 'Rosetted flowers with fused petals; entry holes on green bolls; stained lint.',
      severityLevelDefault: 'HIGH',
      recommendedBiotechSolution: 'Beauveria bassiana 1.15% WP (3g/L) + Gossyplure PB-Rope dispensers.',
      preventionProtocol: 'Deploy BollGuard-III Bt cotton; 20% non-Bt refuge borders; pheromone monitoring.',
    },
    {
      diseaseName: 'Chilli Leaf Curl Virus (ChiLCV)',
      pathogenType: 'VIRAL',
      cropAffiliation: 'Chilli, Tomato',
      commonSymptoms: 'Severe upward curling of leaves, stunted internodes, rosette growth.',
      severityLevelDefault: 'CRITICAL',
      recommendedBiotechSolution: 'Neem Azadirachtin (10,000 ppm) 2ml/L + Lecanicillium lecanii bio-insecticide.',
      preventionProtocol: 'Yellow sticky traps (10/acre); barrier maize rows; resistant Teja F1 hybrids.',
    },
    {
      diseaseName: 'Wheat Yellow / Stripe Rust (Puccinia striiformis)',
      pathogenType: 'FUNGAL',
      cropAffiliation: 'Wheat, Barley',
      commonSymptoms: 'Linear bright yellow powdery stripes of spores along leaf veins.',
      severityLevelDefault: 'HIGH',
      recommendedBiotechSolution: 'Bacillus subtilis strain Th-82 (5ml/L) bio-fungicide foliar spray.',
      preventionProtocol: 'Plant Yr-18 gene cultivars like HD-2967; early satellite monitoring.',
    },
    {
      diseaseName: 'Tomato Late Blight (Phytophthora infestans)',
      pathogenType: 'FUNGAL',
      cropAffiliation: 'Tomato, Potato',
      commonSymptoms: 'Water-soaked irregular dark brown lesions with delicate white fungal downy mildew.',
      severityLevelDefault: 'MEDIUM',
      recommendedBiotechSolution: 'Potassium phosphite bio-stimulant + Trichoderma viride bio-fungicide.',
      preventionProtocol: 'Drip irrigation to keep canopy dry; prophylactic bio-shield spray.',
    },
    {
      diseaseName: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
      pathogenType: 'BACTERIAL',
      cropAffiliation: 'Rice',
      commonSymptoms: 'Water-soaked translucent lesions turning yellow to white along leaf veins.',
      severityLevelDefault: 'LOW',
      recommendedBiotechSolution: 'Bio-copper alternative spray + Pseudomonas fluorescens liquid culture (5ml/L).',
      preventionProtocol: 'Use certified blight-resistant seeds and avoid excessive nitrogen application.',
    },
    {
      diseaseName: 'Chilli Anthracnose / Fruit Rot (Colletotrichum capsici)',
      pathogenType: 'FUNGAL',
      cropAffiliation: 'Chilli',
      commonSymptoms: 'Circular sunken spots on developing pods with concentric acervuli rings.',
      severityLevelDefault: 'MEDIUM',
      recommendedBiotechSolution: 'Trichoderma harzianum bio-fungicide seed treatment and foliar bio-shield.',
      preventionProtocol: 'Ensure field drainage, avoid overhead irrigation, and use disease-free seed.',
    }
  ]);

  // 1. Kanchipuram: Cotton Bollworm (High)
  const case1 = await DiseaseReport.create({
    cropVarietyId: varietyBtCotton._id,
    farmId: farm1._id,
    reportedById: agronomist._id,
    diseaseName: 'Cotton Pink Bollworm (Pectinophora gossypiella)',
    symptoms: 'Rosetted floral buds observed in 8% of sampled cotton crop blocks; early instar larvae found inside young bolls.',
    severity: 'HIGH',
    latitude: 12.9682,
    longitude: 79.9425,
    crop: 'Cotton',
    cropVariety: 'Bt Cotton (BollGuard-III BioShield)',
    locationAddress: 'Sriperumbudur High Road, Kanchipuram, Tamil Nadu',
    dateObserved: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    status: 'INVESTIGATING',
    imageUrl: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop&q=80',
    recommendedTreatment: 'Install 8 pheromone PB-Rope traps per acre; spray Beauveria bassiana liquid bio-formulation (4ml/L) in late afternoon.',
    isDemo: true,
  });

  // 2. Tiruvallur: Chilli Leaf Curl Virus (Critical)
  const case2 = await DiseaseReport.create({
    cropVarietyId: varietyChilli._id,
    farmId: farm2._id,
    reportedById: agronomist._id,
    diseaseName: 'Chilli Leaf Curl Virus (ChiLCV)',
    symptoms: 'Upward leaf curling, stunted bushy canopy, and heavy whitefly vector activity observed across 3 acres.',
    severity: 'CRITICAL',
    latitude: 13.1440,
    longitude: 79.9088,
    crop: 'Chilli',
    cropVariety: 'Hybrid Chilli (Teja Bio-Shield F1)',
    locationAddress: 'Poonamallee Bypass Road, Tiruvallur, Tamil Nadu',
    dateObserved: new Date(Date.now() - 1 * 24 * 3600 * 1000),
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
    recommendedTreatment: 'Quarantine quadrant; spray Azadirachtin 10,000 ppm (2ml/L) + Lecanicillium lecanii bio-insecticide (4g/L); install 12 yellow sticky traps/acre.',
    isDemo: true,
  });

  // 3. Coimbatore: Wheat Yellow Rust (High)
  const case3 = await DiseaseReport.create({
    cropVarietyId: varietyWheat._id,
    farmId: farm4._id,
    reportedById: agronomist._id,
    diseaseName: 'Wheat Yellow / Stripe Rust (Puccinia striiformis)',
    symptoms: 'Yellow linear pustule stripes spreading across peripheral flag leaves.',
    severity: 'HIGH',
    latitude: 10.6615,
    longitude: 77.0055,
    crop: 'Wheat',
    cropVariety: 'HD-2967 Wheat Bio-Resilience',
    locationAddress: 'Pollachi Agro-Corridor, Coimbatore, Tamil Nadu',
    dateObserved: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
    recommendedTreatment: 'Foliar application of Bacillus subtilis strain Th-82 bio-fungicide (5ml/L) with bio-surfactant adjuvant.',
    isDemo: true,
  });

  // 4. Madurai: Tomato Late Blight (Medium)
  const case4 = await DiseaseReport.create({
    cropVarietyId: varietyTomato._id,
    farmId: farm5._id,
    reportedById: scientist._id,
    diseaseName: 'Tomato Late Blight (Phytophthora infestans)',
    symptoms: 'Small water-soaked necrotic lesions on lower leaves following morning dew.',
    severity: 'MEDIUM',
    latitude: 10.0315,
    longitude: 78.3372,
    crop: 'Tomato',
    cropVariety: 'BT Tomato (Arka Tri-Shield BioGuard)',
    locationAddress: 'Melur Agricultural Road, Madurai, Tamil Nadu',
    dateObserved: new Date(Date.now() - 6 * 24 * 3600 * 1000),
    status: 'CONTAINED',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    recommendedTreatment: 'Prune affected lower leaves; apply potassium phosphite bio-stimulant + Trichoderma viride bio-fungicide foliar spray.',
    isDemo: true,
  });

  // 5. Chennai: Bacterial Leaf Blight (Low)
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
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    recommendedTreatment: 'Foliar spray with Pseudomonas fluorescens bio-agent at 5ml/L.',
    isDemo: true,
  });

  // 6. Villupuram: Chilli Anthracnose (Medium)
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
    imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
    recommendedTreatment: 'Apply Trichoderma harzianum bio-fungicide foliar spray + balanced potassium.',
    isDemo: true,
  });

  console.log('📋 Creating 5 DEMO FIELD OBSERVATIONS...');
  await FieldObservation.create([
    {
      farmId: farm1._id,
      cropVarietyId: varietyBtCotton._id,
      observerId: agronomist._id,
      observationDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      growthStage: 'FLOWERING',
      plantHealthScore: 8,
      soilMoisture: 'OPTIMAL',
      soilHealthNotes: 'Deep black clay retaining optimal moisture; rich in microbial activity.',
      weatherCondition: 'SUNNY',
      pestSymptoms: 'Minor presence of bollworm moths in pheromone monitoring traps.',
      notes: 'Boll formation is vigorous with average 24 bolls per plant. Square formation uniform across north quadrants.',
      photoUrl: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop&q=80',
      latitude: 12.9675,
      longitude: 79.9416,
    },
    {
      farmId: farm2._id,
      cropVarietyId: varietyChilli._id,
      observerId: agronomist._id,
      observationDate: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      growthStage: 'VEGETATIVE',
      plantHealthScore: 6,
      soilMoisture: 'MODERATE',
      soilHealthNotes: 'Red sandy loam showing good aeration; nitrogen levels balanced.',
      weatherCondition: 'HUMID_OVERCAST',
      pestSymptoms: 'Whitefly nymphs detected on leaf undersides triggering mild leaf curl.',
      notes: 'ChiLCV viral vectors active due to humid weather. Recommended immediate biological vector suppression.',
      photoUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
      latitude: 13.1432,
      longitude: 79.9080,
    },
    {
      farmId: farm3._id,
      cropVarietyId: varietyRice._id,
      observerId: agronomist._id,
      observationDate: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      growthStage: 'GRAIN_FILLING',
      plantHealthScore: 9,
      soilMoisture: 'OPTIMAL',
      soilHealthNotes: 'Heavy alluvial soil with excellent standing water management.',
      weatherCondition: 'SUNNY',
      pestSymptoms: 'Zero stem borer or blast symptoms detected.',
      notes: 'Panicle density exceeds regional baseline by 15%. Sub1A variety demonstrating strong upright stand.',
      photoUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
      latitude: 11.9401,
      longitude: 79.4861,
    },
    {
      farmId: farm4._id,
      cropVarietyId: varietyMaize._id,
      observerId: agronomist._id,
      observationDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      growthStage: 'FLOWERING',
      plantHealthScore: 8,
      soilMoisture: 'MODERATE',
      soilHealthNotes: 'Good crumb structure; moisture deficit managed via furrow checkdam lift.',
      weatherCondition: 'DRY_WINDY',
      pestSymptoms: 'Minor fall armyworm pinholes in outer perimeter rows.',
      notes: 'Cob emergence is highly synchronized. DroughtGuard-X showing excellent green leaf area retention.',
      photoUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80',
      latitude: 10.6609,
      longitude: 77.0048,
    },
    {
      farmId: farm5._id,
      cropVarietyId: varietyTomato._id,
      observerId: scientist._id,
      observationDate: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      growthStage: 'MATURITY',
      plantHealthScore: 9,
      soilMoisture: 'OPTIMAL',
      soilHealthNotes: 'Rich riverine silt with high mycorrhizal colonisation.',
      weatherCondition: 'SUNNY',
      pestSymptoms: 'Zero fruit borer infestation thanks to Cry1Ac trait expression.',
      notes: 'First harvest yield recorded: 78 Quintals harvested from first 2 acres. Fruit skin firmness excellent.',
      photoUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      latitude: 10.0308,
      longitude: 78.3364,
    }
  ]);

  console.log('🧪 Creating 7 DEMO BIOTECH RECOMMENDATIONS...');
  await BiotechnologyRecommendation.create([
    {
      cropVarietyId: varietyRice._id,
      farmerId: farmer2._id,
      creatorId: scientist._id,
      recommendationType: 'BIOFERTILIZER',
      title: 'Consortium Bio-Inoculant & VAM Mycorrhizae Application',
      productName: 'Nutri-BioSync VAM & Azospirillum Consortium',
      targetIssue: 'Grain filling nutrient uptake and root phosphorus mobilization',
      reasoning: 'Vesicular Arbuscular Mycorrhizae (VAM) hyphae extend effective root surface area by 400%, dramatically enhancing zinc and phosphorus transport during panicle development.',
      expectedBenefit: 'Increases grain weight by 10-14% and reduces chemical phosphorus fertilizer requirement by 25%.',
      applicationInstructions: 'Broadcast 4 kg/acre mixed with 50kg moist vermicompost uniformly around root zones prior to light canal irrigation.',
      dosage: '4 kg per Acre',
      precautions: 'Store biological inoculum in cool shaded storage below 30°C. Do not expose to direct noon sunlight.',
      isAutomatedSuggestion: false,
      status: 'ACTIVE',
    },
    {
      cropVarietyId: varietyWheat._id,
      diseaseReportId: case3._id,
      farmerId: farmer3._id,
      creatorId: scientist._id,
      recommendationType: 'BIOPESTICIDE',
      title: 'Targeted Bacillus subtilis Bio-Fungicide Protocol for Yellow Rust',
      productName: 'Bio-Shield FungStop Ultra (Bacillus subtilis strain QST 713)',
      targetIssue: 'Yellow Stripe Rust Outbreak in Wheat Canopy',
      reasoning: 'Bacillus subtilis bacterial endospores synthesize natural cyclic lipopeptides (surfactin, iturin) that burst fungal spore germ tubes without chemical residue.',
      expectedBenefit: 'Halts yellow rust spore propagation within 48 hours; preserves flag leaf photosynthesis.',
      applicationInstructions: 'Dilute 5ml/L in clean water. Spray using hollow-cone nozzle during late afternoon to ensure bacterial colony establishment on leaf surfaces.',
      dosage: '1.5 Liters per Acre in 150L water',
      precautions: 'Do not tank mix with copper hydroxide fungicides or chlorinated well water within 72 hours.',
      isAutomatedSuggestion: false,
      status: 'ACTIVE',
    },
    {
      cropVarietyId: varietyBtCotton._id,
      diseaseReportId: case1._id,
      farmerId: farmer1._id,
      creatorId: scientist._id,
      recommendationType: 'BIOLOGICAL_CONTROL',
      title: 'Gossyplure Pheromone Mating Disruption & Trichogramma Parasitoids',
      productName: 'Gossyplure Bio-Rope & Trichogramma bactrae Cards',
      targetIssue: 'Pink Bollworm Infestation Suppression in Flowering Cotton',
      reasoning: 'Continuous pheromone release confuses male bollworm moths, reducing mating success by 85%, while micro-parasitoid wasps parasitize remaining egg clutches.',
      expectedBenefit: 'Prevents internal green boll damage and eliminates lint staining without toxic broad-spectrum insecticides.',
      applicationInstructions: 'Fasten 100 bio-ropes per acre on cotton branches at mid-canopy height. Staple 5 Trichogramma cards/acre 3 days later.',
      dosage: '100 dispensers/acre + 50,000 parasitoids/acre',
      precautions: 'Install before peak squaring phase; avoid synthetic pyrethroid sprays that kill beneficial parasitoid wasps.',
      isAutomatedSuggestion: false,
      status: 'ACTIVE',
    },
    {
      cropVarietyId: varietyChilli._id,
      diseaseReportId: case2._id,
      farmerId: farmer1._id,
      creatorId: scientist._id,
      recommendationType: 'BIOPESTICIDE',
      title: 'Botanical Azadirachtin & Entomopathogenic Bio-Shield for ChiLCV Vector',
      productName: 'Neem-Aza 10,000 ppm & Lecanicillium lecanii Bio-Spray',
      targetIssue: 'Chilli Leaf Curl Virus (ChiLCV) Whitefly Vector Infestation',
      reasoning: 'Azadirachtin disrupts whitefly nymphal molting and feeding, while Lecanicillium fungal spores penetrate insect cuticle to collapse the vector population.',
      expectedBenefit: 'Reduces viral transmission vector density by over 80% within 5 days.',
      applicationInstructions: 'Spray thoroughly on leaf undersides in early morning hours at 2ml/L Neem-Aza + 4g/L Lecanicillium.',
      dosage: '500ml Neem-Aza + 1kg Lecanicillium per Acre in 200L water',
      precautions: 'Maintain spray solution pH between 6.0 and 7.0 for optimal fungal viability.',
      isAutomatedSuggestion: false,
      status: 'ACTIVE',
    },
    {
      cropVarietyId: varietyMaize._id,
      farmerId: farmer3._id,
      creatorId: scientist._id,
      recommendationType: 'VARIETY_SELECTION',
      title: 'Transition to Drought-Resilient Maize Hybrid for Semi-Arid Season',
      productName: 'CRISPR-Maize DroughtGuard-X Hybrid Seeds',
      targetIssue: 'Predicted 3-week mid-season rain deficit in Coimbatore & Kongu dryland belt',
      reasoning: 'Cultivar integrates the CspB shock protein which maintains normal cellular protein translation under reduced leaf water potential.',
      expectedBenefit: 'Maintains 85% normal yield even under 40% reduced seasonal soil moisture.',
      applicationInstructions: 'Treat seed with Trichoderma viride (10g/kg) before sowing at 60x20 cm spacing.',
      dosage: '8 kg Seed / Acre',
      precautions: 'Maintain optimal seeding depth of 4-5 cm to ensure deep root anchoring.',
      isAutomatedSuggestion: true,
      status: 'ACTIVE',
    },
    {
      cropVarietyId: varietyTomato._id,
      farmerId: farmer4._id,
      creatorId: scientist._id,
      recommendationType: 'SOIL_ENHANCEMENT',
      title: 'Liquid Bio-NPK Consortium Soil Drenching Protocol',
      productName: 'Bio-NPK Gold (Azotobacter + PSB + KMB Liquid Consortia)',
      targetIssue: 'Soil biological rejuvenation and potash mobilization during fruiting',
      reasoning: 'Rhizospheric bacteria fix atmospheric nitrogen, solubilize insoluble rock phosphate, and mobilize fixed potash in root zones.',
      expectedBenefit: 'Increases tomato fruit average weight by 12% and improves firmness and shelf-life.',
      applicationInstructions: 'Inject via drip irrigation system at 1 Liter/acre during second irrigation cycle.',
      dosage: '1 Liter per Acre through fertigation venturi',
      precautions: 'Flush drip lines with clean water before and after application to prevent microbial settling.',
      isAutomatedSuggestion: true,
      status: 'ACTIVE',
    },
    {
      cropVarietyId: varietyTomato._id,
      farmerId: farmer4._id,
      creatorId: scientist._id,
      recommendationType: 'CROP_MANAGEMENT',
      title: 'Integrated Biological Barrier & Yellow Trap Buffer Strategy',
      productName: 'Micro-Encapsulated Lures & Yellow Sticky Traps Stack',
      targetIssue: 'Early-stage viral vector and fruit borer prevention',
      reasoning: 'Mass visual and chemical attraction traps intercept invading adult insect pests before oviposition can occur on tomato blooms.',
      expectedBenefit: '90% drop in early vector introduction without chemical residues.',
      dosage: '15 traps per acre at crop canopy height',
      applicationInstructions: 'Install along field borders facing prevailing wind direction.',
      precautions: 'Replace sticky cards every 20 days or when covered with dust/insects.',
      isAutomatedSuggestion: false,
      status: 'ACTIVE',
    }
  ]);

  console.log('📢 Creating 5 DEMO FARMER ADVISORIES...');
  await FarmerAdvisory.create([
    {
      farmerId: farmer1._id,
      advisorId: agronomist._id,
      title: '🚨 Cotton Pest Alert: Pink Bollworm Pheromone Trapping Required on Plot 1',
      category: 'DISEASE_ALERT',
      message: 'Dear Ramesh Kumar, field surveillance on your Kanchipuram Cotton plot confirmed early Pink Bollworm presence. Please deploy the allocated 100 Gossyplure Bio-Ropes per acre immediately this week to suppress mating and prevent boll infestation.',
      priority: 'URGENT',
      isRead: false,
    },
    {
      farmerId: farmer1._id,
      advisorId: agronomist._id,
      title: '⚠️ Chilli Leaf Curl Alert: Whitefly Vector Spray Schedule',
      category: 'DISEASE_ALERT',
      message: 'Ramesh Kumar, active whitefly populations observed on your Tiruvallur chilli plot. Apply Neem Azadirachtin 10,000 ppm (2ml/L) + Lecanicillium lecanii bio-insecticide in the morning. Install 12 yellow sticky traps per acre.',
      priority: 'URGENT',
      isRead: false,
    },
    {
      farmerId: farmer2._id,
      advisorId: agronomist._id,
      title: '🌾 Villupuram Paddy Irrigation & Bio-Inoculation Schedule',
      category: 'IRRIGATION',
      message: 'Lakshmi Devi, your IR64 rice is in peak grain-filling stage. Maintain 3-5 cm standing water depth in fields for the next 10 days. Broadcast VAM mycorrhizae biofertilizer mixed with vermicompost for maximum grain weight.',
      priority: 'IMPORTANT',
      isRead: true,
      readAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
    },
    {
      farmerId: farmer4._id,
      advisorId: scientist._id,
      title: '🍅 Tomato Fruiting Phase: Bio-NPK Fertigation Guidance',
      category: 'NUTRIENT_MANAGEMENT',
      message: 'Anitha Raman, your BT Tomato crop has entered peak harvest. Apply 1L/acre Bio-NPK microbial consortia through your drip system to sustain continuous fruit development and enhance post-harvest shelf life.',
      priority: 'IMPORTANT',
      isRead: true,
      readAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    },
    {
      farmerId: farmer3._id,
      advisorId: agronomist._id,
      title: '🌤️ Coimbatore Agro-Meteorology: Furrow Irrigation Window for Maize',
      category: 'WEATHER_ACTION',
      message: 'Suresh Kumar, forecast indicates clear dry conditions with high evapotranspiration over the next 5 days. Schedule deep furrow irrigation for your DroughtGuard-X maize plots to maintain optimal cob swelling.',
      priority: 'ROUTINE',
      isRead: false,
    }
  ]);

  console.log('🔔 Creating DEMO NOTIFICATIONS...');
  await Notification.create([
    {
      recipientUserId: admin._id,
      type: 'OUTBREAK_ALERT',
      title: '🚨 Critical Disease Outbreak Logged',
      message: 'Critical Chilli Leaf Curl Virus outbreak confirmed at Tiruvallur Green Chilli Haven (Ramesh Kumar). Containment protocol initiated.',
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
    },
    {
      recipientUserId: agronomist._id,
      type: 'FIELD_VISIT_REMINDER',
      title: '📋 Scheduled Follow-Up Field Visit',
      message: 'Follow-up field visit due at Kongu Valley Cotton & Maize Plot (Suresh Kumar) for rust containment verification.',
      severity: 'WARNING',
      linkUrl: '/observations',
    },
    {
      recipientUserId: farmerUser._id,
      type: 'NEW_ADVISORY',
      title: '📢 Urgent Advisory: Chilli Whitefly Vector Control',
      message: 'Priya Sharma (Agronomist) dispatched an urgent advisory regarding Chilli Leaf Curl suppression.',
      severity: 'DANGER',
      linkUrl: '/advisories',
    }
  ]);

  console.log('📝 Creating Activity Audit Trail Logs...');
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

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
