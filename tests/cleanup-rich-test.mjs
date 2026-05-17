import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanup() {
  console.log('1. Deleting rich test surgeries...');
  const { data: surgs, error: surgErr } = await supabase
    .from('surgeries')
    .delete()
    .like('resident_email', '%@test.com')
    .select('id');
  if (surgErr) console.error('   Error:', surgErr.message);
  else console.log(`   Deleted ${surgs.length} surgeries.`);

  console.log('2. Deleting rich test profiles and auth users...');
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const testUsers = existingUsers?.users?.filter(u => u.email?.endsWith('@test.com')) || [];

  for (const u of testUsers) {
    await supabase.from('profiles').delete().eq('id', u.id);
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (error) console.error(`   Failed to delete ${u.email}:`, error.message);
    else console.log(`   Deleted user: ${u.email}`);
  }

  console.log('3. Verifying cleanup...');
  const { data: remainingProfs } = await supabase.from('profiles').select('email').like('email', '%@test.com');
  const { data: remainingSurgs } = await supabase.from('surgeries').select('id').like('resident_email', '%@test.com');
  console.log(`   Remaining test profiles: ${remainingProfs?.length || 0}`);
  console.log(`   Remaining test surgeries: ${remainingSurgs?.length || 0}`);

  console.log('\nCleanup complete.');
}

cleanup().catch(console.error);
