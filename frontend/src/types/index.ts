export type UserRole = 'ADMIN' | 'AGRONOMIST' | 'BIOTECH_EXPERT' | 'FARMER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  farmerProfile?: Farmer;
  createdAt?: string;
}

export interface Farmer {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  email?: string;
  state: string;
  district: string;
  village?: string;
  farmSizeAcres: number;
  preferredLanguage: string;
  farmingExperienceYears: number;
  primaryCrops: string;
  farms?: Farm[];
  advisories?: FarmerAdvisory[];
  recommendations?: BiotechRecommendation[];
  _count?: {
    farms: number;
    advisories: number;
    recommendations: number;
  };
  createdAt?: string;
}

export interface Farm {
  id: string;
  farmerId: string;
  farmer?: Farmer;
  farmName: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  totalAreaAcres: number;
  soilType: string;
  irrigationType: string;
  currentCrop?: string;
  cropVarietyId?: string;
  diseaseCases?: DiseaseCase[];
  observations?: FieldObservation[];
  _count?: {
    diseaseCases: number;
    observations: number;
  };
  createdAt?: string;
}

export interface CropVariety {
  id: string;
  cropName: string;
  varietyName: string;
  cropType: 'CEREAL' | 'PULSE' | 'OILSEED' | 'CASH_CROP' | 'HORTICULTURE';
  growingSeason: 'KHARIF' | 'RABI' | 'ZAID' | 'YEAR_ROUND';
  soilRequirements: string;
  expectedYieldMin: number;
  expectedYieldMax: number;
  yieldUnit: string;
  diseaseResistanceTraits: string;
  biotechTraits: string;
  recommendedRegions: string;
  description: string;
  maturityDays: number;
  imageUrl?: string;
  _count?: {
    diseaseCases: number;
    observations: number;
    recommendations: number;
  };
  diseaseCases?: DiseaseCase[];
  observations?: FieldObservation[];
  recommendations?: BiotechRecommendation[];
  createdAt?: string;
}

export interface Disease {
  id: string;
  diseaseName: string;
  pathogenType: 'FUNGAL' | 'BACTERIAL' | 'VIRAL' | 'PEST' | 'NEMATODE';
  cropAffiliation: string;
  commonSymptoms: string;
  severityLevelDefault: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedBiotechSolution: string;
  preventionProtocol: string;
}

export interface DiseaseCase {
  id: string;
  cropVarietyId?: string;
  cropVariety?: CropVariety;
  crop?: string;
  farmId: string;
  farm: Farm;
  locationAddress?: string;
  reportedById: string;
  reportedBy?: { id: string; name: string; role: string; email?: string };
  assignedAdvisorId?: string;
  assignedAdvisor?: { id: string; name: string; role: string; email?: string; phone?: string };
  diseaseName: string;
  problemType?: string;
  affectedArea?: string;
  symptoms: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  latitude: number;
  longitude: number;
  lat?: number;
  lng?: number;
  dateObserved: string;
  status: 'ACTIVE' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'REPORTED';
  imageUrl?: string;
  recommendedTreatment?: string;
  resolvedAt?: string;
  recommendations?: BiotechRecommendation[];
  isDemo?: boolean;
  distanceKm?: number;
  createdAt?: string;
}

export interface FarmerProblemReportPayload {
  farmId: string;
  crop?: string;
  cropVarietyId?: string;
  problemType: string;
  description?: string;
  symptoms?: string;
  affectedArea: string;
  imageUrl?: string;
}

export interface FarmerProblemReportResponse {
  id: string;
  reportId: string;
  submittedDate: string;
  dateObserved: string;
  status: string;
  problemType: string;
  diseaseName: string;
  affectedArea: string;
  crop?: string;
  farmId: string;
  farmName: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  assignedAdvisor?: {
    id?: string;
    name: string;
    role: string;
    email?: string;
    phone?: string;
  };
  recommendation?: string | null;
  recommendedTreatment?: string | null;
  message: string;
}

export interface FieldObservation {
  id: string;
  farmId: string;
  farm: Farm;
  cropVarietyId?: string;
  cropVariety?: CropVariety;
  observerId: string;
  observer?: { id: string; name: string; role: string };
  observationDate: string;
  growthStage: 'SEEDLING' | 'VEGETATIVE' | 'FLOWERING' | 'GRAIN_FILLING' | 'MATURITY';
  plantHealthScore: number;
  soilMoisture: 'OPTIMAL' | 'DRY' | 'WATERLOGGED' | 'MODERATE';
  soilHealthNotes?: string;
  weatherCondition: 'SUNNY' | 'HUMID_OVERCAST' | 'RAINY' | 'DRY_WINDY';
  pestSymptoms?: string;
  notes: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  recommendations?: BiotechRecommendation[];
  createdAt?: string;
}

export interface BiotechRecommendation {
  id: string;
  farmId?: string;
  farm?: { id: string; farmName: string; locationAddress?: string; currentCrop?: string };
  cropName?: string;
  cropVarietyId?: string;
  cropVariety?: CropVariety;
  diseaseCaseId?: string;
  diseaseCase?: DiseaseCase;
  fieldObservationId?: string;
  fieldObservation?: FieldObservation;
  farmerId?: string;
  farmer?: Farmer;
  creatorId?: string;
  creator?: { id: string; name: string; role: string };
  recommendationType: 'BIOFERTILIZER' | 'BIOPESTICIDE' | 'BIOLOGICAL_CONTROL' | 'VARIETY_SELECTION' | 'CROP_MANAGEMENT' | 'SOIL_ENHANCEMENT';
  title: string;
  productName: string;
  targetIssue: string;
  reasoning: string;
  expectedBenefit: string;
  applicationInstructions: string;
  dosage: string;
  precautions: string;
  isAutomatedSuggestion: boolean;
  status: 'PENDING_REVIEW' | 'ACTIVE' | 'APPLIED' | 'ARCHIVED';
  createdAt?: string;
}

export interface FarmerAdvisory {
  id: string;
  farmerId: string;
  farmer: Farmer;
  advisorId: string;
  advisor: { id: string; name: string; role: string };
  title: string;
  category: 'DISEASE_ALERT' | 'IRRIGATION' | 'NUTRIENT_MANAGEMENT' | 'BIOTECH_INPUT' | 'WEATHER_ACTION' | 'GENERAL';
  message: string;
  priority: 'ROUTINE' | 'IMPORTANT' | 'URGENT';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  recipientUserId: string;
  type: 'OUTBREAK_ALERT' | 'NEW_ADVISORY' | 'NEW_RECOMMENDATION' | 'FIELD_VISIT_REMINDER' | 'HEALTH_CRITICAL';
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS';
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface ActivityLogItem {
  id: string;
  userId?: string;
  user?: { id: string; name: string; role: string; avatarUrl?: string };
  action: string;
  module: string;
  details: string;
  createdAt: string;
}

export interface DashboardKPIs {
  totalUsers?: number;
  totalFarmers: number;
  totalFarms: number;
  totalVarieties: number;
  totalDiseaseCases: number;
  criticalDiseaseCases: number;
  totalRecommendations: number;
  totalObservations: number;
  totalAdvisories: number;
  activeOutbreaks: DiseaseCase[];
}

export interface AnalyticsData {
  severityDistribution: { name: string; count: number }[];
  cropTypeDistribution: { name: string; count: number }[];
  recommendationTypeDistribution: { name: string; count: number }[];
  growthStageDistribution: { name: string; count: number }[];
  varietiesYieldComparison: { name: string; minYield: number; maxYield: number; avgYield: number; maturityDays: number }[];
  monthlyDiseaseTrends: any[];
}
