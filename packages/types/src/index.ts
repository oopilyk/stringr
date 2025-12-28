import { z } from 'zod';

// Core types  
export type RequestStatus = 'requested' | 'accepted' | 'in_progress' | 'ready' | 'completed' | 'canceled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type DropoffMethod = 'meetup' | 'pickup' | 'ship' | 'dropbox';

// Zod schemas for validation
export const RequestStatusSchema = z.enum(['requested', 'accepted', 'in_progress', 'ready', 'completed', 'canceled']);
export const PaymentStatusSchema = z.enum(['unpaid', 'paid', 'refunded']);
export const DropoffMethodSchema = z.enum(['meetup', 'pickup', 'ship', 'dropbox']);

// Profile types
export interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  city?: string;
  lat?: number;
  lng?: number;
  created_at?: string;
  updated_at?: string;
}

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Stringer settings
export interface StringerService {
  name: string;
  price_cents: number;
}

export interface AvailabilityBlock {
  dow: number; // 0-6 (Sunday-Saturday)
  start: string; // HH:mm format
  end: string; // HH:mm format
}

export interface StringerSettings {
  id: string; // profile id
  base_price_cents: number;
  turnaround_hours: number;
  accepts_rush: boolean;
  rush_fee_cents: number;
  max_daily_jobs: number;
  services: StringerService[];
  availability: AvailabilityBlock[];
}

export const StringerServiceSchema = z.object({
  name: z.string().min(1),
  price_cents: z.number().int().min(0),
});

export const AvailabilityBlockSchema = z.object({
  dow: z.number().int().min(0).max(6),
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

export const StringerSettingsSchema = z.object({
  id: z.string().uuid(),
  base_price_cents: z.number().int().min(0),
  turnaround_hours: z.number().int().min(1),
  accepts_rush: z.boolean(),
  rush_fee_cents: z.number().int().min(0),
  max_daily_jobs: z.number().int().min(1),
  services: z.array(StringerServiceSchema),
  availability: z.array(AvailabilityBlockSchema),
});

// Request types
export interface Request {
  id: string;
  player_id: string;
  stringer_id?: string;
  status: RequestStatus;
  racquet_brand?: string;
  racquet_model?: string;
  string_pref?: string;
  tension_lbs?: number;
  notes?: string;
  dropoff_method?: DropoffMethod;
  address?: string;
  lat?: number;
  lng?: number;
  quoted_price_cents?: number;
  payment_status: PaymentStatus;
  created_at?: string;
  updated_at?: string;
}

export const RequestSchema = z.object({
  id: z.string().uuid(),
  player_id: z.string().uuid(),
  stringer_id: z.string().uuid().optional(),
  status: RequestStatusSchema,
  racquet_brand: z.string().optional(),
  racquet_model: z.string().optional(),
  string_pref: z.string().optional(),
  tension_lbs: z.number().min(30).max(80).optional(),
  notes: z.string().optional(),
  dropoff_method: DropoffMethodSchema.optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  quoted_price_cents: z.number().int().min(0).optional(),
  payment_status: PaymentStatusSchema,
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Message types
export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export const MessageSchema = z.object({
  id: z.string().uuid(),
  request_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  body: z.string().min(1),
  created_at: z.string(),
});

// Review types
export interface Review {
  id: string;
  request_id: string;
  player_id: string;
  stringer_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  request_id: z.string().uuid(),
  player_id: z.string().uuid(),
  stringer_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  created_at: z.string(),
});

// Stringer rating aggregation
export interface StringerRating {
  stringer_id: string;
  avg_rating: number;
  review_count: number;
}

// API request/response types
export interface CreateRequestPayload {
  racquet_brand?: string;
  racquet_model?: string;
  string_pref?: string;
  tension_lbs?: number;
  notes?: string;
  dropoff_method?: DropoffMethod;
  address?: string;
  lat?: number;
  lng?: number;
  stringer_id: string;
}

export const CreateRequestPayloadSchema = z.object({
  racquet_brand: z.string().optional(),
  racquet_model: z.string().optional(),
  string_pref: z.string().optional(),
  tension_lbs: z.number().min(30).max(80).optional(),
  notes: z.string().optional(),
  dropoff_method: DropoffMethodSchema.optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  stringer_id: z.string().uuid(),
});

export interface SearchStringersParams {
  lat: number;
  lng: number;
  radius_km?: number;
  min_rating?: number;
  max_price_cents?: number;
  accepts_rush?: boolean;
}

export const SearchStringersParamsSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  radius_km: z.number().min(1).max(50).optional(),
  min_rating: z.number().min(1).max(5).optional(),
  max_price_cents: z.number().int().min(0).optional(),
  accepts_rush: z.boolean().optional(),
});

export interface StringerSearchResult extends Profile {
  stringer_settings: StringerSettings;
  rating?: StringerRating;
  distance_km?: number;
}

// Common racquet presets
export const RACQUET_PRESETS = [
  { brand: 'Babolat', model: 'Pure Aero' },
  { brand: 'Babolat', model: 'Pure Drive' },
  { brand: 'Wilson', model: 'Blade 98' },
  { brand: 'Wilson', model: 'Pro Staff 97' },
  { brand: 'Head', model: 'Radical MP' },
  { brand: 'Head', model: 'Speed MP' },
  { brand: 'Yonex', model: 'EZONE 98' },
  { brand: 'Prince', model: 'Textreme Tour 100P' },
] as const;

// Common string types
export const STRING_PRESETS = [
  'Babolat RPM Blast 17',
  'Luxilon ALU Power 16L',
  'Wilson Natural Gut 16',
  'Tecnifibre ATP Razor Code 17',
  'Solinco Hyper-G 17',
  'Head Hawk 17',
  'Polyfibre Black Venom 16L',
  'Babolat Xcel 16',
] as const;

// Onboarding constants
export const MACHINE_BRANDS = [
  'Gamma',
  'Babolat',
  'Wilson',
  'Prince',
  'Tourna',
  'Wise',
  'Eagnas',
  'Alpha',
  'Other',
] as const;

export const PLAYER_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Tournament',
  'Professional',
] as const;

export const RACKET_TYPES = [
  'Tennis',
  'Badminton',
  'Squash',
  'Racquetball',
] as const;

export const CERTIFICATIONS = [
  'USRSA Certified Stringer',
  'ERSA Certified',
  'Master Racquet Technician (MRT)',
  'Self-taught',
  'Manufacturer training',
  'Other',
] as const;

export const STRINGING_LOCATIONS = [
  'Home shop',
  'Tennis club',
  'Sports facility',
  'Mobile service',
  'Retail store',
  'Other',
] as const;

// String inventory types
export interface StringInventoryItem {
  id?: string; // UUID for frontend management
  brand: string;
  model: string;
  gauge: string; // e.g., "16", "17", "16L"
  quantity: number;
  price_cents: number;
}

export const StringInventoryItemSchema = z.object({
  id: z.string().uuid().optional(),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  gauge: z.string().min(1, "Gauge is required"),
  quantity: z.number().int().min(0, "Quantity must be 0 or more"),
  price_cents: z.number().int().min(0, "Price must be positive"),
});

// Dropoff method configuration
export interface DropoffMethodConfig {
  method: DropoffMethod;
  enabled: boolean;
  details?: string; // Optional details like pickup radius, shipping instructions
}

export const DropoffMethodConfigSchema = z.object({
  method: DropoffMethodSchema,
  enabled: z.boolean(),
  details: z.string().optional(),
});

// Extended profile with stringer fields
export interface StringerProfile extends Profile {
  years_experience?: number;
  rackets_strung_count?: number;
  certifications?: string[];
  stringing_location?: string;
  player_levels_served?: string[];
  profile_complete?: boolean;
  profile_completion_percentage?: number;
}

export const StringerProfileSchema = ProfileSchema.extend({
  years_experience: z.number().int().min(0).max(50).optional(),
  rackets_strung_count: z.number().int().min(0).optional(),
  certifications: z.array(z.string()).optional(),
  stringing_location: z.string().optional(),
  player_levels_served: z.array(z.string()).optional(),
  profile_complete: z.boolean().optional(),
  profile_completion_percentage: z.number().int().min(0).max(100).optional(),
});

// Extended stringer settings with new fields
export interface ExtendedStringerSettings extends StringerSettings {
  machine_brand?: string;
  machine_model?: string;
  machine_type?: 'drop-weight' | 'electronic' | 'crank';
  supported_racket_types?: string[];
  max_tension?: number;
  string_inventory?: StringInventoryItem[];
  dropoff_methods?: DropoffMethodConfig[];
  pricing_notes?: string;
  accepts_player_strings?: boolean;
  discount_bulk_jobs?: number;
  onboarding_step?: number;
  onboarding_completed_at?: string;
}

export const ExtendedStringerSettingsSchema = StringerSettingsSchema.extend({
  machine_brand: z.string().min(1).optional(),
  machine_model: z.string().min(1).optional(),
  machine_type: z.enum(['drop-weight', 'electronic', 'crank']).optional(),
  supported_racket_types: z.array(z.string()).min(1, "Select at least one racket type").optional(),
  max_tension: z.number().int().min(40).max(100).optional(),
  string_inventory: z.array(StringInventoryItemSchema).optional(),
  dropoff_methods: z.array(DropoffMethodConfigSchema).optional(),
  pricing_notes: z.string().max(500).optional(),
  accepts_player_strings: z.boolean().optional(),
  discount_bulk_jobs: z.number().int().min(0).max(50).optional(),
  onboarding_step: z.number().int().min(1).max(7).optional(),
  onboarding_completed_at: z.string().optional(),
});

// Onboarding form data (all 7 steps combined)
export interface StringerOnboardingData {
  // Step 1: Credentials & Location
  email: string;
  password: string;
  full_name: string;
  phone: string;
  city: string;
  lat?: number;
  lng?: number;

  // Step 2: Background & Experience
  years_experience?: number;
  rackets_strung_count?: number;
  certifications?: string[];
  stringing_location?: string;
  player_levels_served?: string[];
  bio?: string;

  // Step 3: Equipment & Capabilities
  machine_brand?: string;
  machine_model?: string;
  machine_type?: 'drop-weight' | 'electronic' | 'crank';
  supported_racket_types?: string[];
  max_tension?: number;

  // Step 4: Pricing & Turnaround
  base_price_cents: number;
  turnaround_hours: number;
  accepts_rush: boolean;
  rush_fee_cents: number;
  pricing_notes?: string;
  discount_bulk_jobs?: number;

  // Step 5: String Inventory
  string_inventory?: StringInventoryItem[];
  accepts_player_strings?: boolean;

  // Step 6: Availability & Preferences
  dropoff_methods?: DropoffMethodConfig[];
  availability?: AvailabilityBlock[];
  max_daily_jobs: number;
}

// Step-specific schemas for validation
export const Step1Schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  city: z.string().min(2, "City is required"),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const Step2Schema = z.object({
  years_experience: z.number().int().min(0).max(50).optional(),
  rackets_strung_count: z.number().int().min(0).optional(),
  certifications: z.array(z.string()).optional(),
  stringing_location: z.string().optional(),
  player_levels_served: z.array(z.string()).optional(),
  bio: z.string().max(1000).optional(),
});

export const Step3Schema = z.object({
  machine_brand: z.string().optional(),
  machine_model: z.string().optional(),
  machine_type: z.enum(['drop-weight', 'electronic', 'crank']).optional(),
  supported_racket_types: z.array(z.string()).optional(),
  max_tension: z.number().int().min(40).max(100).optional(),
});

export const Step4Schema = z.object({
  base_price_cents: z.number().int().min(1000, "Minimum $10").max(10000, "Maximum $100"),
  turnaround_hours: z.number().int().min(1),
  accepts_rush: z.boolean(),
  rush_fee_cents: z.number().int().min(0).max(5000),
  pricing_notes: z.string().max(500).optional(),
  discount_bulk_jobs: z.number().int().min(0).max(50).optional(),
});

export const Step5Schema = z.object({
  string_inventory: z.array(StringInventoryItemSchema).optional(),
  accepts_player_strings: z.boolean(),
});

export const Step6Schema = z.object({
  dropoff_methods: z.array(DropoffMethodConfigSchema).min(1, "Select at least one dropoff method"),
  availability: z.array(AvailabilityBlockSchema).optional(),
  max_daily_jobs: z.number().int().min(1).max(50),
});

// Error types
export class StringrError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'StringrError';
  }
}

export class ValidationError extends StringrError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends StringrError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class UnauthorizedError extends StringrError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ConflictError extends StringrError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

// Utility types for forms
export type CreateRequestFormData = Omit<CreateRequestPayload, 'stringer_id'>;
export type UpdateProfileFormData = Partial<Omit<Profile, 'id' | 'role' | 'created_at' | 'updated_at'>>;
export type UpdateStringerSettingsFormData = Partial<Omit<StringerSettings, 'id'>>;
