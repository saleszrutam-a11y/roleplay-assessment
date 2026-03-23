const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getRahulResponse, checkDigression, scoreSession } = require('../services/claude');
const { synthesizeRahulVoice } = require('../services/googleTTS');
const { createSession, saveScores, getSession } = require('../services/supabase');
const router = express.Router();

// Rubric data (shared with frontend)
const RUBRIC = [
  { id: 1, criterion: 'Greeting and welcoming', max_points: 8, description: 'Did the executive greet the customer warmly as they walked in, acknowledge their presence, and introduce themselves?' },
  { id: 2, criterion: 'Needs identification', max_points: 8, description: 'Did the executive ask what help the customer needs before jumping to process — let the customer explain the situation?' },
  { id: 3, criterion: 'Identity verification — in person', max_points: 12, description: 'Did the executive ask to see the Aadhaar card physically, verify the details, and confirm the registered mobile number?' },
  { id: 4, criterion: 'Empathy and reassurance', max_points: 10, description: 'Did the executive acknowledge how stressful a stolen phone situation is and reassure the customer they will resolve it quickly?' },
  { id: 5, criterion: 'Process explanation', max_points: 15, description: 'Did the executive clearly explain what will happen — SIM block, new SIM issuance, activation timeline of 2-4 hours?' },
  { id: 6, criterion: 'Charges transparency', max_points: 8, description: 'Did the executive proactively mention the SIM replacement fee before processing, without the customer having to ask?' },
  { id: 7, criterion: 'FIR / police complaint advice', max_points: 7, description: 'Did the executive advise the customer to file a police FIR, or ask if they already have done so?' },
  { id: 8, criterion: 'Number preservation confirmed', max_points: 10, description: 'Did the executive explicitly confirm the mobile number will remain the same on the new SIM?' },
  { id: 9, criterion: 'Reference number and handover', max_points: 12, description: 'Did the executive provide a service reference number, explain the activation window, and properly complete the handover?' },
  { id: 10, criterion: 'Professional close', max_points: 10, description: 'Did the executive ask if anything else is needed, thank the customer sincerely, and close the interaction with a positive impression?' },
];

const SCENARIO = {
  id: 'telecom_sim_change_instore',
  title: 'Walk-In SIM Replacement — Stolen Phone',
  setting: 'In-Store',
  duration_minutes: 5,
  difficulty: 'Intermediate',
  description: 'A male customer walks into your ConnectIndia Telecom store. His phone was stolen this morning. Handle his SIM replacement request following proper protocol.',
  customer: { name: 'Rahul Mehta', age: 'Mid-30s', role: 'Customer (AI)' },
  executive: { role: 'Store Executive (You)' },
};

// In-memory session store (fallback when Supabase not configured)
const sessions = new Map();

// POST /api/session/start
router.post('/start', async (req, res) => {
  try {
    const dbSession = await createSession();
    const session_id = dbSession.id;

    sessions.set(session_id, {
      id: session_id,
      created_at: new Date().toISOString(),
      status: 'in_progress',
      transcript: [],
      scenario_id: SCENARIO.id,
    });

    res.json({ session_id, scenario: SCENARIO, rubric: RUBRIC });
  } catch (err) {
    console.error('Error starting session:', err.message);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// POST /api/session/message
router.post('/message', async (req, res) => {
  try {
    const { session_id, message, conversation_history = [] } = req.body;

    // 1. Check for digression
    const is_digression = await checkDigression(message);

    let response;
    if (is_digression) {
      response = "I think we've gone a bit off track — I'm just here about my SIM replacement.";
    } else {
      // 2. Get Rahul's response
      response = await getRahulResponse(conversation_history, message);
    }

    // 3. Synthesize TTS audio
    let audio_base64 = null;
    try {
      audio_base64 = await synthesizeRahulVoice(response);
      console.log('TTS result:', audio_base64 ? `${audio_base64.length} chars base64` : 'NULL (no audio)');
    } catch (ttsErr) {
      console.error('TTS error (non-fatal):', ttsErr.message);
    }

    // 4. Check if session should naturally end
    const should_end = conversation_history.length >= 14;

    console.log('Sending response:', { response: response.substring(0, 50), hasAudio: !!audio_base64, should_end });
    res.json({
      response,
      audio_base64,
      audio_format: 'mp3',
      is_digression,
      should_end,
    });
  } catch (err) {
    console.error('Error processing message:', err.message);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// POST /api/session/end
router.post('/end', async (req, res) => {
  try {
    const { session_id, transcript = [], duration_seconds = 0 } = req.body;

    // Score with Claude
    const scores = await scoreSession(transcript, RUBRIC);

    // Save to Supabase (non-fatal)
    try {
      await saveScores(session_id, scores, transcript, duration_seconds);
    } catch (saveErr) {
      console.error('Supabase save error (non-fatal):', saveErr.message);
    }

    // Update in-memory store
    if (sessions.has(session_id)) {
      const session = sessions.get(session_id);
      session.status = 'completed';
      session.scores = scores;
      session.transcript = transcript;
      session.duration_seconds = duration_seconds;
    }

    res.json(scores);
  } catch (err) {
    console.error('Error ending session:', err.message);
    res.status(500).json({ error: 'Failed to score session' });
  }
});

// GET /api/session/:id/result
router.get('/:id/result', async (req, res) => {
  try {
    // Try Supabase first
    const dbSession = await getSession(req.params.id);
    if (dbSession) return res.json(dbSession);

    // Fallback to in-memory
    const session = sessions.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (err) {
    console.error('Error fetching session:', err.message);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

module.exports = router;
