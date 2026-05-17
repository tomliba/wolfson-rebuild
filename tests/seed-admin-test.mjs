import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const testResidents = [
  { email: 'resident1@test.com', full_name: 'דנה כהן', password: 'TestPass123!' },
  { email: 'resident2@test.com', full_name: 'יוסי לוי', password: 'TestPass123!' },
  { email: 'resident3@test.com', full_name: 'מיכל אברהם', password: 'TestPass123!' },
];

const makeSurgeries = (email) => {
  if (email === 'resident1@test.com') {
    return [
      { resident_email: email, surgery_date: '2026-03-05', eye: 'right', patient_initials: 'א.ב', supervising_surgeon: 'ד״ר כהן', steps_performed: ['incisions', 'capsulorhexis'], surgery_type: 'phaco' },
      { resident_email: email, surgery_date: '2026-03-12', eye: 'left', patient_initials: 'ג.ד', supervising_surgeon: 'ד״ר שמיר', steps_performed: ['incisions', 'capsulorhexis', 'hydrodissection'], surgery_type: 'phaco' },
      { resident_email: email, surgery_date: '2026-03-20', eye: 'right', patient_initials: 'ה.ו', supervising_surgeon: 'ד״ר רוזן', steps_performed: ['incisions', 'capsulorhexis', 'hydrodissection'], surgery_type: 'phaco' },
      { resident_email: email, surgery_date: '2026-04-03', eye: 'left', patient_initials: 'ז.ח', supervising_surgeon: 'ד״ר כהן', steps_performed: ['incisions', 'capsulorhexis', 'hydrodissection', 'phacoemulsification'], surgery_type: 'phaco' },
      { resident_email: email, surgery_date: '2026-04-10', eye: 'right', patient_initials: 'ט.י', supervising_surgeon: 'ד״ר שמיר', steps_performed: ['incisions', 'capsulorhexis', 'hydrodissection', 'phacoemulsification', 'cortex_aspiration'], surgery_type: 'phaco' },
      { resident_email: email, surgery_date: '2026-04-18', eye: 'left', patient_initials: 'כ.ל', supervising_surgeon: 'ד״ר רוזן', steps_performed: ['incisions', 'capsulorhexis', 'hydrodissection', 'phacoemulsification', 'cortex_aspiration'], surgery_type: 'phaco' },
      { resident_email: email, surgery_date: '2026-05-02', eye: 'right', patient_initials: 'מ.נ', supervising_surgeon: 'ד״ר כהן', steps_performed: ['incisions', 'capsulorhexis', 'hydrodissection', 'phacoemulsification', 'cortex_aspiration', 'iol_insertion', 'hydration'], surgery_type: 'phaco' },
      { resident_email: email, surgery_date: '2026-05-10', eye: 'left', patient_initials: 'ס.ע', supervising_surgeon: 'ד״ר שמיר', steps_performed: ['incisions', 'capsulorhexis', 'hydrodissection', 'phacoemulsification', 'cortex_aspiration', 'iol_insertion', 'hydration', 'solo'], surgery_type: 'phaco' },
    ];
  }
  if (email === 'resident2@test.com') {
    return [
      { resident_email: email, surgery_date: '2026-04-05', eye: 'right', patient_initials: 'פ.צ', supervising_surgeon: 'ד״ר שמיר', steps_performed: ['incisions', 'capsulorhexis'], surgery_type: 'phaco' },
      { resident_email: email, surgery_date: '2026-04-15', eye: 'left', patient_initials: 'ק.ר', supervising_surgeon: 'ד״ר כהן', steps_performed: ['incisions', 'capsulorhexis', 'hydrodissection'], surgery_type: 'phaco' },
      { resident_email: email, surgery_date: '2026-05-01', eye: 'right', patient_initials: 'ש.ת', supervising_surgeon: 'ד״ר שמיר', steps_performed: ['incisions', 'capsulorhexis', 'hydrodissection', 'phacoemulsification'], surgery_type: 'phaco' },
      { resident_email: email, surgery_date: '2026-05-08', eye: 'left', patient_initials: 'א.ג', supervising_surgeon: 'ד״ר כהן', steps_performed: ['incisions', 'capsulorhexis', 'hydrodissection', 'phacoemulsification'], surgery_type: 'phaco' },
      { resident_email: email, surgery_date: '2026-05-15', eye: 'right', patient_initials: 'ד.ה', supervising_surgeon: 'ד״ר שמיר', steps_performed: ['incisions', 'capsulorhexis', 'hydrodissection', 'phacoemulsification', 'cortex_aspiration'], surgery_type: 'phaco' },
    ];
  }
  if (email === 'resident3@test.com') {
    return [
      { resident_email: email, surgery_date: '2026-03-10', eye: 'left', patient_initials: 'ו.ז', supervising_surgeon: 'ד״ר רוזן', steps_performed: ['incisions'], surgery_type: 'phaco' },
      { resident_email: email, surgery_date: '2026-05-05', eye: 'right', patient_initials: 'ח.ט', supervising_surgeon: 'ד״ר רוזן', steps_performed: ['incisions', 'hydrodissection'], surgery_type: 'phaco' },
      { resident_email: email, surgery_date: '2026-05-12', eye: 'left', patient_initials: 'י.כ', supervising_surgeon: 'ד״ר רוזן', steps_performed: ['incisions', 'capsulorhexis', 'hydrodissection'], surgery_type: 'phaco' },
    ];
  }
  return [];
};

async function seed() {
  // Step 1: Cleanup existing test data
  console.log('1. Cleaning up existing test data...');
  await supabase.from('surgeries').delete().like('resident_email', '%@test.com');

  for (const r of testResidents) {
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === r.email);
    if (existing) {
      await supabase.from('profiles').delete().eq('id', existing.id);
      await supabase.auth.admin.deleteUser(existing.id);
    }
  }
  console.log('   Done.');

  // Step 2: Create auth users (which auto-creates profiles via trigger, or we update them)
  console.log('2. Creating test auth users...');
  const userIds = [];
  for (const r of testResidents) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: r.email,
      password: r.password,
      email_confirm: true,
    });
    if (error) {
      console.error(`   Failed to create ${r.email}:`, error.message);
      return;
    }
    userIds.push(data.user.id);
    console.log(`   Created auth user: ${r.email} (${data.user.id})`);
  }

  // Step 3: Update profiles with full_name and role
  console.log('3. Updating profiles...');
  for (let i = 0; i < testResidents.length; i++) {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userIds[i], email: testResidents[i].email, full_name: testResidents[i].full_name, role: 'resident' });
    if (error) {
      console.error(`   Profile update failed for ${testResidents[i].email}:`, error.message);
      return;
    }
    console.log(`   Updated profile: ${testResidents[i].full_name}`);
  }

  // Step 4: Insert surgeries
  console.log('4. Inserting test surgeries...');
  let totalSurgeries = 0;
  for (const r of testResidents) {
    const surgs = makeSurgeries(r.email);
    const { data, error } = await supabase.from('surgeries').insert(surgs).select();
    if (error) {
      console.error(`   Surgery insert failed for ${r.email}:`, error.message, error.details);
      return;
    }
    totalSurgeries += data.length;
    console.log(`   ${r.full_name}: ${data.length} surgeries`);
  }

  // Step 5: Verify
  console.log('5. Verifying...');
  const { data: profs } = await supabase.from('profiles').select('email, full_name, role').like('email', '%@test.com');
  profs?.forEach(p => console.log(`   Profile: ${p.full_name} (${p.email}) - ${p.role}`));

  const { data: surgs } = await supabase.from('surgeries').select('resident_email, surgery_date, supervising_surgeon').like('resident_email', '%@test.com').order('surgery_date');
  console.log(`   Total test surgeries: ${surgs?.length}`);

  console.log(`\nSeed complete: ${testResidents.length} residents, ${totalSurgeries} surgeries.`);
}

seed().catch(console.error);
