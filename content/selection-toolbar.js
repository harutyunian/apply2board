(function () {
  if (window.__a2bSelectionInit) return;
  window.__a2bSelectionInit = true;

  const HOST_ID = 'a2b-selection-root';
  const MIN_SELECTION_COVER = 30;
  const MIN_SELECTION_ANSWER = 10;

  function createHost() {
    const host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = 'all:initial;position:fixed;z-index:2147483646;pointer-events:none;';
    document.documentElement.appendChild(host);
    return host.attachShadow({ mode: 'closed' });
  }

  function isInsideExtension(node) {
    if (!node) return false;
    const host = document.getElementById(HOST_ID);
    const saveHost = document.getElementById('a2b-extension-root');
    let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    while (el) {
      if (el === host || el === saveHost) return true;
      el = el.parentElement;
    }
    return false;
  }

  class SelectionToolbar {
    constructor(shadow) {
      this.shadow = shadow;
      this.toolbar = null;
      this.resultOverlay = null;
      this.lastText = '';
      this.mode = 'cover';
      this.hideTimer = null;
      this.render();
      this.bindDocumentEvents();
    }

    render() {
      this.shadow.innerHTML = `<style>${this.styles()}</style>
        <div class="a2b-sel-toolbar" id="a2b-sel-toolbar" hidden>
          <button type="button" class="a2b-sel-btn a2b-sel-btn-cover" id="a2b-gen-cover">✨ Cover Letter</button>
          <button type="button" class="a2b-sel-btn a2b-sel-btn-answer" id="a2b-gen-answer">💬 Answer</button>
        </div>
        <div class="a2b-cl-overlay" id="a2b-cl-overlay" hidden>
          <div class="a2b-cl-modal" role="dialog">
            <div class="a2b-cl-header">
              <h2 id="a2b-result-title">Result</h2>
              <button type="button" class="a2b-cl-close" id="a2b-cl-close">&times;</button>
            </div>
            <div class="a2b-cl-loading" id="a2b-cl-loading" hidden>
              <div class="a2b-cl-spinner"></div>
              <p id="a2b-cl-loading-text">Generating…</p>
            </div>
            <div class="a2b-cl-error" id="a2b-cl-error" hidden></div>
            <textarea class="a2b-cl-output" id="a2b-cl-output" rows="14" hidden></textarea>
            <div class="a2b-cl-actions" id="a2b-cl-actions" hidden>
              <button type="button" class="a2b-cl-btn a2b-cl-btn-secondary" id="a2b-cl-copy">Copy</button>
              <button type="button" class="a2b-cl-btn a2b-cl-btn-secondary" id="a2b-cl-regen">Regenerate</button>
              <button type="button" class="a2b-cl-btn a2b-cl-btn-primary" id="a2b-cl-save">Save</button>
            </div>
          </div>
        </div>`;

      this.toolbar = this.shadow.getElementById('a2b-sel-toolbar');
      this.resultOverlay = this.shadow.getElementById('a2b-cl-overlay');

      this.shadow.getElementById('a2b-gen-cover').addEventListener('click', () => this.run('cover'));
      this.shadow.getElementById('a2b-gen-answer').addEventListener('click', () => this.run('answer'));
      this.shadow.getElementById('a2b-cl-close').addEventListener('click', () => this.closeResult());
      this.shadow.getElementById('a2b-cl-copy').addEventListener('click', () => this.copyResult());
      this.shadow.getElementById('a2b-cl-regen').addEventListener('click', () => this.run(this.mode));
      this.shadow.getElementById('a2b-cl-save').addEventListener('click', () => this.saveResult());

      this.resultOverlay.addEventListener('click', (e) => {
        if (e.target === this.resultOverlay) this.closeResult();
      });
    }

    styles() {
      return `
        .a2b-sel-toolbar {
          position: fixed;
          pointer-events: auto;
          transform: translate(-50%, -100%);
          margin-top: -8px;
          display: flex;
          gap: 6px;
          animation: a2b-pop 0.15s ease;
        }
        .a2b-sel-toolbar[hidden] { display: none; }
        @keyframes a2b-pop { from { opacity:0; transform:translate(-50%,-90%); } to { opacity:1; transform:translate(-50%,-100%); } }
        .a2b-sel-btn {
          padding: 8px 14px;
          color: #fff;
          border: none;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          white-space: nowrap;
        }
        .a2b-sel-btn-cover {
          background: #7c3aed;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.45);
        }
        .a2b-sel-btn-cover:hover { background: #6d28d9; }
        .a2b-sel-btn-answer {
          background: #0891b2;
          box-shadow: 0 4px 16px rgba(8, 145, 178, 0.45);
        }
        .a2b-sel-btn-answer:hover { background: #0e7490; }
        .a2b-cl-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          pointer-events: auto;
          z-index: 2147483647;
        }
        .a2b-cl-overlay[hidden] { display: none; }
        .a2b-cl-modal {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 25px 50px rgba(0,0,0,0.25);
        }
        .a2b-cl-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
        .a2b-cl-header h2 { font-size:18px; font-weight:700; color:#0f172a; }
        .a2b-cl-close { background:none; border:none; font-size:26px; color:#94a3b8; cursor:pointer; }
        .a2b-cl-loading { text-align:center; padding:32px 0; color:#64748b; }
        .a2b-cl-spinner {
          width:32px; height:32px; border:3px solid #e2e8f0; border-top-color:#7c3aed;
          border-radius:50%; margin:0 auto 12px; animation:a2b-spin 0.8s linear infinite;
        }
        @keyframes a2b-spin { to { transform:rotate(360deg); } }
        .a2b-cl-error {
          padding:12px; background:#fef2f2; border:1px solid #fecaca; border-radius:8px;
          color:#dc2626; font-size:14px; line-height:1.5;
        }
        .a2b-cl-error[hidden], .a2b-cl-loading[hidden], .a2b-cl-output[hidden], .a2b-cl-actions[hidden] { display:none; }
        .a2b-cl-output {
          width:100%; padding:12px; border:1.5px solid #e2e8f0; border-radius:8px;
          font-size:14px; line-height:1.6; font-family:inherit; resize:vertical; margin-bottom:14px;
        }
        .a2b-cl-actions { display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap; }
        .a2b-cl-btn {
          padding:10px 16px; border-radius:8px; font-size:13px; font-weight:600;
          cursor:pointer; border:none; font-family:inherit;
        }
        .a2b-cl-btn-primary { background:#4f46e5; color:#fff; }
        .a2b-cl-btn-primary:hover { background:#4338ca; }
        .a2b-cl-btn-secondary { background:#f1f5f9; color:#475569; }
        .a2b-cl-btn-secondary:hover { background:#e2e8f0; }
      `;
    }

    bindDocumentEvents() {
      document.addEventListener('mouseup', (e) => {
        if (isInsideExtension(e.target)) return;
        clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => this.onSelectionChange(), 120);
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.hideToolbar();
          this.closeResult();
        }
      });

      document.addEventListener('scroll', () => this.hideToolbar(), true);
    }

    getSelectionText() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return '';
      const text = sel.toString().trim();
      if (!text || isInsideExtension(sel.anchorNode)) return '';
      return text;
    }

    onSelectionChange() {
      const text = this.getSelectionText();
      if (text.length < MIN_SELECTION_ANSWER) {
        this.hideToolbar();
        return;
      }

      const sel = window.getSelection();
      if (!sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) return;

      this.lastText = text;
      this.toolbar.style.left = `${rect.left + rect.width / 2}px`;
      this.toolbar.style.top = `${rect.top}px`;
      this.toolbar.hidden = false;
    }

    hideToolbar() {
      if (this.toolbar) this.toolbar.hidden = true;
    }

    setModeUI(mode) {
      this.mode = mode;
      const title = this.shadow.getElementById('a2b-result-title');
      const loading = this.shadow.getElementById('a2b-cl-loading-text');
      const saveBtn = this.shadow.getElementById('a2b-cl-save');

      if (mode === 'answer') {
        title.textContent = 'Answers';
        loading.textContent = 'Answering with Gemini…';
        saveBtn.textContent = 'Save to notes';
      } else {
        title.textContent = 'Generated Cover Letter';
        loading.textContent = 'Writing cover letter with Gemini…';
        saveBtn.textContent = 'Save to job';
      }
    }

    openResult(mode) {
      this.setModeUI(mode);
      this.hideToolbar();
      this.resultOverlay.hidden = false;
      this.shadow.getElementById('a2b-cl-loading').hidden = false;
      this.shadow.getElementById('a2b-cl-error').hidden = true;
      this.shadow.getElementById('a2b-cl-output').hidden = true;
      this.shadow.getElementById('a2b-cl-actions').hidden = true;
    }

    closeResult() {
      this.resultOverlay.hidden = true;
    }

    showError(message) {
      const errEl = this.shadow.getElementById('a2b-cl-error');
      const settingsUrl = chrome.runtime.getURL('settings/settings.html');
      errEl.innerHTML = `${message}${message.includes('API key') ? `<br><br><a href="${settingsUrl}" target="_blank" style="color:#4f46e5;font-weight:600">Open Settings →</a>` : ''}`;
      errEl.hidden = false;
      this.shadow.getElementById('a2b-cl-loading').hidden = true;
      this.shadow.getElementById('a2b-cl-output').hidden = true;
      this.shadow.getElementById('a2b-cl-actions').hidden = true;
    }

    showResult(text) {
      this.shadow.getElementById('a2b-cl-loading').hidden = true;
      this.shadow.getElementById('a2b-cl-error').hidden = true;
      const output = this.shadow.getElementById('a2b-cl-output');
      output.value = text;
      output.hidden = false;
      this.shadow.getElementById('a2b-cl-actions').hidden = false;
    }

    async run(mode) {
      const minLen = mode === 'answer' ? MIN_SELECTION_ANSWER : MIN_SELECTION_COVER;
      const selectedText = this.lastText || this.getSelectionText();

      if (selectedText.length < minLen) {
        const hint = mode === 'answer'
          ? 'Select the question(s) you want answered (at least 10 characters).'
          : 'Select at least 30 characters of text (your experience or job description).';
        alert(hint);
        return;
      }

      this.lastText = selectedText;
      this.openResult(mode);

      const jobContext = A2B_EXTRACTOR.extractAll();
      const messageType = mode === 'answer' ? 'A2B_ANSWER_QUESTIONS' : 'A2B_GENERATE_COVER_LETTER';

      try {
        const response = await chrome.runtime.sendMessage({
          type: messageType,
          payload: { selectedText, jobContext }
        });

        if (!response?.ok) {
          this.showError(response?.error || 'Generation failed');
          return;
        }

        this.showResult(response.text);
      } catch (err) {
        this.showError(err.message || 'Could not reach extension background');
      }
    }

    async copyResult() {
      const text = this.shadow.getElementById('a2b-cl-output').value;
      try {
        await navigator.clipboard.writeText(text);
        const btn = this.shadow.getElementById('a2b-cl-copy');
        const orig = btn.textContent;
        btn.textContent = 'Copied ✔';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      } catch {
        alert('Copy failed');
      }
    }

    async saveResult() {
      const text = this.shadow.getElementById('a2b-cl-output').value.trim();
      if (!text) return;

      const url = window.location.href;
      let job = await a2bGetJobByUrl(url);
      const saveBtn = this.shadow.getElementById('a2b-cl-save');

      if (this.mode === 'answer') {
        const noteBlock = `--- Q&A (${new Date().toLocaleDateString()}) ---\n${text}`;

        if (job) {
          const notes = job.notes?.trim()
            ? `${job.notes.trimEnd()}\n\n${noteBlock}`
            : noteBlock;
          await a2bUpdateJob(job.id, { notes });
          saveBtn.textContent = 'Saved to notes ✔';
        } else {
          await a2bAddJob({
            ...A2B_EXTRACTOR.extractAll(),
            status: 'saved',
            notes: noteBlock
          });
          saveBtn.textContent = 'Job saved ✔';
        }
        setTimeout(() => { saveBtn.textContent = 'Save to notes'; }, 2000);
        return;
      }

      if (job) {
        await a2bUpdateJob(job.id, {
          coverLetterDocumentId: null,
          coverLetterCustom: text,
          coverLetterCustomType: 'text'
        });
        saveBtn.textContent = 'Saved ✔';
      } else {
        await a2bAddJob({
          ...A2B_EXTRACTOR.extractAll(),
          status: 'saved',
          coverLetterCustom: text,
          coverLetterCustomType: 'text'
        });
        saveBtn.textContent = 'Job saved ✔';
      }
      setTimeout(() => { saveBtn.textContent = 'Save to job'; }, 2000);
    }
  }

  const shadow = createHost();
  new SelectionToolbar(shadow);
})();
