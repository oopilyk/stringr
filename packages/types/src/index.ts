import { z } from 'zod';

// Core types
export type Role = 'player' | 'stringer';
export type RequestStatus = 'requested' | 'accepted' | 'in_progress' | 'ready' | 'completed' | 'canceled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type DropoffMethod = 'meetup' | 'pickup' | 'ship' | 'dropbox';

// Zod schemas for validation
export const RoleSchema = z.enum(['player', 'stringer']);
export const RequestStatusSchema = z.enum(['requested', 'accepted', 'in_progress', 'ready', 'completed', 'canceled']);
export const PaymentStatusSchema = z.enum(['unpaid', 'paid', 'refunded']);
export const DropoffMethodSchema = z.enum(['meetup', 'pickup', 'ship', 'dropbox']);

// Profile types
export interface Profile {
  id: string;
  role: Role;
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
  role: RoleSchema,
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

// Error types
export class RallyStringsError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'RallyStringsError';
  }
}

export class ValidationError extends RallyStringsError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends RallyStringsError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class UnauthorizedError extends RallyStringsError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ConflictError extends RallyStringsError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

// Utility types for forms
export type CreateRequestFormData = Omit<CreateRequestPayload, 'stringer_id'>;
export type UpdateProfileFormData = Partial<Omit<Profile, 'id' | 'role' | 'created_at' | 'updated_at'>>;
export type UpdateStringerSettingsFormData = Partial<Omit<StringerSettings, 'id'>>;
