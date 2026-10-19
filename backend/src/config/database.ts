import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agribiotech';

let isSeeding = false;
let seedCompleted = false;

export const ensureDemoUsers = async (force: boolean = false): Promise<void> => {
  if (seedCompleted && !force) return;
  if (isSeeding) return;
  isSeeding = true;

  try {
    const {
      User,
      Farmer,
      Farm,
      CropVariety,
      Disease,
      DiseaseReport,
      FieldObservation,
      BiotechnologyRecommendation,
      FarmerAdvisory,
    } = await import('../models');
    const bcrypt = (await import('bcryptjs')).default;

    // 1. DEMO USERS: Check, create or verify password hash
    const demoUsers = [
      {
        name: 'Arjun Mehta',
        email: 'admin@agribiotech.demo',
        password: 'Admin@123',
        role: 'admin',
        phone: '+91-98111-00001',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Priya Sharma',
        email: 'agronomist@agribiotech.demo',
        password: 'Agronomist@123',
        role: 'agronomist',
        phone: '+91-98222-00002',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Dr. Rahul Verma',
        email: 'scientist@agribiotech.demo',
        password: 'Scientist@123',
        role: 'biotech_expert',
        phone: '+91-98333-00003',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Ramesh Kumar',
        email: 'farmer@agribiotech.demo',
        password: 'Farmer@123',
        role: 'farmer',
        phone: '+91-98444-00004',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      },
    ];

    let salt: string | null = null;
    const userMap: Record<string, any> = {};

    for (const demo of demoUsers) {
      const existing = await User.findOne({ email: demo.email.toLowerCase() });
      if (!existing) {
        if (!salt) salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(demo.password, salt);
        const created = await User.create({
          name: demo.name,
          email: demo.email.toLowerCase(),
          passwordHash: hash,
          role: demo.role,
          phone: demo.phone,
          avatarUrl: demo.avatarUrl,
        });
        userMap[demo.email] = created;
        console.log(`[Demo Seed] Created user ${demo.email} (${demo.role})`);
      } else {
        userMap[demo.email] = existing;
        const isMatch = await bcrypt.compare(demo.password, existing.passwordHash);
        if (!isMatch) {
          if (!salt) salt = await bcrypt.genSalt(10);
          existing.passwordHash = await bcrypt.hash(demo.password, salt);
          await existing.save();
          console.log(`[Demo Seed] Synchronized password hash for ${demo.email}`);
        }
      }
    }

    // 2. DEMO CROP VARIETIES
    const varietiesCount = await CropVariety.countDocuments();
    const varietyMap: Record<string, any> = {};

    if (varietiesCount === 0) {
      const varietiesToSeed = [
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
      ];

      for (const v of varietiesToSeed) {
        const created = await CropVariety.create(v);
        varietyMap[v.cropName] = created;
      }
      console.log('[Demo Seed] Created 6 baseline crop varieties');
    } else {
      const allVarieties = await CropVariety.find();
      for (const v of allVarieties) {
        varietyMap[v.cropName] = v;
      }
    }

    // 3. DEMO FARMERS
    const farmersCount = await Farmer.countDocuments();
    const farmerMap: Record<string, any> = {};

    if (farmersCount === 0) {
      const farmerUser = userMap['farmer@agribiotech.demo'] || (await User.findOne({ email: 'farmer@agribiotech.demo' }));

      const farmersToSeed = [
        {
          userId: farmerUser?._id,
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
      ];

      for (const f of farmersToSeed) {
        const created = await Farmer.create(f);
        farmerMap[f.fullName] = created;
      }
      console.log('[Demo Seed] Created 4 baseline farmers');
    } else {
      const allFarmers = await Farmer.find();
      for (const f of allFarmers) {
        farmerMap[f.fullName] = f;
      }
    }

    // 4. DEMO FARM PLOTS
    const farmsCount = await Farm.countDocuments();
    const farmMap: Record<string, any> = {};

    if (farmsCount === 0) {
      const farmsToSeed = [
        {
          farmerId: farmerMap['Ramesh Kumar']?._id,
          farmName: 'Kanchipuram Bio-Cotton Research Plot',
          locationAddress: 'Sriperumbudur High Road, Kanchipuram, Tamil Nadu',
          latitude: 12.9675,
          longitude: 79.9416,
          totalAreaAcres: 7.0,
          soilType: 'Deep Black Regur Soil',
          irrigationType: 'Drip & Borewell',
          currentCrop: 'Cotton',
          cropVarietyId: varietyMap['Cotton']?._id,
        },
        {
          farmerId: farmerMap['Ramesh Kumar']?._id,
          farmName: 'Tiruvallur Green Chilli Haven',
          locationAddress: 'Poonamallee Bypass Road, Tiruvallur, Tamil Nadu',
          latitude: 13.1432,
          longitude: 79.9080,
          totalAreaAcres: 5.0,
          soilType: 'Red Sandy Loam',
          irrigationType: 'Micro-Sprinkler & Borewell',
          currentCrop: 'Chilli',
          cropVarietyId: varietyMap['Chilli']?._id,
        },
        {
          farmerId: farmerMap['Lakshmi Devi']?._id,
          farmName: 'Villupuram Delta Paddy & Bio-Plot',
          locationAddress: 'Gingee Road, Tindivanam, Villupuram, Tamil Nadu',
          latitude: 11.9401,
          longitude: 79.4861,
          totalAreaAcres: 8.0,
          soilType: 'Alluvial Heavy Clay Loam',
          irrigationType: 'Canal Lift Irrigation',
          currentCrop: 'Rice',
          cropVarietyId: varietyMap['Rice']?._id,
        },
        {
          farmerId: farmerMap['Suresh Kumar']?._id,
          farmName: 'Pollachi Organic Agro-Ecology Farm',
          locationAddress: 'Valparai Main Road, Pollachi, Coimbatore, Tamil Nadu',
          latitude: 10.6609,
          longitude: 77.0048,
          totalAreaAcres: 9.0,
          soilType: 'Rich Humus Loam',
          irrigationType: 'Gravity Flow Drip',
          currentCrop: 'Cotton',
          cropVarietyId: varietyMap['Cotton']?._id,
        },
        {
          farmerId: farmerMap['Suresh Kumar']?._id,
          farmName: 'Anaimalai Bio-Maize Demonstration Plot',
          locationAddress: 'Sethumadai Foothills, Anaimalai, Coimbatore, Tamil Nadu',
          latitude: 10.5842,
          longitude: 76.9324,
          totalAreaAcres: 6.0,
          soilType: 'Sandy Clay Loam',
          irrigationType: 'Solar Powered Drip',
          currentCrop: 'Maize',
          cropVarietyId: varietyMap['Maize']?._id,
        },
        {
          farmerId: farmerMap['Anitha Raman']?._id,
          farmName: 'Melur Cauvery Delta Research Farm',
          locationAddress: 'Trichy Highway, Melur, Madurai, Tamil Nadu',
          latitude: 10.0345,
          longitude: 78.3371,
          totalAreaAcres: 6.0,
          soilType: 'Riverine Alluvial Silt',
          irrigationType: 'Channel Canal & Tube Well',
          currentCrop: 'Rice',
          cropVarietyId: varietyMap['Rice']?._id,
        },
      ];

      for (const farm of farmsToSeed) {
        if (farm.farmerId) {
          const created = await Farm.create(farm);
          farmMap[farm.farmName] = created;
        }
      }
      console.log('[Demo Seed] Created 6 baseline farm plots');
    } else {
      const allFarms = await Farm.find();
      for (const f of allFarms) {
        farmMap[f.farmName] = f;
      }
    }

    // 5. DEMO DISEASES CATALOG
    const diseasesCount = await Disease.countDocuments();
    if (diseasesCount === 0) {
      await Disease.create([
        {
          diseaseName: 'Cotton Pink Bollworm (Pectinophora gossypiella)',
          pathogenType: 'PEST',
          cropAffiliation: 'Cotton',
          commonSymptoms: 'Rosetted flowers, double seeds, internal boll feeding damage.',
          severityLevelDefault: 'HIGH',
          recommendedBiotechSolution: 'Beauveria bassiana bio-pesticide spray + PBRope mating disruption.',
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
        },
      ]);
      console.log('[Demo Seed] Created 6 baseline diseases in catalog');
    }

    // 6. DEMO DISEASE REPORTS (GIS SURVEILLANCE RADAR CASES)
    const reportsCount = await DiseaseReport.countDocuments();
    if (reportsCount === 0) {
      const agronomistUser = userMap['agronomist@agribiotech.demo'] || (await User.findOne({ email: 'agronomist@agribiotech.demo' }));
      const scientistUser = userMap['scientist@agribiotech.demo'] || (await User.findOne({ email: 'scientist@agribiotech.demo' }));

      const farm1 = farmMap['Kanchipuram Bio-Cotton Research Plot'] || (await Farm.findOne({ farmName: /Kanchipuram/i }));
      const farm2 = farmMap['Tiruvallur Green Chilli Haven'] || (await Farm.findOne({ farmName: /Tiruvallur/i }));
      const farm3 = farmMap['Villupuram Delta Paddy & Bio-Plot'] || (await Farm.findOne({ farmName: /Villupuram/i }));
      const farm4 = farmMap['Pollachi Organic Agro-Ecology Farm'] || (await Farm.findOne({ farmName: /Pollachi/i }));
      const farm5 = farmMap['Melur Cauvery Delta Research Farm'] || (await Farm.findOne({ farmName: /Melur/i }));
      const farm6 = farmMap['Anaimalai Bio-Maize Demonstration Plot'] || (await Farm.findOne({ farmName: /Anaimalai/i }));

      if (farm1 && agronomistUser) {
        await DiseaseReport.create([
          {
            cropVarietyId: varietyMap['Cotton']?._id,
            farmId: farm1._id,
            reportedById: agronomistUser._id,
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
          },
          {
            cropVarietyId: varietyMap['Chilli']?._id,
            farmId: farm2 ? farm2._id : farm1._id,
            reportedById: agronomistUser._id,
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
          },
          {
            cropVarietyId: varietyMap['Wheat']?._id,
            farmId: farm4 ? farm4._id : farm1._id,
            reportedById: agronomistUser._id,
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
          },
          {
            cropVarietyId: varietyMap['Tomato']?._id,
            farmId: farm5 ? farm5._id : farm1._id,
            reportedById: scientistUser ? scientistUser._id : agronomistUser._id,
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
          },
          {
            cropVarietyId: varietyMap['Rice']?._id,
            farmId: farm6 ? farm6._id : farm1._id,
            reportedById: scientistUser ? scientistUser._id : agronomistUser._id,
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
          },
          {
            cropVarietyId: varietyMap['Chilli']?._id,
            farmId: farm3 ? farm3._id : farm1._id,
            reportedById: agronomistUser._id,
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
          },
        ]);
        console.log('[Demo Seed] Created 6 baseline disease surveillance reports with GPS coordinates');
      }
    }

    // 7. Ensure isDemo flag is set on all baseline disease reports
    await DiseaseReport.updateMany({ isDemo: { $exists: false } }, { $set: { isDemo: true } });

    // 8. Safely backfill any existing disease reports lacking coordinates using their verified farm records
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

    for (const report of unmappedReports) {
      const f: any = report.farmId;
      if (f && typeof f.latitude === 'number' && typeof f.longitude === 'number' && !isNaN(f.latitude) && !isNaN(f.longitude) && !(f.latitude === 0 && f.longitude === 0)) {
        await DiseaseReport.updateOne(
          { _id: report._id },
          {
            $set: {
              latitude: f.latitude,
              longitude: f.longitude,
              locationAddress: report.locationAddress || f.locationAddress,
            }
          }
        );
        console.log(`[GIS Safe Sync] Linked verified farm GPS [${f.latitude}, ${f.longitude}] to report "${report.diseaseName}" (${report._id})`);
      }
    }

    seedCompleted = true;
  } catch (err: any) {
    console.error('Error ensuring demo users and data:', err.message);
  } finally {
    isSeeding = false;
  }
};

export const sanitizeMongoUri = (rawUri: string): string => {
  try {
    const trimmed = rawUri.trim();
    if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
      return trimmed;
    }
    const scheme = trimmed.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://';
    const remainder = trimmed.slice(scheme.length);
    const atIndex = remainder.lastIndexOf('@');
    if (atIndex === -1) return trimmed; // No user credentials

    const userInfo = remainder.slice(0, atIndex);
    const hostAndParams = remainder.slice(atIndex + 1);
    const colonIndex = userInfo.indexOf(':');
    if (colonIndex === -1) return trimmed; // No password

    const username = userInfo.slice(0, colonIndex);
    const rawPassword = userInfo.slice(colonIndex + 1);
    // Safely encode special characters (e.g., @, #, ?, %) while preserving existing URL-encoding
    const encodedPassword = encodeURIComponent(decodeURIComponent(rawPassword));
    return `${scheme}${username}:${encodedPassword}@${hostAndParams}`;
  } catch {
    return rawUri.trim();
  }
};

export const getMongoUri = (): string => {
  let uri = (process.env.MONGODB_URI || '').trim();
  uri = uri.replace(/^["']|["']$/g, '').trim();
  if (uri) {
    return sanitizeMongoUri(uri);
  }
  return 'mongodb://localhost:27017/agribiotech';
};

let cachedPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) {
    if (!seedCompleted && !isSeeding) {
      await ensureDemoUsers();
    }
    return;
  }

  const uri = getMongoUri();

  // If in production/Vercel and MONGODB_URI is missing or pointing to localhost, fail fast with a clear error
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    if (!process.env.MONGODB_URI || uri.includes('localhost') || uri.includes('127.0.0.1')) {
      const msg = 'MONGODB_URI is not configured in Vercel environment variables. Please add your MongoDB Atlas connection string in Vercel project settings.';
      console.error(`❌ [Database Config Error] ${msg}`);
      throw new Error(msg);
    }
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || 'agribiotech',
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 30000,
      family: 4, // Force IPv4 to avoid IPv6 SRV DNS resolution failures in AWS Lambda/Vercel
    });
  }

  try {
    const conn = await cachedPromise;
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    if (!seedCompleted && !isSeeding) {
      await ensureDemoUsers();
    }
  } catch (error: any) {
    cachedPromise = null;
    console.error(`❌ MongoDB connection error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;
