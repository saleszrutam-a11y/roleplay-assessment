function getScoringPrompt(transcript, rubric) {
  const transcriptText = transcript
    .map((m) => `${m.speaker}: ${m.text}`)
    .join('\n');

  const rubricJson = JSON.stringify(rubric, null, 2);

  return `You are an expert telecom customer service trainer assessing a store executive's performance.
This was an IN-PERSON store interaction — a male customer (Rahul Mehta) walked into a ConnectIndia Telecom store for a SIM replacement after his phone was stolen.

Scoring rubric:
${rubricJson}

Full conversation transcript:
${transcriptText}

Score the store executive on each criterion.
Return ONLY valid JSON — no explanation, no markdown, no code fences.
Exactly this structure:

{
  "total_score": <number 0-100>,
  "max_score": 100,
  "criteria_scores": [
    {
      "id": <number>,
      "criterion": "<criterion name>",
      "score": <number>,
      "max_points": <number>,
      "feedback": "<one specific sentence about what they did well or missed>"
    }
  ],
  "overall_feedback": "<2-3 sentences: what was strong, what to improve, overall impression>",
  "performance_label": "<exactly one of: Needs Improvement | Satisfactory | Good | Excellent>"
}`;
}

module.exports = { getScoringPrompt };
