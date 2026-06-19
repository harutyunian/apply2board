function a2bGenerateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function a2bGetJobs() {
  const result = await chrome.storage.local.get(A2B_STORAGE_KEY);
  return result[A2B_STORAGE_KEY] || [];
}

async function a2bSaveJobs(jobs) {
  await chrome.storage.local.set({ [A2B_STORAGE_KEY]: jobs });
}

async function a2bGetJobById(id) {
  const jobs = await a2bGetJobs();
  return jobs.find((j) => j.id === id) || null;
}

async function a2bGetJobByUrl(url) {
  const jobs = await a2bGetJobs();
  return jobs.find((j) => j.link === url) || null;
}

async function a2bAddJob(jobData) {
  const jobs = await a2bGetJobs();
  const now = new Date().toISOString();
  const job = {
    id: a2bGenerateId(),
    title: jobData.title || 'Untitled Position',
    company: jobData.company || '',
    link: jobData.link || '',
    status: jobData.status || 'saved',
    salary: jobData.salary || '',
    notes: jobData.notes || '',
    createdAt: now,
    updatedAt: now
  };
  jobs.unshift(job);
  await a2bSaveJobs(jobs);
  return job;
}

async function a2bUpdateJob(id, updates) {
  const jobs = await a2bGetJobs();
  const index = jobs.findIndex((j) => j.id === id);
  if (index === -1) return null;

  jobs[index] = {
    ...jobs[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  await a2bSaveJobs(jobs);
  return jobs[index];
}

async function a2bDeleteJob(id) {
  const jobs = await a2bGetJobs();
  const filtered = jobs.filter((j) => j.id !== id);
  await a2bSaveJobs(filtered);
}

async function a2bMoveJob(id, newStatus) {
  return a2bUpdateJob(id, { status: newStatus });
}

async function a2bGetJobStats() {
  const jobs = await a2bGetJobs();
  const stats = {};
  A2B_STATUS_IDS.forEach((id) => {
    stats[id] = 0;
  });
  jobs.forEach((j) => {
    if (stats[j.status] !== undefined) stats[j.status]++;
  });
  stats.total = jobs.length;
  return stats;
}
