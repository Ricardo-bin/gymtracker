// ─────────────────────────────────────────────────────────────────────────────
//  app.js  –  GymTracker core logic
// ─────────────────────────────────────────────────────────────────────────────
import { db } from "./firebase.js";
import {
  collection, addDoc, query, where,
  orderBy, getDocs, Timestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ══════════════════════════════════════════════════════════════════════════════
//  1.  WORKOUT DEFINITIONS  (from Final Master Transformation Plan)
// ══════════════════════════════════════════════════════════════════════════════
const WORKOUTS = {
  "Upper A": {
    subtitle: "Strength — Chest · Back · Shoulders",
    color: "#2563EB",
    exercises: [
      { name: "Flat Bench Press",        sets: 4, reps: "6–8",   startWt: "20 kg bar",  rest: "90 sec" },
      { name: "Incline DB Press",        sets: 3, reps: "8–10",  startWt: "8 kg each",  rest: "90 sec" },
      { name: "Lat Pulldown",            sets: 3, reps: "10–12", startWt: "35 kg",      rest: "75 sec" },
      { name: "Seated Cable Row",        sets: 3, reps: "10–12", startWt: "20 kg",      rest: "75 sec" },
      { name: "Shoulder Press Machine",  sets: 3, reps: "8–10",  startWt: "15 kg",      rest: "90 sec" },
      { name: "Lateral Raises",          sets: 3, reps: "12–15", startWt: "4 kg each",  rest: "60 sec" },
      { name: "Face Pull",               sets: 3, reps: "15",    startWt: "10 kg",      rest: "60 sec" },
      { name: "Bicep Curl (DB)",         sets: 3, reps: "10–12", startWt: "5 kg each",  rest: "60 sec" },
    ]
  },
  "Lower A": {
    subtitle: "Strength — Squat · Hinge",
    color: "#0E6B5E",
    exercises: [
      { name: "Barbell Back Squat",   sets: 4, reps: "6–8",   startWt: "20 kg bar", rest: "2 min"  },
      { name: "Romanian Deadlift",    sets: 3, reps: "8–10",  startWt: "30 kg bar", rest: "90 sec" },
      { name: "Leg Press",            sets: 3, reps: "10–12", startWt: "40 kg",     rest: "90 sec" },
      { name: "Leg Curl",             sets: 3, reps: "10–12", startWt: "20 kg",     rest: "75 sec" },
      { name: "Leg Extension",        sets: 3, reps: "12",    startWt: "20 kg",     rest: "60 sec" },
      { name: "Standing Calf Raise",  sets: 4, reps: "12–15", startWt: "BW +10 kg", rest: "45 sec" },
    ]
  },
  "Upper B": {
    subtitle: "Volume — Chest · Back · Arms",
    color: "#1D4ED8",
    exercises: [
      { name: "Incline Bench Press",    sets: 4, reps: "8–10",  startWt: "20 kg bar",   rest: "90 sec" },
      { name: "Pec Deck / Cable Fly",   sets: 3, reps: "12–15", startWt: "10 kg/side",  rest: "75 sec" },
      { name: "Chest Dips",             sets: 3, reps: "8–10",  startWt: "Bodyweight",  rest: "90 sec" },
      { name: "Wide Grip Lat Pulldown", sets: 3, reps: "10–12", startWt: "30 kg",       rest: "75 sec" },
      { name: "Single-Arm DB Row",      sets: 3, reps: "10–12", startWt: "10 kg",       rest: "75 sec" },
      { name: "Face Pull",              sets: 3, reps: "15",    startWt: "10 kg",       rest: "60 sec" },
      { name: "Hammer Curl",            sets: 3, reps: "10–12", startWt: "6 kg each",   rest: "60 sec" },
      { name: "Tricep Pushdown",        sets: 3, reps: "12–15", startWt: "12.5 kg",     rest: "60 sec" },
      { name: "Overhead Tricep Ext",    sets: 2, reps: "12",    startWt: "8 kg",        rest: "60 sec" },
    ]
  },
  "Lower B + Core": {
    subtitle: "Volume — Legs · Abs",
    color: "#065F46",
    exercises: [
      { name: "Squat / Leg Press",     sets: 4, reps: "10–12", startWt: "20 kg bar",  rest: "90 sec" },
      { name: "Romanian Deadlift",     sets: 3, reps: "10–12", startWt: "30 kg bar",  rest: "75 sec" },
      { name: "Leg Curl",              sets: 3, reps: "12–15", startWt: "20 kg",      rest: "60 sec" },
      { name: "Leg Extension",         sets: 3, reps: "12–15", startWt: "20 kg",      rest: "60 sec" },
      { name: "Seated Calf Raise",     sets: 4, reps: "15–20", startWt: "+10 kg",     rest: "45 sec" },
      { name: "Hanging Leg Raise",     sets: 3, reps: "10–15", startWt: "Bodyweight", rest: "60 sec" },
      { name: "Cable Crunch",          sets: 3, reps: "12–15", startWt: "15 kg",      rest: "60 sec" },
      { name: "Plank",                 sets: 3, reps: "30–45s", startWt: "Bodyweight", rest: "45 sec" },
      { name: "Russian Twist",         sets: 2, reps: "20 total", startWt: "Bodyweight", rest: "45 sec" },
    ]
  },
  "Optional Upper": {
    subtitle: "Weak Points — Chest · Shoulders",
    color: "#C05C10",
    exercises: [
      { name: "Flat DB Press",      sets: 3, reps: "10–12", startWt: "8 kg each",  rest: "75 sec" },
      { name: "Incline DB Press",   sets: 3, reps: "10–12", startWt: "8 kg each",  rest: "75 sec" },
      { name: "Cable Lateral Raise",sets: 3, reps: "15",    startWt: "5 kg each",  rest: "60 sec" },
      { name: "Face Pull",          sets: 3, reps: "15",    startWt: "10 kg",      rest: "60 sec" },
      { name: "Push-ups",           sets: 2, reps: "Max",   startWt: "Bodyweight", rest: "60 sec" },
    ]
  }
};

// Day → workout key
const DAY_MAP = {
  0: null,            // Sunday  → Rest
  1: null,            // Monday  → Rest
  2: "Upper A",       // Tuesday
  3: "Lower A",       // Wednesday
  4: "Upper B",       // Thursday
  5: "Lower B + Core",// Friday
  6: "Optional Upper" // Saturday
};

const REST_MSG = {
  0: "Sunday — Full recovery. Eat well, sleep early.",
  1: "Monday — Full rest. University day. Prep your meals."
};

// ══════════════════════════════════════════════════════════════════════════════
//  2.  NUTRITION TARGETS
// ══════════════════════════════════════════════════════════════════════════════
const PROTEIN_TARGET = 130;
const CALORIE_TARGET_GYM  = 2600;
const CALORIE_TARGET_REST = 2350;

// ══════════════════════════════════════════════════════════════════════════════
//  3.  NAVIGATION
// ══════════════════════════════════════════════════════════════════════════════
const sections = ["workout", "food", "history", "pdf"];

function showSection(id) {
  sections.forEach(s => {
    document.getElementById(`section-${s}`).classList.toggle("active", s === id);
    document.getElementById(`nav-${s}`).classList.toggle("active", s === id);
  });
  if (id === "history") loadHistory();
  if (id === "workout") renderWorkout();
  if (id === "food")    renderFoodLog();
}

// ══════════════════════════════════════════════════════════════════════════════
//  4.  HELPERS
// ══════════════════════════════════════════════════════════════════════════════
function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function fmtDate(str) {
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" });
}

function toast(msg, type = "ok") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 2600);
}

function showLoading(id, on) {
  const el = document.getElementById(id);
  if (el) el.style.opacity = on ? "0.5" : "1";
}

// ══════════════════════════════════════════════════════════════════════════════
//  5.  WORKOUT SECTION
// ══════════════════════════════════════════════════════════════════════════════
let activeWorkoutKey = null;

function renderWorkout() {
  const today = new Date().getDay();
  const key   = DAY_MAP[today];
  const container = document.getElementById("workout-content");

  if (!key) {
    const msg = REST_MSG[today] || "Rest day.";
    container.innerHTML = `
      <div class="rest-card">
        <div class="rest-icon">🛌</div>
        <h2>Rest Day</h2>
        <p>${msg}</p>
        <button class="btn-secondary" onclick="renderCustomPicker()">Load a different workout →</button>
      </div>`;
    return;
  }

  activeWorkoutKey = key;
  renderWorkoutUI(key);
}

function renderCustomPicker() {
  const container = document.getElementById("workout-content");
  const opts = Object.keys(WORKOUTS).map(k =>
    `<button class="btn-workout-pick" onclick="renderWorkoutUI('${k}')">${k}</button>`
  ).join("");
  container.innerHTML = `
    <div class="picker-wrap">
      <p class="picker-label">Choose a workout</p>
      ${opts}
    </div>`;
}

function renderWorkoutUI(key) {
  activeWorkoutKey = key;
  const w = WORKOUTS[key];
  const container = document.getElementById("workout-content");

  const rows = w.exercises.map((ex, i) => `
    <div class="exercise-card" id="ex-card-${i}">
      <div class="ex-header">
        <div class="ex-left">
          <span class="ex-num">${i + 1}</span>
          <div>
            <div class="ex-name">${ex.name}</div>
            <div class="ex-meta">${ex.sets} sets · ${ex.reps} reps · rest ${ex.rest}</div>
            <div class="ex-start">Start: ${ex.startWt}</div>
          </div>
        </div>
      </div>
      <div class="set-rows" id="sets-${i}">
        ${buildSetRows(ex.sets, i)}
      </div>
      <button class="btn-log-ex" onclick="logExercise(${i})">Log ${ex.name}</button>
    </div>`
  ).join("");

  container.innerHTML = `
    <div class="workout-header" style="--wcolor:${w.color}">
      <div class="wh-day">${getDayLabel()}</div>
      <div class="wh-title">${key}</div>
      <div class="wh-sub">${w.subtitle}</div>
    </div>
    <div class="exercises-list">${rows}</div>
    <button class="btn-change-day" onclick="renderCustomPicker()">Switch workout</button>`;
}

function buildSetRows(sets, exIdx) {
  return Array.from({length: sets}, (_, s) => `
    <div class="set-row">
      <span class="set-label">Set ${s + 1}</span>
      <input type="number" class="input-sm" id="w-${exIdx}-${s}" placeholder="kg" min="0" step="0.5">
      <input type="number" class="input-sm" id="r-${exIdx}-${s}" placeholder="reps" min="0" step="1">
    </div>`
  ).join("");
}

function getDayLabel() {
  return new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"short" });
}

async function logExercise(idx) {
  const key = activeWorkoutKey;
  if (!key) return;
  const ex = WORKOUTS[key].exercises[idx];
  const date = todayStr();
  const sets = [];

  for (let s = 0; s < ex.sets; s++) {
    const wEl = document.getElementById(`w-${idx}-${s}`);
    const rEl = document.getElementById(`r-${idx}-${s}`);
    const wVal = parseFloat(wEl?.value);
    const rVal = parseInt(rEl?.value);
    if (!isNaN(wVal) && !isNaN(rVal) && rVal > 0) {
      sets.push({ set: s + 1, weight: wVal, reps: rVal });
    }
  }

  if (sets.length === 0) {
    toast("Enter weight + reps for at least one set", "err"); return;
  }

  const card = document.getElementById(`ex-card-${idx}`);
  card.style.opacity = "0.5";

  try {
    await addDoc(collection(db, "workouts"), {
      exercise: ex.name,
      workoutKey: key,
      sets,
      date,
      ts: Timestamp.now()
    });
    card.classList.add("logged");
    card.style.opacity = "1";
    toast(`${ex.name} saved ✓`);
  } catch (e) {
    card.style.opacity = "1";
    toast("Save failed — check Firebase config", "err");
    console.error(e);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  6.  FOOD SECTION
// ══════════════════════════════════════════════════════════════════════════════
async function addFood() {
  const nameEl  = document.getElementById("food-name");
  const protEl  = document.getElementById("food-protein");
  const calEl   = document.getElementById("food-cal");

  const name    = nameEl.value.trim();
  const protein = parseFloat(protEl.value);
  const cal     = parseFloat(calEl.value) || 0;

  if (!name)           { toast("Enter food name", "err"); return; }
  if (isNaN(protein) || protein < 0) { toast("Enter valid protein (g)", "err"); return; }

  const btn = document.getElementById("btn-add-food");
  btn.disabled = true;

  try {
    await addDoc(collection(db, "food"), {
      name, protein, calories: cal,
      date: todayStr(),
      ts: Timestamp.now()
    });
    nameEl.value = "";
    protEl.value = "";
    calEl.value  = "";
    toast(`${name} logged ✓`);
    renderFoodLog();
  } catch (e) {
    toast("Save failed", "err"); console.error(e);
  } finally {
    btn.disabled = false;
  }
}

async function renderFoodLog() {
  const el = document.getElementById("food-log-list");
  const protEl = document.getElementById("daily-protein");
  const calEl  = document.getElementById("daily-cal");
  el.innerHTML = `<div class="loading-row">Loading…</div>`;

  try {
    const q = query(
      collection(db, "food"),
      where("date", "==", todayStr()),
      orderBy("ts", "asc")
    );
    const snap = await getDocs(q);
    let totalProt = 0, totalCal = 0;
    const items = [];

    snap.forEach(doc => {
      const d = doc.data();
      totalProt += d.protein || 0;
      totalCal  += d.calories || 0;
      items.push(d);
    });

    protEl.textContent = Math.round(totalProt);
    calEl.textContent  = Math.round(totalCal);

    // Progress bar
    const pct = Math.min(100, Math.round((totalProt / PROTEIN_TARGET) * 100));
    document.getElementById("prot-bar-fill").style.width = pct + "%";
    document.getElementById("prot-pct").textContent = pct + "%";

    if (items.length === 0) {
      el.innerHTML = `<div class="empty-msg">No food logged today</div>`;
      return;
    }

    el.innerHTML = items.map(d => `
      <div class="food-row">
        <span class="food-row-name">${d.name}</span>
        <span class="food-row-macro">${d.protein}g prot</span>
        ${d.calories ? `<span class="food-row-cal">${d.calories} kcal</span>` : ""}
      </div>`).join("");
  } catch (e) {
    el.innerHTML = `<div class="empty-msg err">Load failed</div>`;
    console.error(e);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  7.  HISTORY SECTION
// ══════════════════════════════════════════════════════════════════════════════
async function loadHistory() {
  const wEl = document.getElementById("history-workouts");
  const fEl = document.getElementById("history-food");
  wEl.innerHTML = fEl.innerHTML = `<div class="loading-row">Loading…</div>`;

  // Last 14 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  try {
    // Workouts
    const wq = query(
      collection(db, "workouts"),
      where("date", ">=", cutoffStr),
      orderBy("date", "desc"),
      orderBy("ts", "desc")
    );
    const wSnap = await getDocs(wq);
    const byDate = {};
    wSnap.forEach(doc => {
      const d = doc.data();
      if (!byDate[d.date]) byDate[d.date] = [];
      byDate[d.date].push(d);
    });

    if (Object.keys(byDate).length === 0) {
      wEl.innerHTML = `<div class="empty-msg">No workouts in last 14 days</div>`;
    } else {
      wEl.innerHTML = Object.entries(byDate).map(([date, entries]) => `
        <div class="history-day-block">
          <div class="history-date">${fmtDate(date)}</div>
          ${entries.map(e => `
            <div class="history-ex-row">
              <span class="history-ex-name">${e.exercise}</span>
              <span class="history-ex-key">${e.workoutKey}</span>
              <div class="history-sets">${e.sets.map(s =>
                `<span class="set-chip">${s.weight}kg × ${s.reps}</span>`
              ).join("")}</div>
            </div>`).join("")}
        </div>`).join("");
    }

    // Food history
    const fq = query(
      collection(db, "food"),
      where("date", ">=", cutoffStr),
      orderBy("date", "desc"),
      orderBy("ts", "desc")
    );
    const fSnap = await getDocs(fq);
    const fByDate = {};
    fSnap.forEach(doc => {
      const d = doc.data();
      if (!fByDate[d.date]) fByDate[d.date] = [];
      fByDate[d.date].push(d);
    });

    if (Object.keys(fByDate).length === 0) {
      fEl.innerHTML = `<div class="empty-msg">No meals in last 14 days</div>`;
    } else {
      fEl.innerHTML = Object.entries(fByDate).map(([date, items]) => {
        const totP = items.reduce((a,b) => a + (b.protein||0), 0);
        const totC = items.reduce((a,b) => a + (b.calories||0), 0);
        return `
          <div class="history-day-block">
            <div class="history-date">${fmtDate(date)}
              <span class="history-totals">${Math.round(totP)}g prot · ${Math.round(totC)} kcal</span>
            </div>
            ${items.map(f => `
              <div class="food-row">
                <span class="food-row-name">${f.name}</span>
                <span class="food-row-macro">${f.protein}g</span>
                ${f.calories ? `<span class="food-row-cal">${f.calories} kcal</span>` : ""}
              </div>`).join("")}
          </div>`;
      }).join("");
    }
  } catch (e) {
    wEl.innerHTML = fEl.innerHTML = `<div class="empty-msg err">Load failed — check Firestore rules</div>`;
    console.error(e);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  8.  INIT
// ══════════════════════════════════════════════════════════════════════════════
window.addEventListener("DOMContentLoaded", () => {
  // Nav bindings
  sections.forEach(s => {
    document.getElementById(`nav-${s}`).addEventListener("click", () => showSection(s));
  });

  // Food add button
  document.getElementById("btn-add-food").addEventListener("click", addFood);

  // Food input — enter key
  ["food-name","food-protein","food-cal"].forEach(id => {
    document.getElementById(id).addEventListener("keydown", e => {
      if (e.key === "Enter") addFood();
    });
  });

  // Default section
  showSection("workout");
  renderWorkout();
  renderFoodLog();
});

// Expose for inline onclick
window.renderWorkoutUI   = renderWorkoutUI;
window.renderCustomPicker = renderCustomPicker;
window.logExercise       = logExercise;
