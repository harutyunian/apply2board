function a2bNormalizeSettings(raw) {
  const model = a2bMigrateGeminiModel(raw?.geminiModel);
  return {
    geminiApiKey: raw?.geminiApiKey || '',
    geminiModel: model,
    coverLetterInstructions:
      raw?.coverLetterInstructions || A2B_DEFAULT_COVER_LETTER_INSTRUCTIONS,
    qaInstructions: raw?.qaInstructions || A2B_DEFAULT_QA_INSTRUCTIONS,
    candidateProfile: raw?.candidateProfile || ''
  };
}

async function a2bGetSettings() {
  const result = await chrome.storage.local.get(A2B_SETTINGS_KEY);
  const normalized = a2bNormalizeSettings(result[A2B_SETTINGS_KEY]);
  if (result[A2B_SETTINGS_KEY]?.geminiModel !== normalized.geminiModel) {
    await chrome.storage.local.set({ [A2B_SETTINGS_KEY]: normalized });
  }
  return normalized;
}

async function a2bSaveSettings(settings) {
  const normalized = a2bNormalizeSettings(settings);
  await chrome.storage.local.set({ [A2B_SETTINGS_KEY]: normalized });
  return normalized;
}

async function a2bHasGeminiKey() {
  const settings = await a2bGetSettings();
  return Boolean(settings.geminiApiKey.trim());
}
