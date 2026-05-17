import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const USER_EMAIL = process.env.TEST_USER_EMAIL;
const USER_PASSWORD = process.env.TEST_USER_PASSWORD;

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
const anonClient = createClient(SUPABASE_URL, ANON_KEY);

let userClient;
let userId;
const results = [];
const bugsFixes = [];

function log(testName, passed, detail = '') {
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`  [${status}] ${testName}${detail ? ' -- ' + detail : ''}`);
  results.push({ testName, passed, detail });
}

// ============================================================
// A. AUTH TESTS
// ============================================================
async function authTests() {
  console.log('\n=== A. AUTH TESTS ===');

  // Sign in with correct password
  const { data: signIn, error: signInErr } = await anonClient.auth.signInWithPassword({
    email: USER_EMAIL,
    password: USER_PASSWORD,
  });
  log('Sign in with correct password', !signInErr && signIn.user?.email === USER_EMAIL,
    signInErr ? signInErr.message : `email=${signIn.user?.email}`);

  if (signIn?.session) {
    userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${signIn.session.access_token}` } },
    });
    userId = signIn.user.id;
  }

  // Sign in with wrong password
  const { error: wrongErr } = await anonClient.auth.signInWithPassword({
    email: USER_EMAIL,
    password: 'WrongPassword123!',
  });
  log('Sign in with wrong password returns error', !!wrongErr,
    wrongErr ? wrongErr.message : 'NO ERROR RETURNED');

  // getUser returns user object
  if (userClient) {
    const { data: { user }, error: getUserErr } = await userClient.auth.getUser();
    log('getUser() returns user object', !getUserErr && !!user,
      getUserErr ? getUserErr.message : `id=${user?.id}`);
  } else {
    log('getUser() returns user object', false, 'No userClient - sign in failed');
  }

  // Profile exists with correct email and role
  if (userId) {
    const { data: profile, error: profErr } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    log('Profile exists with correct email and role',
      !profErr && profile?.email === USER_EMAIL && !!profile?.role,
      profErr ? profErr.message : `email=${profile?.email}, role=${profile?.role}`);
  } else {
    log('Profile exists with correct email and role', false, 'No userId');
  }
}

// ============================================================
// B. PROFILE TESTS
// ============================================================
async function profileTests() {
  console.log('\n=== B. PROFILE TESTS ===');

  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('*')
    .eq('email', USER_EMAIL)
    .single();

  if (error) {
    log('Profile has full_name = tom liba', false, error.message);
    log('Profile has role = admin', false, error.message);
    log('Profile has email = tomliba1996@gmail.com', false, error.message);
    return;
  }

  log('Profile has full_name = tom liba',
    profile.full_name === 'tom liba',
    `actual: "${profile.full_name}"`);
  log('Profile has role = admin',
    profile.role === 'admin',
    `actual: "${profile.role}"`);
  log('Profile has email = tomliba1996@gmail.com',
    profile.email === 'tomliba1996@gmail.com',
    `actual: "${profile.email}"`);
}

// ============================================================
// C. ONE_TIME_TASKS TESTS
// ============================================================
async function oneTimeTasksTests() {
  console.log('\n=== C. ONE_TIME_TASKS TESTS ===');

  const { data: tasks, error } = await adminClient
    .from('one_time_tasks')
    .select('*')
    .order('order', { ascending: true });

  if (error) {
    log('List all tasks returns 5 seeded tasks', false, error.message);
    log('Tasks have task_name, order fields', false, 'skipped');
    log('Tasks are ordered correctly (1-5)', false, 'skipped');
    return;
  }

  log('List all tasks returns 5 seeded tasks',
    tasks.length === 5,
    `actual count: ${tasks.length}`);

  const hasFields = tasks.every(t => 'task_name' in t && 'order' in t);
  log('Tasks have task_name, order fields', hasFields,
    hasFields ? 'all have both fields' : 'missing fields');

  const ordered = tasks.every((t, i) => t.order === i + 1);
  log('Tasks are ordered correctly (1-5)', ordered,
    `orders: [${tasks.map(t => t.order).join(', ')}]`);
}

// ============================================================
// D. SURGERY CRUD TESTS
// ============================================================
async function surgeryCrudTests() {
  console.log('\n=== D. SURGERY CRUD TESTS ===');

  if (!userClient) {
    log('Surgery CRUD - skipped', false, 'No userClient');
    return;
  }

  const createdIds = [];

  // Create a phaco surgery with 5 steps
  const phacoData = {
    resident_email: USER_EMAIL,
    surgery_date: '2026-05-01',
    surgery_type: 'phaco',
    steps_performed: ['incisions', 'capsulorhexis', 'hydrodissection', 'phaco', 'IOL'],
    patient_initials: 'AB',
    eye: 'right',
    notes: 'test surgery',
  };

  const { data: created, error: createErr } = await userClient
    .from('surgeries')
    .insert(phacoData)
    .select()
    .single();

  log('Create phaco surgery with 5 steps',
    !createErr && !!created?.id,
    createErr ? createErr.message : `id=${created?.id}`);

  if (created) createdIds.push(created.id);

  // Read it back by id
  if (created) {
    const { data: readBack, error: readErr } = await userClient
      .from('surgeries')
      .select('*')
      .eq('id', created.id)
      .single();
    log('Read back by id matches created',
      !readErr && readBack?.patient_initials === 'AB' && readBack?.surgery_type === 'phaco',
      readErr ? readErr.message : `type=${readBack?.surgery_type}, initials=${readBack?.patient_initials}`);
  }

  // Update it (change patient_initials)
  if (created) {
    const { data: updated, error: updateErr } = await userClient
      .from('surgeries')
      .update({ patient_initials: 'CD' })
      .eq('id', created.id)
      .select()
      .single();
    log('Update patient_initials',
      !updateErr && updated?.patient_initials === 'CD',
      updateErr ? updateErr.message : `initials=${updated?.patient_initials}`);
  }

  // Filter by resident_email
  const { data: filtered, error: filterErr } = await userClient
    .from('surgeries')
    .select('*')
    .eq('resident_email', USER_EMAIL);
  log('Filter by resident_email returns surgery',
    !filterErr && filtered?.length > 0,
    filterErr ? filterErr.message : `count=${filtered?.length}`);

  // List with sort '-surgery_date' (descending)
  const { data: sorted, error: sortErr } = await userClient
    .from('surgeries')
    .select('*')
    .order('surgery_date', { ascending: false });
  let sortOk = false;
  if (!sortErr && sorted && sorted.length > 1) {
    sortOk = sorted.every((s, i) => i === 0 || s.surgery_date <= sorted[i - 1].surgery_date);
  } else if (!sortErr && sorted?.length <= 1) {
    sortOk = true;
  }
  log('List with sort -surgery_date returns descending order',
    !sortErr && sortOk,
    sortErr ? sortErr.message : `count=${sorted?.length}`);

  // Delete it
  if (created) {
    const { error: delErr } = await userClient
      .from('surgeries')
      .delete()
      .eq('id', created.id);
    log('Delete surgery', !delErr, delErr ? delErr.message : 'deleted');

    // Verify gone
    const { data: gone } = await userClient
      .from('surgeries')
      .select('*')
      .eq('id', created.id);
    log('Deleted surgery no longer exists',
      !gone || gone.length === 0,
      `rows found: ${gone?.length || 0}`);
    const idx = createdIds.indexOf(created.id);
    if (idx >= 0) createdIds.splice(idx, 1);
  }

  // Create a phacolaser surgery with 4 steps
  const phacolaserData = {
    resident_email: USER_EMAIL,
    surgery_date: '2026-05-02',
    surgery_type: 'phacolaser',
    steps_performed: ['laser', 'incisions', 'phaco', 'IOL'],
    patient_initials: 'EF',
    eye: 'left',
    notes: '',
  };

  const { data: phLaser, error: phLaserErr } = await userClient
    .from('surgeries')
    .insert(phacolaserData)
    .select()
    .single();
  log('Create phacolaser surgery with 4 steps',
    !phLaserErr && !!phLaser?.id,
    phLaserErr ? phLaserErr.message : `id=${phLaser?.id}`);
  if (phLaser) createdIds.push(phLaser.id);

  // Create with complications
  const complicationsData = {
    resident_email: USER_EMAIL,
    surgery_date: '2026-05-03',
    surgery_type: 'phaco',
    steps_performed: ['incisions', 'capsulorhexis'],
    patient_initials: 'GH',
    eye: 'right',
    complications: 'posterior capsule rupture,vitreous loss',
    notes: '',
  };

  const { data: compSurgery, error: compErr } = await userClient
    .from('surgeries')
    .insert(complicationsData)
    .select()
    .single();
  log('Create with complications stored correctly',
    !compErr && !!compSurgery?.complications,
    compErr ? compErr.message : `complications="${compSurgery?.complications}"`);
  if (compSurgery) createdIds.push(compSurgery.id);

  // Create with notes containing complex types
  const complexNotesData = {
    resident_email: USER_EMAIL,
    surgery_date: '2026-05-04',
    surgery_type: 'phaco',
    steps_performed: ['incisions'],
    patient_initials: 'IJ',
    eye: 'left',
    notes: 'Patient had IOL power +22.5D, used Alcon SA60AT. Axial length: 23.4mm',
  };

  const { data: notesSurgery, error: notesErr } = await userClient
    .from('surgeries')
    .insert(complexNotesData)
    .select()
    .single();
  log('Create with complex notes stored correctly',
    !notesErr && notesSurgery?.notes?.includes('+22.5D'),
    notesErr ? notesErr.message : `notes="${notesSurgery?.notes?.substring(0, 40)}..."`);
  if (notesSurgery) createdIds.push(notesSurgery.id);

  // Delete all test surgeries
  for (const id of createdIds) {
    await userClient.from('surgeries').delete().eq('id', id);
  }
  const { data: remaining } = await userClient
    .from('surgeries')
    .select('id')
    .in('id', createdIds);
  log('Delete all test surgeries',
    !remaining || remaining.length === 0,
    `remaining: ${remaining?.length || 0}`);
}

// ============================================================
// E. TASK_COMPLETION CRUD TESTS
// ============================================================
async function taskCompletionTests() {
  console.log('\n=== E. TASK_COMPLETION CRUD TESTS ===');

  if (!userClient) {
    log('TaskCompletion CRUD - skipped', false, 'No userClient');
    return;
  }

  // Get a seeded task id
  const { data: tasks } = await adminClient
    .from('one_time_tasks')
    .select('id')
    .order('order', { ascending: true })
    .limit(1);

  if (!tasks || tasks.length === 0) {
    log('Task completion tests - skipped', false, 'No seeded tasks found');
    return;
  }

  const taskId = tasks[0].id;

  // Create a completion
  const { data: comp, error: compErr } = await userClient
    .from('task_completions')
    .insert({ task_id: taskId, resident_email: USER_EMAIL, completion_date: '2026-05-17' })
    .select()
    .single();
  log('Create task completion',
    !compErr && !!comp?.id,
    compErr ? compErr.message : `id=${comp?.id}`);

  // Filter by resident_email
  if (comp) {
    const { data: filtered, error: filterErr } = await userClient
      .from('task_completions')
      .select('*')
      .eq('resident_email', USER_EMAIL);
    log('Filter completions by resident_email',
      !filterErr && filtered?.length > 0,
      filterErr ? filterErr.message : `count=${filtered?.length}`);
  }

  // Delete it
  if (comp) {
    const { error: delErr } = await userClient
      .from('task_completions')
      .delete()
      .eq('id', comp.id);
    log('Delete task completion', !delErr, delErr ? delErr.message : 'deleted');

    const { data: gone } = await userClient
      .from('task_completions')
      .select('*')
      .eq('id', comp.id);
    log('Deleted completion gone',
      !gone || gone.length === 0,
      `remaining: ${gone?.length || 0}`);
  }

  // Try creating with non-existent task_id
  const { error: fkErr } = await userClient
    .from('task_completions')
    .insert({ task_id: '00000000-0000-0000-0000-000000000000', resident_email: USER_EMAIL, completion_date: '2026-05-17' })
    .select()
    .single();
  log('Non-existent task_id errors (FK constraint)',
    !!fkErr,
    fkErr ? fkErr.message : 'NO ERROR - FK not enforced!');
}

// ============================================================
// F. VIDEO_REVIEW CRUD TESTS
// ============================================================
async function videoReviewTests() {
  console.log('\n=== F. VIDEO_REVIEW CRUD TESTS ===');

  if (!userClient) {
    log('VideoReview CRUD - skipped', false, 'No userClient');
    return;
  }

  const videoData = {
    resident_email: USER_EMAIL,
    review_date: '2026-05-01',
    senior_doctor: 'Dr. Cohen',
    video_description: 'Phaco surgery right eye',
    feedback: 'Good technique overall',
    notes: 'Minor tremor noted',
    presented_in_meeting: false,
    meeting_date: null,
  };

  const { data: video, error: createErr } = await userClient
    .from('video_reviews')
    .insert(videoData)
    .select()
    .single();
  log('Create video review with all fields',
    !createErr && !!video?.id,
    createErr ? createErr.message : `id=${video?.id}`);

  // Update - set presented_in_meeting and meeting_date
  if (video) {
    const { data: updated, error: updateErr } = await userClient
      .from('video_reviews')
      .update({ presented_in_meeting: true, meeting_date: '2026-05-10' })
      .eq('id', video.id)
      .select()
      .single();
    log('Update video review (presented + meeting_date)',
      !updateErr && updated?.presented_in_meeting === true && updated?.meeting_date === '2026-05-10',
      updateErr ? updateErr.message : `presented=${updated?.presented_in_meeting}, date=${updated?.meeting_date}`);
  }

  // Filter by resident_email
  const { data: filtered, error: filterErr } = await userClient
    .from('video_reviews')
    .select('*')
    .eq('resident_email', USER_EMAIL);
  log('Filter video reviews by resident_email',
    !filterErr && filtered?.length > 0,
    filterErr ? filterErr.message : `count=${filtered?.length}`);

  // Delete
  if (video) {
    const { error: delErr } = await userClient
      .from('video_reviews')
      .delete()
      .eq('id', video.id);
    log('Delete video review', !delErr, delErr ? delErr.message : 'deleted');

    const { data: gone } = await userClient
      .from('video_reviews')
      .select('*')
      .eq('id', video.id);
    log('Deleted video review gone',
      !gone || gone.length === 0,
      `remaining: ${gone?.length || 0}`);
  }
}

// ============================================================
// G. WET_LAB_SESSION CRUD TESTS
// ============================================================
async function wetLabSessionTests() {
  console.log('\n=== G. WET_LAB_SESSION CRUD TESTS ===');

  if (!userClient) {
    log('WetLabSession CRUD - skipped', false, 'No userClient');
    return;
  }

  const labData = {
    resident_email: USER_EMAIL,
    practice_date: '2026-05-05',
    steps_practiced: ['capsulorhexis', 'hydrodissection'],
    notes: 'Good progress on continuous curvilinear technique',
  };

  const { data: session, error: createErr } = await userClient
    .from('wet_lab_sessions')
    .insert(labData)
    .select()
    .single();
  log('Create wet lab session',
    !createErr && !!session?.id,
    createErr ? createErr.message : `id=${session?.id}`);

  // Filter by resident_email
  if (session) {
    const { data: filtered, error: filterErr } = await userClient
      .from('wet_lab_sessions')
      .select('*')
      .eq('resident_email', USER_EMAIL);
    log('Filter wet lab sessions by resident_email',
      !filterErr && filtered?.length > 0,
      filterErr ? filterErr.message : `count=${filtered?.length}`);
  }

  // Delete
  if (session) {
    const { error: delErr } = await userClient
      .from('wet_lab_sessions')
      .delete()
      .eq('id', session.id);
    log('Delete wet lab session', !delErr, delErr ? delErr.message : 'deleted');

    const { data: gone } = await userClient
      .from('wet_lab_sessions')
      .select('*')
      .eq('id', session.id);
    log('Deleted wet lab session gone',
      !gone || gone.length === 0,
      `remaining: ${gone?.length || 0}`);
  }
}

// ============================================================
// H. RLS POLICY TESTS
// ============================================================
async function rlsTests() {
  console.log('\n=== H. RLS POLICY TESTS ===');

  if (!userClient) {
    log('RLS tests - skipped', false, 'No userClient');
    return;
  }

  const TEST_EMAIL = 'test_resident@test.com';
  const TEST_PASS = 'TestPass123!';
  let testUserId = null;
  let testUserClient = null;

  // Create a second test user
  const { data: newUser, error: createUserErr } = await adminClient.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASS,
    email_confirm: true,
  });

  if (createUserErr) {
    // Maybe user already exists, try to get them
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    const existing = users.find(u => u.email === TEST_EMAIL);
    if (existing) {
      testUserId = existing.id;
    } else {
      log('Create second test user', false, createUserErr.message);
      return;
    }
  } else {
    testUserId = newUser.user.id;
  }
  log('Create second test user', !!testUserId, `id=${testUserId}`);

  // Ensure test user has a profile with role=resident
  await adminClient
    .from('profiles')
    .upsert({ id: testUserId, email: TEST_EMAIL, role: 'resident', full_name: 'Test Resident' });

  // Sign in as test user
  const { data: testSignIn, error: testSignErr } = await anonClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASS,
  });

  if (testSignErr || !testSignIn?.session) {
    log('Sign in as test_resident', false, testSignErr?.message || 'No session');
    // Cleanup
    if (testUserId) await adminClient.auth.admin.deleteUser(testUserId);
    return;
  }

  testUserClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${testSignIn.session.access_token}` } },
  });
  log('Sign in as test_resident', true, `email=${testSignIn.user.email}`);

  // Create admin's surgery for the test
  const { data: adminSurgery } = await userClient
    .from('surgeries')
    .insert({
      resident_email: USER_EMAIL,
      surgery_date: '2026-04-01',
      surgery_type: 'phaco',
      steps_performed: ['incisions', 'capsulorhexis'],
      patient_initials: 'RLS',
      eye: 'right',
      notes: 'RLS test',
    })
    .select()
    .single();

  // As test_resident: try to read admin's surgeries
  const { data: testRead } = await testUserClient
    .from('surgeries')
    .select('*')
    .eq('resident_email', USER_EMAIL);
  log('test_resident cannot read admin surgeries (RLS blocks)',
    !testRead || testRead.length === 0,
    `rows returned: ${testRead?.length || 0}`);

  // As admin: read all surgeries
  const { data: adminRead } = await userClient
    .from('surgeries')
    .select('*');
  log('Admin can read all surgeries',
    adminRead && adminRead.length > 0,
    `count=${adminRead?.length || 0}`);

  // As test_resident: create own surgery
  const { data: testSurgery, error: testSurgeryErr } = await testUserClient
    .from('surgeries')
    .insert({
      resident_email: TEST_EMAIL,
      surgery_date: '2026-04-02',
      surgery_type: 'phaco',
      steps_performed: ['incisions'],
      patient_initials: 'TR',
      eye: 'left',
      notes: '',
    })
    .select()
    .single();
  log('test_resident can create own surgery',
    !testSurgeryErr && !!testSurgery?.id,
    testSurgeryErr ? testSurgeryErr.message : `id=${testSurgery?.id}`);

  // As admin: can see test_resident's surgery
  if (testSurgery) {
    const { data: adminSeeTest } = await userClient
      .from('surgeries')
      .select('*')
      .eq('id', testSurgery.id);
    log('Admin can see test_resident surgery',
      adminSeeTest && adminSeeTest.length > 0,
      `found=${adminSeeTest?.length || 0}`);
  }

  // As test_resident: try to read admin's videos
  const { data: testVideos } = await testUserClient
    .from('video_reviews')
    .select('*')
    .eq('resident_email', USER_EMAIL);
  log('test_resident cannot read admin video reviews',
    !testVideos || testVideos.length === 0,
    `rows returned: ${testVideos?.length || 0}`);

  // Cleanup
  if (testSurgery) {
    await adminClient.from('surgeries').delete().eq('id', testSurgery.id);
  }
  if (adminSurgery) {
    await adminClient.from('surgeries').delete().eq('id', adminSurgery.id);
  }
  await adminClient.from('task_completions').delete().eq('resident_email', TEST_EMAIL);
  await adminClient.from('video_reviews').delete().eq('resident_email', TEST_EMAIL);
  await adminClient.from('wet_lab_sessions').delete().eq('resident_email', TEST_EMAIL);
  await adminClient.from('surgeries').delete().eq('resident_email', TEST_EMAIL);
  await adminClient.from('profiles').delete().eq('id', testUserId);
  await adminClient.auth.admin.deleteUser(testUserId);
  log('RLS test cleanup', true, 'test user and data removed');
}

// ============================================================
// I. API SHIM TESTS
// ============================================================
async function apiShimTests() {
  console.log('\n=== I. API SHIM TESTS ===');

  try {
    // The api.js uses browser client (createBrowserClient from @supabase/ssr)
    // which requires browser globals. We cannot import it in Node.js.
    log('API shim import', false,
      'SKIPPED - api.js uses @supabase/ssr createBrowserClient which requires browser environment. Direct Supabase tests above cover the same operations.');
  } catch (e) {
    log('API shim import', false, `SKIPPED - ${e.message}`);
  }
}

// ============================================================
// J. DATA INTEGRITY TESTS
// ============================================================
async function dataIntegrityTests() {
  console.log('\n=== J. DATA INTEGRITY TESTS ===');

  if (!userClient) {
    log('Data integrity tests - skipped', false, 'No userClient');
    return;
  }

  // Create surgery with invalid surgery_type
  const { error: invalidTypeErr } = await userClient
    .from('surgeries')
    .insert({
      resident_email: USER_EMAIL,
      surgery_date: '2026-05-10',
      surgery_type: 'invalid',
      steps_performed: ['incisions'],
      patient_initials: 'XX',
      eye: 'right',
      notes: '',
    })
    .select()
    .single();
  log('Invalid surgery_type rejected (check constraint)',
    !!invalidTypeErr,
    invalidTypeErr ? invalidTypeErr.message : 'NO ERROR - constraint missing!');

  // Create surgery with eye='both'
  const { error: invalidEyeErr } = await userClient
    .from('surgeries')
    .insert({
      resident_email: USER_EMAIL,
      surgery_date: '2026-05-10',
      surgery_type: 'phaco',
      steps_performed: ['incisions'],
      patient_initials: 'XX',
      eye: 'both',
      notes: '',
    })
    .select()
    .single();
  log('Invalid eye=both rejected (check constraint)',
    !!invalidEyeErr,
    invalidEyeErr ? invalidEyeErr.message : 'NO ERROR - constraint missing!');

  // Create surgery without resident_email
  const { error: noEmailErr } = await userClient
    .from('surgeries')
    .insert({
      surgery_date: '2026-05-10',
      surgery_type: 'phaco',
      steps_performed: ['incisions'],
      patient_initials: 'XX',
      eye: 'right',
      notes: '',
    })
    .select()
    .single();
  log('Missing resident_email rejected (not null)',
    !!noEmailErr,
    noEmailErr ? noEmailErr.message : 'NO ERROR - not null missing!');

  // Create surgery without surgery_date
  const { error: noDateErr } = await userClient
    .from('surgeries')
    .insert({
      resident_email: USER_EMAIL,
      surgery_type: 'phaco',
      steps_performed: ['incisions'],
      patient_initials: 'XX',
      eye: 'right',
      notes: '',
    })
    .select()
    .single();
  log('Missing surgery_date rejected (not null)',
    !!noDateErr,
    noDateErr ? noDateErr.message : 'NO ERROR - not null missing!');

  // Verify steps_performed stores as proper text array
  const { data: arraySurgery, error: arrayErr } = await userClient
    .from('surgeries')
    .insert({
      resident_email: USER_EMAIL,
      surgery_date: '2026-05-11',
      surgery_type: 'phaco',
      steps_performed: ['step1', 'step2', 'step3'],
      patient_initials: 'AR',
      eye: 'right',
      notes: '',
    })
    .select()
    .single();
  const isArray = !arrayErr && Array.isArray(arraySurgery?.steps_performed);
  log('steps_performed stores as proper text array',
    isArray,
    arrayErr ? arrayErr.message : `type=${typeof arraySurgery?.steps_performed}, isArray=${isArray}`);

  // Verify created_at is auto-populated
  if (arraySurgery) {
    log('created_at is auto-populated',
      !!arraySurgery.created_at,
      `value=${arraySurgery.created_at}`);
    // Cleanup
    await userClient.from('surgeries').delete().eq('id', arraySurgery.id);
  } else {
    log('created_at is auto-populated', false, 'No surgery created to check');
  }

  // Clean up any invalid rows that somehow got created
  await adminClient.from('surgeries').delete().eq('patient_initials', 'XX');
}

// ============================================================
// MAIN RUNNER
// ============================================================
async function main() {
  console.log('========================================');
  console.log('WOLFSON BACKEND TESTS');
  console.log('========================================');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`User: ${USER_EMAIL}`);
  console.log(`Time: ${new Date().toISOString()}`);

  await authTests();
  await profileTests();
  await oneTimeTasksTests();
  await surgeryCrudTests();
  await taskCompletionTests();
  await videoReviewTests();
  await wetLabSessionTests();
  await rlsTests();
  await apiShimTests();
  await dataIntegrityTests();

  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log('\n========================================');
  console.log(`SUMMARY: ${passed} passed, ${failed} failed, ${total} total`);
  console.log('========================================');

  if (failed > 0) {
    console.log('\nFAILURES:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  [FAIL] ${r.testName} -- ${r.detail}`);
    });
  }

  // Write results to file
  let md = `# Backend Test Results\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Total:** ${passed} passed, ${failed} failed, ${total} total\n\n`;

  md += `## Results by Section\n\n`;

  let currentSection = '';
  for (const r of results) {
    const section = r.testName.split(' - ')[0] || r.testName;
    if (section !== currentSection) {
      currentSection = section;
    }
    const icon = r.passed ? 'PASS' : 'FAIL';
    md += `- [${icon}] ${r.testName}${r.detail ? ' -- ' + r.detail : ''}\n`;
  }

  if (failed > 0) {
    md += `\n## Failures\n\n`;
    for (const r of results.filter(r => !r.passed)) {
      md += `- **${r.testName}**: ${r.detail}\n`;
    }
  }

  md += `\n## Notes\n\n`;
  md += `- API shim tests skipped: api.js uses browser-only @supabase/ssr createBrowserClient\n`;
  md += `- Direct Supabase client tests cover the same CRUD operations the API shim wraps\n`;

  writeFileSync('tests/backend-results.md', md);
  console.log('\nResults written to tests/backend-results.md');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
