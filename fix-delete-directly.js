import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixDeletePolicy() {
  console.log('🔧 Attempting to fix the DELETE policy directly...')
  
  try {
    // Drop existing policy
    console.log('1️⃣ Dropping existing policy...')
    const dropResult = await supabase.rpc('sql', {
      sql: 'DROP POLICY IF EXISTS "Stringers can delete their own settings" ON public.stringer_settings;'
    })
    
    if (dropResult.error) {
      console.log('Note: Drop policy result:', dropResult.error.message)
    }
    
    // Create new policy with explicit casting
    console.log('2️⃣ Creating new policy...')
    const createResult = await supabase.rpc('sql', {
      sql: `CREATE POLICY "Stringers can delete their own settings" ON public.stringer_settings
            FOR DELETE USING (auth.uid()::text = id::text);`
    })
    
    if (createResult.error) {
      console.error('❌ Create policy error:', createResult.error)
      return
    }
    
    console.log('✅ Policy created successfully')
    
    // Test the policy
    console.log('3️⃣ Testing the new policy...')
    
    // First create a test user session
    const testEmail = 'marco@example.com'
    const testPassword = 'password123'
    
    // Create anon client for testing
    const testClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOEKpnzJYI18EZE0J50PXcQjsNhcUe04a4E4')
    
    const { data: authData, error: authError } = await testClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (authError) {
      console.error('❌ Test auth error:', authError)
      return
    }
    
    const userId = authData.user.id
    console.log('🆔 Test user ID:', userId)
    
    // Ensure there's a setting to delete
    await supabase
      .from('stringer_settings')
      .delete()
      .eq('id', userId)
    
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
    
    console.log('✅ Test setting created')
    
    // Try to delete with the test user
    const { error: deleteError, count } = await testClient
      .from('stringer_settings')
      .delete()
      .eq('id', userId)
    
    if (deleteError) {
      console.error('❌ Delete test failed:', deleteError)
    } else {
      console.log('✅ Delete test result - count:', count)
      
      // Verify deletion
      const { data: remaining } = await testClient
        .from('stringer_settings')
        .select('*')
        .eq('id', userId)
      
      console.log('📋 Remaining records:', remaining?.length || 0)
      
      if ((remaining?.length || 0) === 0) {
        console.log('🎉 DELETE POLICY FIXED! The delete operation now works correctly.')
      } else {
        console.log('❌ Delete policy still not working')
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing policy:', error)
  }
}

fixDeletePolicy()

