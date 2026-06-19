(function () {
  let allJobs = [];
  let allDocuments = [];
  let filteredJobs = [];
  let selectedJobId = null;
  let draggedJobId = null;
  let currentSort = 'date-desc';
  let formMode = 'edit'; // 'add' | 'edit'

  const board = document.getElementById('board');
  const jobCount = document.getElementById('job-count');
  const filterStatus = document.getElementById('filter-status');
  const filterCompany = document.getElementById('filter-company');
  const filterTag = document.getElementById('filter-tag');
  const filterSalaryMin = document.getElementById('filter-salary-min');
  const filterSalaryMax = document.getElementById('filter-salary-max');
  const filterKeywords = document.getElementById('filter-keywords');
  const boardSort = document.getElementById('board-sort');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const detailOverlay = document.getElementById('detail-overlay');
  const editOverlay = document.getElementById('edit-overlay');

  const boardGetEl = (root, id) => document.getElementById(id);

  function refreshAttachmentSelects(job) {
    const j = job || {};
    a2bFillAttachmentFields(document, 'edit-cv', j, allDocuments, A2B_DOC_TYPE_CV, 'cv', boardGetEl);
    a2bFillAttachmentFields(document, 'edit-cl', j, allDocuments, A2B_DOC_TYPE_COVER, 'cl', boardGetEl);
  }

  window.a2bRefreshAttachmentSelects = () => refreshAttachmentSelects(
    selectedJobId ? allJobs.find((j) => j.id === selectedJobId) : {}
  );

  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderAttachmentDetail(label, attachment) {
    if (!attachment) return '';
    if (attachment.contentType === 'link') {
      return `<div class="detail-row"><label>${label}</label><p><a href="${escapeHtml(attachment.content)}" target="_blank" rel="noopener">${escapeHtml(attachment.name)}</a></p></div>`;
    }
    return `<div class="detail-row"><label>${label}</label><p style="white-space:pre-wrap">${escapeHtml(attachment.content)}</p></div>`;
  }

  function renderTagChip(tag) {
    const color = a2bGetTagColor(tag);
    return `<span class="tag" style="background:${color}20;color:${color};border:1px solid ${color}40">${escapeHtml(tag)}</span>`;
  }

  function buildNoteTemplateButtons(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = A2B_NOTE_TEMPLATES.map(
      (t) => `<button type="button" class="template-btn" data-template="${t.id}">${t.label}</button>`
    ).join('');
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-template]');
      if (!btn) return;
      const template = A2B_NOTE_TEMPLATES.find((t) => t.id === btn.dataset.template);
      if (!template) return;
      const textarea = document.getElementById('edit-notes');
      const prefix = textarea.value.trim() ? textarea.value.trimEnd() + '\n\n' : '';
      textarea.value = prefix + template.text;
      textarea.focus();
    });
  }

  function toggleEditAppliedField(status) {
    const field = document.getElementById('edit-applied-field');
    const input = document.getElementById('edit-applied');
    field.hidden = status !== 'applied' && !input.value;
    if (status === 'applied' && !input.value) {
      input.value = a2bTodayDateInput();
    }
  }

  function getFormData() {
    return {
      title: document.getElementById('edit-title').value.trim(),
      company: document.getElementById('edit-company').value.trim(),
      link: document.getElementById('edit-link').value.trim(),
      status: document.getElementById('edit-status').value,
      currency: document.getElementById('edit-currency').value,
      salary: document.getElementById('edit-salary').value.trim(),
      tags: document.getElementById('edit-tags').value,
      notes: document.getElementById('edit-notes').value.trim(),
      appliedAt: document.getElementById('edit-applied').value,
      ...a2bReadAllAttachments(document, 'edit-cv', 'edit-cl', boardGetEl)
    };
  }

  function resetForm(defaultStatus) {
    document.getElementById('edit-title').value = '';
    document.getElementById('edit-company').value = '';
    document.getElementById('edit-link').value = '';
    document.getElementById('edit-status').value = defaultStatus || 'saved';
    document.getElementById('edit-currency').value = 'USD';
    document.getElementById('edit-salary').value = '';
    document.getElementById('edit-tags').value = '';
    document.getElementById('edit-notes').value = '';
    document.getElementById('edit-applied').value = '';
    toggleEditAppliedField(defaultStatus || 'saved');
    refreshAttachmentSelects({});
  }

  function setFormMode(mode) {
    formMode = mode;
    const title = document.getElementById('form-modal-title');
    const submitBtn = document.getElementById('form-submit-btn');
    if (mode === 'add') {
      title.textContent = 'Add Job';
      submitBtn.textContent = 'Add Job';
    } else {
      title.textContent = 'Edit Job';
      submitBtn.textContent = 'Save changes';
    }
  }

  function openAddJob(defaultStatus) {
    setFormMode('add');
    resetForm(defaultStatus);
    selectedJobId = null;
    detailOverlay.hidden = true;
    editOverlay.hidden = false;
    document.getElementById('edit-title').focus();
  }

  async function populateFilterOptions() {
    const prevStatus = filterStatus.value;
    const prevCompany = filterCompany.value;
    const prevTag = filterTag.value;

    filterStatus.innerHTML =
      '<option value="">All statuses</option>' +
      A2B_STATUSES.map((s) => `<option value="${s.id}">${s.label}</option>`).join('');

    const companies = [...new Set(allJobs.map((j) => j.company).filter(Boolean))].sort();
    filterCompany.innerHTML =
      '<option value="">All companies</option>' +
      companies.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

    const tags = await a2bGetAllTags();
    filterTag.innerHTML =
      '<option value="">All tags</option>' +
      tags.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');

    filterStatus.value = prevStatus;
    filterCompany.value = prevCompany;
    filterTag.value = prevTag;

    boardSort.innerHTML = A2B_SORT_OPTIONS.map(
      (s) => `<option value="${s.id}">${s.label}</option>`
    ).join('');
    boardSort.value = currentSort;

    document.getElementById('edit-status').innerHTML = A2B_STATUSES.map(
      (s) => `<option value="${s.id}">${s.label}</option>`
    ).join('');

    document.getElementById('edit-currency').innerHTML = A2B_CURRENCIES.map(
      (c) => `<option value="${c.id}">${c.label}</option>`
    ).join('');
  }

  function getActiveFilters() {
    return {
      status: filterStatus.value,
      company: filterCompany.value,
      tag: filterTag.value,
      salaryMin: filterSalaryMin.value ? Number(filterSalaryMin.value) : null,
      salaryMax: filterSalaryMax.value ? Number(filterSalaryMax.value) : null,
      keywords: filterKeywords.value.trim().toLowerCase()
    };
  }

  function hasActiveFilters() {
    const f = getActiveFilters();
    return f.status || f.company || f.tag || f.salaryMin || f.salaryMax || f.keywords;
  }

  function applyFilters() {
    const { status, company, tag, salaryMin, salaryMax, keywords } = getActiveFilters();

    filteredJobs = allJobs.filter((job) => {
      if (status && job.status !== status) return false;
      if (company && job.company !== company) return false;
      if (tag && !(job.tags || []).includes(tag)) return false;

      if (salaryMin || salaryMax) {
        const salaryNum = a2bParseSalaryNumber(job.salary);
        if (salaryNum === null) return false;
        if (salaryMin && salaryNum < salaryMin) return false;
        if (salaryMax && salaryNum > salaryMax) return false;
      }

      if (keywords) {
        const haystack = [job.title, job.company, job.notes, job.salary, ...(job.tags || [])]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(keywords)) return false;
      }

      return true;
    });

    clearFiltersBtn.hidden = !hasActiveFilters();
    renderBoard();
  }

  function renderBoard() {
    jobCount.textContent = `${filteredJobs.length} job${filteredJobs.length !== 1 ? 's' : ''}`;

    if (allJobs.length === 0) {
      board.innerHTML = `
        <div class="empty-board">
          <h2>No jobs saved yet</h2>
          <p>Add a job manually here, or save one from any job listing page.</p>
          <button class="btn btn-primary" id="empty-add-btn">+ Add Job</button>
        </div>`;
      document.getElementById('empty-add-btn').addEventListener('click', () => openAddJob());
      return;
    }

    board.innerHTML = A2B_STATUSES.map((status) => {
      const columnJobs = a2bSortJobs(
        filteredJobs.filter((j) => j.status === status.id),
        currentSort
      );
      return `
        <div class="column" data-status="${status.id}">
          <div class="column-header">
            <div class="column-title">
              <span class="column-dot" style="background:${status.color}"></span>
              ${status.label}
            </div>
            <div class="column-header-actions">
              <button class="column-add" data-status="${status.id}" title="Add job to ${status.label}">+</button>
              <span class="column-count">${columnJobs.length}</span>
            </div>
          </div>
          <div class="column-cards" data-status="${status.id}">
            ${columnJobs.length === 0
              ? '<div class="empty-column">Drop jobs here</div>'
              : columnJobs.map(renderCard).join('')}
          </div>
        </div>`;
    }).join('');

    bindCardEvents();
    bindDragDrop();
    bindColumnAddButtons();
  }

  function bindColumnAddButtons() {
    board.querySelectorAll('.column-add').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openAddJob(btn.dataset.status);
      });
    });
  }

  function renderCard(job) {
    const salaryDisplay = a2bFormatSalary(job);
    const tags = job.tags && job.tags.length > 0
      ? `<div class="card-tags">${job.tags.map(renderTagChip).join('')}</div>`
      : '';
    const applied = job.appliedAt
      ? `<div class="card-applied">Applied ${formatDate(job.appliedAt)}</div>`
      : '';

    return `
      <div class="card" draggable="true" data-id="${job.id}">
        <div class="card-title">${escapeHtml(job.title)}</div>
        ${job.company ? `<div class="card-company">${escapeHtml(job.company)}</div>` : ''}
        ${tags}
        ${salaryDisplay ? `<div class="card-salary">${escapeHtml(salaryDisplay)}</div>` : ''}
        ${applied}
        ${job.notes ? `<div class="card-notes">${escapeHtml(job.notes)}</div>` : ''}
        <div class="card-date">${formatDate(job.createdAt)}</div>
      </div>`;
  }

  function bindCardEvents() {
    board.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('click', () => {
        if (card.classList.contains('dragging')) return;
        openDetail(card.dataset.id);
      });
    });
  }

  function bindDragDrop() {
    board.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('dragstart', (e) => {
        draggedJobId = card.dataset.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        draggedJobId = null;
        board.querySelectorAll('.column-cards').forEach((col) => {
          col.classList.remove('drag-over');
        });
      });
    });

    board.querySelectorAll('.column-cards').forEach((col) => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        col.classList.add('drag-over');
      });

      col.addEventListener('dragleave', (e) => {
        if (!col.contains(e.relatedTarget)) {
          col.classList.remove('drag-over');
        }
      });

      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const jobId = e.dataTransfer.getData('text/plain') || draggedJobId;
        const newStatus = col.dataset.status;
        if (!jobId || !newStatus) return;

        const job = allJobs.find((j) => j.id === jobId);
        if (job && job.status !== newStatus) {
          await a2bMoveJob(jobId, newStatus);
          await loadJobs();
        }
      });
    });
  }

  function openDetail(id) {
    const job = allJobs.find((j) => j.id === id);
    if (!job) return;

    selectedJobId = id;
    const salaryDisplay = a2bFormatSalary(job);
    const tagsHtml =
      job.tags && job.tags.length > 0
        ? `<div class="detail-row"><label>Tags</label><div class="detail-tags">${job.tags.map(renderTagChip).join('')}</div></div>`
        : '';

    const cv = a2bResolveAttachment(job, 'cv', allDocuments);
    const cover = a2bResolveAttachment(job, 'cl', allDocuments);

    document.getElementById('detail-title').textContent = job.title;
    document.getElementById('detail-body').innerHTML = `
      <div class="detail-row">
        <label>Status</label>
        <p><span class="status-badge" style="background:${a2bGetStatusColor(job.status)}">${a2bGetStatusLabel(job.status)}</span></p>
      </div>
      ${job.company ? `<div class="detail-row"><label>Company</label><p>${escapeHtml(job.company)}</p></div>` : ''}
      ${salaryDisplay ? `<div class="detail-row"><label>Salary</label><p>${escapeHtml(salaryDisplay)}</p></div>` : ''}
      ${job.appliedAt ? `<div class="detail-row"><label>Applied</label><p>${formatDate(job.appliedAt)}</p></div>` : ''}
      ${tagsHtml}
      ${renderAttachmentDetail('CV / Resume', cv)}
      ${renderAttachmentDetail('Cover Letter', cover)}
      ${job.link ? `<div class="detail-row"><label>Link</label><p><a href="${escapeHtml(job.link)}" target="_blank" rel="noopener">${escapeHtml(job.link)}</a></p></div>` : ''}
      ${job.notes ? `<div class="detail-row"><label>Notes</label><p style="white-space:pre-wrap">${escapeHtml(job.notes)}</p></div>` : ''}
      <div class="detail-row">
        <label>Saved</label>
        <p>${formatDate(job.createdAt)}${job.updatedAt !== job.createdAt ? ` · Updated ${formatDate(job.updatedAt)}` : ''}</p>
      </div>`;

    const linkBtn = document.getElementById('detail-link');
    linkBtn.href = job.link || '#';
    linkBtn.hidden = !job.link;

    detailOverlay.hidden = false;
  }

  function closeDetail() {
    detailOverlay.hidden = true;
    selectedJobId = null;
  }

  function openEdit() {
    const job = allJobs.find((j) => j.id === selectedJobId);
    if (!job) return;

    setFormMode('edit');
    document.getElementById('edit-title').value = job.title;
    document.getElementById('edit-company').value = job.company;
    document.getElementById('edit-link').value = job.link;
    document.getElementById('edit-status').value = job.status;
    document.getElementById('edit-currency').value = job.currency || 'USD';
    document.getElementById('edit-salary').value = job.salary;
    document.getElementById('edit-tags').value = (job.tags || []).join(', ');
    document.getElementById('edit-notes').value = job.notes;
    document.getElementById('edit-applied').value = a2bIsoToDateInput(job.appliedAt);
    toggleEditAppliedField(job.status);
    refreshAttachmentSelects(job);

    detailOverlay.hidden = true;
    editOverlay.hidden = false;
  }

  function closeEdit() {
    editOverlay.hidden = true;
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    const data = getFormData();
    if (!data.title) return;

    if (formMode === 'add') {
      const job = await a2bAddJob(data);
      closeEdit();
      await loadJobs();
      openDetail(job.id);
      return;
    }

    if (!selectedJobId) return;

    await a2bUpdateJob(selectedJobId, data);

    closeEdit();
    await loadJobs();
    openDetail(selectedJobId);
  }

  async function handleDelete() {
    if (!selectedJobId) return;
    if (!confirm('Delete this job from your board?')) return;

    await a2bDeleteJob(selectedJobId);
    closeDetail();
    await loadJobs();
  }

  function exportJobs() {
    const data = JSON.stringify(allJobs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apply2board-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearFilters() {
    filterStatus.value = '';
    filterCompany.value = '';
    filterTag.value = '';
    filterSalaryMin.value = '';
    filterSalaryMax.value = '';
    filterKeywords.value = '';
    applyFilters();
  }

  async function loadJobs() {
    allJobs = await a2bGetJobs();
    allDocuments = await a2bGetDocuments();
    currentSort = await a2bGetSortPref();
    await populateFilterOptions();
    applyFilters();
  }

  filterStatus.addEventListener('change', applyFilters);
  filterCompany.addEventListener('change', applyFilters);
  filterTag.addEventListener('change', applyFilters);
  filterSalaryMin.addEventListener('input', applyFilters);
  filterSalaryMax.addEventListener('input', applyFilters);
  filterKeywords.addEventListener('input', applyFilters);

  boardSort.addEventListener('change', async () => {
    currentSort = boardSort.value;
    await a2bSaveSortPref(currentSort);
    renderBoard();
  });

  document.getElementById('edit-status').addEventListener('change', (e) => {
    toggleEditAppliedField(e.target.value);
  });

  clearFiltersBtn.addEventListener('click', clearFilters);
  document.getElementById('add-job-btn').addEventListener('click', () => openAddJob());
  document.getElementById('export-btn').addEventListener('click', exportJobs);
  document.getElementById('detail-close').addEventListener('click', closeDetail);
  document.getElementById('detail-edit').addEventListener('click', openEdit);
  document.getElementById('detail-delete').addEventListener('click', handleDelete);
  document.getElementById('edit-close').addEventListener('click', closeEdit);
  document.getElementById('edit-cancel').addEventListener('click', closeEdit);
  document.getElementById('edit-form').addEventListener('submit', handleFormSubmit);

  detailOverlay.addEventListener('click', (e) => {
    if (e.target === detailOverlay) closeDetail();
  });
  editOverlay.addEventListener('click', (e) => {
    if (e.target === editOverlay) closeEdit();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[A2B_STORAGE_KEY]) {
      loadJobs();
    }
  });

  buildNoteTemplateButtons('edit-templates');
  a2bBindAttachmentSelects(document, ['edit-cv', 'edit-cl'], boardGetEl);
  loadJobs();
})();
