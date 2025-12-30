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
          full_name: 'Marco Rodriguez',
          bio: '10+ years stringing experience. Former college player, specializes in poly and natural gut hybrids.',
          city: 'Baltimore',
          lat: 39.2904,
          lng: -76.6122,
          phone: '+1 (555) 123-4567',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco'
        },
        settings: {
          base_price_cents: 2500, // $25
          turnaround_hours: 24,
          accepts_rush: true,
          rush_fee_cents: 1000, // $10
          max_daily_jobs: 6,
          flexible_availability: false,
          string_inventory: [
            { brand: 'Babolat', model: 'RPM Blast', gauge: '17g', quantity: 10, price_cents: 1800 },
            { brand: 'Solinco', model: 'Hyper-G', gauge: '17g', quantity: 8, price_cents: 1600 },
            { brand: 'Luxilon', model: 'ALU Power', gauge: '16L', quantity: 6, price_cents: 2200 },
          ],
          dropoff_methods: [
            { method: 'Meet at location', details: 'I can meet you at local tennis courts' },
            { method: 'Drop off at location', details: 'Drop off at my home - address provided after booking' }
          ],
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
          full_name: 'Sarah Chen',
          bio: 'Professional racquet technician. Quick turnaround, attention to detail. Available weekends!',
          city: 'Towson',
          lat: 39.4011,
          lng: -76.6012,
          phone: '+1 (555) 234-5678',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
        },
        settings: {
          base_price_cents: 3000, // $30
          turnaround_hours: 12,
          accepts_rush: true,
          rush_fee_cents: 1500, // $15
          max_daily_jobs: 4,
          flexible_availability: false,
          string_inventory: [
            { brand: 'Luxilon', model: 'ALU Power', gauge: '16L', quantity: 12, price_cents: 2200 },
            { brand: 'Tecnifibre', model: 'ATP Razor Code', gauge: '17g', quantity: 8, price_cents: 1500 },
            { brand: 'Wilson', model: 'NXT', gauge: '16g', quantity: 6, price_cents: 1200 },
          ],
          dropoff_methods: [
            { method: 'Meet at location', details: 'Available weekends at local parks' },
            { method: 'Drop off at location', details: 'Home address provided after confirmation' }
          ],
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
          full_name: 'David Park',
          bio: 'Budget-friendly option. Good for recreational players. Same-day service available.',
          city: 'Columbia',
          lat: 39.2414,
          lng: -76.8610,
          phone: '+1 (555) 345-6789',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'
        },
        settings: {
          base_price_cents: 2000, // $20
          turnaround_hours: 48,
          accepts_rush: false,
          rush_fee_cents: 0,
          max_daily_jobs: 8,
          flexible_availability: false,
          string_inventory: [
            { brand: 'Tecnifibre', model: 'ATP Razor Code', gauge: '17g', quantity: 15, price_cents: 1500 },
            { brand: 'Wilson', model: 'NXT', gauge: '16g', quantity: 10, price_cents: 1200 },
            { brand: 'Gamma', model: 'Zo', gauge: '17g', quantity: 8, price_cents: 1000 },
          ],
          dropoff_methods: [
            { method: 'Drop off at location', details: 'Evening drop-off available - address on confirmation' },
            { method: 'Mail service', details: 'Pre-paid shipping label provided' }
          ],
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
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa'
        },
        settings: {
          base_price_cents: 2800, // $28
          turnaround_hours: 6,
          accepts_rush: true,
          rush_fee_cents: 500, // $5
          max_daily_jobs: 10,
          flexible_availability: true,
          string_inventory: [
            { brand: 'Babolat', model: 'Xcel', gauge: '16g', quantity: 20, price_cents: 1400 },
            { brand: 'Gamma', model: 'Zo', gauge: '17g', quantity: 12, price_cents: 1000 },
            { brand: 'Wilson', model: 'NXT', gauge: '16g', quantity: 10, price_cents: 1200 },
          ],
          dropoff_methods: [
            { method: 'Mobile service - I come to you', details: 'Available within 15 mile radius of Rockville' },
            { method: 'Meet at location', details: 'Can meet at local tennis courts or parks' }
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
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
        },
        settings: {
          base_price_cents: 3500, // $35
          turnaround_hours: 18,
          accepts_rush: true,
          rush_fee_cents: 1200, // $12
          max_daily_jobs: 5,
          flexible_availability: false,
          string_inventory: [
            { brand: 'Babolat', model: 'Natural Gut', gauge: '16g', quantity: 4, price_cents: 4500 },
            { brand: 'Luxilon', model: 'ALU Power', gauge: '16L', quantity: 8, price_cents: 2200 },
            { brand: 'Solinco', model: 'Tour Bite', gauge: '17g', quantity: 6, price_cents: 1700 },
          ],
          dropoff_methods: [
            { method: 'Drop off at location', details: 'Professional studio - address shared after booking' },
            { method: 'Meet at location', details: 'Available at select tournaments and clubs' }
          ],
          services: [
            { name: 'Pro Restring', price_cents: 3500 },
            { name: 'Natural Gut Setup', price_cents: 5500 },
            { name: 'Custom Tension', price_cents: 4000 }
          ],
          availability: [
            { dow: 2, start: '16:00', end: '21:00' },
            { dow: 4, start: '16:00', end: '21:00' },
            { dow: 6, start: '08:00', end: '18:00' },
            { dow: 0, start: '10:00', end: '16:00' },
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
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'
        },
        settings: {
          base_price_cents: 2700, // $27
          turnaround_hours: 36,
          accepts_rush: true,
          rush_fee_cents: 700, // $7
          max_daily_jobs: 12,
          flexible_availability: false,
          string_inventory: [
            { brand: 'Babolat', model: 'RPM Blast', gauge: '17g', quantity: 25, price_cents: 1800 },
            { brand: 'Wilson', model: 'NXT', gauge: '16g', quantity: 20, price_cents: 1200 },
            { brand: 'Luxilon', model: 'ALU Power', gauge: '16L', quantity: 15, price_cents: 2200 },
            { brand: 'Head', model: 'Velocity MLT', gauge: '17g', quantity: 12, price_cents: 1300 },
          ],
          dropoff_methods: [
            { method: 'Drop off at shop', details: '123 Tennis Court Lane, Silver Spring MD - Open 9am-7pm weekdays' },
            { method: 'Pick up from location', details: 'Free pickup within 10 miles' }
          ],
          services: [
            { name: 'Shop Service', price_cents: 2700 },
            { name: 'Grip + String', price_cents: 3200 },
            { name: 'Full Service', price_cents: 4500 }
          ],
          availability: [
            { dow: 1, start: '09:00', end: '19:00' },
            { dow: 2, start: '09:00', end: '19:00' },
            { dow: 3, start: '09:00', end: '19:00' },
            { dow: 4, start: '09:00', end: '19:00' },
            { dow: 5, start: '09:00', end: '19:00' },
            { dow: 6, start: '09:00', end: '17:00' },
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

      // Create stringer settings
      const { error: settingsError } = await supabase
        .from('stringer_settings')
        .insert({
          id: authData.user.id,
          ...stringer.settings,
          onboarding_completed_at: new Date().toISOString()
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
        racket_photo_url: 'https://placehold.co/800x600/png?text=Babolat+Pure+Aero',
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
        completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      {
        player_id: playerProfiles[1]?.id,
        stringer_id: stringerProfiles[1]?.id,
        status: 'in_progress',
        racket_photo_url: 'https://placehold.co/800x600/png?text=Wilson+Blade+98',
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
        accepted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        player_id: playerProfiles[0]?.id,
        stringer_id: stringerProfiles[2]?.id,
        status: 'completed',
        racket_photo_url: 'https://placehold.co/800x600/png?text=Head+Speed+MP',
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
        completed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
      },
      {
        player_id: playerProfiles[1]?.id,
        stringer_id: stringerProfiles[0]?.id,
        status: 'pending',
        racket_photo_url: 'https://placehold.co/800x600/png?text=Yonex+EZONE+98',
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
        preferred_completion_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
        estimated_price_cents: 4600
      },
      {
        player_id: playerProfiles[0]?.id,
        stringer_id: stringerProfiles[3]?.id,
        status: 'pending',
        racket_photo_url: 'https://placehold.co/800x600/png?text=Prince+Textreme',
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
