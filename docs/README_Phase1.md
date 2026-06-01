# MoneyTrack 💸

A personal daily expense and income tracker — built in phases from a simple static web app to a full-stack AI-powered application.

---

## Table of Contents

1. [What this app does](#what-this-app-does)
2. [Tech stack — Phase 1](#tech-stack--phase-1)
3. [Project structure explained](#project-structure-explained)
4. [How the code works](#how-the-code-works)
5. [Local development](#local-development)
6. [Deploy to production (free)](#deploy-to-production-free)
7. [Full roadmap](#full-roadmap)
8. [Code standards](#code-standards)

---

## What this app does

| Feature | Status |
|---|---|
| Auto-selects today's date on open | ✅ |
| Add expense or income entry | ✅ |
| Choose payment source (Cash, bKash, Nagad, Bank, Card) | ✅ |
| Daily summary (total spent, income, net balance) | ✅ |
| Weekly bar chart + entry list | ✅ |
| Monthly totals, source breakdown, daily history | ✅ |
| Data persists across browser sessions | ✅ |
| Fully responsive (mobile + desktop) | ✅ |
| Accessible (ARIA labels, keyboard navigation) | ✅ |

---

## Tech stack — Phase 1

```
Frontend:   HTML5 + CSS3 + Vanilla JavaScript
Storage:    Browser localStorage (JSON)
Server:     Nginx (inside Docker)
Container:  Docker + Docker Compose
Deploy:     Render.com (free tier) or Netlify
```

**No frameworks. No npm packages. No backend server. No database.**
One HTML file, one CSS file, four JS files. Served by Nginx in Docker.

---

## Project structure explained

```
moneytrack/
│
├── frontend/
│   ├── src/                        ← All app source code
│   │   ├── index.html              ← App shell (structure only, no logic)
│   │   ├── css/
│   │   │   └── main.css            ← All styles (design tokens → components)
│   │   └── js/
│   │       ├── utils.js            ← Pure helper functions (dates, formatting)
│   │       ├── storage.js          ← All data read/write (localStorage)
│   │       ├── ui.js               ← All DOM rendering (no data logic)
│   │       └── app.js              ← Controller (wires everything together)
│   └── nginx.conf                  ← Web server config
│
├── docs/
│   └── README.md                   ← This file
│
├── .gitignore                      ← Files Git should not track
├── docker-compose.yml              ← Run app with one command
└── Dockerfile                      ← Build production container
```

### Why is the JS split into 4 files?

This is called **Separation of Concerns** — each file has exactly one job:

| File | Job | What it knows about |
|---|---|---|
| `utils.js` | Pure math & formatting | Nothing (no DOM, no storage) |
| `storage.js` | Read & write data | Data shapes + utils |
| `ui.js` | Render HTML to screen | DOM + utils |
| `app.js` | Co-ordinate everything | All three above |

**Why does this matter?**
In Phase 2, we replace `storage.js` with a Firebase version. The rest of the app stays **unchanged**. This is called the **Repository Pattern** — a professional software design pattern.

---

## How the code works

### Data model

Every transaction is stored as a JavaScript object:

```javascript
{
  id:     1748692800000,   // unique number (timestamp + random)
  date:   "2026-05-31",   // local date string YYYY-MM-DD
  name:   "Lunch",        // user-entered label
  source: "bKash",        // payment source
  amount: 150.00,         // always positive
  type:   "expense",      // "expense" | "income"
  ts:     1748692800000   // unix timestamp for sorting
}
```

All entries are stored in an **array** in `localStorage` under the key `moneytrack_entries_v1`.

### Flow: adding an entry

```
User fills form → clicks "Add Entry"
  → app.js: onAddEntry()
    → validates name & amount
    → calls Storage.addEntry({ name, source, amount, type })
      → storage.js: validates again (defence in depth)
      → builds entry object with id + date + ts
      → loads existing array from localStorage
      → pushes new entry
      → saves array back to localStorage
    → app.js: calls renderToday()
      → calls Storage.getEntriesByDate(today)
      → calls Storage.calcTotals(entries)
      → calls UI.renderTodayHero(totals)
        → ui.js: updates hero card numbers
      → calls UI.renderTodayEntries(entries)
        → ui.js: builds HTML string, sets innerHTML
```

### Tab switching

```
User clicks "Week" tab
  → app.js: onTabClick()
    → state.activeTab = 'week'
    → hides today panel, shows week panel
    → calls renderWeek()
      → gets week date range from Utils.getCurrentWeekDays()
      → loads entries from Storage.getEntriesByRange(from, to)
      → calls UI.renderWeekBalance(), UI.renderWeekChart(), UI.renderWeekEntries()
```

---

## Local development

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [Git](https://git-scm.com/) installed
- A code editor ([VS Code](https://code.visualstudio.com/) recommended)

### Step 1 — Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/moneytrack.git
cd moneytrack
```

### Step 2 — Start the app

```bash
docker compose up --build
```

This command:
1. Reads `Dockerfile` and builds the container image
2. Reads `docker-compose.yml` and starts the container
3. Maps port 80 inside the container to port 3000 on your machine

### Step 3 — Open in browser

```
http://localhost:3000
```

### Step 4 — Stop the app

```bash
docker compose down
```

### Making code changes

Since this is Phase 1 (no build step), you can:
1. Edit files in `frontend/src/`
2. Run `docker compose up --build` again to see changes

In Phase 2+ we will add **hot reload** so you don't need to rebuild on every change.

---

## Deploy to production (free)

### Option A — Render.com (Recommended for Docker)

Render.com can build and deploy Docker containers directly from GitHub. Free tier is available.

**Step 1** — Push your code to GitHub

```bash
git init
git add .
git commit -m "feat: initial moneytrack phase 1"
git remote add origin https://github.com/YOUR_USERNAME/moneytrack.git
git push -u origin main
```

**Step 2** — Create a Render account at [render.com](https://render.com)

**Step 3** — Create a new "Web Service"
- Connect your GitHub account
- Select the `moneytrack` repository
- Render auto-detects the `Dockerfile`
- Set these values:
  - **Name:** moneytrack
  - **Branch:** main
  - **Port:** 80

**Step 4** — Click "Deploy"
- Render builds the Docker image (~2 minutes)
- Your app is live at `https://moneytrack.onrender.com`

**Step 5** — Every time you push to `main`, Render auto-deploys.

### Option B — Netlify (Simplest, no Docker)

Netlify can serve the `frontend/src/` folder directly (no Docker needed).

1. Go to [netlify.com](https://netlify.com) → "Add new site" → "Import from Git"
2. Connect GitHub, select the repo
3. Set **Publish directory** to `frontend/src`
4. Click "Deploy site"

Your app is live at `https://YOUR-SITE-NAME.netlify.app`.

---

## Full roadmap

### Phase 1 — Static (Current) ✅
Single HTML/CSS/JS app. localStorage. Docker + Nginx. Deployed on Render or Netlify.

### Phase 2 — Multi-user (Firebase)
- User login (email + Google)
- Cloud database (Firebase Firestore)
- Data syncs across all devices
- **What changes:** `storage.js` replaced by `firebase-storage.js`. Rest of app untouched.
- **New tech:** Firebase SDK, Firebase Authentication

### Phase 3 — Full-stack (React + Supabase)
- Rebuild frontend with React
- PostgreSQL database via Supabase (structured, queryable, ready for ML)
- REST API calls instead of direct DB access
- **New tech:** React, Vite, Supabase JS SDK

### Phase 4 — PWA (Installable)
- Works offline
- Installable on Android/iOS from the browser
- Push notifications ("You've spent 80% of your weekly budget")
- **New tech:** Service Worker, Web App Manifest

### Phase 5 — AI/ML Features
- Smart category detection (type "lunch KFC" → auto-tags as Food)
- Spending prediction ("you'll spend ~৳8,500 this week")
- Anomaly alerts ("Transport 3× higher than usual today")
- Natural language entry ("spent 150 taka on rickshaw")
- Monthly AI insights report
- **New tech:** OpenAI/Gemini API, Python FastAPI backend, scikit-learn

---

## Code standards

### JavaScript
- Strict mode enabled (`'use strict'`)
- IIFEs to avoid polluting global scope
- Every function has a JSDoc comment
- No inline event handlers in HTML (`onclick="..."` avoided — use `addEventListener`)
- User input is always sanitised and HTML-escaped before rendering
- Validation happens in two places (form + storage) — "defence in depth"

### CSS
- Design tokens as CSS custom properties (variables) at the top
- BEM-inspired class naming: `.block__element--modifier`
- Mobile-first, responsive
- `prefers-reduced-motion` media query respected
- No magic numbers — all spacing via `--space-N` tokens

### Git
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat:` new feature
  - `fix:` bug fix
  - `docs:` documentation
  - `style:` formatting only
  - `refactor:` code change, no feature/fix
  - `chore:` build/tooling changes

### Docker
- Multi-stage build (builder + production)
- Production image is minimal (Nginx Alpine, ~25 MB)
- Health check configured
- Resource limits set

---

*Built with care as a portfolio project. Phase 1 of 5.*
