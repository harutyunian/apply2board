function a2bBuildCoverLetterPrompt(instructions, jobContext, selectedText, candidateProfile) {
  const job = jobContext || {};
  const profileParts = [];
  if (selectedText?.trim()) {
    profileParts.push('SELECTED TEXT FROM PAGE (candidate background / relevant experience):', selectedText.trim());
  }
  if (candidateProfile?.trim()) {
    profileParts.push('CANDIDATE PROFILE (from settings):', candidateProfile.trim());
  }

  return `${instructions.trim()}

---
JOB POSTING:
Job title: ${job.title || 'Unknown'}
Company: ${job.company || 'Unknown'}
URL: ${job.link || 'Unknown'}
${job.salary ? `Salary: ${job.salary}` : ''}

Job description excerpt:
${(job.description || 'Not available').slice(0, 3000)}

---
${profileParts.length ? profileParts.join('\n\n') : 'CANDIDATE BACKGROUND: Not provided — write a general cover letter based on the job posting only.'}

---
Write the cover letter now.`;
}

async function a2bCallGemini(apiKey, model, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 2048
      }
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = data?.error?.message || `Gemini API error (${response.status})`;
    throw new Error(msg);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned an empty response. Try again.');
  }

  return text.trim();
}

async function a2bGenerateCoverLetter(jobContext, selectedText) {
  const settings = await a2bGetSettings();

  if (!settings.geminiApiKey.trim()) {
    throw new Error('Gemini API key not configured. Open Settings and add your key.');
  }

  const prompt = a2bBuildCoverLetterPrompt(
    settings.coverLetterInstructions,
    jobContext,
    selectedText,
    settings.candidateProfile
  );

  return a2bCallGemini(settings.geminiApiKey.trim(), settings.geminiModel, prompt);
}

function a2bBuildQAPrompt(instructions, jobContext, selectedText, candidateProfile) {
  const job = jobContext || {};

  return `${instructions.trim()}

---
JOB CONTEXT:
Job title: ${job.title || 'Unknown'}
Company: ${job.company || 'Unknown'}
URL: ${job.link || 'Unknown'}
${job.salary ? `Salary: ${job.salary}` : ''}

Job description excerpt:
${(job.description || 'Not available').slice(0, 2000)}

---
CANDIDATE PROFILE:
${candidateProfile?.trim() || 'Not provided in settings.'}

---
QUESTIONS / TEXT SELECTED BY USER:
${selectedText.trim()}

---
Answer the question(s) now.`;
}

async function a2bGenerateAnswers(jobContext, selectedText) {
  const settings = await a2bGetSettings();

  if (!settings.geminiApiKey.trim()) {
    throw new Error('Gemini API key not configured. Open Settings and add your key.');
  }

  const prompt = a2bBuildQAPrompt(
    settings.qaInstructions,
    jobContext,
    selectedText,
    settings.candidateProfile
  );

  return a2bCallGemini(settings.geminiApiKey.trim(), settings.geminiModel, prompt);
}
