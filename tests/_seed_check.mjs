import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const EMAIL = 'tomliba1996@gmail.com';

async function main() {
  // Check one_time_tasks
  const { data: tasks } = await sb.from('one_time_tasks').select('*').order('order');
  console.log('one_time_tasks count:', tasks?.length || 0);

  if (!tasks || tasks.length === 0) {
    console.log('Seeding tasks...');
    const { error } = await sb.from('one_time_tasks').insert([
      { task_name: 'השלמת קורס מבוא לקטרקט', order: 1 },
      { task_name: 'צפייה ב-10 ניתוחי קטרקט', order: 2 },
      { task_name: 'תרגול 5 רקסיס בוטלאב', order: 3 },
      { task_name: 'ביצוע ניתוח סולו ראשון', order: 4 },
      { task_name: 'השתתפות בישיבת שמיים', order: 5 },
    ]);
    if (error) console.error('Seed tasks failed:', error.message);
    else console.log('Tasks seeded.');
  } else {
    console.log('Tasks already seeded:', tasks.map(t => t.task_name).join(', '));
  }

  // Check profile
  const { data: profile } = await sb.from('profiles').select('*').eq('email', EMAIL).single();
  console.log('Profile:', profile ? `full_name="${profile.full_name}", role="${profile.role}"` : 'NOT FOUND');

  if (profile && profile.full_name !== 'tom liba') {
    const { error } = await sb.from('profiles').update({ full_name: 'tom liba' }).eq('email', EMAIL);
    if (error) console.error('Profile update failed:', error.message);
    else console.log('Profile full_name updated to tom liba');
  }

  console.log('Seed check complete.');
}

main().catch(console.error);
