importScripts('../lib/constants.js');

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(A2B_STORAGE_KEY, (result) => {
    if (!result[A2B_STORAGE_KEY]) {
      chrome.storage.local.set({ [A2B_STORAGE_KEY]: [] });
    }
  });
});
