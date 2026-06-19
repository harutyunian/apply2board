const A2B_STATUSES = [
  { id: 'saved', label: 'Saved', color: '#6366f1' },
  { id: 'applied', label: 'Applied', color: '#3b82f6' },
  { id: 'interview', label: 'Interview', color: '#f59e0b' },
  { id: 'offer', label: 'Offer', color: '#10b981' },
  { id: 'rejected', label: 'Rejected', color: '#ef4444' }
];

const A2B_STORAGE_KEY = 'a2b_jobs';

const A2B_STATUS_IDS = A2B_STATUSES.map((s) => s.id);

function a2bGetStatusLabel(statusId) {
  const status = A2B_STATUSES.find((s) => s.id === statusId);
  return status ? status.label : statusId;
}

function a2bGetStatusColor(statusId) {
  const status = A2B_STATUSES.find((s) => s.id === statusId);
  return status ? status.color : '#6366f1';
}
