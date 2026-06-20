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
Write the COMPLETE cover letter now — from opening greeting through closing sign-off. Do not stop mid-sentence.`;
}

function a2bExtractGeminiText(data) {
  const candidate = data?.candidates?.[0];

  if (!candidate?.content?.parts?.length) {
    const blockReason = data?.promptFeedback?.blockReason;
    if (blockReason) {
      throw new Error(`Request blocked: ${blockReason}`);
    }
    throw new Error('Gemini returned an empty response. Try again.');
  }

  const parts = candidate.content.parts;
  const finishReason = candidate.finishReason;

  let text = parts
    .filter((p) => p.text && p.thought !== true)
    .map((p) => p.text)
    .join('')
    .trim();

  if (!text) {
    text = parts
      .map((p) => p.text)
      .filter(Boolean)
      .join('')
      .trim();
  }

  if (!text) {
    throw new Error('Gemini returned an empty response. Try again.');
  }

  return { text, truncated: finishReason === 'MAX_TOKENS' };
}

async function a2bFetchGemini(apiKey, model, prompt, generationConfig) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = data?.error?.message || `Gemini API error (${response.status})`;
    throw new Error(msg);
  }

  return data;
}

async function a2bCallGemini(apiKey, model, prompt, options = {}) {
  const baseConfig = {
    temperature: options.temperature ?? 0.75,
    maxOutputTokens: options.maxOutputTokens ?? 8192
  };

  let data;
  try {
    data = await a2bFetchGemini(apiKey, model, prompt, {
      ...baseConfig,
      thinkingConfig: { thinkingBudget: 0 }
    });
  } catch (err) {
    if (String(err.message).includes('thinking')) {
      data = await a2bFetchGemini(apiKey, model, prompt, baseConfig);
    } else {
      throw err;
    }
  }

  const { text, truncated } = a2bExtractGeminiText(data);

  if (truncated) {
    return a2bContinueGemini(apiKey, model, prompt, text, options);
  }

  return text;
}

async function a2bContinueGemini(apiKey, model, originalPrompt, partialText, options = {}) {
  const continuePrompt = `${originalPrompt}

---
You already started writing but were cut off. Here is the incomplete text:

${partialText}

---
Continue EXACTLY where you stopped and finish the rest. Output ONLY the continuation (do not repeat what was already written).`;

  const baseConfig = {
    temperature: options.temperature ?? 0.75,
    maxOutputTokens: options.maxOutputTokens ?? 8192
  };

  let data;
  try {
    data = await a2bFetchGemini(apiKey, model, continuePrompt, {
      ...baseConfig,
      thinkingConfig: { thinkingBudget: 0 }
    });
  } catch {
    data = await a2bFetchGemini(apiKey, model, continuePrompt, baseConfig);
  }

  try {
    const { text: continuation } = a2bExtractGeminiText(data);
    return `${partialText}${continuation}`.trim();
  } catch {
    return partialText;
  }
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

  return a2bCallGemini(settings.geminiApiKey.trim(), settings.geminiModel, prompt, {
    maxOutputTokens: 8192
  });
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
Answer ALL questions completely. Do not stop mid-answer.`;
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

  return a2bCallGemini(settings.geminiApiKey.trim(), settings.geminiModel, prompt, {
    maxOutputTokens: 8192
  });
}
