// AI Prompt template
// This is the place to customize the prompt

const generateAnalysisPrompt = (projectData, newExtractedText) => {
  return `
You are an expert IT Project Manager and Consultant.
You are helping to extract requirements from a client's document or transcript.

### Current Project State
${JSON.stringify(projectData, null, 2)}

### New Uploaded Content (Transcript / Document)
${newExtractedText}

### Task
Analyze the new content and update the project state.
1. Extract any new "Detected Info" (platform, budget, specific features).
2. Remove any "Missing Info" if it has been answered.
3. Suggest new "Missing Info" or "Recommended Questions" if the new content reveals new ambiguities.
4. Estimate a new "completion" percentage (0-100).
5. Generate a "draft" of the job posting based on current knowledge.

Respond ONLY with a valid JSON object matching the following schema:
{
  "completion": number,
  "detected": { ... },
  "missing": [ { "title": string, "priority": number } ],
  "recommendedQuestions": [ { "question": string, "reason": string, "priority": number } ],
  "draft": string
}
  `.trim();
};

module.exports = {
  generateAnalysisPrompt,
};
