(async function () {
  const form = document.getElementById('settings-form');
  const apiKeyInput = document.getElementById('gemini-api-key');
  const modelSelect = document.getElementById('gemini-model');
  const instructionsInput = document.getElementById('cover-instructions');
  const qaInstructionsInput = document.getElementById('qa-instructions');
  const profileInput = document.getElementById('candidate-profile');
  const keyStatus = document.getElementById('key-status');
  const saveMsg = document.getElementById('save-msg');
  const toggleKeyBtn = document.getElementById('toggle-key');

  modelSelect.innerHTML = A2B_GEMINI_MODELS.map(
    (m) => `<option value="${m.id}">${m.label}</option>`
  ).join('');

  function updateKeyStatus(key) {
    if (key.trim()) {
      keyStatus.textContent = 'API key configured ✔';
      keyStatus.classList.add('configured');
    } else {
      keyStatus.textContent = 'Not configured';
      keyStatus.classList.remove('configured');
    }
  }

  async function loadSettings() {
    const settings = await a2bGetSettings();
    apiKeyInput.value = settings.geminiApiKey;
    modelSelect.value = settings.geminiModel;
    instructionsInput.value = settings.coverLetterInstructions;
    qaInstructionsInput.value = settings.qaInstructions;
    profileInput.value = settings.candidateProfile;
    updateKeyStatus(settings.geminiApiKey);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await a2bSaveSettings({
      geminiApiKey: apiKeyInput.value.trim(),
      geminiModel: modelSelect.value,
      coverLetterInstructions: instructionsInput.value.trim() || A2B_DEFAULT_COVER_LETTER_INSTRUCTIONS,
      qaInstructions: qaInstructionsInput.value.trim() || A2B_DEFAULT_QA_INSTRUCTIONS,
      candidateProfile: profileInput.value.trim()
    });
    updateKeyStatus(apiKeyInput.value);
    saveMsg.hidden = false;
    setTimeout(() => { saveMsg.hidden = true; }, 2500);
  });

  toggleKeyBtn.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    toggleKeyBtn.textContent = isPassword ? 'Hide' : 'Show';
  });

  document.getElementById('reset-instructions').addEventListener('click', () => {
    instructionsInput.value = A2B_DEFAULT_COVER_LETTER_INSTRUCTIONS;
  });

  document.getElementById('reset-qa-instructions').addEventListener('click', () => {
    qaInstructionsInput.value = A2B_DEFAULT_QA_INSTRUCTIONS;
  });

  loadSettings();
})();
