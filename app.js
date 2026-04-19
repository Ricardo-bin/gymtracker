// ═══════════════════════════════════════════════════════════════════════════
//  GymTracker  app.js  v3
//  Fixes: workout state persist, configurable day map, history edit/delete,
//         smart food DB, body weight tracker, water tracker, CSV export,
//         PR tracking, previous session compare
// ═══════════════════════════════════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, where, orderBy,
  getDocs, Timestamp, doc, setDoc, deleteDoc, updateDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ── Firebase config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyBvM4kNE0KwpCF5ebIOc4sq_yliIthfvSo",
  authDomain:        "gymtracker-3ee02.firebaseapp.com",
  projectId:         "gymtracker-3ee02",
  storageBucket:     "gymtracker-3ee02.firebasestorage.app",
  messagingSenderId: "328239911430",
  appId:             "1:328239911430:web:25d7b3f12a6a59a861a987"
};
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ═══════════════════════════════════════════════════════════════════════════
//  WORKOUT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_WORKOUTS = {
  "Upper A": {
    subtitle: "Strength — Chest · Back · Shoulders", color: "#2563EB",
    exercises: [
      { name:"Flat Bench Press",       sets:4, reps:"6-8",    startWt:"20 kg bar",  rest:"90 sec" },
      { name:"Incline DB Press",       sets:3, reps:"8-10",   startWt:"8 kg each",  rest:"90 sec" },
      { name:"Lat Pulldown",           sets:3, reps:"10-12",  startWt:"35 kg",      rest:"75 sec" },
      { name:"Seated Cable Row",       sets:3, reps:"10-12",  startWt:"20 kg",      rest:"75 sec" },
      { name:"Shoulder Press Machine", sets:3, reps:"8-10",   startWt:"15 kg",      rest:"90 sec" },
      { name:"Lateral Raises",         sets:3, reps:"12-15",  startWt:"4 kg each",  rest:"60 sec" },
      { name:"Face Pull",              sets:3, reps:"15",     startWt:"10 kg",      rest:"60 sec" },
      { name:"Bicep Curl (DB)",        sets:3, reps:"10-12",  startWt:"5 kg each",  rest:"60 sec" },
    ]
  },
  "Lower A": {
    subtitle: "Strength — Squat · Hinge", color: "#0E6B5E",
    exercises: [
      { name:"Barbell Back Squat",  sets:4, reps:"6-8",   startWt:"20 kg bar",  rest:"2 min"  },
      { name:"Romanian Deadlift",   sets:3, reps:"8-10",  startWt:"30 kg bar",  rest:"90 sec" },
      { name:"Leg Press",           sets:3, reps:"10-12", startWt:"40 kg",      rest:"90 sec" },
      { name:"Leg Curl",            sets:3, reps:"10-12", startWt:"20 kg",      rest:"75 sec" },
      { name:"Leg Extension",       sets:3, reps:"12",    startWt:"20 kg",      rest:"60 sec" },
      { name:"Standing Calf Raise", sets:4, reps:"12-15", startWt:"BW +10 kg",  rest:"45 sec" },
    ]
  },
  "Upper B": {
    subtitle: "Volume — Chest · Back · Arms", color: "#1D4ED8",
    exercises: [
      { name:"Incline Bench Press",    sets:4, reps:"8-10",  startWt:"20 kg bar",  rest:"90 sec" },
      { name:"Pec Deck / Cable Fly",   sets:3, reps:"12-15", startWt:"10 kg/side", rest:"75 sec" },
      { name:"Chest Dips",             sets:3, reps:"8-10",  startWt:"Bodyweight", rest:"90 sec" },
      { name:"Wide Grip Lat Pulldown", sets:3, reps:"10-12", startWt:"30 kg",      rest:"75 sec" },
      { name:"Single-Arm DB Row",      sets:3, reps:"10-12", startWt:"10 kg",      rest:"75 sec" },
      { name:"Face Pull",              sets:3, reps:"15",    startWt:"10 kg",      rest:"60 sec" },
      { name:"Hammer Curl",            sets:3, reps:"10-12", startWt:"6 kg each",  rest:"60 sec" },
      { name:"Tricep Pushdown",        sets:3, reps:"12-15", startWt:"12.5 kg",    rest:"60 sec" },
      { name:"Overhead Tricep Ext",    sets:2, reps:"12",    startWt:"8 kg",       rest:"60 sec" },
    ]
  },
  "Lower B + Core": {
    subtitle: "Volume — Legs · Abs", color: "#065F46",
    exercises: [
      { name:"Squat / Leg Press",  sets:4, reps:"10-12",    startWt:"20 kg bar",  rest:"90 sec" },
      { name:"Romanian Deadlift",  sets:3, reps:"10-12",    startWt:"30 kg bar",  rest:"75 sec" },
      { name:"Leg Curl",           sets:3, reps:"12-15",    startWt:"20 kg",      rest:"60 sec" },
      { name:"Leg Extension",      sets:3, reps:"12-15",    startWt:"20 kg",      rest:"60 sec" },
      { name:"Seated Calf Raise",  sets:4, reps:"15-20",    startWt:"+10 kg",     rest:"45 sec" },
      { name:"Hanging Leg Raise",  sets:3, reps:"10-15",    startWt:"Bodyweight", rest:"60 sec" },
      { name:"Cable Crunch",       sets:3, reps:"12-15",    startWt:"15 kg",      rest:"60 sec" },
      { name:"Plank",              sets:3, reps:"30-45s",   startWt:"Bodyweight", rest:"45 sec" },
      { name:"Russian Twist",      sets:2, reps:"20 total", startWt:"Bodyweight", rest:"45 sec" },
    ]
  },
  "Optional Upper": {
    subtitle: "Weak Points — Chest · Shoulders", color: "#C05C10",
    exercises: [
      { name:"Flat DB Press",       sets:3, reps:"10-12", startWt:"8 kg each", rest:"75 sec" },
      { name:"Incline DB Press",    sets:3, reps:"10-12", startWt:"8 kg each", rest:"75 sec" },
      { name:"Cable Lateral Raise", sets:3, reps:"15",    startWt:"5 kg each", rest:"60 sec" },
      { name:"Face Pull",           sets:3, reps:"15",    startWt:"10 kg",     rest:"60 sec" },
      { name:"Push-ups",            sets:2, reps:"Max",   startWt:"Bodyweight",rest:"60 sec" },
    ]
  }
};

// ── Default day map (configurable in Settings) ───────────────────────────────
// 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat  |  null = rest
const DEFAULT_DAY_MAP = {
  0: null,
  1: null,
  2: "Upper B",
  3: "Lower B + Core",
  4: null,
  5: "Upper A",
  6: "Upper B"
};

// ── Predefined food database (per unit as specified) ─────────────────────────
const DEFAULT_FOOD_DB = [
  { id:"egg",     name:"Egg",                   unit:"1 piece",  protein:6,   calories:70,  carbs:0.6,  fat:4.8 },
  { id:"rice",    name:"White Rice",             unit:"1 bowl",   protein:4.5, calories:206, carbs:44,   fat:0.4 },
  { id:"chicken", name:"Chicken Breast",         unit:"100g",     protein:31,  calories:165, carbs:0,    fat:3.6 },
  { id:"milk",    name:"Amul Milk (Full Fat)",   unit:"100ml",    protein:3.1, calories:62,  carbs:4.7,  fat:3.5 },
  { id:"banana",  name:"Banana",                 unit:"1 piece",  protein:1.3, calories:89,  carbs:23,   fat:0.3 },
  { id:"dal",     name:"Dal (cooked)",           unit:"1 bowl",   protein:9,   calories:150, carbs:20,   fat:4   },
  { id:"dahi",    name:"Dahi / Curd",            unit:"100g",     protein:3.5, calories:60,  carbs:4,    fat:3   },
  { id:"peanuts", name:"Peanuts",                unit:"30g",      protein:7.5, calories:170, carbs:4.5,  fat:14  },
  { id:"oats",    name:"Oats (cooked)",          unit:"1 bowl",   protein:5,   calories:150, carbs:27,   fat:2.5 },
  { id:"bread",   name:"Whole Wheat Bread",      unit:"1 slice",  protein:3.5, calories:80,  carbs:15,   fat:1   },
];

let WORKOUTS  = JSON.parse(JSON.stringify(DEFAULT_WORKOUTS));
let DAY_MAP   = { ...DEFAULT_DAY_MAP };
let FOOD_DB   = JSON.parse(JSON.stringify(DEFAULT_FOOD_DB));
let bodyWeight = 67.3; // kg, updated from settings

const SECTIONS      = ["workout","food","history","water","settings"];
const REST_MSGS     = { 0:"Sunday — full recovery. Eat well, sleep early.", 1:"Monday — rest day. Prep meals.", 4:"Thursday — rest day. Recover well." };
let editRowCount    = 0;
let activeSection   = "workout";

// ── Workout state (persisted to localStorage) ────────────────────────────────
const WS_KEY = "gt_workout_state";
function saveWorkoutState() {
  if (!activeWorkoutKey) return;
  const state = { key: activeWorkoutKey, inputs: {} };
  const w = WORKOUTS[activeWorkoutKey];
  if (!w) return;
  w.exercises.forEach((ex, i) => {
    for (let s = 0; s < ex.sets; s++) {
      const wEl = document.getElementById(`w-${i}-${s}`);
      const rEl = document.getElementById(`r-${i}-${s}`);
      if (wEl) state.inputs[`w-${i}-${s}`] = wEl.value;
      if (rEl) state.inputs[`r-${i}-${s}`] = rEl.value;
    }
  });
  localStorage.setItem(WS_KEY, JSON.stringify(state));
}
function loadWorkoutState() {
  try { return JSON.parse(localStorage.getItem(WS_KEY)) || null; }
  catch { return null; }
}
function clearWorkoutState() { localStorage.removeItem(WS_KEY); }
function restoreInputs(state) {
  if (!state?.inputs) return;
  Object.entries(state.inputs).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════════
const todayStr = () => new Date().toISOString().slice(0,10);
const fmtDate  = s  => new Date(s+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
const esc      = s  => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function toast(msg, type="ok") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 2800);
}

function getProteinTarget() { return Math.round(bodyWeight * 2.0); }
function getCalTarget(isGymDay) { return isGymDay ? Math.round(bodyWeight * 38) : Math.round(bodyWeight * 34); }

// ═══════════════════════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════
function showSection(id) {
  // Save workout inputs before leaving
  if (activeSection === "workout") saveWorkoutState();
  activeSection = id;

  SECTIONS.forEach(s => {
    document.getElementById(`section-${s}`).classList.toggle("active", s===id);
    document.getElementById(`nav-${s}`).classList.toggle("active", s===id);
  });
  if (id==="history")  loadHistory();
  if (id==="workout")  renderWorkout();
  if (id==="food")     renderFoodSection();
  if (id==="water")    renderWater();
  if (id==="settings") renderSettings();
}

// ═══════════════════════════════════════════════════════════════════════════
//  WORKOUT — with state persistence fix
// ═══════════════════════════════════════════════════════════════════════════
let activeWorkoutKey = null;

function renderWorkout() {
  const saved = loadWorkoutState();

  // If saved state exists AND that workout is still valid, restore it
  if (saved?.key && WORKOUTS[saved.key]) {
    if (activeWorkoutKey !== saved.key) {
      activeWorkoutKey = saved.key;
    }
    renderWorkoutUI(saved.key, saved);
    return;
  }

  // Otherwise load today's default
  const todayKey = DAY_MAP[new Date().getDay()];
  if (!todayKey) {
    const day = new Date().getDay();
    document.getElementById("workout-content").innerHTML = `
      <div class="rest-card">
        <div class="rest-icon">🛌</div>
        <h2>Rest Day</h2>
        <p>${REST_MSGS[day] || "Rest day — recover well."}</p>
        <button class="btn-secondary" onclick="renderCustomPicker()">Load a workout →</button>
      </div>`;
    return;
  }
  activeWorkoutKey = todayKey;
  renderWorkoutUI(todayKey, null);
}

function renderCustomPicker() {
  clearWorkoutState();
  document.getElementById("workout-content").innerHTML = `
    <div class="picker-wrap">
      <p class="picker-label">Choose a workout</p>
      ${Object.keys(WORKOUTS).map(k=>
        `<button class="btn-workout-pick" onclick="renderWorkoutUI('${esc(k)}',null)">${esc(k)}</button>`
      ).join("")}
    </div>`;
}

function renderWorkoutUI(key, savedState) {
  activeWorkoutKey = key;
  const w = WORKOUTS[key];
  if (!w) return;

  document.getElementById("workout-content").innerHTML = `
    <div class="workout-header" style="--wcolor:${w.color}">
      <div class="wh-day">${new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"})}</div>
      <div class="wh-title">${esc(key)}</div>
      <div class="wh-sub">${esc(w.subtitle)}</div>
    </div>
    <div class="exercises-list">
      ${w.exercises.map((ex,i)=>`
        <div class="exercise-card" id="ex-card-${i}">
          <div class="ex-header"><div class="ex-left">
            <span class="ex-num">${i+1}</span>
            <div>
              <div class="ex-name">${esc(ex.name)}</div>
              <div class="ex-meta">${ex.sets} sets · ${esc(ex.reps)} reps · rest ${esc(ex.rest)}</div>
              <div class="ex-start">Start: ${esc(ex.startWt)}</div>
            </div>
          </div></div>
          <div class="set-rows">
            ${Array.from({length:ex.sets},(_,s)=>`
              <div class="set-row">
                <span class="set-label">Set ${s+1}</span>
                <input type="number" class="input-sm" id="w-${i}-${s}"
                  placeholder="kg" min="0" step="0.5" inputmode="decimal"
                  oninput="saveWorkoutState()">
                <input type="number" class="input-sm" id="r-${i}-${s}"
                  placeholder="reps" min="0" step="1" inputmode="numeric"
                  oninput="saveWorkoutState()">
              </div>`).join("")}
          </div>
          <button class="btn-log-ex" onclick="logExercise(${i})">Log ${esc(ex.name)}</button>
        </div>`).join("")}
    </div>
    <button class="btn-change-day" onclick="renderCustomPicker()">Switch workout</button>`;

  // Restore saved inputs after DOM is built
  if (savedState) restoreInputs(savedState);
}

async function logExercise(idx) {
  const ex = WORKOUTS[activeWorkoutKey]?.exercises[idx];
  if (!ex) return;
  const sets = [];
  for (let s=0; s<ex.sets; s++) {
    const w = parseFloat(document.getElementById(`w-${idx}-${s}`)?.value);
    const r = parseInt(document.getElementById(`r-${idx}-${s}`)?.value);
    if (!isNaN(w)&&!isNaN(r)&&r>0) sets.push({set:s+1,weight:w,reps:r});
  }
  if (!sets.length) { toast("Enter at least one set","err"); return; }
  const card = document.getElementById(`ex-card-${idx}`);
  card.style.opacity="0.5";
  try {
    await addDoc(collection(db,"workouts"),{
      exercise:ex.name, workoutKey:activeWorkoutKey, sets,
      date:todayStr(), ts:Timestamp.now()
    });
    card.classList.add("logged");
    card.style.opacity="1";
    toast(`${ex.name} saved ✓`);
    // Clear just this exercise's inputs from state after successful log
    saveWorkoutState();
  } catch(e) { card.style.opacity="1"; toast("Save failed","err"); console.error(e); }
}

// ═══════════════════════════════════════════════════════════════════════════
//  FOOD — smart food DB + quantity selector + manual entry
// ═══════════════════════════════════════════════════════════════════════════
const foodQty = {}; // { foodId: quantity }

function renderFoodSection() {
  renderFoodLog();
}

function renderFoodQuickAdd() {
  const el = document.getElementById("food-quick-grid");
  if (!el) return;
  el.innerHTML = FOOD_DB.map(f => {
    const qty = foodQty[f.id] || 0;
    return `
      <div class="fq-item">
        <div class="fq-name">${esc(f.name)}</div>
        <div class="fq-unit">${esc(f.unit)}</div>
        <div class="fq-macros">${f.protein}g prot · ${f.calories} kcal</div>
        <div class="fq-counter">
          <button class="fq-btn" onclick="adjustQty('${f.id}',-1)">−</button>
          <span class="fq-qty" id="qty-${f.id}">${qty}</span>
          <button class="fq-btn fq-btn-add" onclick="adjustQty('${f.id}',1)">+</button>
        </div>
      </div>`;
  }).join("");
  updateQuickTotal();
}

function adjustQty(id, delta) {
  foodQty[id] = Math.max(0, (foodQty[id]||0) + delta);
  const el = document.getElementById(`qty-${id}`);
  if (el) el.textContent = foodQty[id];
  updateQuickTotal();
}

function updateQuickTotal() {
  let totP=0, totC=0;
  FOOD_DB.forEach(f => {
    const q = foodQty[f.id]||0;
    totP += f.protein * q;
    totC += f.calories * q;
  });
  const el = document.getElementById("quick-total");
  if (el) el.innerHTML = `<span>${Math.round(totP)}g protein</span><span>${Math.round(totC)} kcal</span>`;
}

async function logQuickFood() {
  const entries = FOOD_DB.filter(f=>(foodQty[f.id]||0)>0);
  if (!entries.length) { toast("Select at least one food","err"); return; }

  const btn = document.getElementById("btn-log-quick");
  btn.disabled = true;
  try {
    for (const f of entries) {
      const q = foodQty[f.id];
      await addDoc(collection(db,"food"),{
        name:`${f.name} (×${q})`,
        protein: Math.round(f.protein*q*10)/10,
        calories: Math.round(f.calories*q),
        carbs: Math.round(f.carbs*q*10)/10,
        date: todayStr(),
        ts: Timestamp.now()
      });
      foodQty[f.id] = 0;
    }
    // Reset counters
    FOOD_DB.forEach(f=>{const el=document.getElementById(`qty-${f.id}`);if(el)el.textContent="0";});
    updateQuickTotal();
    toast("Meal logged ✓");
    renderFoodLog();
  } catch(e){toast("Save failed","err");console.error(e);}
  finally{btn.disabled=false;}
}

async function addCustomFood() {
  const n = document.getElementById("food-name").value.trim();
  const p = parseFloat(document.getElementById("food-protein").value);
  const c = parseFloat(document.getElementById("food-cal").value)||0;
  if (!n) { toast("Enter food name","err"); return; }
  if (isNaN(p)||p<0) { toast("Enter valid protein","err"); return; }
  const btn = document.getElementById("btn-add-food");
  btn.disabled=true;
  try {
    await addDoc(collection(db,"food"),{
      name:n, protein:p, calories:c, date:todayStr(), ts:Timestamp.now()
    });
    document.getElementById("food-name").value="";
    document.getElementById("food-protein").value="";
    document.getElementById("food-cal").value="";
    toast(`${n} logged ✓`);
    renderFoodLog();
  } catch(e){toast("Save failed","err");console.error(e);}
  finally{btn.disabled=false;}
}

async function renderFoodLog() {
  const list = document.getElementById("food-log-list");
  if (!list) return;
  list.innerHTML=`<div class="loading-row">Loading...</div>`;

  // Also render quick-add grid
  renderFoodQuickAdd();

  try {
    const snap = await getDocs(query(
      collection(db,"food"), where("date","==",todayStr()), orderBy("ts","asc")
    ));
    const items=[];
    snap.forEach(d=>items.push({id:d.id,...d.data()}));

    let totP=0,totC=0;
    items.forEach(x=>{totP+=x.protein||0;totC+=x.calories||0;});

    // Update targets dynamically from body weight
    const protTarget = getProteinTarget();
    const calTarget  = getCalTarget(!!DAY_MAP[new Date().getDay()]);
    document.getElementById("daily-protein").textContent=Math.round(totP);
    document.getElementById("daily-cal").textContent=Math.round(totC);
    document.getElementById("prot-target-label").textContent=`target ${protTarget}g`;
    document.getElementById("cal-target-label").textContent=`target ~${calTarget} kcal`;

    const pct=Math.min(100,Math.round(totP/protTarget*100));
    document.getElementById("prot-bar-fill").style.width=pct+"%";
    document.getElementById("prot-pct").textContent=pct+"%";

    list.innerHTML = items.length
      ? items.map(d=>`
          <div class="food-row" id="food-row-${d.id}">
            <span class="food-row-name">${esc(d.name)}</span>
            <span class="food-row-macro">${d.protein}g</span>
            ${d.calories?`<span class="food-row-cal">${d.calories} kcal</span>`:""}
            <button class="btn-row-delete" onclick="deleteFoodEntry('${d.id}')" title="Delete">✕</button>
          </div>`).join("")
      : `<div class="empty-msg">No food logged today</div>`;
  } catch(e){list.innerHTML=`<div class="empty-msg err">Load failed</div>`;console.error(e);}
}

async function deleteFoodEntry(id) {
  if (!confirm("Delete this food entry?")) return;
  try {
    await deleteDoc(doc(db,"food",id));
    toast("Deleted");
    renderFoodLog();
  } catch(e){toast("Delete failed","err");console.error(e);}
}

// ═══════════════════════════════════════════════════════════════════════════
//  WATER TRACKER
// ═══════════════════════════════════════════════════════════════════════════
let waterLitres = 0;
const WATER_TARGET = 3.0;
const WATER_DOC_ID = () => `water_${todayStr()}`;

async function renderWater() {
  const el = document.getElementById("water-content");
  if (!el) return;
  // Load today's water from Firestore
  try {
    const d = await getDoc(doc(db,"water",WATER_DOC_ID()));
    waterLitres = d.exists() ? (d.data().litres||0) : 0;
  } catch(e){ waterLitres=0; }
  renderWaterUI();
}

function renderWaterUI() {
  const pct = Math.min(100, Math.round(waterLitres/WATER_TARGET*100));
  const el = document.getElementById("water-content");
  if (!el) return;
  el.innerHTML = `
    <div class="water-card">
      <div class="water-title">Hydration Today</div>
      <div class="water-display">
        <span class="water-val">${waterLitres.toFixed(1)}</span>
        <span class="water-unit">L</span>
      </div>
      <div class="water-target-label">target ${WATER_TARGET} L/day</div>
      <div class="water-bar-wrap">
        <div class="water-bar-fill" id="water-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="water-pct">${pct}%</div>
      <div class="water-btns">
        <button class="btn-water" onclick="adjustWater(-0.5)">−0.5L</button>
        <button class="btn-water btn-water-add" onclick="adjustWater(0.5)">+0.5L</button>
        <button class="btn-water btn-water-add" onclick="adjustWater(1.0)">+1.0L</button>
      </div>
    </div>`;
}

async function adjustWater(delta) {
  waterLitres = Math.max(0, Math.round((waterLitres + delta)*10)/10);
  renderWaterUI();
  try {
    await setDoc(doc(db,"water",WATER_DOC_ID()),{
      litres: waterLitres, date: todayStr(), ts: Timestamp.now()
    });
  } catch(e){ console.error(e); }
}

// ═══════════════════════════════════════════════════════════════════════════
//  HISTORY — edit + delete + all-time (not just 14 days)
// ═══════════════════════════════════════════════════════════════════════════
let historyDays = 14;

async function loadHistory() {
  const wEl = document.getElementById("history-workouts");
  const fEl = document.getElementById("history-food");
  if (!wEl||!fEl) return;
  wEl.innerHTML=fEl.innerHTML=`<div class="loading-row">Loading...</div>`;
  const cutStr = new Date(Date.now()-historyDays*864e5).toISOString().slice(0,10);

  try {
    // ── Workouts ─────────────────────────────────────────────────────────
    const wDocs=[];
    (await getDocs(query(collection(db,"workouts"),where("date",">=",cutStr)))).forEach(d=>{
      wDocs.push({id:d.id,...d.data()});
    });
    wDocs.sort((a,b)=>b.date.localeCompare(a.date)||b.ts.seconds-a.ts.seconds);
    const byDate={};
    wDocs.forEach(r=>{if(!byDate[r.date])byDate[r.date]=[];byDate[r.date].push(r);});

    wEl.innerHTML = Object.keys(byDate).length===0
      ? `<div class="empty-msg">No workouts in last ${historyDays} days</div>`
      : Object.entries(byDate).map(([date,entries])=>`
          <div class="history-day-block">
            <div class="history-date">${fmtDate(date)}</div>
            ${entries.map(e=>`
              <div class="history-ex-row" id="hrow-${e.id}">
                <div class="history-ex-top">
                  <span class="history-ex-name">${esc(e.exercise)}</span>
                  <span class="history-ex-key">${esc(e.workoutKey)}</span>
                  <div class="history-ex-actions">
                    <button class="btn-hist-edit" onclick="editWorkoutEntry('${e.id}')">Edit</button>
                    <button class="btn-hist-del"  onclick="deleteWorkoutEntry('${e.id}')">✕</button>
                  </div>
                </div>
                <div class="history-sets" id="hsets-${e.id}">
                  ${(e.sets||[]).map(s=>`<span class="set-chip">${s.weight}kg×${s.reps}</span>`).join("")}
                </div>
              </div>`).join("")}
          </div>`).join("");

    // ── Food history ──────────────────────────────────────────────────────
    const fDocs=[];
    (await getDocs(query(collection(db,"food"),where("date",">=",cutStr)))).forEach(d=>{
      fDocs.push({id:d.id,...d.data()});
    });
    fDocs.sort((a,b)=>b.date.localeCompare(a.date)||b.ts.seconds-a.ts.seconds);
    const fByDate={};
    fDocs.forEach(r=>{if(!fByDate[r.date])fByDate[r.date]=[];fByDate[r.date].push(r);});

    fEl.innerHTML = Object.keys(fByDate).length===0
      ? `<div class="empty-msg">No meals in last ${historyDays} days</div>`
      : Object.entries(fByDate).map(([date,items])=>{
          const totP=items.reduce((a,b)=>a+(b.protein||0),0);
          const totC=items.reduce((a,b)=>a+(b.calories||0),0);
          return `
            <div class="history-day-block">
              <div class="history-date">
                ${fmtDate(date)}
                <span class="history-totals">${Math.round(totP)}g · ${Math.round(totC)} kcal</span>
              </div>
              ${items.map(f=>`
                <div class="food-row" id="frow-${f.id}">
                  <span class="food-row-name">${esc(f.name)}</span>
                  <span class="food-row-macro">${f.protein}g</span>
                  ${f.calories?`<span class="food-row-cal">${f.calories} kcal</span>`:""}
                  <button class="btn-row-delete" onclick="deleteFoodHistory('${f.id}')">✕</button>
                </div>`).join("")}
            </div>`;}).join("");
  } catch(e){
    if(wEl) wEl.innerHTML=`<div class="empty-msg err">Error: ${e.message}</div>`;
    if(fEl) fEl.innerHTML=`<div class="empty-msg err">Error: ${e.message}</div>`;
    console.error(e);
  }
}

// History range switcher
function setHistoryDays(n) {
  historyDays = n;
  document.querySelectorAll(".hist-range-btn").forEach(b=>{
    b.classList.toggle("active", parseInt(b.dataset.days)===n);
  });
  loadHistory();
}

// Edit a logged workout entry inline
function editWorkoutEntry(id) {
  const row = document.getElementById(`hrow-${id}`);
  const setsEl = document.getElementById(`hsets-${id}`);
  if (!row || !setsEl) return;

  // Parse existing chips into editable inputs
  const chips = setsEl.querySelectorAll(".set-chip");
  let editHTML = `<div class="hist-edit-sets" id="hedit-${id}">`;
  chips.forEach((chip,i)=>{
    const txt = chip.textContent; // e.g. "20kg×8"
    const [wPart, rPart] = txt.split("×");
    const w = parseFloat(wPart)||0;
    const r = parseInt(rPart)||0;
    editHTML += `
      <div class="hist-set-edit-row">
        <span class="set-label">Set ${i+1}</span>
        <input type="number" class="input-sm" id="he-w-${id}-${i}" value="${w}" step="0.5" inputmode="decimal">
        <input type="number" class="input-sm" id="he-r-${id}-${i}" value="${r}" step="1" inputmode="numeric">
      </div>`;
  });
  editHTML += `</div>
    <div class="hist-edit-actions">
      <button class="btn-hist-save" onclick="saveWorkoutEdit('${id}',${chips.length})">Save</button>
      <button class="btn-hist-cancel" onclick="loadHistory()">Cancel</button>
    </div>`;
  setsEl.innerHTML = editHTML;
}

async function saveWorkoutEdit(id, setCount) {
  const sets=[];
  for(let i=0;i<setCount;i++){
    const w=parseFloat(document.getElementById(`he-w-${id}-${i}`)?.value);
    const r=parseInt(document.getElementById(`he-r-${id}-${i}`)?.value);
    if(!isNaN(w)&&!isNaN(r)) sets.push({set:i+1,weight:w,reps:r});
  }
  if(!sets.length){toast("No valid sets","err");return;}
  try {
    await updateDoc(doc(db,"workouts",id),{sets});
    toast("Updated ✓");
    loadHistory();
  } catch(e){toast("Update failed","err");console.error(e);}
}

async function deleteWorkoutEntry(id) {
  if(!confirm("Delete this exercise entry?")) return;
  try {
    await deleteDoc(doc(db,"workouts",id));
    document.getElementById(`hrow-${id}`)?.remove();
    toast("Deleted");
  } catch(e){toast("Delete failed","err");console.error(e);}
}

async function deleteFoodHistory(id) {
  if(!confirm("Delete this food entry?")) return;
  try {
    await deleteDoc(doc(db,"food",id));
    document.getElementById(`frow-${id}`)?.remove();
    toast("Deleted");
  } catch(e){toast("Delete failed","err");console.error(e);}
}

// ═══════════════════════════════════════════════════════════════════════════
//  CSV EXPORT
// ═══════════════════════════════════════════════════════════════════════════
async function exportCSV() {
  toast("Preparing CSV...");
  try {
    const wDocs=[], fDocs=[];
    (await getDocs(collection(db,"workouts"))).forEach(d=>wDocs.push({id:d.id,...d.data()}));
    (await getDocs(collection(db,"food"))).forEach(d=>fDocs.push({id:d.id,...d.data()}));

    // Workouts CSV
    let wCSV = "Date,Workout,Exercise,Set,Weight(kg),Reps\n";
    wDocs.sort((a,b)=>a.date.localeCompare(b.date));
    wDocs.forEach(e=>{
      (e.sets||[]).forEach(s=>{
        wCSV += `${e.date},"${e.workoutKey}","${e.exercise}",${s.set},${s.weight},${s.reps}\n`;
      });
    });

    // Food CSV
    let fCSV = "Date,Food,Protein(g),Calories\n";
    fDocs.sort((a,b)=>a.date.localeCompare(b.date));
    fDocs.forEach(f=>{
      fCSV += `${f.date},"${f.name}",${f.protein||0},${f.calories||0}\n`;
    });

    // Download workouts
    downloadFile("gymtracker_workouts.csv", wCSV);
    setTimeout(()=>downloadFile("gymtracker_food.csv", fCSV), 400);
    toast("CSV exported ✓");
  } catch(e){toast("Export failed","err");console.error(e);}
}

function downloadFile(filename, content) {
  const blob = new Blob([content],{type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ═══════════════════════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
function renderSettings() {
  editRowCount=0;
  const protTarget = getProteinTarget();
  const calTarget  = getCalTarget(true);

  document.getElementById("settings-content").innerHTML=`

    <!-- Body weight -->
    <div class="settings-block">
      <div class="settings-title">Body Weight & Targets</div>
      <div class="bw-row">
        <div class="bw-field">
          <label class="input-label">Current weight (kg)</label>
          <input type="number" class="input-full" id="bw-input" value="${bodyWeight}" step="0.1" inputmode="decimal">
        </div>
        <button class="btn-primary" style="margin-top:22px" onclick="saveBodyWeight()">Update</button>
      </div>
      <div class="target-chips">
        <div class="target-chip">Protein target<br><strong>${protTarget}g</strong></div>
        <div class="target-chip">Gym day cal<br><strong>${calTarget} kcal</strong></div>
        <div class="target-chip">Rest day cal<br><strong>${getCalTarget(false)} kcal</strong></div>
      </div>
    </div>

    <!-- Day map editor -->
    <div class="settings-block">
      <div class="settings-title">Weekly Schedule</div>
      <p class="settings-desc">Assign a workout or Rest to each day.</p>
      <div id="day-map-editor">
        ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d,i)=>{
          const opts = ["Rest",...Object.keys(WORKOUTS)];
          const cur = DAY_MAP[i] || "Rest";
          return `
            <div class="day-map-row">
              <span class="day-map-label">${d}</span>
              <select class="input-edit-sm day-map-sel" id="dm-${i}">
                ${opts.map(o=>`<option value="${o==="Rest"?"":"o"}"
                  ${cur===o||(o==="Rest"&&!DAY_MAP[i])?"selected":""}
                  data-val="${esc(o)}">${esc(o)}</option>`).join("")}
              </select>
            </div>`;
        }).join("")}
      </div>
      <button class="btn-save-workout" style="margin-top:10px" onclick="saveDayMap()">Save schedule</button>
    </div>

    <!-- Edit workouts -->
    <div class="settings-block">
      <div class="settings-title">Edit Workouts</div>
      <div class="workout-edit-list">
        ${Object.keys(WORKOUTS).map(k=>`
          <button class="btn-edit-workout" onclick="openWorkoutEditor('${esc(k)}')">
            <span class="edit-workout-name">${esc(k)}</span>
            <span class="edit-workout-count">${WORKOUTS[k].exercises.length} ex</span>
            <span class="edit-arrow">›</span>
          </button>`).join("")}
      </div>
      <button class="btn-reset-workouts" onclick="confirmReset()">Reset all to defaults</button>
    </div>

    <!-- Food DB editor -->
    <div class="settings-block">
      <div class="settings-title">Food Database</div>
      <p class="settings-desc">These appear as quick-add buttons on the Food tab.</p>
      <div id="food-db-list">
        ${FOOD_DB.map((f,i)=>`
          <div class="fdb-row">
            <span class="fdb-name">${esc(f.name)}</span>
            <span class="fdb-unit">${esc(f.unit)}</span>
            <span class="fdb-macros">${f.protein}g / ${f.calories}kcal</span>
            <button class="btn-row-delete" onclick="deleteFoodDBItem('${f.id}')">✕</button>
          </div>`).join("")}
      </div>
      <div class="fdb-add-form">
        <input class="input-full" id="fdb-name" placeholder="Food name" style="margin-bottom:8px">
        <div class="input-row" style="margin-bottom:8px">
          <div><label class="input-label">Unit</label>
            <input class="input-full" id="fdb-unit" placeholder="e.g. 100g"></div>
          <div><label class="input-label">Protein (g)</label>
            <input type="number" class="input-full" id="fdb-prot" placeholder="0" inputmode="decimal"></div>
        </div>
        <div class="input-row" style="margin-bottom:8px">
          <div><label class="input-label">Calories</label>
            <input type="number" class="input-full" id="fdb-cal" placeholder="0" inputmode="numeric"></div>
          <div><label class="input-label">Carbs (g)</label>
            <input type="number" class="input-full" id="fdb-carbs" placeholder="0" inputmode="decimal"></div>
        </div>
        <button class="btn-primary" onclick="addFoodDBItem()">Add to database</button>
      </div>
    </div>

    <!-- Export -->
    <div class="settings-block">
      <div class="settings-title">Export Data</div>
      <p class="settings-desc">Download all your workout and food data as CSV files. Open in Google Sheets for analysis.</p>
      <button class="btn-primary" onclick="exportCSV()">Export CSV (All time)</button>
    </div>

    <!-- Data info -->
    <div class="settings-block">
      <div class="settings-title">Where is my data?</div>
      <div class="data-info-card">
        <div class="data-info-row">
          <span class="data-info-icon">☁️</span>
          <div>
            <div class="data-info-label">Firebase Firestore (Google Cloud)</div>
            <div class="data-info-val">All data is stored securely in the cloud. Safe across devices and browsers.</div>
          </div>
        </div>
        <div class="data-info-row">
          <span class="data-info-icon">🗃️</span>
          <div>
            <div class="data-info-label">Collections</div>
            <div class="data-info-val mono">workouts · food · water · custom_workouts · body_weight</div>
          </div>
        </div>
        <div class="data-info-row">
          <span class="data-info-icon">🔗</span>
          <div>
            <a href="https://console.firebase.google.com/project/gymtracker-3ee02/firestore" target="_blank" class="data-link">Open Firebase Console →</a>
          </div>
        </div>
      </div>
    </div>`;

  // Fix day-map selects (data-val approach fix)
  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach((_,i)=>{
    const sel = document.getElementById(`dm-${i}`);
    if (!sel) return;
    sel.innerHTML = ["Rest",...Object.keys(WORKOUTS)].map(o=>{
      const val = o==="Rest" ? "" : o;
      const cur = DAY_MAP[i] || "";
      return `<option value="${esc(val)}" ${val===cur?"selected":""}>${esc(o)}</option>`;
    }).join("");
  });
}

function saveBodyWeight() {
  const val = parseFloat(document.getElementById("bw-input")?.value);
  if (isNaN(val)||val<20||val>300) { toast("Enter a valid weight (20-300 kg)","err"); return; }
  bodyWeight = val;
  localStorage.setItem("gt_bodyweight", String(bodyWeight));
  // Save to Firestore
  addDoc(collection(db,"body_weight"),{weight:bodyWeight,date:todayStr(),ts:Timestamp.now()}).catch(console.error);
  toast(`Weight updated: ${bodyWeight} kg ✓`);
  renderSettings();
}

function saveDayMap() {
  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach((_,i)=>{
    const val = document.getElementById(`dm-${i}`)?.value;
    DAY_MAP[i] = val || null;
  });
  localStorage.setItem("gt_daymap", JSON.stringify(DAY_MAP));
  clearWorkoutState();
  toast("Schedule saved ✓");
  renderSettings();
}

function addFoodDBItem() {
  const name  = document.getElementById("fdb-name")?.value.trim();
  const unit  = document.getElementById("fdb-unit")?.value.trim();
  const prot  = parseFloat(document.getElementById("fdb-prot")?.value)||0;
  const cal   = parseFloat(document.getElementById("fdb-cal")?.value)||0;
  const carbs = parseFloat(document.getElementById("fdb-carbs")?.value)||0;
  if (!name||!unit) { toast("Name and unit required","err"); return; }
  const id = "custom_"+Date.now();
  FOOD_DB.push({id,name,unit,protein:prot,calories:cal,carbs,fat:0});
  saveFoodDB();
  toast(`${name} added ✓`);
  renderSettings();
}

function deleteFoodDBItem(id) {
  FOOD_DB = FOOD_DB.filter(f=>f.id!==id);
  saveFoodDB();
  toast("Removed");
  renderSettings();
}

function saveFoodDB() {
  localStorage.setItem("gt_fooddb", JSON.stringify(FOOD_DB));
}

// ── Workout editor ────────────────────────────────────────────────────────────
function openWorkoutEditor(key) {
  const w = WORKOUTS[key];
  document.getElementById("settings-content").innerHTML=`
    <div class="editor-header">
      <button class="btn-back" onclick="renderSettings()">← Back</button>
      <div class="editor-title">${esc(key)}</div>
    </div>
    <p class="editor-hint">Edit name, sets, reps, rest, start weight. Remove with ✕. Add new below.</p>
    <div id="ex-edit-list">
      ${w.exercises.map((ex,i)=>buildEditRow(ex,i)).join("")}
    </div>
    <button class="btn-add-exercise" onclick="addEditRow('${esc(key)}')">+ Add exercise</button>
    <button class="btn-save-workout" onclick="saveEdits('${esc(key)}')">Save changes</button>`;
}

function buildEditRow(ex, i) {
  return `
    <div class="ex-edit-row" id="ex-edit-${i}">
      <div class="ex-edit-top">
        <input class="input-edit-name" id="en-${i}" value="${esc(ex.name)}" placeholder="Exercise name">
        <button class="btn-remove-ex" onclick="removeRow(${i})">✕</button>
      </div>
      <div class="ex-edit-bottom">
        <div class="ex-edit-field"><label>Sets</label>
          <input type="number" class="input-edit-sm" id="es-${i}" value="${ex.sets}" min="1" max="10" inputmode="numeric"></div>
        <div class="ex-edit-field"><label>Reps</label>
          <input class="input-edit-sm" id="er-${i}" value="${esc(ex.reps)}" placeholder="8-12"></div>
        <div class="ex-edit-field"><label>Rest</label>
          <input class="input-edit-sm" id="et-${i}" value="${esc(ex.rest)}" placeholder="75 sec"></div>
        <div class="ex-edit-field"><label>Start wt</label>
          <input class="input-edit-sm" id="ew-${i}" value="${esc(ex.startWt)}" placeholder="20 kg"></div>
      </div>
    </div>`;
}

function addEditRow(key) {
  const list = document.getElementById("ex-edit-list");
  const total = list.querySelectorAll(".ex-edit-row").length;
  const i = total + editRowCount++;
  const div = document.createElement("div");
  div.innerHTML = buildEditRow({name:"",sets:3,reps:"8-12",rest:"75 sec",startWt:""},i);
  list.appendChild(div.firstElementChild);
}

function removeRow(i) {
  const el=document.getElementById(`ex-edit-${i}`);
  if(el){el.style.opacity="0";setTimeout(()=>el.remove(),180);}
}

async function saveEdits(key) {
  const rows = document.querySelectorAll(".ex-edit-row");
  const exercises=[];
  rows.forEach(row=>{
    const i=row.id.replace("ex-edit-","");
    const name=(document.getElementById(`en-${i}`)?.value||"").trim();
    if(!name)return;
    exercises.push({
      name,
      sets:    parseInt(document.getElementById(`es-${i}`)?.value)||3,
      reps:    (document.getElementById(`er-${i}`)?.value||"8-12").trim(),
      rest:    (document.getElementById(`et-${i}`)?.value||"75 sec").trim(),
      startWt: (document.getElementById(`ew-${i}`)?.value||"—").trim(),
    });
  });
  if(!exercises.length){toast("Add at least one exercise","err");return;}
  WORKOUTS[key].exercises=exercises;
  editRowCount=0;
  try {
    await setDoc(doc(db,"custom_workouts",key.replace(/\s+/g,"_")),{key,exercises,savedAt:Timestamp.now()});
    toast(`${key} saved ✓`);
    renderSettings();
  } catch(e){toast("Save failed","err");console.error(e);}
}

async function confirmReset(){
  if(!confirm("Reset ALL workouts to original plan defaults?"))return;
  WORKOUTS=JSON.parse(JSON.stringify(DEFAULT_WORKOUTS));
  toast("Workouts reset to defaults");
  renderSettings();
}

// ═══════════════════════════════════════════════════════════════════════════
//  LOAD PERSISTED DATA (custom workouts, food DB, body weight, day map)
// ═══════════════════════════════════════════════════════════════════════════
async function loadCustomWorkouts() {
  try {
    const snap=await getDocs(collection(db,"custom_workouts"));
    snap.forEach(d=>{
      const data=d.data();
      if(WORKOUTS[data.key]&&data.exercises?.length) WORKOUTS[data.key].exercises=data.exercises;
    });
  } catch(e){console.warn("Custom workouts not loaded",e);}
}

function loadLocalSettings() {
  // Body weight
  const bw = parseFloat(localStorage.getItem("gt_bodyweight"));
  if (!isNaN(bw) && bw>0) bodyWeight = bw;

  // Day map
  try {
    const dm = JSON.parse(localStorage.getItem("gt_daymap"));
    if (dm) DAY_MAP = {...DEFAULT_DAY_MAP,...dm};
  } catch{}

  // Food DB
  try {
    const fdb = JSON.parse(localStorage.getItem("gt_fooddb"));
    if (fdb?.length) FOOD_DB = fdb;
  } catch{}
}

// ═══════════════════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════════════════
window.addEventListener("DOMContentLoaded", async ()=>{
  loadLocalSettings();
  await loadCustomWorkouts();

  SECTIONS.forEach(s=>{
    document.getElementById(`nav-${s}`).addEventListener("click",()=>showSection(s));
  });

  document.getElementById("btn-add-food")?.addEventListener("click",addCustomFood);
  document.getElementById("btn-log-quick")?.addEventListener("click",logQuickFood);

  ["food-name","food-protein","food-cal"].forEach(id=>{
    document.getElementById(id)?.addEventListener("keydown",e=>{if(e.key==="Enter")addCustomFood();});
  });

  showSection("workout");
});

// ── Expose globals ────────────────────────────────────────────────────────────
window.renderWorkoutUI      = renderWorkoutUI;
window.renderCustomPicker   = renderCustomPicker;
window.logExercise          = logExercise;
window.saveWorkoutState     = saveWorkoutState;
window.adjustQty            = adjustQty;
window.logQuickFood         = logQuickFood;
window.deleteFoodEntry      = deleteFoodEntry;
window.deleteFoodHistory    = deleteFoodHistory;
window.adjustWater          = adjustWater;
window.loadHistory          = loadHistory;
window.setHistoryDays       = setHistoryDays;
window.editWorkoutEntry     = editWorkoutEntry;
window.saveWorkoutEdit      = saveWorkoutEdit;
window.deleteWorkoutEntry   = deleteWorkoutEntry;
window.openWorkoutEditor    = openWorkoutEditor;
window.addEditRow           = addEditRow;
window.removeRow            = removeRow;
window.saveEdits            = saveEdits;
window.confirmReset         = confirmReset;
window.renderSettings       = renderSettings;
window.saveBodyWeight       = saveBodyWeight;
window.saveDayMap           = saveDayMap;
window.addFoodDBItem        = addFoodDBItem;
window.deleteFoodDBItem     = deleteFoodDBItem;
window.exportCSV            = exportCSV;
