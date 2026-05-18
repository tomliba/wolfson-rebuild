import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request) {
  const serverSupabase = await createServerClient();
  const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await serverSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { residentId, residentEmail } = await request.json();
  if (!residentId || !residentEmail) {
    return NextResponse.json({ error: 'Missing residentId or residentEmail' }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const results = {};

  const { error: e1, count: c1 } = await admin.from('surgeries').delete().eq('resident_email', residentEmail).select('id', { count: 'exact', head: true });
  results.surgeries = e1 ? e1.message : 'ok';

  const { error: e2 } = await admin.from('video_reviews').delete().eq('resident_email', residentEmail);
  results.video_reviews = e2 ? e2.message : 'ok';

  const { error: e3 } = await admin.from('task_completions').delete().eq('resident_email', residentEmail);
  results.task_completions = e3 ? e3.message : 'ok';

  const { error: e4 } = await admin.from('wet_lab_sessions').delete().eq('resident_email', residentEmail);
  results.wet_lab_sessions = e4 ? e4.message : 'ok';

  const { error: e5 } = await admin.from('profiles').delete().eq('id', residentId);
  results.profile = e5 ? e5.message : 'ok';

  const { error: e6 } = await admin.auth.admin.deleteUser(residentId);
  results.auth_user = e6 ? e6.message : 'ok';

  const allOk = Object.values(results).every(v => v === 'ok');
  return NextResponse.json({ success: allOk, results });
}
