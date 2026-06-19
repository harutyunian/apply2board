const A2B_STATUSES = [
  { id: 'saved', label: 'Saved', color: '#6366f1' },
  { id: 'applied', label: 'Applied', color: '#3b82f6' },
  { id: 'interview', label: 'Interview', color: '#f59e0b' },
  { id: 'offer', label: 'Offer', color: '#10b981' },
  { id: 'rejected', label: 'Rejected', color: '#ef4444' }
];

const A2B_CURRENCIES = [
  { id: 'USD', label: 'USD ($)', symbol: '$' },
  { id: 'EUR', label: 'EUR (€)', symbol: '€' },
  { id: 'GBP', label: 'GBP (£)', symbol: '£' },
  { id: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
  { id: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
  { id: 'CHF', label: 'CHF', symbol: 'CHF ' },
  { id: 'JPY', label: 'JPY (¥)', symbol: '¥' },
  { id: 'INR', label: 'INR (₹)', symbol: '₹' },
  { id: 'AMD', label: 'AMD (֏)', symbol: '֏' },
  { id: 'RUB', label: 'RUB (₽)', symbol: '₽' },
  { id: 'PLN', label: 'PLN (zł)', symbol: 'zł' },
  { id: 'UAH', label: 'UAH (₴)', symbol: '₴' }
];

const A2B_SORT_OPTIONS = [
  { id: 'date-desc', label: 'Newest first' },
  { id: 'date-asc', label: 'Oldest first' },
  { id: 'updated-desc', label: 'Recently updated' },
  { id: 'company-asc', label: 'Company A → Z' },
  { id: 'company-desc', label: 'Company Z → A' },
  { id: 'salary-desc', label: 'Salary high → low' },
  { id: 'salary-asc', label: 'Salary low → high' },
  { id: 'applied-desc', label: 'Applied date (newest)' },
  { id: 'applied-asc', label: 'Applied date (oldest)' }
];

const A2B_NOTE_TEMPLATES = [
  {
    id: 'recruiter',
    label: 'Recruiter',
    text: 'Recruiter: \nContact: \nSource: '
  },
  {
    id: 'interview',
    label: 'Interview',
    text: 'Interview date: \nFormat: (phone / video / onsite)\nInterviewer: \nNotes: '
  },
  {
    id: 'questions',
    label: 'Questions',
    text: 'Questions to ask:\n• \n• \n• '
  },
  {
    id: 'followup',
    label: 'Follow-up',
    text: 'Follow-up date: \nAction: \n'
  },
  {
    id: 'offer',
    label: 'Offer details',
    text: 'Base salary: \nBonus: \nEquity: \nStart date: \nDeadline to respond: '
  }
];

const A2B_TAG_COLORS = [
  '#6366f1', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f59e0b', '#10b981', '#14b8a6', '#64748b'
];

const A2B_STORAGE_KEY = 'a2b_jobs';
const A2B_SORT_PREF_KEY = 'a2b_sort_pref';
const A2B_DOCUMENTS_KEY = 'a2b_documents';
const A2B_SETTINGS_KEY = 'a2b_settings';

const A2B_GEMINI_MODELS = [
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (recommended)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite (fast)' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (best quality)' }
];

const A2B_DEPRECATED_GEMINI_MODELS = {
  'gemini-2.0-flash': 'gemini-3.5-flash',
  'gemini-2.0-flash-001': 'gemini-3.5-flash',
  'gemini-2.0-flash-lite': 'gemini-3.1-flash-lite',
  'gemini-2.0-flash-lite-001': 'gemini-3.1-flash-lite',
  'gemini-1.5-flash': 'gemini-2.5-flash',
  'gemini-1.5-flash-001': 'gemini-2.5-flash',
  'gemini-1.5-pro': 'gemini-2.5-pro',
  'gemini-1.5-pro-001': 'gemini-2.5-pro'
};

function a2bMigrateGeminiModel(modelId) {
  if (!modelId) return A2B_GEMINI_MODELS[0].id;
  if (A2B_DEPRECATED_GEMINI_MODELS[modelId]) {
    return A2B_DEPRECATED_GEMINI_MODELS[modelId];
  }
  const known = A2B_GEMINI_MODELS.some((m) => m.id === modelId);
  return known ? modelId : A2B_GEMINI_MODELS[0].id;
}

const A2B_DEFAULT_COVER_LETTER_INSTRUCTIONS = `You are an expert career coach. Write a professional, tailored cover letter for the job application below.

Guidelines:
- Match the language of the job posting (English, Russian, etc.)
- 3–4 concise paragraphs
- Professional but human tone — not generic or robotic
- Highlight how the candidate's background fits THIS specific role and company
- Mention 1–2 concrete skills or achievements from the candidate profile
- Explain genuine motivation for this company/role
- Do NOT use placeholder brackets like [Your Name] or [Company]
- Return ONLY the cover letter text — no subject line, no markdown, no explanations`;

const A2B_DEFAULT_QA_INSTRUCTIONS = `You are helping a job applicant answer application or interview questions.

Guidelines:
- Answer as the candidate in first person
- Match the language of the questions (English, Russian, etc.)
- Be specific, honest, and professional — not generic
- Use the candidate profile and job context when relevant
- If multiple questions are selected, answer each one clearly (number or label each answer)
- Keep answers concise but complete (2–5 sentences per question unless a longer answer is needed)
- Do NOT invent experience the candidate does not have — if info is missing, give a strong general answer
- Return ONLY the answers — no preamble, no markdown headers`;

const A2B_DOC_TYPE_CV = 'cv';
const A2B_DOC_TYPE_COVER = 'cover_letter';

const A2B_ATTACH_NONE = '';
const A2B_ATTACH_CUSTOM_TEXT = '__custom_text__';
const A2B_ATTACH_CUSTOM_LINK = '__custom_link__';

const A2B_STATUS_IDS = A2B_STATUSES.map((s) => s.id);

function a2bGetStatusLabel(statusId) {
  const status = A2B_STATUSES.find((s) => s.id === statusId);
  return status ? status.label : statusId;
}

function a2bGetStatusColor(statusId) {
  const status = A2B_STATUSES.find((s) => s.id === statusId);
  return status ? status.color : '#6366f1';
}

function a2bGetCurrencySymbol(currencyId) {
  const currency = A2B_CURRENCIES.find((c) => c.id === currencyId);
  return currency ? currency.symbol : '$';
}

function a2bBuildCurrencyOptions(selected) {
  return A2B_CURRENCIES.map(
    (c) => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${c.label}</option>`
  ).join('');
}

function a2bParseTags(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((t) => t.trim()).filter(Boolean);
  return input
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i);
}

function a2bFormatSalary(job) {
  if (!job.salary) return '';
  const sym = a2bGetCurrencySymbol(job.currency || 'USD');
  const val = String(job.salary).trim();
  if (/^[€$£₹₽¥₴֏]|CHF|C\$|A\$|zł/.test(val)) return val;
  return `${sym}${val}`;
}

function a2bParseSalaryNumber(salaryStr) {
  if (!salaryStr) return null;
  const numbers = String(salaryStr).replace(/,/g, '').match(/\d+/g);
  if (!numbers || numbers.length === 0) return null;
  return Math.max(...numbers.map(Number));
}

function a2bTodayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function a2bIsoToDateInput(iso) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function a2bDateInputToIso(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr + 'T12:00:00').toISOString();
}

function a2bGetTagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return A2B_TAG_COLORS[Math.abs(hash) % A2B_TAG_COLORS.length];
}

function a2bRenderTagsHtml(tags) {
  if (!tags || tags.length === 0) return '';
  return tags
    .map(
      (t) =>
        `<span class="a2b-tag" style="background:${a2bGetTagColor(t)}20;color:${a2bGetTagColor(t)};border:1px solid ${a2bGetTagColor(t)}40">${t}</span>`
    )
    .join('');
}

function a2bSortJobs(jobs, sortId) {
  const sorted = [...jobs];
  switch (sortId) {
    case 'date-asc':
      return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'updated-desc':
      return sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    case 'company-asc':
      return sorted.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
    case 'company-desc':
      return sorted.sort((a, b) => (b.company || '').localeCompare(a.company || ''));
    case 'salary-desc':
      return sorted.sort(
        (a, b) => (a2bParseSalaryNumber(b.salary) || 0) - (a2bParseSalaryNumber(a.salary) || 0)
      );
    case 'salary-asc':
      return sorted.sort(
        (a, b) => (a2bParseSalaryNumber(a.salary) || 0) - (a2bParseSalaryNumber(b.salary) || 0)
      );
    case 'applied-desc':
      return sorted.sort((a, b) => {
        const da = a.appliedAt ? new Date(a.appliedAt) : 0;
        const db = b.appliedAt ? new Date(b.appliedAt) : 0;
        return db - da;
      });
    case 'applied-asc':
      return sorted.sort((a, b) => {
        const da = a.appliedAt ? new Date(a.appliedAt) : Infinity;
        const db = b.appliedAt ? new Date(b.appliedAt) : Infinity;
        return da - db;
      });
    case 'date-desc':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}
