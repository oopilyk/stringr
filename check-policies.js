import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPolicies() {
  console.log('🔍 Checking RLS policies for stringer_settings...')
  
  // Query the RLS policies for stringer_settings table
  const { data: policies, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'stringer_settings')
  
  if (error) {
    console.error('❌ Error querying policies:', error)
    return
  }
  
  console.log('📋 Found', policies.length, 'policies:')
  policies.forEach(policy => {
    console.log(`\n📝 Policy: ${policy.policyname}`)
    console.log(`   Command: ${policy.cmd}`)
    console.log(`   With check: ${policy.with_check}`)
    console.log(`   Using: ${policy.using}`)
    console.log(`   Permissive: ${policy.permissive}`)
  })
  
  // Also check if RLS is enabled on the table
  console.log('\n🔒 Checking if RLS is enabled...')
  const { data: tables, error: tableError } = await supabase
    .from('pg_class')
    .select('relname, relrowsecurity')
    .eq('relname', 'stringer_settings')
    .single()
  
  if (tableError) {
    console.error('❌ Error checking RLS status:', tableError)
  } else {
    console.log('🛡️ RLS enabled:', tables.relrowsecurity ? 'YES' : 'NO')
  }
}

checkPolicies()

