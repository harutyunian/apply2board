importScripts('../lib/constants.js');

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get([A2B_STORAGE_KEY, A2B_DOCUMENTS_KEY], (result) => {
    const updates = {};
    if (!result[A2B_STORAGE_KEY]) updates[A2B_STORAGE_KEY] = [];
    if (!result[A2B_DOCUMENTS_KEY]) updates[A2B_DOCUMENTS_KEY] = [];
    if (Object.keys(updates).length) chrome.storage.local.set(updates);
  });
});
