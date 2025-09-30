import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOEKpnzJYI18EZE0J50PXcQjsNhcUe04a4E4'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Test with anon key (like the frontend)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
// Test with service key (admin access)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

async function testStopProviding() {
  console.log('🧪 Testing Stop Providing functionality...')
  
  // First, sign in as Marco
  console.log('\n1️⃣ Signing in as Marco...')
  const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
    email: 'marco@example.com',
    password: 'password123'
  })
  
  if (authError) {
    console.error('❌ Auth error:', authError)
    return
  }
  
  console.log('✅ Signed in as:', authData.user.email)
  console.log('🆔 User ID:', authData.user.id)
  
  // Check current stringer_settings
  console.log('\n2️⃣ Checking current stringer_settings...')
  const { data: currentSettings, error: currentError } = await supabaseAnon
    .from('stringer_settings')
    .select('*')
    .eq('id', authData.user.id)
  
  if (currentError) {
    console.error('❌ Error checking settings:', currentError)
  } else {
    console.log('📋 Current settings count:', currentSettings.length)
    if (currentSettings.length > 0) {
      console.log('   Settings exist for Marco')
    } else {
      console.log('   No settings found - Marco is not currently providing services')
      
      // Create settings first so we can test deletion
      console.log('\n🔧 Creating settings first...')
      const { error: insertError } = await supabaseAnon
        .from('stringer_settings')
        .insert({
          id: authData.user.id,
          base_price_cents: 2500,
          turnaround_hours: 24,
          accepts_rush: true,
          rush_fee_cents: 1000,
          max_daily_jobs: 5,
          services: [{ name: 'Test Service', price_cents: 2500 }]
        })
      
      if (insertError) {
        console.error('❌ Error creating settings:', insertError)
        return
      } else {
        console.log('✅ Created test settings')
      }
    }
  }
  
  // Now try to delete the settings (simulating "Stop Providing")
  console.log('\n3️⃣ Testing DELETE operation...')
  const { error: deleteError } = await supabaseAnon
    .from('stringer_settings')
    .delete()
    .eq('id', authData.user.id)
  
  if (deleteError) {
    console.error('❌ Delete failed:', deleteError)
    console.log('   Error code:', deleteError.code)
    console.log('   Error message:', deleteError.message)
    console.log('   Error details:', deleteError.details)
  } else {
    console.log('✅ Delete succeeded!')
  }
  
  // Verify deletion
  console.log('\n4️⃣ Verifying deletion...')
  const { data: afterDelete, error: verifyError } = await supabaseAnon
    .from('stringer_settings')
    .select('*')
    .eq('id', authData.user.id)
  
  if (verifyError) {
    console.error('❌ Error verifying:', verifyError)
  } else {
    console.log('📋 Settings count after delete:', afterDelete.length)
    if (afterDelete.length === 0) {
      console.log('✅ Settings successfully deleted!')
    } else {
      console.log('❌ Settings still exist after delete')
    }
  }
  
  // Test search API
  console.log('\n5️⃣ Testing search API...')
  const searchUrl = `${supabaseUrl}/functions/v1/search-stringers?lat=39.2904&lng=-76.6122&radius_km=25`
  
  const response = await fetch(searchUrl, {
    headers: {
      'Authorization': `Bearer ${authData.session.access_token}`,
      'apikey': supabaseAnonKey
    }
  })
  
  const searchData = await response.json()
  const marcoInResults = searchData.stringers?.find(s => s.full_name === 'Marco Rodriguez')
  
  console.log('🎯 Total stringers found:', searchData.stringers?.length || 0)
  console.log('📍 Marco in search results:', marcoInResults ? 'YES ❌' : 'NO ✅')
}

testStopProviding()

