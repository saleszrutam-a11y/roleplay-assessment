function getScoringPrompt(transcript, rubric) {
  const transcriptText = transcript
    .map((m) => `${m.speaker}: ${m.text}`)
    .join('\n');

  const rubricJson = JSON.stringify(rubric, null, 2);

  return `You are a STRICT telecom customer service trainer assessing a store executive's performance.
This was an IN-PERSON store interaction — a male customer (Rahul Mehta) walked into a ConnectIndia Telecom store for a SIM replacement after his phone was stolen.

CRITICAL SCORING RULES:
- Be STRICT. Only give points for actions the executive CLEARLY and EXPLICITLY performed.
- If a criterion was NOT addressed at all in the conversation, score it 0.
- If the conversation is very short (fewer than 6 exchanges), most criteria were likely NOT covered — score them 0.
- Do NOT give partial credit for vaguely related statements. The action must be specific and clear.
- A greeting alone does NOT earn points for empathy, process explanation, or other criteria.
- total_score MUST equal the exact sum of all individual criterion scores.

Scoring rubric:
${rubricJson}

Full conversation transcript (${transcript.length} messages):
${transcriptText}

Score the store executive on each criterion. Be harsh — real training requires honest feedback.
Return ONLY valid JSON — no explanation, no markdown, no code fences.
Exactly this structure:

{
  "total_score": <number 0-100, must equal sum of all criterion scores>,
  "max_score": 100,
  "criteria_scores": [
    {
      "id": <number>,
      "criterion": "<criterion name>",
      "score": <number, 0 if not addressed>,
      "max_points": <number>,
      "feedback": "<one specific sentence about what they did well or missed>"
    }
  ],
  "overall_feedback": "<2-3 sentences: what was strong, what to improve, overall impression>",
  "performance_label": "<exactly one of: Needs Improvement | Satisfactory | Good | Excellent>"
}`;
}

module.exports = { getScoringPrompt };
