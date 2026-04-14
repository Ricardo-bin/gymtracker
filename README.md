# GymTracker — Setup & Deployment Guide

---

## Files in this project

```
gymtracker/
├── index.html       ← Main app (single page)
├── style.css        ← All styles
├── app.js           ← All logic + workout data
├── firebase.js      ← Firebase config (edit this first)
├── plan.pdf         ← YOUR transformation PDF (rename and add)
└── README.md        ← This file
```

---

## STEP 1 — Create a Firebase project

1. Go to https://console.firebase.google.com
2. Click **Add project** → give it a name (e.g. `gymtracker-lin`)
3. Disable Google Analytics (not needed) → **Create project**

---

## STEP 2 — Create Firestore database

1. In your project → left sidebar → **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (allows read/write for 30 days)
4. Select region: **asia-south1** (Mumbai — closest to Ludhiana)
5. Click **Enable**

---

## STEP 3 — Get your Firebase config

1. In Firebase Console → top left gear icon → **Project settings**
2. Scroll down to **Your apps** → click **</>** (Web app)
3. Register app name: `gymtracker` → click **Register app**
4. You will see a `firebaseConfig` object like this:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "gymtracker-lin.firebaseapp.com",
  projectId: "gymtracker-lin",
  storageBucket: "gymtracker-lin.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

5. Open `firebase.js` in a text editor
6. Replace the placeholder values with YOUR values
7. Save the file

---

## STEP 4 — Add Firestore security rules (after testing)

After the 30-day test mode expires, go to:
**Firestore Database → Rules** and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

This keeps it open (fine for personal use). For added security
later, you can add Firebase Authentication.

---

## STEP 5 — Add your PDF

1. Take your `Final_Master_Transformation_Plan.pdf`
2. Rename it to exactly: `plan.pdf`
3. Place it in the same `gymtracker/` folder alongside index.html

---

## STEP 6 — Deploy to GitHub Pages

### 6a — Create a GitHub repository

1. Go to https://github.com → **New repository**
2. Name it: `gymtracker` (or anything you like)
3. Set to **Public**
4. Click **Create repository**

### 6b — Push your files

Option A — GitHub Desktop (easiest):
1. Download GitHub Desktop: https://desktop.github.com
2. File → Add Local Repository → select your `gymtracker/` folder
3. Commit all files → Push to GitHub

Option B — Command line:
```bash
cd gymtracker
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gymtracker.git
git push -u origin main
```

### 6c — Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Left sidebar → **Pages**
4. Source: **Deploy from a branch**
5. Branch: **main** → folder: **/ (root)**
6. Click **Save**

Your app will be live at:
`https://YOUR_USERNAME.github.io/gymtracker/`

It takes 1–3 minutes to build the first time.

---

## STEP 7 — Add to home screen (use like an app)

On iPhone:
1. Open the GitHub Pages URL in Safari
2. Tap the Share button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add**

Now it opens full-screen like a native app.

---

## How it works day-to-day

| Day | What the app loads automatically |
|-----|----------------------------------|
| Monday | Rest day message |
| Tuesday | Upper A workout |
| Wednesday | Lower A workout |
| Thursday | Upper B workout |
| Friday | Lower B + Core workout |
| Saturday | Optional Upper workout |
| Sunday | Rest day message |

You can always tap **Switch workout** to load a different day manually.

---

## Firestore collections created automatically

| Collection | What's stored |
|------------|---------------|
| `workouts` | exercise, sets (weight+reps), date, workoutKey |
| `food` | name, protein, calories, date |

No setup needed — Firestore creates them on first write.

---

## Troubleshooting

**"Save failed — check Firebase config"**
→ Your `firebase.js` still has placeholder values. Replace with real config.

**PDF not showing**
→ Make sure the file is named exactly `plan.pdf` (lowercase) in the same folder.

**History not loading**
→ Firestore may need a composite index. Check the browser console for a
   Firestore error — it usually includes a link to auto-create the index.
   Click the link, create the index, wait 2 minutes.

**App works locally but not on GitHub Pages**
→ Make sure ALL files (index.html, style.css, app.js, firebase.js, plan.pdf)
   are committed and pushed to GitHub.
