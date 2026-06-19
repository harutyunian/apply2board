(function () {
  if (window.__a2bInitialized) return;
  window.__a2bInitialized = true;

  const SHADOW_HOST_ID = 'a2b-extension-root';

  function createShadowRoot() {
    const host = document.createElement('div');
    host.id = SHADOW_HOST_ID;
    host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;';
    document.documentElement.appendChild(host);
    return host.attachShadow({ mode: 'closed' });
  }

  function buildStatusOptions(selected) {
    return A2B_STATUSES.map(
      (s) => `<option value="${s.id}" ${s.id === selected ? 'selected' : ''}>${s.label}</option>`
    ).join('');
  }

  function truncate(text, max = 120) {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  class Apply2BoardUI {
    constructor(shadow) {
      this.shadow = shadow;
      this.isOpen = false;
      this.existingJob = null;
      this.extracted = A2B_EXTRACTOR.extractAll();
      this.render();
      this.checkExistingJob();
    }

    render() {
      this.shadow.innerHTML = `
        <style>${this.getStyles()}</style>
        <button class="a2b-fab" id="a2b-fab" title="Save to Apply2Board">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="9" rx="1"/>
            <rect x="14" y="3" width="7" height="5" rx="1"/>
            <rect x="14" y="12" width="7" height="9" rx="1"/>
            <rect x="3" y="16" width="7" height="5" rx="1"/>
          </svg>
          <span class="a2b-fab-label">Save Job</span>
        </button>
        <div class="a2b-overlay" id="a2b-overlay" hidden>
          <div class="a2b-modal" role="dialog" aria-labelledby="a2b-modal-title">
            <div class="a2b-modal-header">
              <h2 id="a2b-modal-title">Save Job</h2>
              <button class="a2b-close" id="a2b-close" aria-label="Close">&times;</button>
            </div>
            <form class="a2b-form" id="a2b-form">
              <div class="a2b-field">
                <label for="a2b-title">Job Title</label>
                <input type="text" id="a2b-title" name="title" placeholder="Software Engineer" required />
              </div>
              <div class="a2b-field">
                <label for="a2b-company">Company</label>
                <input type="text" id="a2b-company" name="company" placeholder="Acme Inc." />
              </div>
              <div class="a2b-field">
                <label for="a2b-link">Link</label>
                <input type="url" id="a2b-link" name="link" placeholder="https://..." />
              </div>
              <div class="a2b-field">
                <label for="a2b-status">Status</label>
                <select id="a2b-status" name="status">${buildStatusOptions('saved')}</select>
              </div>
              <div class="a2b-field">
                <label for="a2b-salary">Salary <span class="a2b-optional">(optional)</span></label>
                <input type="text" id="a2b-salary" name="salary" placeholder="$120,000 – $150,000" />
              </div>
              <div class="a2b-field">
                <label for="a2b-notes">Notes</label>
                <textarea id="a2b-notes" name="notes" rows="3" placeholder="Add notes about this role..."></textarea>
              </div>
              <div class="a2b-actions">
                <button type="button" class="a2b-btn a2b-btn-secondary" id="a2b-cancel">Cancel</button>
                <button type="submit" class="a2b-btn a2b-btn-primary" id="a2b-submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      `;

      this.fab = this.shadow.getElementById('a2b-fab');
      this.overlay = this.shadow.getElementById('a2b-overlay');
      this.form = this.shadow.getElementById('a2b-form');
      this.bindEvents();
      this.prefillForm();
    }

    getStyles() {
      return `
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .a2b-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          background: #4f46e5;
          color: #fff;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 4px 20px rgba(79, 70, 229, 0.45);
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
          z-index: 2147483647;
        }
        .a2b-fab:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(79, 70, 229, 0.55); background: #4338ca; }
        .a2b-fab:active { transform: translateY(0); }
        .a2b-fab.saved { background: #059669; box-shadow: 0 4px 20px rgba(5, 150, 105, 0.45); }
        .a2b-fab.saved:hover { background: #047857; }
        .a2b-fab.active { background: #4338ca; transform: scale(0.96); }
        .a2b-fab-label { white-space: nowrap; }
        .a2b-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 2147483647;
          animation: a2b-fade-in 0.2s ease;
        }
        .a2b-overlay[hidden] { display: none; }
        @keyframes a2b-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes a2b-slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .a2b-modal {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 440px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          animation: a2b-slide-up 0.25s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .a2b-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 0;
        }
        .a2b-modal-header h2 { font-size: 18px; font-weight: 700; color: #0f172a; }
        .a2b-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #94a3b8;
          cursor: pointer;
          line-height: 1;
          padding: 4px;
        }
        .a2b-close:hover { color: #475569; }
        .a2b-form { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 14px; }
        .a2b-field { display: flex; flex-direction: column; gap: 5px; }
        .a2b-field label { font-size: 13px; font-weight: 600; color: #334155; }
        .a2b-optional { font-weight: 400; color: #94a3b8; }
        .a2b-field input, .a2b-field select, .a2b-field textarea {
          padding: 10px 12px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
          background: #fff;
          transition: border-color 0.15s;
          outline: none;
        }
        .a2b-field input:focus, .a2b-field select:focus, .a2b-field textarea:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
        }
        .a2b-field textarea { resize: vertical; min-height: 72px; }
        .a2b-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
        .a2b-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          font-family: inherit;
          transition: background 0.15s;
        }
        .a2b-btn-primary { background: #4f46e5; color: #fff; }
        .a2b-btn-primary:hover { background: #4338ca; }
        .a2b-btn-secondary { background: #f1f5f9; color: #475569; }
        .a2b-btn-secondary:hover { background: #e2e8f0; }
      `;
    }

    bindEvents() {
      this.fab.addEventListener('click', () => this.openModal());
      this.shadow.getElementById('a2b-close').addEventListener('click', () => this.closeModal());
      this.shadow.getElementById('a2b-cancel').addEventListener('click', () => this.closeModal());
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.closeModal();
      });
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) this.closeModal();
      });
    }

    prefillForm() {
      const { title, company, link, salary, description } = this.extracted;
      this.shadow.getElementById('a2b-title').value = title;
      this.shadow.getElementById('a2b-company').value = company;
      this.shadow.getElementById('a2b-link').value = link;
      this.shadow.getElementById('a2b-salary').value = salary;
      if (description) {
        this.shadow.getElementById('a2b-notes').placeholder = truncate(description, 200);
      }
    }

    async checkExistingJob() {
      this.existingJob = await a2bGetJobByUrl(window.location.href);
      if (this.existingJob) {
        this.setSavedState();
      }
    }

    setSavedState() {
      this.fab.classList.add('saved');
      this.shadow.querySelector('.a2b-fab-label').textContent = 'Saved ✔';
    }

    openModal() {
      this.isOpen = true;
      this.fab.classList.add('active');
      this.overlay.hidden = false;

      if (this.existingJob) {
        this.shadow.getElementById('a2b-title').value = this.existingJob.title;
        this.shadow.getElementById('a2b-company').value = this.existingJob.company;
        this.shadow.getElementById('a2b-link').value = this.existingJob.link;
        this.shadow.getElementById('a2b-status').value = this.existingJob.status;
        this.shadow.getElementById('a2b-salary').value = this.existingJob.salary;
        this.shadow.getElementById('a2b-notes').value = this.existingJob.notes;
        this.shadow.getElementById('a2b-modal-title').textContent = 'Update Job';
        this.shadow.getElementById('a2b-submit').textContent = 'Update';
      }
    }

    closeModal() {
      this.isOpen = false;
      this.fab.classList.remove('active');
      this.overlay.hidden = true;
    }

    async handleSubmit(e) {
      e.preventDefault();
      const submitBtn = this.shadow.getElementById('a2b-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving…';

      const data = {
        title: this.shadow.getElementById('a2b-title').value.trim(),
        company: this.shadow.getElementById('a2b-company').value.trim(),
        link: this.shadow.getElementById('a2b-link').value.trim(),
        status: this.shadow.getElementById('a2b-status').value,
        salary: this.shadow.getElementById('a2b-salary').value.trim(),
        notes: this.shadow.getElementById('a2b-notes').value.trim()
      };

      try {
        if (this.existingJob) {
          await a2bUpdateJob(this.existingJob.id, data);
        } else {
          this.existingJob = await a2bAddJob(data);
        }
        this.setSavedState();
        this.closeModal();
      } catch (err) {
        console.error('[Apply2Board] Save failed:', err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = this.existingJob ? 'Update' : 'Save';
      }
    }
  }

  const shadow = createShadowRoot();
  new Apply2BoardUI(shadow);
})();
