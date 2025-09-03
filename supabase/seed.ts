import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

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
          role: 'stringer' as const,
          full_name: 'Marco Rodriguez',
          bio: '10+ years stringing experience. Former college player, specializes in poly and natural gut hybrids.',
          city: 'Palo Alto',
          lat: 37.4419,
          lng: -122.1430,
          phone: '+1 (555) 123-4567'
        },
        settings: {
          base_price_cents: 2500, // $25
          turnaround_hours: 24,
          accepts_rush: true,
          rush_fee_cents: 1000, // $10
          max_daily_jobs: 6,
          services: [
            { name: 'Restring', price_cents: 2500 },
            { name: 'Restring + Grip', price_cents: 3500 },
            { name: 'Grip Only', price_cents: 1500 }
          ],
          availability: [
            { dow: 1, start: '09:00', end: '18:00' }, // Monday
            { dow: 2, start: '09:00', end: '18:00' }, // Tuesday
            { dow: 3, start: '09:00', end: '18:00' }, // Wednesday
            { dow: 4, start: '09:00', end: '18:00' }, // Thursday
            { dow: 5, start: '09:00', end: '20:00' }, // Friday
            { dow: 6, start: '08:00', end: '16:00' }, // Saturday
          ]
        }
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'sarah@example.com',
        password: 'password123',
        profile: {
          role: 'stringer' as const,
          full_name: 'Sarah Chen',
          bio: 'Professional racquet technician. Quick turnaround, attention to detail. Available weekends!',
          city: 'San Francisco',
          lat: 37.7749,
          lng: -122.4194,
          phone: '+1 (555) 234-5678'
        },
        settings: {
          base_price_cents: 3000, // $30
          turnaround_hours: 12,
          accepts_rush: true,
          rush_fee_cents: 1500, // $15
          max_daily_jobs: 4,
          services: [
            { name: 'Premium Restring', price_cents: 3000 },
            { name: 'Premium + Grip', price_cents: 4200 },
            { name: 'String Analysis', price_cents: 500 }
          ],
          availability: [
            { dow: 0, start: '10:00', end: '16:00' }, // Sunday
            { dow: 3, start: '17:00', end: '21:00' }, // Wednesday evening
            { dow: 5, start: '17:00', end: '21:00' }, // Friday evening
            { dow: 6, start: '08:00', end: '18:00' }, // Saturday
          ]
        }
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'david@example.com',
        password: 'password123',
        profile: {
          role: 'stringer' as const,
          full_name: 'David Park',
          bio: 'Budget-friendly option. Good for recreational players. Same-day service available.',
          city: 'Mountain View',
          lat: 37.3861,
          lng: -122.0839,
          phone: '+1 (555) 345-6789'
        },
        settings: {
          base_price_cents: 2000, // $20
          turnaround_hours: 48,
          accepts_rush: false,
          rush_fee_cents: 0,
          max_daily_jobs: 8,
          services: [
            { name: 'Basic Restring', price_cents: 2000 },
            { name: 'Restring + Basic Grip', price_cents: 2800 }
          ],
          availability: [
            { dow: 1, start: '18:00', end: '22:00' }, // Monday evening
            { dow: 2, start: '18:00', end: '22:00' }, // Tuesday evening  
            { dow: 4, start: '18:00', end: '22:00' }, // Thursday evening
            { dow: 6, start: '09:00', end: '17:00' }, // Saturday
            { dow: 0, start: '12:00', end: '18:00' }, // Sunday afternoon
          ]
        }
      }
    ]

    // Create sample players
    const players = [
      {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'alex@example.com',
        password: 'password123',
        profile: {
          role: 'player' as const,
          full_name: 'Alex Johnson',
          city: 'Palo Alto',
          lat: 37.4419,
          lng: -122.1430,
          phone: '+1 (555) 456-7890'
        }
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        email: 'emma@example.com',
        password: 'password123',
        profile: {
          role: 'player' as const,
          full_name: 'Emma Wilson',
          city: 'San Mateo',
          lat: 37.5630,
          lng: -122.3255,
          phone: '+1 (555) 567-8901'
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

      // Create stringer settings
      const { error: settingsError } = await supabase
        .from('stringer_settings')
        .insert({
          id: authData.user.id,
          ...stringer.settings
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
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return
    }

    const stringerProfiles = allProfiles.filter(p => p.role === 'stringer')
    const playerProfiles = allProfiles.filter(p => p.role === 'player')

    // Create sample requests
    console.log('Creating sample requests...')
    
    const sampleRequests = [
      {
        player_id: playerProfiles[0]?.id,
        stringer_id: stringerProfiles[0]?.id,
        status: 'completed',
        racquet_brand: 'Babolat',
        racquet_model: 'Pure Aero',
        string_pref: 'RPM Blast 17',
        tension_lbs: 55,
        notes: 'Please use fresh strings, playing tournament next week',
        dropoff_method: 'meetup',
        address: '123 University Ave, Palo Alto, CA',
        lat: 37.4455,
        lng: -122.1596,
        quoted_price_cents: 2500,
        payment_status: 'paid'
      },
      {
        player_id: playerProfiles[1]?.id,
        stringer_id: stringerProfiles[1]?.id,
        status: 'in_progress',
        racquet_brand: 'Wilson',
        racquet_model: 'Blade 98',
        string_pref: 'Luxilon ALU Power 16L',
        tension_lbs: 58,
        notes: 'Hybrid with natural gut cross if available',
        dropoff_method: 'pickup',
        address: '456 Main St, San Mateo, CA',
        lat: 37.5630,
        lng: -122.3255,
        quoted_price_cents: 4500,
        payment_status: 'unpaid'
      },
      {
        player_id: playerProfiles[0]?.id,
        stringer_id: stringerProfiles[2]?.id,
        status: 'ready',
        racquet_brand: 'Head',
        racquet_model: 'Speed MP',
        string_pref: 'Tecnifibre ATP Razor Code 17',
        tension_lbs: 52,
        dropoff_method: 'meetup',
        address: 'Stanford Tennis Courts',
        lat: 37.4275,
        lng: -122.1697,
        quoted_price_cents: 2000,
        payment_status: 'paid'
      },
      {
        player_id: playerProfiles[1]?.id,
        stringer_id: stringerProfiles[0]?.id,
        status: 'requested',
        racquet_brand: 'Yonex',
        racquet_model: 'EZONE 98',
        string_pref: 'Solinco Hyper-G 17',
        tension_lbs: 56,
        notes: 'Need it for weekend match, can pay rush fee',
        dropoff_method: 'meetup',
        address: 'Central Park, San Mateo',
        lat: 37.5444,
        lng: -122.3136,
        quoted_price_cents: 3500,
        payment_status: 'unpaid'
      },
      {
        player_id: playerProfiles[0]?.id,
        status: 'requested',
        racquet_brand: 'Prince',
        racquet_model: 'Textreme Tour 100P',
        string_pref: 'Babolat Xcel 16',
        tension_lbs: 54,
        notes: 'Looking for quick turnaround',
        dropoff_method: 'pickup',
        address: '789 Forest Ave, Palo Alto, CA',
        lat: 37.4520,
        lng: -122.1430,
        quoted_price_cents: 0, // Will be set when stringer accepts
        payment_status: 'unpaid'
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
      for (const request of completedRequests) {
        const { error: reviewError } = await supabase
          .from('reviews')
          .insert({
            request_id: request.id,
            player_id: request.player_id,
            stringer_id: request.stringer_id,
            rating: 5,
            comment: 'Great work! Quick turnaround and perfect tension. Highly recommend!'
          })

        if (reviewError) {
          console.error('Error creating review:', reviewError)
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
