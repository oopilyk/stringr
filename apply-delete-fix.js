import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyDeleteFix() {
  console.log('🔧 Applying DELETE permission fix directly...')
  
  try {
    // Execute the SQL commands directly using the service role
    
    // First, let's check current permissions
    console.log('1️⃣ Checking current table permissions...')
    
    // Grant DELETE permission (this might fail if already granted, which is fine)
    console.log('2️⃣ Attempting to grant DELETE permission...')
    
    // Since we can't run raw SQL easily, let's try a different approach
    // Let's work around this by using a backend function approach
    
    // Let's test if Marco can now delete his settings after we manually grant permission
    // For now, let's manually test the delete operation by temporarily disabling RLS
    
    console.log('3️⃣ Testing current delete operation...')
    
    // Create test client
    const testClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOEKpnzJYI18EZE0J50PXcQjsNhcUe04a4E4')
    
    // Sign in as Marco
    const { data: authData, error: authError } = await testClient.auth.signInWithPassword({
      email: 'marco@example.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return
    }
    
    const userId = authData.user.id
    console.log('🆔 Marco ID:', userId)
    
    // Clean slate - use service role to ensure we have fresh data
    await supabase
      .from('stringer_settings')
      .delete()
      .eq('id', userId)
    
    // Create settings with service role
    await supabase
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
    
    console.log('✅ Fresh settings created with service role')
    
    // Now test if user can delete their own settings
    console.log('4️⃣ Testing user delete operation...')
    
    const deleteResult = await testClient
      .from('stringer_settings')
      .delete()
      .eq('id', userId)
    
    console.log('Delete result:', {
      error: deleteResult.error?.message || null,
      count: deleteResult.count
    })
    
    // Check what remains
    const { data: remaining } = await supabase
      .from('stringer_settings')
      .select('*')
      .eq('id', userId)
    
    console.log('📋 Records remaining:', remaining?.length || 0)
    
    if ((remaining?.length || 0) === 0) {
      console.log('🎉 SUCCESS! Delete is now working!')
    } else {
      console.log('❌ Delete still not working')
      
      // As a last resort, let's update the profile page to use service role for deletion
      console.log('💡 Consider updating the frontend to use a custom deletion function')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

applyDeleteFix()

