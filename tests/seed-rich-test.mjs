import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const residents = [
  { email: 'rich1@test.com', full_name: 'דנה כהן', level: 'advanced' },
  { email: 'rich2@test.com', full_name: 'יוסי לוי', level: 'intermediate' },
  { email: 'rich3@test.com', full_name: 'מיכל אברהם', level: 'beginner' },
  { email: 'rich4@test.com', full_name: 'אלון ברק', level: 'advanced' },
  { email: 'rich5@test.com', full_name: 'גלית דהן', level: 'intermediate' },
  { email: 'rich6@test.com', full_name: 'הדר פרידמן', level: 'intermediate' },
  { email: 'rich7@test.com', full_name: 'טל שושן', level: 'beginner' },
  { email: 'rich8@test.com', full_name: 'כרמל עוז', level: 'beginner' },
];

const attendings = ['ד״ר שמיר', 'ד״ר כהן', 'ד״ר רוזן', 'ד״ר לוי', 'ד״ר אביזמר', 'ד״ר גרוס'];

const STEPS_PHACO = ['incisions', 'capsulorhexis', 'hydrodissection', 'phacoemulsification', 'cortex_aspiration', 'iol_insertion', 'hydration', 'toric_iol', 'solo'];
const STEPS_LASER = ['laser_incisions', 'laser_hydrodissection', 'laser_phacoemulsification', 'laser_cortex_aspiration', 'laser_toric_iol', 'laser_hydration'];

const COMPLICATIONS = ['קרע בקופסית קדמית', 'קרע בקופסית אחורית', 'זונוליזיס', 'ויטרקטומיה קדמית', 'השתלת עדשה בסולקוס'];

const initials = ['א.ב', 'ג.ד', 'ה.ו', 'ז.ח', 'ט.י', 'כ.ל', 'מ.נ', 'ס.ע', 'פ.צ', 'ק.ר', 'ש.ת', 'א.ג', 'ד.ה', 'ו.ז', 'ח.ט', 'י.כ', 'ל.מ', 'נ.ס', 'ע.פ', 'צ.ק'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateSurgeries(email, level) {
  const surgeries = [];
  const monthWeights = { 0: 3, 1: 4, 2: 5, 3: 8, 4: 10 }; // Jan=3, Feb=4, Mar=5, Apr=8, May=10

  let count;
  if (level === 'advanced') count = randInt(12, 15);
  else if (level === 'intermediate') count = randInt(8, 11);
  else count = randInt(5, 7);

  for (let i = 0; i < count; i++) {
    // Pick month weighted toward Apr-May
    const monthPool = [];
    for (const [m, w] of Object.entries(monthWeights)) {
      for (let j = 0; j < w; j++) monthPool.push(parseInt(m));
    }
    const monthIdx = pick(monthPool); // 0-4 maps to Jan-May
    const month = monthIdx + 1; // 1-5
    const day = randInt(1, 28);
    const date = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const isPhacolaser = Math.random() < 0.12;
    const surgeryType = isPhacolaser ? 'phacolaser' : 'phaco';
    const stepsList = isPhacolaser ? STEPS_LASER : STEPS_PHACO;

    let maxStep;
    if (level === 'advanced') {
      maxStep = randInt(5, stepsList.length); // up to solo
    } else if (level === 'intermediate') {
      maxStep = randInt(2, Math.min(5, stepsList.length)); // up to cortex_aspiration
    } else {
      maxStep = randInt(1, 3); // incisions, capsulorhexis, hydrodissection
    }
    const steps_performed = stepsList.slice(0, maxStep);

    const hasComplication = Math.random() < 0.10;
    const complications = hasComplication ? pick(COMPLICATIONS) : '';

    surgeries.push({
      resident_email: email,
      surgery_date: date,
      patient_initials: pick(initials),
      eye: Math.random() < 0.5 ? 'right' : 'left',
      supervising_surgeon: pick(attendings),
      steps_performed,
      surgery_type: surgeryType,
      complications,
      notes: '',
    });
  }

  return surgeries;
}

async function seed() {
  // Cleanup any existing rich test data
  console.log('1. Cleaning up existing rich test data...');
  await supabase.from('surgeries').delete().like('resident_email', '%@test.com');

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const richUsers = existingUsers?.users?.filter(u => u.email?.startsWith('rich') && u.email?.endsWith('@test.com')) || [];
  for (const u of richUsers) {
    await supabase.from('profiles').delete().eq('id', u.id);
    await supabase.auth.admin.deleteUser(u.id);
  }
  console.log('   Done.');

  // Create auth users
  console.log('2. Creating 8 test residents...');
  const userIds = [];
  for (const r of residents) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: r.email,
      password: 'TestPass123!',
      email_confirm: true,
    });
    if (error) {
      console.error(`   Failed to create ${r.email}:`, error.message);
      return;
    }
    userIds.push(data.user.id);
    console.log(`   Created: ${r.full_name} (${r.email})`);
  }

  // Update profiles
  console.log('3. Updating profiles...');
  for (let i = 0; i < residents.length; i++) {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userIds[i], email: residents[i].email, full_name: residents[i].full_name, role: 'resident' });
    if (error) {
      console.error(`   Profile update failed for ${residents[i].email}:`, error.message);
      return;
    }
  }
  console.log('   Done.');

  // Generate and insert surgeries
  console.log('4. Generating surgeries...');
  let totalSurgeries = 0;
  for (const r of residents) {
    const surgs = generateSurgeries(r.email, r.level);
    const { data, error } = await supabase.from('surgeries').insert(surgs).select();
    if (error) {
      console.error(`   Insert failed for ${r.email}:`, error.message);
      return;
    }
    totalSurgeries += data.length;
    console.log(`   ${r.full_name} (${r.level}): ${data.length} surgeries`);
  }

  // Verify
  console.log('5. Verification...');
  const { data: allSurgs } = await supabase.from('surgeries').select('id, surgery_date, complications').like('resident_email', '%@test.com');
  const withComplications = allSurgs?.filter(s => s.complications && s.complications.length > 0).length || 0;
  const byMonth = {};
  allSurgs?.forEach(s => {
    const m = s.surgery_date.slice(0, 7);
    byMonth[m] = (byMonth[m] || 0) + 1;
  });

  console.log(`   Total surgeries: ${allSurgs?.length}`);
  console.log(`   With complications: ${withComplications} (${Math.round(withComplications / allSurgs.length * 100)}%)`);
  console.log(`   By month:`, byMonth);

  console.log(`\nSeed complete: ${residents.length} residents, ${totalSurgeries} surgeries.`);
}

seed().catch(console.error);
