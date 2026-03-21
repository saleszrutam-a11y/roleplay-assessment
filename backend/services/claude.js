const Anthropic = require('@anthropic-ai/sdk');
const { getRahulPersonaPrompt } = require('../prompts/rahul_persona');
const { getDigressionPrompt } = require('../prompts/digression');
const { getScoringPrompt } = require('../prompts/scoring');

let client = null;
let initialized = false;

// Try multiple model names — availability depends on API plan
const MODELS = [
  'claude-sonnet-4-5-20250514',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-latest',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
];

function getClient() {
  if (initialized) return client;
  initialized = true;

  if (process.env.ANTHROPIC_API_KEY) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    console.log('Claude client initialized');
  } else {
    console.warn('ANTHROPIC_API_KEY not set — Claude integration disabled, using mock responses');
  }
  return client;
}

// Cache the working model so we don't retry failed models every call
let workingModel = null;

async function callClaude(prompt, maxTokens = 300) {
  const cl = getClient();
  if (!cl) return null;

  // If we already found a working model, use it directly
  if (workingModel) {
    try {
      const response = await cl.messages.create({
        model: workingModel,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });
      return response.content[0].text.trim();
    } catch (err) {
      console.error(`Working model ${workingModel} failed:`, err.message);
      workingModel = null; // Reset and try all models
    }
  }

  // Try each model until one works
  for (const model of MODELS) {
    try {
      console.log('Trying model:', model);
      const response = await cl.messages.create({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });
      console.log('✓ Model working:', model);
      workingModel = model; // Cache for future calls
      return response.content[0].text.trim();
    } catch (err) {
      console.error(`✗ Model ${model} failed:`, err.message);
    }
  }

  console.error('All models failed — no Claude model available');
  return null;
}

async function getRahulResponse(conversationHistory, agentMessage) {
  const prompt = getRahulPersonaPrompt(conversationHistory, agentMessage);

  const response = await callClaude(prompt, 200);
  if (response) return response;

  // Mock fallback
  const fallbacks = [
    "Hello, I need some help. My phone was stolen this morning at the metro station and I need a new SIM card.",
    "My number is 98765-43210. I've had it for about 7 years now.",
    "Yes, here's my Aadhaar card. You can check — last four digits are 7834.",
    "Achha, okay. So how long will this whole process take?",
    "Thank you so much, you've been really helpful.",
  ];
  const idx = Math.min(Math.floor(conversationHistory.length / 2), fallbacks.length - 1);
  return fallbacks[idx];
}

async function checkDigression(message) {
  const prompt = getDigressionPrompt(message);

  const response = await callClaude(prompt, 10);
  if (response) {
    return response.toUpperCase().includes('NO');
  }

  return false;
}

async function scoreSession(transcript, rubric) {
  const prompt = getScoringPrompt(transcript, rubric);

  console.log('Scoring session with', transcript.length, 'transcript entries');
  const response = await callClaude(prompt, 2000);
  console.log('Scoring raw response:', response ? response.substring(0, 200) + '...' : 'NULL');

  if (response) {
    try {
      // Remove markdown code fences and any leading/trailing text
      let cleaned = response;
      // Remove ```json ... ``` wrapping
      cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      // Extract JSON object if there's surrounding text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }
      cleaned = cleaned.trim();
      console.log('Cleaned JSON (first 200 chars):', cleaned.substring(0, 200));
      const parsed = JSON.parse(cleaned);
      console.log('Scoring parsed successfully, total_score:', parsed.total_score);
      return parsed;
    } catch (e) {
      console.error('Failed to parse scoring JSON:', e.message);
      console.error('Raw response was:', response);
      // Retry with stricter instructions
      const retry = await callClaude(prompt + '\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no explanation, no code fences. Start with { and end with }.', 2000);
      console.log('Retry raw response:', retry ? retry.substring(0, 200) + '...' : 'NULL');
      if (retry) {
        try {
          let cleanedRetry = retry;
          cleanedRetry = cleanedRetry.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          const jsonMatch = cleanedRetry.match(/\{[\s\S]*\}/);
          if (jsonMatch) cleanedRetry = jsonMatch[0];
          cleanedRetry = cleanedRetry.trim();
          const parsed = JSON.parse(cleanedRetry);
          console.log('Retry parsed successfully, total_score:', parsed.total_score);
          return parsed;
        } catch (e2) {
          console.error('Retry also failed:', e2.message);
          console.error('Retry response was:', retry);
        }
      }
    }
  } else {
    console.error('Claude returned NULL for scoring — API key may be invalid or out of credits');
  }

  // Mock fallback scoring
  console.warn('Using MOCK fallback scoring (score 72)');
  return {
    total_score: 72,
    max_score: 100,
    criteria_scores: rubric.map((r) => ({
      id: r.id,
      criterion: r.criterion,
      score: Math.round(r.max_points * 0.72),
      max_points: r.max_points,
      feedback: `Assessment unavailable — Claude API not configured.`,
    })),
    overall_feedback: 'Scoring unavailable — please configure the ANTHROPIC_API_KEY to enable AI-powered assessment.',
    performance_label: 'Satisfactory',
  };
}

module.exports = { getRahulResponse, checkDigression, scoreSession };
