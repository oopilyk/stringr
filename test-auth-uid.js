import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOEKpnzJYI18EZE0J50PXcQjsNhcUe04a4E4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuthUid() {
  console.log('🔐 Testing auth.uid() matching...')
  
  // Sign in as Marco
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'marco@example.com',
    password: 'password123'
  })
  
  if (authError) {
    console.error('❌ Auth error:', authError)
    return
  }
  
  const userId = authData.user.id
  console.log('🆔 Logged in user ID:', userId)
  console.log('📝 User ID type:', typeof userId)
  
  // Test auth.uid() function directly
  console.log('\n🔍 Testing auth.uid() function...')
  
  // Create a simple test query to see what auth.uid() returns
  const { data: authUidTest, error: authUidError } = await supabase
    .rpc('test_auth_uid')
    .catch(async () => {
      // If the function doesn't exist, create it first
      console.log('📝 Creating test function...')
      
      // We can't create functions through the client, so let's use a workaround
      // Let's test using a SELECT query with auth.uid()
      const { data: testResult, error: testError } = await supabase
        .from('stringer_settings')
        .select('id')
        .eq('id', userId)
        .limit(1)
      
      if (testError) {
        console.error('❌ Test query error:', testError)
        return null
      }
      
      console.log('✅ Can read own stringer_settings via id match')
      
      // Now let's try to see if the DELETE policy condition would match
      // by using a different approach - checking what the RLS policy sees
      
      // Test with a raw query that mimics the DELETE policy
      const { data: policyTest, error: policyError } = await supabase
        .from('stringer_settings')
        .select('id, (id = auth.uid()) as uid_matches')
        .eq('id', userId)
      
      return policyTest
    })
  
  // Let's manually fix this by recreating Marco's stringer_settings entry
  // and testing if the issue persists
  
  console.log('\n🔄 Recreating Marco\'s settings to test deletion...')
  
  // First ensure it's deleted (using our known working method)
  await supabase
    .from('stringer_settings')
    .delete()
    .eq('id', userId)
  
  // Create new settings
  const { error: insertError } = await supabase
    .from('stringer_settings')
    .insert({
      id: userId,
      base_price_cents: 2500,
      turnaround_hours: 24,
      accepts_rush: true,
      rush_fee_cents: 1000,
      max_daily_jobs: 5,
      services: [{ name: 'Test Service', price_cents: 2500 }]
    })
  
  if (insertError) {
    console.error('❌ Insert error:', insertError)
    return
  }
  
  console.log('✅ Created new settings')
  
  // Now test deletion again
  console.log('\n🗑️ Testing deletion on fresh settings...')
  
  const { error: deleteError, count } = await supabase
    .from('stringer_settings')
    .delete()
    .eq('id', userId)
  
  console.log('Delete result:', { error: deleteError, count })
  
  // Check if it worked
  const { data: checkAfter } = await supabase
    .from('stringer_settings')
    .select('*')
    .eq('id', userId)
  
  console.log('Records after delete:', checkAfter?.length || 0)
}

testAuthUid()

