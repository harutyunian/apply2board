(async function () {
  const statsEl = document.getElementById('stats');
  const recentList = document.getElementById('recent-list');

  async function render() {
    const stats = await a2bGetJobStats();
    const jobs = await a2bGetJobs();

    const highlightStats = [
      { id: 'saved', label: 'Saved' },
      { id: 'applied', label: 'Applied' },
      { id: 'interview', label: 'Interview' }
    ];

    statsEl.innerHTML = highlightStats.map((s) => `
      <div class="stat-item">
        <div class="stat-value">${stats[s.id] || 0}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    `).join('');

    const recent = jobs.slice(0, 5);
    if (recent.length === 0) {
      recentList.innerHTML = '<li class="recent-empty">No jobs saved yet.<br>Click "Save Job" on any listing page.</li>';
    } else {
      recentList.innerHTML = recent.map((job) => `
        <li>
          <span class="recent-job-title" title="${escapeAttr(job.title)}">${escapeHtml(job.title)}</span>
          <span class="recent-status" style="background:${a2bGetStatusColor(job.status)}">${a2bGetStatusLabel(job.status)}</span>
        </li>
      `).join('');
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/"/g, '&quot;');
  }

  document.getElementById('open-board').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('board/board.html') });
  });

  document.getElementById('open-settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[A2B_STORAGE_KEY]) {
      render();
    }
  });

  render();
})();
