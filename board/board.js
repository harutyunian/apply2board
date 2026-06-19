(function () {
  let allJobs = [];
  let filteredJobs = [];
  let selectedJobId = null;
  let draggedJobId = null;

  const board = document.getElementById('board');
  const jobCount = document.getElementById('job-count');
  const filterStatus = document.getElementById('filter-status');
  const filterCompany = document.getElementById('filter-company');
  const filterSalaryMin = document.getElementById('filter-salary-min');
  const filterSalaryMax = document.getElementById('filter-salary-max');
  const filterKeywords = document.getElementById('filter-keywords');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const detailOverlay = document.getElementById('detail-overlay');
  const editOverlay = document.getElementById('edit-overlay');

  function parseSalaryNumber(salaryStr) {
    if (!salaryStr) return null;
    const numbers = salaryStr.replace(/,/g, '').match(/\d+/g);
    if (!numbers || numbers.length === 0) return null;
    const parsed = numbers.map(Number);
    return Math.max(...parsed);
  }

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

  function populateFilterOptions() {
    filterStatus.innerHTML = '<option value="">All statuses</option>' +
      A2B_STATUSES.map((s) => `<option value="${s.id}">${s.label}</option>`).join('');

    const companies = [...new Set(allJobs.map((j) => j.company).filter(Boolean))].sort();
    filterCompany.innerHTML = '<option value="">All companies</option>' +
      companies.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

    const editStatus = document.getElementById('edit-status');
    editStatus.innerHTML = A2B_STATUSES.map(
      (s) => `<option value="${s.id}">${s.label}</option>`
    ).join('');
  }

  function getActiveFilters() {
    return {
      status: filterStatus.value,
      company: filterCompany.value,
      salaryMin: filterSalaryMin.value ? Number(filterSalaryMin.value) : null,
      salaryMax: filterSalaryMax.value ? Number(filterSalaryMax.value) : null,
      keywords: filterKeywords.value.trim().toLowerCase()
    };
  }

  function hasActiveFilters() {
    const f = getActiveFilters();
    return f.status || f.company || f.salaryMin || f.salaryMax || f.keywords;
  }

  function applyFilters() {
    const { status, company, salaryMin, salaryMax, keywords } = getActiveFilters();

    filteredJobs = allJobs.filter((job) => {
      if (status && job.status !== status) return false;
      if (company && job.company !== company) return false;

      if (salaryMin || salaryMax) {
        const salaryNum = parseSalaryNumber(job.salary);
        if (salaryNum === null) return false;
        if (salaryMin && salaryNum < salaryMin) return false;
        if (salaryMax && salaryNum > salaryMax) return false;
      }

      if (keywords) {
        const haystack = [job.title, job.company, job.notes, job.salary]
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
          <p>Browse job listings and click the "Save Job" button to add them here.</p>
        </div>`;
      return;
    }

    board.innerHTML = A2B_STATUSES.map((status) => {
      const columnJobs = filteredJobs.filter((j) => j.status === status.id);
      return `
        <div class="column" data-status="${status.id}">
          <div class="column-header">
            <div class="column-title">
              <span class="column-dot" style="background:${status.color}"></span>
              ${status.label}
            </div>
            <span class="column-count">${columnJobs.length}</span>
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
  }

  function renderCard(job) {
    return `
      <div class="card" draggable="true" data-id="${job.id}">
        <div class="card-title">${escapeHtml(job.title)}</div>
        ${job.company ? `<div class="card-company">${escapeHtml(job.company)}</div>` : ''}
        ${job.salary ? `<div class="card-salary">${escapeHtml(job.salary)}</div>` : ''}
        ${job.notes ? `<div class="card-notes">${escapeHtml(job.notes)}</div>` : ''}
        <div class="card-date">${formatDate(job.createdAt)}</div>
      </div>`;
  }

  function bindCardEvents() {
    board.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('click', (e) => {
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
    document.getElementById('detail-title').textContent = job.title;
    document.getElementById('detail-body').innerHTML = `
      <div class="detail-row">
        <label>Status</label>
        <p><span class="status-badge" style="background:${a2bGetStatusColor(job.status)}">${a2bGetStatusLabel(job.status)}</span></p>
      </div>
      ${job.company ? `<div class="detail-row"><label>Company</label><p>${escapeHtml(job.company)}</p></div>` : ''}
      ${job.salary ? `<div class="detail-row"><label>Salary</label><p>${escapeHtml(job.salary)}</p></div>` : ''}
      ${job.link ? `<div class="detail-row"><label>Link</label><p><a href="${escapeHtml(job.link)}" target="_blank" rel="noopener">${escapeHtml(job.link)}</a></p></div>` : ''}
      ${job.notes ? `<div class="detail-row"><label>Notes</label><p>${escapeHtml(job.notes)}</p></div>` : ''}
      <div class="detail-row">
        <label>Saved</label>
        <p>${formatDate(job.createdAt)}${job.updatedAt !== job.createdAt ? ` · Updated ${formatDate(job.updatedAt)}` : ''}</p>
      </div>`;

    const linkBtn = document.getElementById('detail-link');
    if (job.link) {
      linkBtn.href = job.link;
      linkBtn.hidden = false;
    } else {
      linkBtn.hidden = true;
    }

    detailOverlay.hidden = false;
  }

  function closeDetail() {
    detailOverlay.hidden = true;
    selectedJobId = null;
  }

  function openEdit() {
    const job = allJobs.find((j) => j.id === selectedJobId);
    if (!job) return;

    document.getElementById('edit-title').value = job.title;
    document.getElementById('edit-company').value = job.company;
    document.getElementById('edit-link').value = job.link;
    document.getElementById('edit-status').value = job.status;
    document.getElementById('edit-salary').value = job.salary;
    document.getElementById('edit-notes').value = job.notes;

    detailOverlay.hidden = true;
    editOverlay.hidden = false;
  }

  function closeEdit() {
    editOverlay.hidden = true;
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!selectedJobId) return;

    await a2bUpdateJob(selectedJobId, {
      title: document.getElementById('edit-title').value.trim(),
      company: document.getElementById('edit-company').value.trim(),
      link: document.getElementById('edit-link').value.trim(),
      status: document.getElementById('edit-status').value,
      salary: document.getElementById('edit-salary').value.trim(),
      notes: document.getElementById('edit-notes').value.trim()
    });

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
    filterSalaryMin.value = '';
    filterSalaryMax.value = '';
    filterKeywords.value = '';
    applyFilters();
  }

  async function loadJobs() {
    allJobs = await a2bGetJobs();
    populateFilterOptions();
    applyFilters();
  }

  filterStatus.addEventListener('change', applyFilters);
  filterCompany.addEventListener('change', applyFilters);
  filterSalaryMin.addEventListener('input', applyFilters);
  filterSalaryMax.addEventListener('input', applyFilters);
  filterKeywords.addEventListener('input', applyFilters);
  clearFiltersBtn.addEventListener('click', clearFilters);
  document.getElementById('export-btn').addEventListener('click', exportJobs);
  document.getElementById('detail-close').addEventListener('click', closeDetail);
  document.getElementById('detail-edit').addEventListener('click', openEdit);
  document.getElementById('detail-delete').addEventListener('click', handleDelete);
  document.getElementById('edit-close').addEventListener('click', closeEdit);
  document.getElementById('edit-cancel').addEventListener('click', closeEdit);
  document.getElementById('edit-form').addEventListener('submit', handleEditSubmit);

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

  loadJobs();
})();
