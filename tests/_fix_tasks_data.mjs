import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tasks = [
  {
    task_name: 'הכרת המיקרוסקופ',
    description: 'הכרות עם תפעול המיקרוסקופ הניתוחי',
    order: 1,
  },
  {
    task_name: 'הכרת מכשיר פאקו',
    description: 'הכרות עם תפעול מכשיר הפאקואמולסיפיקציה',
    order: 2,
  },
  {
    task_name: 'הכרת כלי הניתוח',
    description: 'הכרות עם כלי הניתוח השונים וייעודם',
    order: 3,
  },
  {
    task_name: 'קריאת ספר פאקו',
    description: 'קריאת חומר תיאורטי על ניתוח פאקו',
    order: 4,
  },
  {
    task_name: 'תרגול בעיניים מלאכותיות',
    description: 'תרגול מעשי על עיניים מלאכותיות (Wet Lab)',
    order: 5,
  },
];

async function updateTasks() {
  // Step 1: Delete all existing task completions (foreign key constraint)
  console.log('1. Deleting existing task_completions...');
  const { error: compErr } = await supabase
    .from('task_completions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (compErr) {
    console.log('   Warning:', compErr.message);
  } else {
    console.log('   Done.');
  }

  // Step 2: Delete all existing tasks
  console.log('2. Deleting existing one_time_tasks...');
  const { error: delErr } = await supabase
    .from('one_time_tasks')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) {
    console.error('   DELETE failed:', delErr.message);
    return;
  }
  console.log('   Done.');

  // Step 3: Insert new tasks
  console.log('3. Inserting 5 new tasks...');
  const { data, error: insErr } = await supabase
    .from('one_time_tasks')
    .insert(tasks)
    .select();
  if (insErr) {
    console.error('   INSERT failed:', insErr.message, insErr.details, insErr.hint);
    return;
  }
  console.log(`   Inserted ${data.length} tasks.`);

  // Step 4: Verify
  console.log('4. Verifying...');
  const { data: verify } = await supabase
    .from('one_time_tasks')
    .select('*')
    .order('order');
  for (const t of verify) {
    console.log(`   [${t.order}] ${t.task_name} | ${t.description || 'NO DESC'}`);
  }
  console.log(`   Total: ${verify.length} tasks`);
}

updateTasks().catch(console.error);
