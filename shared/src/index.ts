// API contracts shared by the app and the server.
// Keep this file free of runtime dependencies so both sides can import it.

export type Role = "FARMER" | "EXPERT" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  countryCode: string;
  language: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ---------- Location & weather ----------

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface CurrentWeather {
  temperatureC: number;
  humidity: number;
  windKph: number;
  rainMm: number;
  condition: string;
  isDay: boolean;
}

export interface DailyForecast {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  rainMm: number;
  rainChance: number;
  windMaxKph: number;
  condition: string;
  sunrise: string;
  sunset: string;
}

export type AdvisoryLevel = "info" | "watch" | "warning";

/** A weather reading translated into a farm decision. */
export interface Advisory {
  id: string;
  level: AdvisoryLevel;
  title: string;
  action: string;
  reason: string;
}

export interface WeatherReport {
  location: GeoPoint & { name?: string };
  current: CurrentWeather;
  daily: DailyForecast[];
  advisories: Advisory[];
  fetchedAt: string;
}

// ---------- Crops ----------

export interface CropSummary {
  key: string;
  name: string;
  localNames: Record<string, string>;
  category: string;
  growingDays: [number, number];
  waterNeed: "low" | "medium" | "high";
}

export interface CropRecommendation {
  crop: CropSummary;
  /** 0–100 */
  score: number;
  reasons: string[];
  cautions: string[];
  plantingWindow: string;
  soilRequirements: string;
  commonDiseases: string[];
}

// ---------- Disease scanning ----------

export type ScanStatus =
  | "REJECTED_QUALITY" // image unusable, retake
  | "LOW_CONFIDENCE" // shown as possible conditions only
  | "CONFIDENT" // likely diagnosis
  | "PENDING_REVIEW" // sent to an expert
  | "VERIFIED"; // confirmed by an expert

export type Severity = "mild" | "moderate" | "severe";

export interface QualityReport {
  usable: boolean;
  issues: { code: string; message: string }[];
}

export interface DiseaseInfo {
  key: string;
  name: string;
  crop: string;
  isHealthy: boolean;
  summary: string;
  symptoms: string[];
  causes: string[];
  treatment: string[];
  prevention: string[];
  monitoring: string[];
}

export interface PredictionCandidate {
  label: string;
  name: string;
  confidence: number;
}

export interface ScanResult {
  id: string;
  status: ScanStatus;
  createdAt: string;
  imageUrl: string;
  crop: string | null;
  quality: QualityReport;
  /** Top prediction; null when the image was rejected. */
  prediction: (PredictionCandidate & { severity: Severity | null }) | null;
  candidates: PredictionCandidate[];
  disease: DiseaseInfo | null;
  modelVersion: string | null;
  feedback: { isCorrect: boolean; correctedLabel?: string | null } | null;
}

export interface ScanFeedbackInput {
  isCorrect: boolean;
  correctedLabel?: string;
  notes?: string;
}

// ---------- Farms ----------

export interface FarmCrop {
  id: string;
  cropKey: string;
  cropName: string;
  plantedAt: string | null;
  expectedHarvestAt: string | null;
}

export interface Farm {
  id: string;
  name: string;
  lat: number;
  lon: number;
  locationName: string | null;
  sizeHa: number | null;
  soilType: string | null;
  soil: { ph?: number; nitrogen?: number; phosphorus?: number; potassium?: number; organicMatter?: number } | null;
  crops: FarmCrop[];
}

export interface FarmInput {
  name: string;
  lat: number;
  lon: number;
  locationName?: string;
  sizeHa?: number;
  soilType?: string;
}

// ---------- Alerts ----------

export interface Alert {
  id: string;
  type: "WEATHER" | "DISEASE" | "PEST" | "PLANTING" | "HARVEST" | "HEALTH";
  level: AdvisoryLevel;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

// ---------- Assistant ----------

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  conversationId: string;
  reply: string;
}
