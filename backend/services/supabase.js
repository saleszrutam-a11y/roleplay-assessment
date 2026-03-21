const { createClient } = require('@supabase/supabase-js');

let supabase = null;
let initialized = false;

function getClient() {
  if (initialized) return supabase;
  initialized = true;

  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log('Supabase client initialized');
  } else {
    console.warn('Supabase not configured — sessions will not persist');
  }
  return supabase;
}

async function createSession() {
  const client = getClient();
  if (!client) {
    const mockId = require('uuid').v4();
    return { id: mockId };
  }

  const { data, error } = await client
    .from('sessions')
    .insert({ status: 'in_progress' })
    .select('id')
    .single();

  if (error) {
    console.error('Supabase createSession error:', error.message);
    return { id: require('uuid').v4() };
  }
  return data;
}

async function getSession(id) {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Supabase getSession error:', error.message);
    return null;
  }
  return data;
}

async function updateSession(id, updates) {
  const client = getClient();
  if (!client) return;

  const { error } = await client
    .from('sessions')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Supabase updateSession error:', error.message);
  }
}

async function saveScores(id, scores, transcript, duration_seconds) {
  const client = getClient();
  if (!client) {
    console.warn('Supabase not configured — scores not saved');
    return;
  }

  const { error } = await client
    .from('sessions')
    .update({
      total_score: scores.total_score,
      scores: scores,
      transcript: transcript,
      duration_seconds: duration_seconds,
      status: 'completed',
      performance_label: scores.performance_label,
    })
    .eq('id', id);

  if (error) {
    console.error('Supabase saveScores error:', error.message);
  }
}

module.exports = { createSession, getSession, updateSession, saveScores };
