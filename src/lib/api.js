import { createClient } from '@/lib/supabase/client';

function parseSort(sortField) {
  if (!sortField) return null;
  if (sortField.startsWith('-')) {
    return { column: sortField.slice(1), ascending: false };
  }
  return { column: sortField, ascending: true };
}

function makeEntity(tableName) {
  return {
    async list(sortField) {
      const supabase = createClient();
      let query = supabase.from(tableName).select('*');
      const sort = parseSort(sortField);
      if (sort) {
        query = query.order(sort.column, { ascending: sort.ascending });
      }
      const { data, error } = await query;
      if (error) {
        console.error('Supabase error:', tableName, error.message, error.details, error.hint);
        throw new Error(error.message);
      }
      return data;
    },

    async filter(where, sortField) {
      const supabase = createClient();
      let query = supabase.from(tableName).select('*');
      for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value);
      }
      const sort = parseSort(sortField);
      if (sort) {
        query = query.order(sort.column, { ascending: sort.ascending });
      }
      const { data, error } = await query;
      if (error) {
        console.error('Supabase error:', tableName, error.message, error.details, error.hint);
        throw new Error(error.message);
      }
      return data;
    },

    async create(record) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(tableName)
        .insert(record)
        .select()
        .single();
      if (error) {
        console.error('Supabase error:', tableName, error.message, error.details, error.hint);
        throw new Error(error.message);
      }
      return data;
    },

    async update(id, record) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(tableName)
        .update(record)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Supabase error:', tableName, error.message, error.details, error.hint);
        throw new Error(error.message);
      }
      return data;
    },

    async delete(id) {
      const supabase = createClient();
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Supabase error:', tableName, error.message, error.details, error.hint);
        throw new Error(error.message);
      }
    },
  };
}

export const Surgery = makeEntity('surgeries');
export const OneTimeTask = makeEntity('one_time_tasks');
export const TaskCompletion = makeEntity('task_completions');
export const VideoReview = makeEntity('video_reviews');
export const WetLabSession = makeEntity('wet_lab_sessions');
export const User = makeEntity('profiles');

export const entities = {
  Surgery,
  OneTimeTask,
  TaskCompletion,
  VideoReview,
  WetLabSession,
  User,
};

export const auth = {
  async me() {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();
    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || null,
      role: profile?.role || 'resident',
    };
  },

  async logout(redirectHref) {
    const supabase = createClient();
    await supabase.auth.signOut();
    if (redirectHref) {
      window.location.href = redirectHref;
    } else {
      window.location.href = '/login';
    }
  },

  redirectToLogin(returnUrl) {
    window.location.href = '/login';
  },
};
