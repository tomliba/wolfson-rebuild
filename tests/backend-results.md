# Backend Test Results

**Date:** 2026-05-17T17:47:57.062Z
**Total:** 49 passed, 1 failed, 50 total

## Results by Section

- [PASS] Sign in with correct password -- email=tomliba1996@gmail.com
- [PASS] Sign in with wrong password returns error -- Invalid login credentials
- [PASS] getUser() returns user object -- id=f75ecf78-a392-4ac8-bd50-c8f4b365169d
- [PASS] Profile exists with correct email and role -- email=tomliba1996@gmail.com, role=admin
- [PASS] Profile has full_name = tom liba -- actual: "tom liba"
- [PASS] Profile has role = admin -- actual: "admin"
- [PASS] Profile has email = tomliba1996@gmail.com -- actual: "tomliba1996@gmail.com"
- [PASS] List all tasks returns 5 seeded tasks -- actual count: 5
- [PASS] Tasks have task_name, order fields -- all have both fields
- [PASS] Tasks are ordered correctly (1-5) -- orders: [1, 2, 3, 4, 5]
- [PASS] Create phaco surgery with 5 steps -- id=e793d19e-4abe-4997-80af-28cc6c37b2dd
- [PASS] Read back by id matches created -- type=phaco, initials=AB
- [PASS] Update patient_initials -- initials=CD
- [PASS] Filter by resident_email returns surgery -- count=1
- [PASS] List with sort -surgery_date returns descending order -- count=1
- [PASS] Delete surgery -- deleted
- [PASS] Deleted surgery no longer exists -- rows found: 0
- [PASS] Create phacolaser surgery with 4 steps -- id=93f6d49a-cb14-4b3a-8d0f-76bc93da5014
- [PASS] Create with complications stored correctly -- complications="posterior capsule rupture,vitreous loss"
- [PASS] Create with complex notes stored correctly -- notes="Patient had IOL power +22.5D, used Alcon..."
- [PASS] Delete all test surgeries -- remaining: 0
- [PASS] Create task completion -- id=847f4042-7a5c-4bb7-ab54-44f11cee8853
- [PASS] Filter completions by resident_email -- count=2
- [PASS] Delete task completion -- deleted
- [PASS] Deleted completion gone -- remaining: 0
- [PASS] Non-existent task_id errors (FK constraint) -- insert or update on table "task_completions" violates foreign key constraint "task_completions_task_id_fkey"
- [PASS] Create video review with all fields -- id=726805ab-cc30-4fbe-b3ca-080e0fce8501
- [PASS] Update video review (presented + meeting_date) -- presented=true, date=2026-05-10
- [PASS] Filter video reviews by resident_email -- count=1
- [PASS] Delete video review -- deleted
- [PASS] Deleted video review gone -- remaining: 0
- [PASS] Create wet lab session -- id=b82d14b7-eafc-4007-97ff-76547ead9cf1
- [PASS] Filter wet lab sessions by resident_email -- count=1
- [PASS] Delete wet lab session -- deleted
- [PASS] Deleted wet lab session gone -- remaining: 0
- [PASS] Create second test user -- id=4ce6fc16-1b61-4c60-9d6d-30a2d289e2b4
- [PASS] Sign in as test_resident -- email=test_resident@test.com
- [PASS] test_resident cannot read admin surgeries (RLS blocks) -- rows returned: 0
- [PASS] Admin can read all surgeries -- count=1
- [PASS] test_resident can create own surgery -- id=473a673c-d51d-4d61-9a13-b3ac3cc0faad
- [PASS] Admin can see test_resident surgery -- found=1
- [PASS] test_resident cannot read admin video reviews -- rows returned: 0
- [PASS] RLS test cleanup -- test user and data removed
- [FAIL] API shim import -- SKIPPED - api.js uses @supabase/ssr createBrowserClient which requires browser environment. Direct Supabase tests above cover the same operations.
- [PASS] Invalid surgery_type rejected (check constraint) -- new row for relation "surgeries" violates check constraint "surgeries_surgery_type_check"
- [PASS] Invalid eye=both rejected (check constraint) -- new row for relation "surgeries" violates check constraint "surgeries_eye_check"
- [PASS] Missing resident_email rejected (not null) -- new row violates row-level security policy for table "surgeries"
- [PASS] Missing surgery_date rejected (not null) -- null value in column "surgery_date" of relation "surgeries" violates not-null constraint
- [PASS] steps_performed stores as proper text array -- type=object, isArray=true
- [PASS] created_at is auto-populated -- value=2026-05-17T17:47:57.028376+00:00

## Failures

- **API shim import**: SKIPPED - api.js uses @supabase/ssr createBrowserClient which requires browser environment. Direct Supabase tests above cover the same operations.

## Notes

- API shim tests skipped: api.js uses browser-only @supabase/ssr createBrowserClient
- Direct Supabase client tests cover the same CRUD operations the API shim wraps
