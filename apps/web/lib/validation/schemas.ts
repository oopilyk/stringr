import { z } from 'zod'

// Auth Schemas
export const SignInSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const SignUpSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  full_name: z.string().min(1, 'Full name is required').max(100, 'Name too long'),
})

export const MagicLinkSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
})

// Profile Schemas
export const ProfileUpdateSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Name too long').optional(),
  bio: z.string().max(1000, 'Bio must be less than 1000 characters').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional().or(z.literal('')),
  city: z.string().max(100, 'City name too long').optional(),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
})

export const AvatarUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'File must be a JPEG, PNG, or WebP image'
    ),
})

// Stringer Onboarding Schemas
export const StringerBackgroundSchema = z.object({
  years_experience: z.number().min(0, 'Must be 0 or greater').max(100, 'Invalid years'),
  rackets_strung_count: z.number().min(0, 'Must be 0 or greater').max(1000000, 'Invalid count').optional(),
  certifications: z.array(z.string()).max(20, 'Too many certifications'),
  stringing_location: z.string().min(1, 'Location is required'),
  player_levels_served: z.array(z.string()).min(1, 'Select at least one player level'),
  bio: z.string().max(1000, 'Bio too long').optional(),
})

export const StringerEquipmentSchema = z.object({
  machine_brand: z.string().min(1, 'Machine brand is required'),
  machine_model: z.string().min(1, 'Machine model is required'),
  machine_type: z.enum(['manual', 'electronic', 'drop-weight']),
  max_tension: z.number().min(10).max(90, 'Tension must be between 10-90 lbs'),
  supported_racket_types: z.array(z.string()).min(1, 'Select at least one racket type'),
})

export const StringerPricingSchema = z.object({
  base_price_cents: z.number().min(1000, 'Price must be at least $10').max(50000, 'Price too high'),
  turnaround_hours: z.number().min(1, 'Must be at least 1 hour').max(720, 'Invalid turnaround time'),
  accepts_rush: z.boolean(),
  rush_fee_cents: z.number().min(0).max(10000).optional(),
  discount_bulk_jobs: z.number().min(0).max(50, 'Discount must be 0-50%').optional(),
  pricing_notes: z.string().max(500, 'Notes too long').optional(),
})

export const StringInventoryItemSchema = z.object({
  brand: z.string().min(1, 'Brand is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  gauge: z.string().min(1, 'Gauge is required').max(20),
  quantity: z.number().min(0, 'Quantity cannot be negative').max(1000),
  price_cents: z.number().min(0, 'Price cannot be negative').max(50000),
})

export const StringInventorySchema = z.object({
  string_inventory: z.array(StringInventoryItemSchema).max(50, 'Too many items'),
  accepts_player_strings: z.boolean(),
})

export const AvailabilitySchema = z.object({
  dropoff_methods: z.array(z.object({
    method: z.string(),
    details: z.string().optional(),
  })).min(1, 'Select at least one dropoff method'),
  max_daily_jobs: z.number().min(1).max(50).optional(),
  availability: z.array(z.object({
    day: z.string(),
    start_time: z.string(),
    end_time: z.string(),
  })).optional(),
})

// Contact Form Schema
export const ContactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

// Review Schema
export const ReviewSchema = z.object({
  rating: z.number().min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5'),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(1000),
  stringer_id: z.string().uuid('Invalid stringer ID'),
})

// Search Schema
export const SearchStringersSchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radius_miles: z.number().min(1).max(500).optional(),
  min_rating: z.number().min(0).max(5).optional(),
  max_price_cents: z.number().min(0).max(100000).optional(),
  query: z.string().max(200).optional(),
})

// Helper function to safely validate data
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return { success: false, error: firstError.message }
    }
    return { success: false, error: 'Validation failed' }
  }
}

// Request Schemas
export const RacketPhotoSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Photo must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Photo must be JPEG, PNG, or WebP'
    ),
})

export const CreateRequestSchema = z.object({
  stringer_id: z.string().uuid('Invalid stringer'),
  racket_photo_url: z.string().url('Racket photo is required'),

  service_type: z.enum([
    'restring_only',
    'restring_grip',
    'restring_grommets',
    'full_service'
  ]),

  // String selection - full snapshot
  string_selection: z.object({
    brand: z.string().min(1).max(50),
    model: z.string().min(1).max(50),
    gauge: z.string().min(1).max(20),
    price_cents: z.number().min(0).max(50000),
  }),

  tension_mains_lbs: z.number().min(10).max(90),
  tension_crosses_lbs: z.number().min(10).max(90),

  string_pattern: z.enum(['existing', 'two_piece', 'one_piece', 'ask_stringer']),

  // Dropoff method - full snapshot
  dropoff_method: z.object({
    method: z.string().min(1).max(100),
    details: z.string().max(500).nullable().optional(),
  }),

  // Preferred time slot for dropoff
  preferred_time_slot: z.object({
    day: z.string(),
    start: z.string(),
    end: z.string(),
  }).nullable().optional(),

  special_instructions: z.string().max(1000).nullable().optional(),
  preferred_completion_date: z.string().nullable().optional(), // ISO date string
  estimated_price_cents: z.number().min(0),
})

// Export types for TypeScript
export type SignInInput = z.infer<typeof SignInSchema>
export type SignUpInput = z.infer<typeof SignUpSchema>
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>
export type StringerBackgroundInput = z.infer<typeof StringerBackgroundSchema>
export type ContactFormInput = z.infer<typeof ContactFormSchema>
export type ReviewInput = z.infer<typeof ReviewSchema>
export type CreateRequestInput = z.infer<typeof CreateRequestSchema>
