import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOEKpnzJYI18EZE0J50PXcQjsNhcUe04a4E4'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

async function testSimpleDelete() {
  console.log('🧪 Simple delete test...')
  
  // Sign in as Marco
  const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
    email: 'marco@example.com',
    password: 'password123'
  })
  
  if (authError) {
    console.error('❌ Auth error:', authError)
    return
  }
  
  const userId = authData.user.id
  console.log('🆔 User ID:', userId)
  
  // Clean slate - remove any existing settings with service role
  await supabaseService
    .from('stringer_settings')
    .delete()
    .eq('id', userId)
  
  // Create fresh settings with user role
  console.log('\n✏️ Creating fresh settings with user role...')
  const { data: insertData, error: insertError } = await supabaseAnon
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
    .select()
  
  if (insertError) {
    console.error('❌ Insert error:', insertError)
    return
  }
  
  console.log('✅ Settings created')
  
  // Verify settings exist
  const { data: beforeDelete } = await supabaseAnon
    .from('stringer_settings')
    .select('*')
    .eq('id', userId)
  
  console.log('📋 Settings before delete:', beforeDelete?.length || 0)
  
  // Try to delete with user role
  console.log('\n🗑️ Attempting delete with user role...')
  const deleteResult = await supabaseAnon
    .from('stringer_settings')
    .delete()
    .eq('id', userId)
    .select()  // Add select to see what was actually deleted
  
  console.log('Delete result:', {
    error: deleteResult.error ? deleteResult.error.message : null,
    data: deleteResult.data,
    count: deleteResult.count
  })
  
  // Check what remains
  const { data: afterDelete } = await supabaseAnon
    .from('stringer_settings')
    .select('*')
    .eq('id', userId)
  
  console.log('📋 Settings after delete:', afterDelete?.length || 0)
  
  if ((afterDelete?.length || 0) > 0) {
    console.log('❌ DELETE FAILED - settings still exist')
    
    // Let's try a different approach - maybe the issue is with UUID comparison
    console.log('\n🔧 Trying delete with string UUID...')
    const deleteResult2 = await supabaseAnon
      .from('stringer_settings')
      .delete()
      .eq('id', `${userId}`)  // Explicitly convert to string
      .select()
    
    console.log('Delete result 2:', {
      error: deleteResult2.error ? deleteResult2.error.message : null,
      data: deleteResult2.data,
      count: deleteResult2.count
    })
    
    const { data: afterDelete2 } = await supabaseAnon
      .from('stringer_settings')
      .select('*')
      .eq('id', userId)
    
    console.log('📋 Settings after delete 2:', afterDelete2?.length || 0)
  } else {
    console.log('✅ DELETE SUCCEEDED!')
  }
}

testSimpleDelete()

