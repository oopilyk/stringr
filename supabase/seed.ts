import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

// Try loading from apps/web/.env.local first, fallback to root .env.local
config({ path: path.join(__dirname, '../apps/web/.env.local') })
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedData() {
  console.log('🌱 Starting seed process...')

  try {
    // Create sample stringers
    const stringers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'marco@example.com',
        password: 'password123',
        profile: {
          full_name: 'Marco Rodriguez',
          bio: 'Professional tennis stringer with 15+ years experience. Former college player and certified Master Racquet Technician.',
          city: 'Baltimore',
          lat: 39.2904,
          lng: -76.6122,
          phone: '+1 (555) 123-4567',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco',
          years_experience: 15,
          rackets_strung_count: 2500,
          certifications: ['USRSA Master', 'ERSA Certified'],
          stringing_location: 'Tennis club',
          player_levels_served: ['Intermediate', 'Advanced', 'Tournament', 'Professional']
        },
        settings: {
          base_price_cents: 2500, // $25
          turnaround_hours: 24,
          accepts_rush: true,
          rush_fee_cents: 800, // $8
          max_daily_jobs: 8,
          flexible_availability: false,
          pricing_notes: 'String cost not included. Natural gut available for +$15. Free grip replacement with stringing.',
          discount_bulk_jobs: 10,
          machine_brand: 'Babolat',
          machine_model: 'Star 5',
          machine_type: 'electronic',
          max_tension: 80,
          supported_racket_types: ['Tennis', 'Badminton', 'Squash'],
          accepts_player_strings: true,
          string_inventory: [
            { brand: 'Luxilon', model: 'ALU Power', gauge: '16L', quantity: 10, price_cents: 1800 },
            { brand: 'Babolat', model: 'RPM Blast', gauge: '17g', quantity: 8, price_cents: 1600 },
            { brand: 'Wilson', model: 'NXT', gauge: '16g', quantity: 6, price_cents: 1200 },
          ],
          dropoff_methods: [
            { method: 'meetup', enabled: true, details: 'Can meet at local tennis courts or coffee shops in Baltimore area' },
            { method: 'pickup', enabled: true, details: 'Free pickup within 10 miles, $5 fee for 10-20 miles' },
            { method: 'dropbox', enabled: true, details: 'Available at Baltimore Tennis Club, 123 Court St, 9am-8pm daily' }
          ],
          services: [
            { name: 'Standard Restring', price_cents: 2500 },
            { name: 'Premium String', price_cents: 3500 },
            { name: 'Hybrid Setup', price_cents: 4000 }
          ],
          availability: [
            { dow: 1, start: '17:00', end: '21:00' }, // Monday 5:00 PM - 9:00 PM
            { dow: 2, start: '17:00', end: '21:00' }, // Tuesday 5:00 PM - 9:00 PM
            { dow: 3, start: '17:00', end: '21:00' }, // Wednesday 5:00 PM - 9:00 PM
            { dow: 4, start: '17:00', end: '21:00' }, // Thursday 5:00 PM - 9:00 PM
            { dow: 6, start: '09:00', end: '17:00' }, // Saturday 9:00 AM - 5:00 PM
            { dow: 0, start: '09:00', end: '17:00' }, // Sunday 9:00 AM - 5:00 PM
          ]
        }
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'sarah@example.com',
        password: 'password123',
        profile: {
          full_name: 'Sarah Chen',
          bio: 'Tennis coach and certified stringer specializing in high-performance strings. Quick turnaround and competitive pricing.',
          city: 'Towson',
          lat: 39.4011,
          lng: -76.6012,
          phone: '+1 (555) 234-5678',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
          years_experience: 10,
          rackets_strung_count: 1800,
          certifications: ['USRSA Certified'],
          stringing_location: 'Home shop',
          player_levels_served: ['Beginner', 'Intermediate', 'Advanced', 'Tournament']
        },
        settings: {
          base_price_cents: 3000, // $30
          turnaround_hours: 12,
          accepts_rush: true,
          rush_fee_cents: 1000, // $10
          max_daily_jobs: 6,
          flexible_availability: false,
          pricing_notes: 'Same-day service available! String cost separate. Premium strings in stock.',
          discount_bulk_jobs: 15,
          machine_brand: 'Gamma',
          machine_model: 'X-6FC',
          machine_type: 'crank',
          max_tension: 75,
          supported_racket_types: ['Tennis', 'Squash'],
          accepts_player_strings: true,
          string_inventory: [
            { brand: 'Solinco', model: 'Tour Bite', gauge: '17g', quantity: 12, price_cents: 1400 },
            { brand: 'Tecnifibre', model: 'Black Code', gauge: '16g', quantity: 8, price_cents: 1500 },
          ],
          dropoff_methods: [
            { method: 'meetup', enabled: true, details: 'Happy to meet at local parks or tennis facilities' },
            { method: 'ship', enabled: true, details: 'USPS Priority Mail return shipping included in price' },
            { method: 'dropbox', enabled: true, details: '456 Elm Ave, secure lockbox available 24/7' }
          ],
          services: [
            { name: 'Express Restring', price_cents: 3000 },
            { name: 'Tournament Prep', price_cents: 4500 },
            { name: 'String Consultation', price_cents: 5000 }
          ],
          availability: [
            { dow: 1, start: '18:00', end: '20:00' }, // Monday
            { dow: 3, start: '18:00', end: '20:00' }, // Wednesday
            { dow: 5, start: '18:00', end: '20:00' }, // Friday
            { dow: 6, start: '10:00', end: '18:00' }, // Saturday
            { dow: 0, start: '10:00', end: '18:00' }, // Sunday
          ]
        }
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'david@example.com',
        password: 'password123',
        profile: {
          full_name: 'David Park',
          bio: 'Budget-friendly stringing service. Great for recreational players. Available weekends and evenings.',
          city: 'Columbia',
          lat: 39.2414,
          lng: -76.8610,
          phone: '+1 (555) 345-6789',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
          years_experience: 5,
          rackets_strung_count: 650,
          certifications: ['Self-taught'],
          stringing_location: 'Mobile service',
          player_levels_served: ['Beginner', 'Intermediate']
        },
        settings: {
          base_price_cents: 2000, // $20
          turnaround_hours: 48,
          accepts_rush: false,
          rush_fee_cents: 0,
          max_daily_jobs: 4,
          flexible_availability: true,
          pricing_notes: 'Best rates in town! Strings available at cost. Weekend appointments preferred.',
          discount_bulk_jobs: 5,
          machine_brand: 'Prince',
          machine_model: 'Neos 1000',
          machine_type: 'drop-weight',
          max_tension: 70,
          supported_racket_types: ['Tennis', 'Badminton'],
          accepts_player_strings: true,
          string_inventory: [
            { brand: 'Prince', model: 'Synthetic Gut', gauge: '16g', quantity: 15, price_cents: 800 },
            { brand: 'Gamma', model: 'TNT2', gauge: '17g', quantity: 10, price_cents: 900 },
          ],
          dropoff_methods: [
            { method: 'meetup', enabled: true, details: 'Flexible meeting locations throughout Columbia area' },
            { method: 'pickup', enabled: true, details: 'Free pickup anywhere in Columbia and surrounding areas' }
          ],
          services: [
            { name: 'Basic Restring', price_cents: 2000 },
            { name: 'Synthetic Gut', price_cents: 2200 },
            { name: 'Multifilament', price_cents: 2800 }
          ],
          availability: []
        }
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'lisa@example.com',
        password: 'password123',
        profile: {
          full_name: 'Lisa Martinez',
          bio: 'Mobile stringing service - I come to you! Specialized in junior and beginner setups.',
          city: 'Rockville',
          lat: 39.0840,
          lng: -77.1528,
          phone: '+1 (555) 456-7890',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
          years_experience: 7,
          rackets_strung_count: 950,
          certifications: ['USRSA Certified'],
          stringing_location: 'Mobile service',
          player_levels_served: ['Beginner', 'Intermediate', 'Junior']
        },
        settings: {
          base_price_cents: 2800, // $28
          turnaround_hours: 6,
          accepts_rush: true,
          rush_fee_cents: 500, // $5
          max_daily_jobs: 10,
          flexible_availability: true,
          pricing_notes: 'Mobile service - I come to you! Free travel within 15 miles. Juniors get 10% off.',
          discount_bulk_jobs: 12,
          machine_brand: 'Gamma',
          machine_model: 'Progression II',
          machine_type: 'crank',
          max_tension: 72,
          supported_racket_types: ['Tennis'],
          accepts_player_strings: true,
          string_inventory: [
            { brand: 'Babolat', model: 'Xcel', gauge: '16g', quantity: 20, price_cents: 1400 },
            { brand: 'Gamma', model: 'Zo', gauge: '17g', quantity: 12, price_cents: 1000 },
            { brand: 'Wilson', model: 'NXT', gauge: '16g', quantity: 10, price_cents: 1200 },
          ],
          dropoff_methods: [
            { method: 'pickup', enabled: true, details: 'Mobile service - I come to you! Available within 15 mile radius of Rockville' },
            { method: 'meetup', enabled: true, details: 'Can meet at local tennis courts or parks' }
          ],
          services: [
            { name: 'Mobile Service', price_cents: 2800 },
            { name: 'Junior Setup', price_cents: 2300 },
            { name: 'Beginner Special', price_cents: 2000 }
          ],
          availability: [
            { dow: 1, start: '14:00', end: '20:00' },
            { dow: 2, start: '14:00', end: '20:00' },
            { dow: 3, start: '14:00', end: '20:00' },
            { dow: 4, start: '14:00', end: '20:00' },
            { dow: 5, start: '14:00', end: '20:00' },
          ]
        }
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        email: 'alex@example.com',
        password: 'password123',
        profile: {
          full_name: 'Alex Kim',
          bio: 'Former touring pro with expertise in polyester and natural gut strings. Available for consultations.',
          city: 'Annapolis',
          lat: 38.9784,
          lng: -76.4922,
          phone: '+1 (555) 567-8901',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
          years_experience: 20,
          rackets_strung_count: 4200,
          certifications: ['USRSA Master', 'MRT - Master Racquet Technician'],
          stringing_location: 'Professional studio',
          player_levels_served: ['Advanced', 'Tournament', 'Professional']
        },
        settings: {
          base_price_cents: 3500, // $35
          turnaround_hours: 18,
          accepts_rush: true,
          rush_fee_cents: 1200, // $12
          max_daily_jobs: 5,
          flexible_availability: false,
          pricing_notes: 'Premium service for serious players. Natural gut specialist. String consultation included.',
          discount_bulk_jobs: 8,
          machine_brand: 'Babolat',
          machine_model: 'Star 7',
          machine_type: 'electronic',
          max_tension: 85,
          supported_racket_types: ['Tennis', 'Squash'],
          accepts_player_strings: false,
          string_inventory: [
            { brand: 'Babolat', model: 'Natural Gut', gauge: '16g', quantity: 4, price_cents: 4500 },
            { brand: 'Luxilon', model: 'ALU Power', gauge: '16L', quantity: 8, price_cents: 2200 },
            { brand: 'Solinco', model: 'Tour Bite', gauge: '17g', quantity: 6, price_cents: 1700 },
          ],
          dropoff_methods: [
            { method: 'dropbox', enabled: true, details: 'Professional studio - address shared after booking' },
            { method: 'meetup', enabled: true, details: 'Available at select tournaments and clubs' }
          ],
          services: [
            { name: 'Pro Restring', price_cents: 3500 },
            { name: 'Natural Gut Setup', price_cents: 5500 },
            { name: 'Custom Tension', price_cents: 4000 }
          ],
          availability: [
            { dow: 2, start: '16:00', end: '21:00' }, // Tuesday 4:00 PM - 9:00 PM
            { dow: 4, start: '16:00', end: '21:00' }, // Thursday 4:00 PM - 9:00 PM
            { dow: 6, start: '08:00', end: '18:00' }, // Saturday 8:00 AM - 6:00 PM
            { dow: 0, start: '10:00', end: '16:00' }, // Sunday 10:00 AM - 4:00 PM
          ]
        }
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        email: 'mike@example.com',
        password: 'password123',
        profile: {
          full_name: 'Mike Johnson',
          bio: 'Tennis shop owner with 20+ years experience. Full service including grip replacement and racquet maintenance.',
          city: 'Silver Spring',
          lat: 38.9906,
          lng: -77.0261,
          phone: '+1 (555) 678-9012',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
          years_experience: 20,
          rackets_strung_count: 5800,
          certifications: ['USRSA Certified', 'ERSA Certified'],
          stringing_location: 'Tennis shop',
          player_levels_served: ['Beginner', 'Intermediate', 'Advanced']
        },
        settings: {
          base_price_cents: 2700, // $27
          turnaround_hours: 36,
          accepts_rush: true,
          rush_fee_cents: 700, // $7
          max_daily_jobs: 12,
          flexible_availability: false,
          pricing_notes: 'Full pro shop services. Volume discounts available. String and labor package deals.',
          discount_bulk_jobs: 20,
          machine_brand: 'Wise',
          machine_model: '2086',
          machine_type: 'electronic',
          max_tension: 78,
          supported_racket_types: ['Tennis', 'Badminton', 'Squash', 'Racquetball'],
          accepts_player_strings: true,
          string_inventory: [
            { brand: 'Babolat', model: 'RPM Blast', gauge: '17g', quantity: 25, price_cents: 1800 },
            { brand: 'Wilson', model: 'NXT', gauge: '16g', quantity: 20, price_cents: 1200 },
            { brand: 'Luxilon', model: 'ALU Power', gauge: '16L', quantity: 15, price_cents: 2200 },
            { brand: 'Head', model: 'Velocity MLT', gauge: '17g', quantity: 12, price_cents: 1300 },
          ],
          dropoff_methods: [
            { method: 'dropbox', enabled: true, details: '123 Tennis Court Lane, Silver Spring MD - Open 9am-7pm weekdays' },
            { method: 'pickup', enabled: true, details: 'Free pickup within 10 miles' }
          ],
          services: [
            { name: 'Shop Service', price_cents: 2700 },
            { name: 'Grip + String', price_cents: 3200 },
            { name: 'Full Service', price_cents: 4500 }
          ],
          availability: [
            { dow: 1, start: '09:00', end: '19:00' }, // Monday 9:00 AM - 7:00 PM
            { dow: 2, start: '09:00', end: '19:00' }, // Tuesday 9:00 AM - 7:00 PM
            { dow: 3, start: '09:00', end: '19:00' }, // Wednesday 9:00 AM - 7:00 PM
            { dow: 4, start: '09:00', end: '19:00' }, // Thursday 9:00 AM - 7:00 PM
            { dow: 5, start: '09:00', end: '19:00' }, // Friday 9:00 AM - 7:00 PM
            { dow: 6, start: '09:00', end: '17:00' }, // Saturday 9:00 AM - 5:00 PM
          ]
        }
      }
    ]

    // Create sample players
    const players = [
      {
        id: '77777777-7777-7777-7777-777777777777',
        email: 'player1@example.com',
        password: 'password123',
        profile: {
          full_name: 'Jennifer Smith',
          city: 'Baltimore',
          lat: 39.2904,
          lng: -76.6122,
          phone: '+1 (555) 111-2222',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer'
        }
      },
      {
        id: '88888888-8888-8888-8888-888888888888',
        email: 'player2@example.com',
        password: 'password123',
        profile: {
          full_name: 'Robert Williams',
          city: 'Towson',
          lat: 39.4011,
          lng: -76.6012,
          phone: '+1 (555) 222-3333',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert'
        }
      }
    ]

    // Create users and profiles
    console.log('Creating users and profiles...')
    
    for (const stringer of stringers) {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: stringer.email,
        password: stringer.password,
        email_confirm: true,
        user_metadata: { role: 'stringer' }
      })

      if (authError) {
        console.error('Error creating stringer auth user:', authError)
        continue
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          ...stringer.profile
        })

      if (profileError) {
        console.error('Error creating stringer profile:', profileError)
        continue
      }

      // Create stringer settings WITHOUT Stripe account
      // Stringers must complete real Stripe Connect onboarding to test payments
      // This ensures the payment flow works correctly in development
      const { error: settingsError } = await supabase
        .from('stringer_settings')
        .insert({
          id: authData.user.id,
          ...stringer.settings,
          onboarding_completed_at: new Date().toISOString(),
          // Stripe fields left null - stringers must complete real onboarding
          stripe_account_id: null,
          stripe_onboarding_completed: false,
          stripe_charges_enabled: false,
          stripe_payouts_enabled: false,
          accepting_requests: true
        })

      if (settingsError) {
        console.error('Error creating stringer settings:', settingsError)
        continue
      }

      console.log(`✅ Created stringer: ${stringer.profile.full_name}`)
    }

    for (const player of players) {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: player.email,
        password: player.password,
        email_confirm: true,
        user_metadata: { role: 'player' }
      })

      if (authError) {
        console.error('Error creating player auth user:', authError)
        continue
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          ...player.profile
        })

      if (profileError) {
        console.error('Error creating player profile:', profileError)
        continue
      }

      console.log(`✅ Created player: ${player.profile.full_name}`)
    }

    // Get created users for creating requests
    // Get stringers (users with stringer_settings)
    const { data: stringerSettings, error: stringerError } = await supabase
      .from('stringer_settings')
      .select('id')

    if (stringerError) {
      console.error('Error fetching stringers:', stringerError)
      return
    }

    const stringerIds = stringerSettings.map(s => s.id)

    // Get all profiles
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return
    }

    const stringerProfiles = allProfiles.filter(p => stringerIds.includes(p.id))
    const playerProfiles = allProfiles.filter(p => !stringerIds.includes(p.id))

    // Create sample requests
    console.log('Creating sample requests...')

    const sampleRequests = [
      {
        player_id: playerProfiles[0]?.id,
        stringer_id: stringerProfiles[0]?.id,
        status: 'completed',
        racket_photo_url: 'https://images.unsplash.com/photo-1617883861744-87e9592e8e2d?w=800&h=600&fit=crop',
        service_type: 'restring_only',
        string_selection: {
          brand: 'Babolat',
          model: 'RPM Blast',
          gauge: '17g',
          price_cents: 1800
        },
        tension_mains_lbs: 55,
        tension_crosses_lbs: 55,
        string_pattern: 'two_piece',
        dropoff_method: {
          method: 'Meet at location',
          details: '123 University Ave, Palo Alto, CA'
        },
        special_instructions: 'Please use fresh strings, playing tournament next week',
        estimated_price_cents: 4300,
        final_price_cents: 4300,
        tip_cents: 500, // $5 tip
        completion_photo_url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&h=600&fit=crop',
        completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      {
        player_id: playerProfiles[1]?.id,
        stringer_id: stringerProfiles[1]?.id,
        status: 'completed',
        racket_photo_url: 'https://images.unsplash.com/photo-1617883861509-c1625f2c0b5f?w=800&h=600&fit=crop',
        service_type: 'restring_grip',
        string_selection: {
          brand: 'Luxilon',
          model: 'ALU Power',
          gauge: '16L',
          price_cents: 2200
        },
        tension_mains_lbs: 58,
        tension_crosses_lbs: 56,
        string_pattern: 'two_piece',
        dropoff_method: {
          method: 'Drop off at location',
          details: '456 Main St, San Mateo, CA'
        },
        special_instructions: 'Hybrid with natural gut cross if available',
        estimated_price_cents: 5400,
        final_price_cents: 5400,
        tip_cents: 750, // $7.50 tip
        completion_photo_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop',
        completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      {
        player_id: playerProfiles[0]?.id,
        stringer_id: stringerProfiles[2]?.id,
        status: 'completed',
        racket_photo_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&h=600&fit=crop',
        service_type: 'restring_only',
        string_selection: {
          brand: 'Tecnifibre',
          model: 'ATP Razor Code',
          gauge: '17g',
          price_cents: 1500
        },
        tension_mains_lbs: 52,
        tension_crosses_lbs: 52,
        string_pattern: 'existing',
        dropoff_method: {
          method: 'Meet at location',
          details: 'Stanford Tennis Courts'
        },
        estimated_price_cents: 3500,
        final_price_cents: 3500,
        tip_cents: 1000, // $10 tip
        completion_photo_url: 'https://images.unsplash.com/photo-1617883861653-c8c0de9aa87d?w=800&h=600&fit=crop',
        completed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
      },
      {
        player_id: playerProfiles[1]?.id,
        stringer_id: stringerProfiles[0]?.id,
        status: 'completed',
        racket_photo_url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&h=600&fit=crop',
        service_type: 'restring_grip',
        string_selection: {
          brand: 'Solinco',
          model: 'Hyper-G',
          gauge: '17g',
          price_cents: 1600
        },
        tension_mains_lbs: 56,
        tension_crosses_lbs: 54,
        string_pattern: 'two_piece',
        dropoff_method: {
          method: 'Meet at location',
          details: 'Central Park, San Mateo'
        },
        special_instructions: 'Need it for weekend match, can pay rush fee',
        estimated_price_cents: 4600,
        final_price_cents: 4600,
        tip_cents: 0,
        completion_photo_url: 'https://images.unsplash.com/photo-1617883861509-c1625f2c0b5f?w=800&h=600&fit=crop',
        completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      {
        player_id: playerProfiles[0]?.id,
        stringer_id: stringerProfiles[3]?.id,
        status: 'pending',
        racket_photo_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop',
        service_type: 'full_service',
        string_selection: {
          brand: 'Babolat',
          model: 'Xcel',
          gauge: '16g',
          price_cents: 1400
        },
        tension_mains_lbs: 54,
        tension_crosses_lbs: 54,
        string_pattern: 'ask_stringer',
        dropoff_method: {
          method: 'Drop off at location',
          details: '789 Forest Ave, Palo Alto, CA'
        },
        special_instructions: 'Looking for quick turnaround',
        estimated_price_cents: 4200
      },
      {
        player_id: playerProfiles[0]?.id,
        stringer_id: stringerProfiles[1]?.id,
        status: 'pending',
        racket_photo_url: 'https://images.unsplash.com/photo-1617883861653-c8c0de9aa87d?w=800&h=600&fit=crop',
        service_type: 'restring_only',
        string_selection: {
          brand: 'Tecnifibre',
          model: 'Razor Code',
          gauge: '17g',
          price_cents: 1500
        },
        tension_mains_lbs: 53,
        tension_crosses_lbs: 51,
        string_pattern: 'two_piece',
        dropoff_method: {
          method: 'Meet at location',
          details: 'Tennis Courts, Downtown'
        },
        estimated_price_cents: 3500
      },
      {
        player_id: playerProfiles[1]?.id,
        stringer_id: stringerProfiles[2]?.id,
        status: 'pending',
        racket_photo_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop',
        service_type: 'restring_grip',
        string_selection: {
          brand: 'Wilson',
          model: 'NXT',
          gauge: '16g',
          price_cents: 1200
        },
        tension_mains_lbs: 55,
        tension_crosses_lbs: 55,
        string_pattern: 'existing',
        dropoff_method: {
          method: 'Drop off at location',
          details: 'My home address'
        },
        special_instructions: 'Please use overgrip',
        estimated_price_cents: 3800
      },
      {
        player_id: playerProfiles[0]?.id,
        stringer_id: stringerProfiles[4]?.id,
        status: 'pending',
        racket_photo_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&h=600&fit=crop',
        service_type: 'restring_only',
        string_selection: {
          brand: 'Luxilon',
          model: '4G',
          gauge: '17g',
          price_cents: 1900
        },
        tension_mains_lbs: 52,
        tension_crosses_lbs: 50,
        string_pattern: 'two_piece',
        dropoff_method: {
          method: 'Meet at location',
          details: 'Club Tennis Center'
        },
        estimated_price_cents: 4400,
        accepted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        work_started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        estimated_completion: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() // Tomorrow
      },
      // Pending request for Marco - so he can test accepting it
      {
        player_id: playerProfiles[1]?.id,
        stringer_id: stringerProfiles[0]?.id, // Marco
        status: 'pending',
        racket_photo_url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&h=600&fit=crop',
        service_type: 'restring_only',
        string_selection: {
          brand: 'Babolat',
          model: 'RPM Blast',
          gauge: '17g',
          price_cents: 1800
        },
        tension_mains_lbs: 56,
        tension_crosses_lbs: 56,
        string_pattern: 'two_piece',
        dropoff_method: {
          method: 'Drop off at location',
          details: 'My shop, 123 Tennis Lane'
        },
        estimated_price_cents: 4300
      },
      // Another pending request for Marco
      {
        player_id: playerProfiles[0]?.id,
        stringer_id: stringerProfiles[0]?.id, // Marco
        status: 'pending',
        racket_photo_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&h=600&fit=crop',
        service_type: 'restring_grip',
        string_selection: {
          brand: 'Luxilon',
          model: '4G',
          gauge: '16g',
          price_cents: 2000
        },
        tension_mains_lbs: 54,
        tension_crosses_lbs: 52,
        string_pattern: 'two_piece',
        dropoff_method: {
          method: 'Meet at location',
          details: 'Community Tennis Courts'
        },
        special_instructions: 'Need it done within 48 hours if possible',
        estimated_price_cents: 4500
      },
      // Completed request
      {
        player_id: playerProfiles[0]?.id,
        stringer_id: stringerProfiles[1]?.id,
        status: 'completed',
        racket_photo_url: 'https://images.unsplash.com/photo-1617883861509-c1625f2c0b5f?w=800&h=600&fit=crop',
        service_type: 'restring_grip',
        string_selection: {
          brand: 'Solinco',
          model: 'Hyper-G',
          gauge: '17g',
          price_cents: 1600
        },
        tension_mains_lbs: 58,
        tension_crosses_lbs: 56,
        string_pattern: 'two_piece',
        dropoff_method: {
          method: 'Meet at location',
          details: 'Stanford Tennis Courts'
        },
        estimated_price_cents: 4100,
        final_price_cents: 4100,
        tip_cents: 500,
        completion_photo_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop',
        completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      // One more pending request for Marco Rodriguez
      {
        player_id: playerProfiles[1]?.id,
        stringer_id: stringerProfiles[0]?.id, // Marco Rodriguez
        status: 'pending',
        racket_photo_url: 'https://images.unsplash.com/photo-1617883861509-c1625f2c0b5f?w=800&h=600&fit=crop',
        service_type: 'restring_grip',
        string_selection: {
          brand: 'Wilson',
          model: 'Champions Choice',
          gauge: '16g',
          price_cents: 2500
        },
        tension_mains_lbs: 50,
        tension_crosses_lbs: 48,
        string_pattern: 'existing',
        dropoff_method: {
          method: 'Drop off at location',
          details: 'My office - 555 Bryant St'
        },
        estimated_price_cents: 5500
      }
    ]

    for (const request of sampleRequests) {
      const { error: requestError } = await supabase
        .from('requests')
        .insert(request)

      if (requestError) {
        console.error('Error creating request:', requestError)
        continue
      }
    }

    console.log('✅ Created sample requests')

    // Create sample reviews for completed requests
    console.log('Creating sample reviews...')

    const { data: completedRequests, error: completedError } = await supabase
      .from('requests')
      .select('*')
      .eq('status', 'completed')

    if (completedError) {
      console.error('Error fetching completed requests:', completedError)
    } else {
      const stringerReviews = [
        { rating: 5, comment: 'Excellent work! Perfect tension and quick turnaround. My racket feels amazing!' },
        { rating: 5, comment: 'Very professional and knowledgeable. The strings are perfect. Will definitely use again!' },
        { rating: 4, comment: 'Good job overall. Racket plays well, just took a bit longer than expected.' },
        { rating: 5, comment: 'Outstanding service! Best stringing job I\'ve had. Highly recommended!' },
      ]

      const playerReviews = [
        { rating: 5, comment: 'Great player to work with! Clear communication and easy pickup/dropoff.' },
        { rating: 5, comment: 'Very respectful and appreciative. Would love to string for them again!' },
        { rating: 4, comment: 'Good communication. Pickup was smooth.' },
        { rating: 5, comment: 'Excellent customer! On time and friendly.' },
      ]

      for (let i = 0; i < completedRequests.length; i++) {
        const request = completedRequests[i]

        // Player reviews stringer
        const stringerReview = stringerReviews[i % stringerReviews.length]
        const { error: stringerReviewError } = await supabase
          .from('reviews')
          .insert({
            request_id: request.id,
            reviewee_id: request.stringer_id,
            reviewer_id: request.player_id,
            review_type: 'stringer_review',
            rating: stringerReview.rating,
            comment: stringerReview.comment
          })

        if (stringerReviewError) {
          console.error('Error creating stringer review:', stringerReviewError)
        }

        // Stringer reviews player
        const playerReview = playerReviews[i % playerReviews.length]
        const { error: playerReviewError } = await supabase
          .from('reviews')
          .insert({
            request_id: request.id,
            reviewee_id: request.player_id,
            reviewer_id: request.stringer_id,
            review_type: 'player_review',
            rating: playerReview.rating,
            comment: playerReview.comment
          })

        if (playerReviewError) {
          console.error('Error creating player review:', playerReviewError)
        }
      }
      console.log('✅ Created sample reviews')
    }

    // Create sample messages
    console.log('Creating sample messages...')
    
    const { data: activeRequests, error: activeError } = await supabase
      .from('requests')
      .select('*')
      .in('status', ['accepted', 'in_progress', 'ready'])

    if (activeError) {
      console.error('Error fetching active requests:', activeError)
    } else {
      for (const request of activeRequests) {
        const messages = [
          {
            request_id: request.id,
            sender_id: request.player_id,
            body: 'Hi! When would be a good time to drop off my racquet?'
          },
          {
            request_id: request.id,
            sender_id: request.stringer_id,
            body: 'Hey! I can meet tomorrow at 2pm at the tennis courts. Does that work for you?'
          },
          {
            request_id: request.id,
            sender_id: request.player_id,
            body: 'Perfect! See you then.'
          }
        ]

        for (const message of messages) {
          const { error: messageError } = await supabase
            .from('messages')
            .insert(message)

          if (messageError) {
            console.error('Error creating message:', messageError)
          }
        }
      }
      console.log('✅ Created sample messages')
    }

    // Create sample direct conversations (not tied to requests)
    console.log('Creating sample conversations...')

    // Get some profiles for conversations
    const { data: conversationProfiles, error: convProfilesError } = await supabase
      .from('profiles')
      .select('id')

    if (!convProfilesError && conversationProfiles && conversationProfiles.length >= 2) {
      // Create a few conversations between stringers and players
      const conversationsToCreate = [
        {
          participant_one: stringerIds[0], // Marco
          participant_two: conversationProfiles.find(p => !stringerIds.includes(p.id))?.id, // A player
          messages: [
            { sender: 'player', body: 'Hi Marco! I saw your profile and was wondering about your natural gut strings?' },
            { sender: 'stringer', body: 'Hey! Thanks for reaching out. I have natural gut available - it\'s $15 extra on top of the labor. Perfect for control and feel!' },
            { sender: 'player', body: 'That sounds great! What\'s your availability this week?' }
          ]
        },
        {
          participant_one: stringerIds[1], // Sarah
          participant_two: conversationProfiles.find(p => !stringerIds.includes(p.id))?.id, // A player
          messages: [
            { sender: 'player', body: 'Do you offer same-day service?' },
            { sender: 'stringer', body: 'Yes! For an extra $10 I can have it done within 12 hours if you drop it off before noon.' },
            { sender: 'player', body: 'Perfect! I\'ll come by tomorrow morning.' }
          ]
        }
      ]

      for (const conv of conversationsToCreate) {
        if (!conv.participant_two) continue

        // Use the helper function to create conversation
        const { data: conversationId, error: convError } = await supabase
          .rpc('get_or_create_conversation', {
            user_one_id: conv.participant_one,
            user_two_id: conv.participant_two
          })

        if (!convError && conversationId) {
          // Add messages to the conversation
          for (const msg of conv.messages) {
            const senderId = msg.sender === 'stringer' ? conv.participant_one : conv.participant_two

            await supabase
              .from('messages')
              .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                body: msg.body
              })
          }
        }
      }
      console.log('✅ Created sample conversations')
    }

    console.log('🎉 Seed data created successfully!')
    console.log('\nTest accounts:')
    console.log('Stringers:')
    stringers.forEach(s => console.log(`  ${s.profile.full_name}: ${s.email} / password123`))
    console.log('Players:')
    players.forEach(p => console.log(`  ${p.profile.full_name}: ${p.email} / password123`))

  } catch (error) {
    console.error('❌ Error seeding data:', error)
  }
}

// Run the seed
seedData()
