import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOEKpnzJYI18EZE0J50PXcQjsNhcUe04a4E4'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

async function deepDebug() {
  console.log('🕵️ Deep debugging the deletion issue...')
  
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
  console.log('🆔 Marco\'s User ID:', userId)
  
  // Check stringer_settings with service role (bypasses RLS)
  console.log('\n📋 Service role view of stringer_settings:')
  const { data: serviceData, error: serviceError } = await supabaseService
    .from('stringer_settings')
    .select('*')
    .eq('id', userId)
  
  if (serviceError) {
    console.error('❌ Service error:', serviceError)
  } else {
    console.log('   Settings count (service role):', serviceData.length)
    serviceData.forEach((setting, i) => {
      console.log(`   Setting ${i + 1}:`, {
        id: setting.id,
        base_price: setting.base_price_cents,
        created_at: setting.created_at
      })
    })
  }
  
  // Check stringer_settings with user role (through RLS)
  console.log('\n👤 User role view of stringer_settings:')
  const { data: userData, error: userError } = await supabaseAnon
    .from('stringer_settings')
    .select('*')
    .eq('id', userId)
  
  if (userError) {
    console.error('❌ User error:', userError)
  } else {
    console.log('   Settings count (user role):', userData.length)
  }
  
  // Try delete with detailed error handling
  console.log('\n🗑️ Attempting DELETE with detailed error handling...')
  
  const deleteResult = await supabaseAnon
    .from('stringer_settings')
    .delete()
    .eq('id', userId)
  
  console.log('   Delete result:', {
    error: deleteResult.error,
    data: deleteResult.data,
    count: deleteResult.count,
    status: deleteResult.status,
    statusText: deleteResult.statusText
  })
  
  // Check again after delete attempt
  console.log('\n🔍 Checking after delete attempt...')
  const { data: afterDelete, error: afterError } = await supabaseAnon
    .from('stringer_settings')
    .select('*')
    .eq('id', userId)
  
  console.log('   User view after delete:', afterDelete?.length || 0, 'records')
  
  const { data: afterDeleteService, error: afterErrorService } = await supabaseService
    .from('stringer_settings')
    .select('*')
    .eq('id', userId)
  
  console.log('   Service view after delete:', afterDeleteService?.length || 0, 'records')
  
  // Try manual delete with service role
  console.log('\n🔧 Manual delete with service role...')
  const { error: manualDeleteError } = await supabaseService
    .from('stringer_settings')
    .delete()
    .eq('id', userId)
  
  if (manualDeleteError) {
    console.error('❌ Manual delete error:', manualDeleteError)
  } else {
    console.log('✅ Manual delete succeeded')
    
    // Final verification
    const { data: finalCheck } = await supabaseService
      .from('stringer_settings')
      .select('*')
      .eq('id', userId)
    
    console.log('🏁 Final count:', finalCheck?.length || 0, 'records')
  }
}

deepDebug()

