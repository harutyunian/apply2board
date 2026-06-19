function a2bGenerateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function a2bNormalizeJob(job) {
  return {
    id: job.id,
    title: job.title || 'Untitled Position',
    company: job.company || '',
    link: job.link || '',
    status: job.status || 'saved',
    salary: job.salary || '',
    currency: job.currency || 'USD',
    appliedAt: job.appliedAt || null,
    tags: Array.isArray(job.tags) ? job.tags : [],
    cvDocumentId: job.cvDocumentId || null,
    cvCustom: job.cvCustom || '',
    cvCustomType: job.cvCustomType || null,
    coverLetterDocumentId: job.coverLetterDocumentId || null,
    coverLetterCustom: job.coverLetterCustom || '',
    coverLetterCustomType: job.coverLetterCustomType || null,
    notes: job.notes || '',
    createdAt: job.createdAt || new Date().toISOString(),
    updatedAt: job.updatedAt || new Date().toISOString()
  };
}

function a2bResolveAppliedAt(status, appliedAtInput, previousJob) {
  if (status === 'applied') {
    if (appliedAtInput) return a2bDateInputToIso(appliedAtInput);
    if (previousJob?.appliedAt) return previousJob.appliedAt;
    return a2bDateInputToIso(a2bTodayDateInput());
  }
  if (appliedAtInput) return a2bDateInputToIso(appliedAtInput);
  return previousJob?.appliedAt || null;
}

async function a2bGetJobs() {
  const result = await chrome.storage.local.get(A2B_STORAGE_KEY);
  const jobs = result[A2B_STORAGE_KEY] || [];
  return jobs.map(a2bNormalizeJob);
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
  const status = jobData.status || 'saved';

  const job = a2bNormalizeJob({
    ...jobData,
    id: a2bGenerateId(),
    status,
    currency: jobData.currency || 'USD',
    appliedAt: a2bResolveAppliedAt(status, jobData.appliedAt, null),
    tags: a2bParseTags(jobData.tags),
    createdAt: now,
    updatedAt: now
  });

  jobs.unshift(job);
  await a2bSaveJobs(jobs);
  return job;
}

async function a2bUpdateJob(id, updates) {
  const jobs = await a2bGetJobs();
  const index = jobs.findIndex((j) => j.id === id);
  if (index === -1) return null;

  const previous = jobs[index];
  const status = updates.status !== undefined ? updates.status : previous.status;

  const normalized = a2bNormalizeJob({
    ...previous,
    ...updates,
    status,
    currency: updates.currency !== undefined ? updates.currency : previous.currency,
    tags: updates.tags !== undefined ? a2bParseTags(updates.tags) : previous.tags,
    appliedAt: a2bResolveAppliedAt(
      status,
      updates.appliedAt !== undefined ? updates.appliedAt : a2bIsoToDateInput(previous.appliedAt),
      previous
    ),
    updatedAt: new Date().toISOString()
  });

  jobs[index] = normalized;
  await a2bSaveJobs(jobs);
  return jobs[index];
}

async function a2bDeleteJob(id) {
  const jobs = await a2bGetJobs();
  const filtered = jobs.filter((j) => j.id !== id);
  await a2bSaveJobs(filtered);
}

async function a2bMoveJob(id, newStatus) {
  const job = await a2bGetJobById(id);
  if (!job) return null;

  const updates = { status: newStatus };
  if (newStatus === 'applied' && !job.appliedAt) {
    updates.appliedAt = a2bTodayDateInput();
  }
  return a2bUpdateJob(id, updates);
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

async function a2bGetAllTags() {
  const jobs = await a2bGetJobs();
  const tagSet = new Set();
  jobs.forEach((j) => j.tags.forEach((t) => tagSet.add(t)));
  return [...tagSet].sort();
}

async function a2bGetSortPref() {
  const result = await chrome.storage.local.get(A2B_SORT_PREF_KEY);
  return result[A2B_SORT_PREF_KEY] || 'date-desc';
}

async function a2bSaveSortPref(sortId) {
  await chrome.storage.local.set({ [A2B_SORT_PREF_KEY]: sortId });
}

function a2bNormalizeDocument(doc) {
  return {
    id: doc.id,
    name: doc.name || 'Untitled',
    type: doc.type === A2B_DOC_TYPE_COVER ? A2B_DOC_TYPE_COVER : A2B_DOC_TYPE_CV,
    contentType: doc.contentType === 'link' ? 'link' : 'text',
    content: doc.content || '',
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString()
  };
}

async function a2bGetDocuments() {
  const result = await chrome.storage.local.get(A2B_DOCUMENTS_KEY);
  const docs = result[A2B_DOCUMENTS_KEY] || [];
  return docs.map(a2bNormalizeDocument);
}

async function a2bSaveDocuments(documents) {
  await chrome.storage.local.set({ [A2B_DOCUMENTS_KEY]: documents });
}

async function a2bGetDocumentsByType(type) {
  const docs = await a2bGetDocuments();
  return docs.filter((d) => d.type === type);
}

async function a2bGetDocumentById(id) {
  const docs = await a2bGetDocuments();
  return docs.find((d) => d.id === id) || null;
}

async function a2bAddDocument(data) {
  const docs = await a2bGetDocuments();
  const now = new Date().toISOString();
  const doc = a2bNormalizeDocument({
    id: a2bGenerateId(),
    name: data.name,
    type: data.type,
    contentType: data.contentType,
    content: data.content,
    createdAt: now,
    updatedAt: now
  });
  docs.unshift(doc);
  await a2bSaveDocuments(docs);
  return doc;
}

async function a2bUpdateDocument(id, updates) {
  const docs = await a2bGetDocuments();
  const index = docs.findIndex((d) => d.id === id);
  if (index === -1) return null;

  docs[index] = a2bNormalizeDocument({
    ...docs[index],
    ...updates,
    updatedAt: new Date().toISOString()
  });
  await a2bSaveDocuments(docs);
  return docs[index];
}

async function a2bDeleteDocument(id) {
  const docs = await a2bGetDocuments();
  await a2bSaveDocuments(docs.filter((d) => d.id !== id));
}
