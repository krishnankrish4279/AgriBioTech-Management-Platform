import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. USER MODEL
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'agronomist' | 'biotech_expert' | 'farmer' | 'ADMIN' | 'AGRONOMIST' | 'BIOTECH_EXPERT' | 'FARMER';
  phone?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'agronomist', 'biotech_expert', 'farmer', 'ADMIN', 'AGRONOMIST', 'BIOTECH_EXPERT', 'FARMER'],
      default: 'farmer',
      index: true,
    },
    phone: { type: String, trim: true },
    avatarUrl: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  },
  { timestamps: true }
);

// 2. FARMER MODEL
export interface IFarmer extends Document {
  userId?: mongoose.Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const FarmerSchema = new Schema<IFarmer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    fullName: { type: String, required: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    state: { type: String, required: true, trim: true, index: true },
    district: { type: String, required: true, trim: true, index: true },
    village: { type: String, trim: true },
    farmSizeAcres: { type: Number, default: 1.0, min: 0 },
    preferredLanguage: { type: String, default: 'English' },
    farmingExperienceYears: { type: Number, default: 5, min: 0 },
    primaryCrops: { type: String, required: true },
  },
  { timestamps: true }
);

// 3. FARM MODEL
export interface IFarm extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmName: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  totalAreaAcres: number;
  soilType: string;
  irrigationType: string;
  currentCrop?: string;
  cropVarietyId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FarmSchema = new Schema<IFarm>(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true, index: true },
    farmName: { type: String, required: true, trim: true },
    locationAddress: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    totalAreaAcres: { type: Number, required: true, min: 0 },
    soilType: { type: String, required: true },
    irrigationType: { type: String, required: true },
    currentCrop: { type: String },
    cropVarietyId: { type: Schema.Types.ObjectId, ref: 'CropVariety' },
  },
  { timestamps: true }
);

// 4. CROP VARIETY MODEL
export interface ICropVariety extends Document {
  cropName: string;
  varietyName: string;
  cropType: string;
  growingSeason: string;
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
  createdAt: Date;
  updatedAt: Date;
}

const CropVarietySchema = new Schema<ICropVariety>(
  {
    cropName: { type: String, required: true, trim: true, index: true },
    varietyName: { type: String, required: true, trim: true, index: true },
    cropType: { type: String, required: true, index: true },
    growingSeason: { type: String, required: true, index: true },
    soilRequirements: { type: String, required: true },
    expectedYieldMin: { type: Number, required: true, min: 0 },
    expectedYieldMax: { type: Number, required: true, min: 0 },
    yieldUnit: { type: String, default: 'Quintals/Acre' },
    diseaseResistanceTraits: { type: String, required: true },
    biotechTraits: { type: String, required: true },
    recommendedRegions: { type: String, required: true },
    description: { type: String, required: true },
    maturityDays: { type: Number, default: 120, min: 1 },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

// 5. DISEASE REPORT / CASE MODEL
export interface IDiseaseReport extends Document {
  cropVarietyId?: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  reportedById: mongoose.Types.ObjectId;
  diseaseName: string;
  symptoms: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'low' | 'medium' | 'high' | 'critical';
  latitude?: number;
  longitude?: number;
  dateObserved: Date;
  status: 'ACTIVE' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'REPORTED' | 'active' | 'investigating' | 'contained' | 'resolved' | 'reported';
  imageUrl?: string;
  recommendedTreatment?: string;
  resolvedAt?: Date;
  crop?: string;
  cropVariety?: string;
  farm?: string;
  locationAddress?: string;
  problemType?: string;
  affectedArea?: string;
  assignedAdvisorId?: mongoose.Types.ObjectId;
  isDemo?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DiseaseReportSchema = new Schema<IDiseaseReport>(
  {
    cropVarietyId: { type: Schema.Types.ObjectId, ref: 'CropVariety', index: true },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    reportedById: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    diseaseName: { type: String, required: true, trim: true, index: true },
    symptoms: { type: String, required: true },
    severity: {
      type: String,
      required: true,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'low', 'medium', 'high', 'critical'],
      default: 'MEDIUM',
      index: true,
    },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    dateObserved: { type: Date, default: Date.now },
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'REPORTED', 'active', 'investigating', 'contained', 'resolved', 'reported'],
      default: 'ACTIVE',
      index: true,
    },
    crop: { type: String, trim: true },
    cropVariety: { type: String, trim: true },
    farm: { type: String, trim: true },
    locationAddress: { type: String, trim: true },
    imageUrl: { type: String },
    recommendedTreatment: { type: String },
    resolvedAt: { type: Date },
    problemType: { type: String, trim: true },
    affectedArea: { type: String, trim: true },
    assignedAdvisorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

DiseaseReportSchema.index({ latitude: 1, longitude: 1 });
DiseaseReportSchema.index({ severity: 1, status: 1 });

// 6. FIELD OBSERVATION MODEL
export interface IFieldObservation extends Document {
  farmId: mongoose.Types.ObjectId;
  cropVarietyId?: mongoose.Types.ObjectId;
  observerId: mongoose.Types.ObjectId;
  observationDate: Date;
  growthStage: string;
  plantHealthScore: number;
  soilMoisture: string;
  soilHealthNotes?: string;
  weatherCondition: string;
  pestSymptoms?: string;
  notes: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

const FieldObservationSchema = new Schema<IFieldObservation>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    cropVarietyId: { type: Schema.Types.ObjectId, ref: 'CropVariety', index: true },
    observerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    observationDate: { type: Date, default: Date.now },
    growthStage: { type: String, required: true, index: true },
    plantHealthScore: { type: Number, required: true, min: 1, max: 10, default: 8 },
    soilMoisture: { type: String, required: true },
    soilHealthNotes: { type: String },
    weatherCondition: { type: String, required: true },
    pestSymptoms: { type: String },
    notes: { type: String, required: true },
    photoUrl: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { timestamps: true }
);

// 7. BIOTECHNOLOGY RECOMMENDATION MODEL
export interface IBiotechnologyRecommendation extends Document {
  cropVarietyId?: mongoose.Types.ObjectId;
  diseaseReportId?: mongoose.Types.ObjectId;
  fieldObservationId?: mongoose.Types.ObjectId;
  farmerId?: mongoose.Types.ObjectId;
  creatorId?: mongoose.Types.ObjectId;
  recommendationType: string;
  title: string;
  productName: string;
  targetIssue: string;
  reasoning: string;
  expectedBenefit: string;
  applicationInstructions: string;
  dosage: string;
  precautions: string;
  isAutomatedSuggestion: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const BiotechnologyRecommendationSchema = new Schema<IBiotechnologyRecommendation>(
  {
    cropVarietyId: { type: Schema.Types.ObjectId, ref: 'CropVariety', index: true },
    diseaseReportId: { type: Schema.Types.ObjectId, ref: 'DiseaseReport', index: true },
    fieldObservationId: { type: Schema.Types.ObjectId, ref: 'FieldObservation', index: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    recommendationType: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    targetIssue: { type: String, required: true },
    reasoning: { type: String, required: true },
    expectedBenefit: { type: String, required: true },
    applicationInstructions: { type: String, required: true },
    dosage: { type: String, required: true },
    precautions: { type: String, required: true },
    isAutomatedSuggestion: { type: Boolean, default: false },
    status: { type: String, default: 'ACTIVE', index: true },
  },
  { timestamps: true }
);

// 8. FARMER ADVISORY MODEL
export interface IFarmerAdvisory extends Document {
  farmerId: mongoose.Types.ObjectId;
  advisorId: mongoose.Types.ObjectId;
  title: string;
  category: string;
  message: string;
  priority: 'ROUTINE' | 'IMPORTANT' | 'URGENT' | 'routine' | 'important' | 'urgent';
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FarmerAdvisorySchema = new Schema<IFarmerAdvisory>(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true, index: true },
    advisorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    message: { type: String, required: true },
    priority: {
      type: String,
      required: true,
      enum: ['ROUTINE', 'IMPORTANT', 'URGENT', 'routine', 'important', 'urgent'],
      default: 'ROUTINE',
    },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

// 9. NOTIFICATION MODEL
export interface INotification extends Document {
  recipientUserId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  severity: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, default: 'INFO' },
    isRead: { type: Boolean, default: false, index: true },
    linkUrl: { type: String },
  },
  { timestamps: true }
);

// 10. ACTIVITY LOG MODEL
export interface IActivityLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  module: string;
  details: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    details: { type: String, required: true },
  },
  { timestamps: true }
);

// 11. DISEASE KNOWLEDGE BASE CATALOG
export interface IDisease extends Document {
  diseaseName: string;
  pathogenType: string;
  cropAffiliation: string;
  commonSymptoms: string;
  severityLevelDefault: string;
  recommendedBiotechSolution: string;
  preventionProtocol: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiseaseCatalogSchema = new Schema<IDisease>(
  {
    diseaseName: { type: String, required: true, unique: true, trim: true },
    pathogenType: { type: String, required: true },
    cropAffiliation: { type: String, required: true },
    commonSymptoms: { type: String, required: true },
    severityLevelDefault: { type: String, default: 'HIGH' },
    recommendedBiotechSolution: { type: String, required: true },
    preventionProtocol: { type: String, required: true },
  },
  { timestamps: true }
);

// 12. SECURITY EVENT AUDIT MODEL
export interface ISecurityEvent extends Document {
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  userRole?: string;
  attemptedResource: string;
  targetRole?: string;
  requestedRoute: string;
  outcome: 'denied' | 'allowed';
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  targetUserId?: mongoose.Types.ObjectId;
  timestamp: Date;
  createdAt: Date;
}

const SecurityEventSchema = new Schema<ISecurityEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userName: { type: String, trim: true },
    userRole: { type: String, trim: true },
    attemptedResource: { type: String, required: true, trim: true },
    targetRole: { type: String, trim: true },
    requestedRoute: { type: String, required: true, trim: true },
    outcome: { type: String, enum: ['denied', 'allowed'], required: true, index: true },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    details: { type: String },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Export Mongoose Models
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Farmer: Model<IFarmer> = mongoose.models.Farmer || mongoose.model<IFarmer>('Farmer', FarmerSchema);
export const Farm: Model<IFarm> = mongoose.models.Farm || mongoose.model<IFarm>('Farm', FarmSchema);
export const CropVariety: Model<ICropVariety> = mongoose.models.CropVariety || mongoose.model<ICropVariety>('CropVariety', CropVarietySchema);
export const DiseaseReport: Model<IDiseaseReport> = mongoose.models.DiseaseReport || mongoose.model<IDiseaseReport>('DiseaseReport', DiseaseReportSchema);
export const FieldObservation: Model<IFieldObservation> = mongoose.models.FieldObservation || mongoose.model<IFieldObservation>('FieldObservation', FieldObservationSchema);
export const BiotechnologyRecommendation: Model<IBiotechnologyRecommendation> = mongoose.models.BiotechnologyRecommendation || mongoose.model<IBiotechnologyRecommendation>('BiotechnologyRecommendation', BiotechnologyRecommendationSchema);
export const FarmerAdvisory: Model<IFarmerAdvisory> = mongoose.models.FarmerAdvisory || mongoose.model<IFarmerAdvisory>('FarmerAdvisory', FarmerAdvisorySchema);
export const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const ActivityLog: Model<IActivityLog> = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
export const Disease: Model<IDisease> = mongoose.models.Disease || mongoose.model<IDisease>('Disease', DiseaseCatalogSchema);
export const SecurityEvent: Model<ISecurityEvent> = mongoose.models.SecurityEvent || mongoose.model<ISecurityEvent>('SecurityEvent', SecurityEventSchema);

