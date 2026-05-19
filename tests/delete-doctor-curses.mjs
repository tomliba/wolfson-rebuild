import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // Step 1: Find the profile
  const { data: profiles, error: findErr } = await supabase
    .from('profiles')
    .select('*')
    .or('full_name.ilike.%curses%,full_name.ilike.%doctor%,email.ilike.%curses%,email.ilike.%doctor%');

  if (findErr) { console.error('Find error:', findErr.message); return; }
  if (!profiles.length) { console.log('No matching profiles found.'); return; }

  // Step 2: Show what we found
  console.log(`Found ${profiles.length} matching profile(s):`);
  for (const p of profiles) {
    console.log(`  id: ${p.id}`);
    console.log(`  email: ${p.email}`);
    console.log(`  full_name: ${p.full_name}`);
    console.log(`  role: ${p.role}`);
    console.log('');
  }

  for (const p of profiles) {
    const email = p.email;
    const id = p.id;
    console.log(`--- Deleting data for ${email} (${id}) ---`);

    // Step 3: Delete related data
    const tables = ['surgeries', 'video_reviews', 'task_completions', 'wet_lab_sessions'];
    for (const table of tables) {
      const { error, count } = await supabase
        .from(table)
        .delete()
        .eq('resident_email', email)
        .select('id', { count: 'exact', head: true });
      console.log(`  ${table}: ${error ? 'ERROR ' + error.message : 'deleted ' + (count ?? 0) + ' rows'}`);
    }

    // Delete profile
    const { error: profErr } = await supabase.from('profiles').delete().eq('id', id);
    console.log(`  profiles: ${profErr ? 'ERROR ' + profErr.message : 'deleted'}`);

    // Delete auth user
    const { error: authErr } = await supabase.auth.admin.deleteUser(id);
    console.log(`  auth user: ${authErr ? 'ERROR ' + authErr.message : 'deleted'}`);
  }

  // Step 4: Confirm it's gone
  console.log('\n--- Verification ---');
  const { data: check } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .or('full_name.ilike.%curses%,full_name.ilike.%doctor%,email.ilike.%curses%,email.ilike.%doctor%');
  console.log(`Matching profiles remaining: ${check?.length ?? 0}`);
  if (check?.length) console.log(check);
  else console.log('Confirmed: Doctor Curses is gone.');
}

run().catch(e => { console.error(e); process.exit(1); });
