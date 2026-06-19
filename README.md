# Apply2Board

**Save job listings in one click. Track your pipeline on a local Kanban board.**

Apply2Board is a Chrome extension that lets you capture job postings directly from the browser and organize them visually — without spreadsheets, Notion, or any external service. Everything stays on your machine.

> No backend · No API keys · No account · Fully offline

---

## Why Apply2Board?

Job hunting is messy. You open dozens of tabs, copy links into spreadsheets, forget where you applied, and lose track of follow-ups. Apply2Board fixes the capture step: one button on any job page, instant save, visual pipeline.

| Problem | Apply2Board |
|---|---|
| Manual copy-paste into Notion/Sheets | One-click save with auto-fill |
| Lost job links | Every card stores the original URL |
| No overview of application stage | Kanban board with 5 pipeline stages |
| Privacy concerns with cloud tools | 100% local storage in your browser |

---

## Features

### Save from any page
A floating **Save Job** button appears on every website. Click it — a modal opens over the page (no new tab, no navigation away). Fill in the details and save.

### Smart auto-fill
The extension reads the page and pre-fills what it can:

- **Job title** — from `h1`, Open Graph, JSON-LD `JobPosting`, and site-specific selectors
- **Company** — from structured data, meta tags, or the page hostname
- **Link** — current page URL
- **Salary** — when available in JSON-LD or page content

Works on LinkedIn, Greenhouse, Lever, Ashby, company career pages, and most job boards.

### Kanban pipeline
Five columns mirror a real hiring pipeline:

```
Saved → Applied → Interview → Offer → Rejected
```

Drag cards between columns to update status. Click a card for full details, edit, or delete.

### Filters
Narrow down your board by:

- Status
- Company
- Salary range (min / max)
- Keywords (searches title, company, notes)

### Export
Download all saved jobs as a JSON file for backup or migration.

---

## Quick Start

### Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the `apply2board` folder
5. Pin the extension icon to your toolbar for quick access

### Daily workflow

```
Browse job listing
       ↓
Click "Save Job" (bottom-right)
       ↓
Review auto-filled form → Save
       ↓
Open extension popup → "Open Kanban Board"
       ↓
Drag cards as your pipeline progresses
```

**Step by step:**

1. Open any job listing (LinkedIn, company site, job board, etc.)
2. Click the purple **Save Job** button in the bottom-right corner
3. Check the pre-filled fields — add salary, notes, or change status if needed
4. Click **Save** — the button turns green: **Saved ✔**
5. Click the extension icon in your toolbar → **Open Kanban Board**
6. Manage your pipeline: drag cards, filter, edit, export

If you revisit a page you already saved, the button shows **Saved ✔** and the form opens in update mode.

---

## How it works

```
┌─────────────────────────────────────────────────────────┐
│  Job listing page (LinkedIn, Greenhouse, etc.)          │
│                                                         │
│                              ┌──────────────┐           │
│                              │  Save Job ✔  │  ← FAB    │
│                              └──────────────┘           │
│  ┌──────────────────────────────────────────┐           │
│  │  Modal: title, company, link, status,    │           │
│  │  salary, notes                           │           │
│  └──────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼  chrome.storage.local
┌─────────────────────────────────────────────────────────┐
│  Kanban Board                                           │
│  ┌────────┐ ┌─────────┐ ┌───────────┐ ┌───────┐ ┌──────┐│
│  │ Saved  │ │ Applied │ │ Interview │ │ Offer │ │ Rej. ││
│  │  ▪ ▪   │ │   ▪     │ │     ▪     │ │       │ │      ││
│  └────────┘ └─────────┘ └───────────┘ └───────┘ └──────┘│
└─────────────────────────────────────────────────────────┘
```

**Content script** — injects the floating button and save modal into any page. Runs inside a Shadow DOM so it never conflicts with site styles.

**Extractor** — parses JSON-LD, Open Graph meta tags, and common DOM selectors to auto-fill the form.

**Board page** — a full-page Kanban UI opened from the extension popup. Supports drag-and-drop, filtering, detail view, and JSON export.

**Popup** — quick stats (Saved / Applied / Interview) and a shortcut to open the board.

---

## Privacy & data

All job data is stored in **`chrome.storage.local`** under the key `a2b_jobs`.

- Nothing is sent to any server
- No analytics, no tracking
- No account or sign-in required
- Data stays in your browser until you delete it or uninstall the extension

Use **Export** on the board page to back up your data as JSON at any time.

---

## Project structure

```
apply2board/
├── manifest.json              Manifest V3 configuration
├── icons/                     Extension icons (16, 48, 128 px)
│
├── lib/
│   ├── constants.js           Pipeline statuses and colors
│   └── storage.js             CRUD helpers for chrome.storage.local
│
├── content/
│   ├── extractor.js           Page metadata extraction logic
│   ├── content.js             Floating button + save modal (Shadow DOM)
│   └── content.css
│
├── board/
│   ├── board.html             Kanban board (full page)
│   ├── board.js               Drag-and-drop, filters, detail/edit views
│   └── board.css
│
├── popup/
│   ├── popup.html             Extension toolbar popup
│   ├── popup.js               Stats and "Open Board" shortcut
│   └── popup.css
│
└── background/
    └── service-worker.js      Initializes local storage on install
```

---

## Tech stack

- **Manifest V3** — latest Chrome extension standard
- **Vanilla JS** — no frameworks, no build step
- **chrome.storage.local** — persistent local storage
- **Shadow DOM** — isolated UI on third-party pages
- **HTML5 Drag and Drop API** — Kanban card movement

---

## Roadmap

Ideas for future versions:

- [ ] Import from JSON (restore backup)
- [ ] Dark mode
- [ ] Keyboard shortcut to open save modal
- [ ] Site-specific extractors (LinkedIn, Indeed, etc.)
- [ ] Application deadline reminders

---

## License

MIT
