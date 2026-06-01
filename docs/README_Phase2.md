# 💸 MoneyTrack — Phase 2

Multi-user expense tracker with Firebase Authentication and Firestore cloud database.

**🔗 Live Demo:** [legendary-dango-43cd29.netlify.app](https://legendary-dango-43cd29.netlify.app)

---

## What changed from Phase 1

| | Phase 1 | Phase 2 |
|---|---|---|
| Storage | localStorage (browser only) | Firebase Firestore (cloud) |
| Auth | None | Email/password + Google login |
| Devices | One browser only | Any device, any browser |
| Users | Everyone shares data | Each user sees only their own |
| Files changed | — | `storage.js` replaced, `ui.js` + `app.js` extended |

**Key insight:** `utils.js` and `main.css` are **100% unchanged** from Phase 1.
`storage.js` was completely replaced — but because it has the same public API,
`ui.js` and `app.js` only needed small additions (async/await + auth handling).
This is the **Repository Pattern** working in practice.

---

## Firestore data structure

```
Firestore
└── users/                          (collection)
    └── {userId}/                   (document — one per user)
        └── entries/                (sub-collection)
            └── {entryId}/          (document — one per entry)
                ├── date:   "2026-06-01"
                ├── name:   "Lunch"
                ├── source: "bKash"
                ├── amount: 150
                ├── type:   "expense"
                └── ts:     1748692800000
```

Each user's data is in their own sub-collection.
Security Rules ensure users can **only** read/write their own path.

---

## Security Rules

Set in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

This means:
- You must be logged in (`request.auth != null`)
- You can only access your own data (`auth.uid == userId`)
- Nobody can read or modify another user's entries

---

## Local development

```bash
git clone https://github.com/YOUR_USERNAME/moneytrack.git
cd moneytrack
docker compose up --build
# Open http://localhost:3000
```

---

## Deploy to Netlify

1. Push to GitHub
2. Netlify auto-deploys from `main` branch
3. Set **Publish directory** to `frontend/src`

Every `git push` triggers a new deployment automatically.

---

## Project structure

```
moneytrack/
├── frontend/src/
│   ├── index.html              # App shell — 3 screens: loading, auth, app
│   ├── css/main.css            # All styles including auth screen
│   └── js/
│       ├── firebase-config.js  # Firebase init + service exports  ← NEW
│       ├── utils.js            # Unchanged from Phase 1            ← SAME
│       ├── storage.js          # Firestore replace localStorage    ← REPLACED
│       ├── ui.js               # Render + auth UI helpers          ← EXTENDED
│       └── app.js              # Auth flow + async data loading    ← EXTENDED
├── frontend/nginx.conf
├── Dockerfile
├── docker-compose.yml
└── .gitignore
```

---

## Roadmap

| Phase | Description | Status |
|---|---|---|
| 1 | HTML/CSS/JS + localStorage + Docker + Netlify | ✅ Done |
| 2 | Firebase Auth + Firestore cloud database | ✅ Done |
| 3 | React + Supabase (PostgreSQL) + Vercel | 🔜 Next |
| 4 | PWA — installable, offline, push notifications | 📋 Planned |
| 5 | AI/ML — predictions, smart categories, NLP input | 📋 Planned |
