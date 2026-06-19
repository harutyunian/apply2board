importScripts('../lib/constants.js', '../lib/settings.js', '../lib/gemini.js');

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get([A2B_STORAGE_KEY, A2B_DOCUMENTS_KEY, A2B_SETTINGS_KEY], (result) => {
    const updates = {};
    if (!result[A2B_STORAGE_KEY]) updates[A2B_STORAGE_KEY] = [];
    if (!result[A2B_DOCUMENTS_KEY]) updates[A2B_DOCUMENTS_KEY] = [];
    if (!result[A2B_SETTINGS_KEY]) {
      updates[A2B_SETTINGS_KEY] = a2bNormalizeSettings({});
    }
    if (Object.keys(updates).length) chrome.storage.local.set(updates);
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'A2B_GENERATE_COVER_LETTER') {
    a2bGenerateCoverLetter(message.payload?.jobContext, message.payload?.selectedText)
      .then((text) => sendResponse({ ok: true, text }))
      .catch((err) => sendResponse({ ok: false, error: err.message || 'Generation failed' }));
    return true;
  }

  if (message.type === 'A2B_ANSWER_QUESTIONS') {
    a2bGenerateAnswers(message.payload?.jobContext, message.payload?.selectedText)
      .then((text) => sendResponse({ ok: true, text }))
      .catch((err) => sendResponse({ ok: false, error: err.message || 'Generation failed' }));
    return true;
  }

  if (message.type === 'A2B_CHECK_GEMINI') {
    a2bHasGeminiKey()
      .then((configured) => sendResponse({ ok: true, configured }))
      .catch(() => sendResponse({ ok: true, configured: false }));
    return true;
  }
});
