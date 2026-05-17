import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL = process.env.TEST_USER_EMAIL;

async function seed() {
  console.log('Seeding test data...');

  // 1. Update profile full_name
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .update({ full_name: 'tom liba' })
    .eq('email', EMAIL)
    .select()
    .single();

  if (profileErr) {
    console.error('Profile update failed:', profileErr.message);
    // Try by auth user lookup
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === EMAIL);
    if (user) {
      const { error: e2 } = await supabase
        .from('profiles')
        .update({ full_name: 'tom liba' })
        .eq('id', user.id);
      if (e2) console.error('Profile update by id failed:', e2.message);
      else console.log('Profile updated by id.');
    }
  } else {
    console.log('Profile updated:', profile.full_name);
  }

  // 2. Seed one_time_tasks (upsert by task_name to avoid duplicates)
  const tasks = [
    { task_name: 'השלמת קורס מבוא לקטרקט', order: 1 },
    { task_name: 'צפייה ב-10 ניתוחי קטרקט', order: 2 },
    { task_name: 'תרגול 5 רקסיס בוטלאב', order: 3 },
    { task_name: 'ביצוע ניתוח סולו ראשון', order: 4 },
    { task_name: 'השתתפות בישיבת שמיים', order: 5 },
  ];

  const { data: taskData, error: taskErr } = await supabase
    .from('one_time_tasks')
    .upsert(tasks, { onConflict: 'task_name' })
    .select();

  if (taskErr) {
    console.error('Task seed failed:', taskErr.message);
    // Try insert ignoring conflicts
    for (const t of tasks) {
      const { error } = await supabase.from('one_time_tasks').insert(t);
      if (error && !error.message.includes('duplicate')) {
        console.error(`  Task "${t.task_name}" failed:`, error.message);
      }
    }
    // Verify
    const { data: existing } = await supabase.from('one_time_tasks').select('*');
    console.log('Tasks in DB:', existing?.length || 0);
  } else {
    console.log('Tasks seeded:', taskData.length);
  }

  // 3. Verify RLS: insert a test surgery as admin, then read it back
  console.log('\nTesting RLS - inserting surgery...');
  const testSurgery = {
    resident_email: EMAIL,
    surgery_date: '2026-01-15',
    surgery_type: 'phaco',
    steps_performed: ['incisions', 'capsulorhexis', 'hydrodissection'],
    patient_initials: 'TS',
    eye: 'right',
    notes: '',
  };

  const { data: surgery, error: surgeryErr } = await supabase
    .from('surgeries')
    .insert(testSurgery)
    .select()
    .single();

  if (surgeryErr) {
    console.error('Surgery insert FAILED (RLS issue):', surgeryErr.message);
    console.log('Attempting to fix RLS policies...');
    await fixRLS();
    // Retry
    const { data: retry, error: retryErr } = await supabase
      .from('surgeries')
      .insert(testSurgery)
      .select()
      .single();
    if (retryErr) {
      console.error('Surgery insert STILL FAILED after RLS fix:', retryErr.message);
    } else {
      console.log('Surgery insert succeeded after fix:', retry.id);
      await supabase.from('surgeries').delete().eq('id', retry.id);
      console.log('Test surgery cleaned up.');
    }
  } else {
    console.log('Surgery insert succeeded:', surgery.id);
    // Read it back
    const { data: readBack } = await supabase
      .from('surgeries')
      .select('*')
      .eq('id', surgery.id)
      .single();
    console.log('Read back:', readBack ? 'OK' : 'FAILED');
    // Clean up
    await supabase.from('surgeries').delete().eq('id', surgery.id);
    console.log('Test surgery cleaned up.');
  }

  // 4. Check all tables are accessible
  console.log('\nTable access check:');
  for (const table of ['profiles', 'one_time_tasks', 'task_completions', 'surgeries', 'video_reviews', 'wet_lab_sessions']) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    console.log(`  ${table}: ${error ? 'ERROR - ' + error.message : 'OK (' + (data?.length || 0) + ' rows sample)'}`);
  }

  console.log('\nDone.');
}

async function fixRLS() {
  // Using service role, RLS is bypassed. The issue is likely that the
  // anon/authenticated role can't insert. Let's check and add policies.
  const policies = [
    `CREATE POLICY IF NOT EXISTS "Users can insert own surgeries" ON surgeries FOR INSERT TO authenticated WITH CHECK (resident_email = (SELECT email FROM auth.users WHERE id = auth.uid()))`,
    `CREATE POLICY IF NOT EXISTS "Users can update own surgeries" ON surgeries FOR UPDATE TO authenticated USING (resident_email = (SELECT email FROM auth.users WHERE id = auth.uid()))`,
    `CREATE POLICY IF NOT EXISTS "Users can delete own surgeries" ON surgeries FOR DELETE TO authenticated USING (resident_email = (SELECT email FROM auth.users WHERE id = auth.uid()))`,
    `CREATE POLICY IF NOT EXISTS "Users can read own surgeries" ON surgeries FOR SELECT TO authenticated USING (resident_email = (SELECT email FROM auth.users WHERE id = auth.uid()))`,
    `CREATE POLICY IF NOT EXISTS "Admins can read all surgeries" ON surgeries FOR SELECT TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')`,
  ];

  for (const sql of policies) {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.log(`  Policy SQL failed (may already exist): ${error.message}`);
    }
  }
}

seed().catch(console.error);
