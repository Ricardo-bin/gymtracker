// ─────────────────────────────────────────────────────────────────────────────
//  app.js  —  GymTracker  |  v2
//  Fixes: history (no compound index), workout editor, PDF removed
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where,
         orderBy, getDocs, Timestamp, doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ── Firebase (your real config already inlined) ───────────────────────────────
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

// ══════════════════════════════════════════════════════════════════════════════
//  DEFAULT WORKOUT DEFINITIONS
// ══════════════════════════════════════════════════════════════════════════════
const DEFAULT_WORKOUTS = {
  "Upper A": {
    subtitle: "Strength — Chest · Back · Shoulders",
    color: "#2563EB",
    exercises: [
      { name: "Flat Bench Press",       sets: 4, reps: "6-8",    startWt: "20 kg bar",  rest: "90 sec" },
      { name: "Incline DB Press",       sets: 3, reps: "8-10",   startWt: "8 kg each",  rest: "90 sec" },
      { name: "Lat Pulldown",           sets: 3, reps: "10-12",  startWt: "35 kg",      rest: "75 sec" },
      { name: "Seated Cable Row",       sets: 3, reps: "10-12",  startWt: "20 kg",      rest: "75 sec" },
      { name: "Shoulder Press Machine", sets: 3, reps: "8-10",   startWt: "15 kg",      rest: "90 sec" },
      { name: "Lateral Raises",         sets: 3, reps: "12-15",  startWt: "4 kg each",  rest: "60 sec" },
      { name: "Face Pull",              sets: 3, reps: "15",     startWt: "10 kg",      rest: "60 sec" },
      { name: "Bicep Curl (DB)",        sets: 3, reps: "10-12",  startWt: "5 kg each",  rest: "60 sec" },
    ]
  },
  "Lower A": {
    subtitle: "Strength — Squat · Hinge",
    color: "#0E6B5E",
    exercises: [
      { name: "Barbell Back Squat",  sets: 4, reps: "6-8",   startWt: "20 kg bar",  rest: "2 min"  },
      { name: "Romanian Deadlift",   sets: 3, reps: "8-10",  startWt: "30 kg bar",  rest: "90 sec" },
      { name: "Leg Press",           sets: 3, reps: "10-12", startWt: "40 kg",      rest: "90 sec" },
      { name: "Leg Curl",            sets: 3, reps: "10-12", startWt: "20 kg",      rest: "75 sec" },
      { name: "Leg Extension",       sets: 3, reps: "12",    startWt: "20 kg",      rest: "60 sec" },
      { name: "Standing Calf Raise", sets: 4, reps: "12-15", startWt: "BW +10 kg",  rest: "45 sec" },
    ]
  },
  "Upper B": {
    subtitle: "Volume — Chest · Back · Arms",
    color: "#1D4ED8",
    exercises: [
      { name: "Incline Bench Press",    sets: 4, reps: "8-10",  startWt: "20 kg bar",  rest: "90 sec" },
      { name: "Pec Deck / Cable Fly",   sets: 3, reps: "12-15", startWt: "10 kg/side", rest: "75 sec" },
      { name: "Chest Dips",             sets: 3, reps: "8-10",  startWt: "Bodyweight", rest: "90 sec" },
      { name: "Wide Grip Lat Pulldown", sets: 3, reps: "10-12", startWt: "30 kg",      rest: "75 sec" },
      { name: "Single-Arm DB Row",      sets: 3, reps: "10-12", startWt: "10 kg",      rest: "75 sec" },
      { name: "Face Pull",              sets: 3, reps: "15",    startWt: "10 kg",      rest: "60 sec" },
      { name: "Hammer Curl",            sets: 3, reps: "10-12", startWt: "6 kg each",  rest: "60 sec" },
      { name: "Tricep Pushdown",        sets: 3, reps: "12-15", startWt: "12.5 kg",    rest: "60 sec" },
      { name: "Overhead Tricep Ext",    sets: 2, reps: "12",    startWt: "8 kg",       rest: "60 sec" },
    ]
  },
  "Lower B + Core": {
    subtitle: "Volume — Legs · Abs",
    color: "#065F46",
    exercises: [
      { name: "Squat / Leg Press",  sets: 4, reps: "10-12",    startWt: "20 kg bar",  rest: "90 sec" },
      { name: "Romanian Deadlift",  sets: 3, reps: "10-12",    startWt: "30 kg bar",  rest: "75 sec" },
      { name: "Leg Curl",           sets: 3, reps: "12-15",    startWt: "20 kg",      rest: "60 sec" },
      { name: "Leg Extension",      sets: 3, reps: "12-15",    startWt: "20 kg",      rest: "60 sec" },
      { name: "Seated Calf Raise",  sets: 4, reps: "15-20",    startWt: "+10 kg",     rest: "45 sec" },
      { name: "Hanging Leg Raise",  sets: 3, reps: "10-15",    startWt: "Bodyweight", rest: "60 sec" },
      { name: "Cable Crunch",       sets: 3, reps: "12-15",    startWt: "15 kg",      rest: "60 sec" },
      { name: "Plank",              sets: 3, reps: "30-45s",   startWt: "Bodyweight", rest: "45 sec" },
      { name: "Russian Twist",      sets: 2, reps: "20 total", startWt: "Bodyweight", rest: "45 sec" },
    ]
  },
  "Optional Upper": {
    subtitle: "Weak Points — Chest · Shoulders",
    color: "#C05C10",
    exercises: [
      { name: "Flat DB Press",       sets: 3, reps: "10-12", startWt: "8 kg each", rest: "75 sec" },
      { name: "Incline DB Press",    sets: 3, reps: "10-12", startWt: "8 kg each", rest: "75 sec" },
      { name: "Cable Lateral Raise", sets: 3, reps: "15",    startWt: "5 kg each", rest: "60 sec" },
      { name: "Face Pull",           sets: 3, reps: "15",    startWt: "10 kg",     rest: "60 sec" },
      { name: "Push-ups",            sets: 2, reps: "Max",   startWt: "Bodyweight",rest: "60 sec" },
    ]
  }
};

let WORKOUTS = JSON.parse(JSON.stringify(DEFAULT_WORKOUTS));
const DAY_MAP  = { 0:null, 1:null, 2:"Upper A", 3:"Lower A", 4:"Upper B", 5:"Lower B + Core", 6:"Optional Upper" };
const REST_MSG = { 0:"Sunday — full recovery. Eat well, sleep early.", 1:"Monday — rest day. University. Prep meals." };
const PROTEIN_TARGET = 130;
const SECTIONS = ["workout","food","history","settings"];
let editRowCount = 0;

// ══════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════════════════════
const todayStr = () => new Date().toISOString().slice(0,10);
const fmtDate  = s  => new Date(s+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
const esc      = s  => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function toast(msg, type="ok") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 2800);
}

// ══════════════════════════════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════════════════════════════
function showSection(id) {
  SECTIONS.forEach(s => {
    document.getElementById(`section-${s}`).classList.toggle("active", s===id);
    document.getElementById(`nav-${s}`).classList.toggle("active", s===id);
  });
  if (id==="history")  loadHistory();
  if (id==="workout")  renderWorkout();
  if (id==="food")     renderFoodLog();
  if (id==="settings") renderSettings();
}

// ══════════════════════════════════════════════════════════════════════════════
//  WORKOUT
// ══════════════════════════════════════════════════════════════════════════════
let activeWorkoutKey = null;

function renderWorkout() {
  const key = DAY_MAP[new Date().getDay()];
  const C   = document.getElementById("workout-content");
  if (!key) {
    C.innerHTML = `
      <div class="rest-card">
        <div class="rest-icon">🛌</div>
        <h2>Rest Day</h2>
        <p>${REST_MSG[new Date().getDay()]||"Rest day."}</p>
        <button class="btn-secondary" onclick="renderCustomPicker()">Load a workout →</button>
      </div>`;
    return;
  }
  renderWorkoutUI(key);
}

function renderCustomPicker() {
  document.getElementById("workout-content").innerHTML = `
    <div class="picker-wrap">
      <p class="picker-label">Choose a workout</p>
      ${Object.keys(WORKOUTS).map(k=>
        `<button class="btn-workout-pick" onclick="renderWorkoutUI('${esc(k)}')">${esc(k)}</button>`
      ).join("")}
    </div>`;
}

function renderWorkoutUI(key) {
  activeWorkoutKey = key;
  const w = WORKOUTS[key];
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
                <input type="number" class="input-sm" id="w-${i}-${s}" placeholder="kg" min="0" step="0.5" inputmode="decimal">
                <input type="number" class="input-sm" id="r-${i}-${s}" placeholder="reps" min="0" step="1" inputmode="numeric">
              </div>`).join("")}
          </div>
          <button class="btn-log-ex" onclick="logExercise(${i})">Log ${esc(ex.name)}</button>
        </div>`).join("")}
    </div>
    <button class="btn-change-day" onclick="renderCustomPicker()">Switch workout</button>`;
}

async function logExercise(idx) {
  const ex   = WORKOUTS[activeWorkoutKey]?.exercises[idx];
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
    await addDoc(collection(db,"workouts"),{exercise:ex.name,workoutKey:activeWorkoutKey,sets,date:todayStr(),ts:Timestamp.now()});
    card.classList.add("logged"); card.style.opacity="1";
    toast(`${ex.name} saved`);
  } catch(e) { card.style.opacity="1"; toast("Save failed","err"); console.error(e); }
}

// ══════════════════════════════════════════════════════════════════════════════
//  FOOD
// ══════════════════════════════════════════════════════════════════════════════
async function addFood() {
  const n = document.getElementById("food-name").value.trim();
  const p = parseFloat(document.getElementById("food-protein").value);
  const c = parseFloat(document.getElementById("food-cal").value)||0;
  if (!n) { toast("Enter food name","err"); return; }
  if (isNaN(p)||p<0) { toast("Enter valid protein","err"); return; }
  const btn = document.getElementById("btn-add-food");
  btn.disabled=true;
  try {
    await addDoc(collection(db,"food"),{name:n,protein:p,calories:c,date:todayStr(),ts:Timestamp.now()});
    document.getElementById("food-name").value=document.getElementById("food-protein").value=document.getElementById("food-cal").value="";
    toast(`${n} logged`);
    renderFoodLog();
  } catch(e){toast("Save failed","err");console.error(e);}
  finally{btn.disabled=false;}
}

async function renderFoodLog() {
  const list = document.getElementById("food-log-list");
  list.innerHTML=`<div class="loading-row">Loading...</div>`;
  try {
    // single-field orderBy — no composite index needed
    const snap = await getDocs(query(collection(db,"food"),where("date","==",todayStr()),orderBy("ts","asc")));
    let totP=0,totC=0; const items=[];
    snap.forEach(d=>{const x=d.data();totP+=x.protein||0;totC+=x.calories||0;items.push(x);});
    document.getElementById("daily-protein").textContent=Math.round(totP);
    document.getElementById("daily-cal").textContent=Math.round(totC);
    const pct=Math.min(100,Math.round(totP/PROTEIN_TARGET*100));
    document.getElementById("prot-bar-fill").style.width=pct+"%";
    document.getElementById("prot-pct").textContent=pct+"%";
    list.innerHTML=items.length
      ? items.map(d=>`<div class="food-row"><span class="food-row-name">${esc(d.name)}</span><span class="food-row-macro">${d.protein}g</span>${d.calories?`<span class="food-row-cal">${d.calories} kcal</span>`:""}</div>`).join("")
      : `<div class="empty-msg">No food logged today</div>`;
  } catch(e){list.innerHTML=`<div class="empty-msg err">Load failed</div>`;console.error(e);}
}

// ══════════════════════════════════════════════════════════════════════════════
//  HISTORY  — single where clause only, sort client-side (no composite index)
// ══════════════════════════════════════════════════════════════════════════════
async function loadHistory() {
  const wEl=document.getElementById("history-workouts");
  const fEl=document.getElementById("history-food");
  wEl.innerHTML=fEl.innerHTML=`<div class="loading-row">Loading...</div>`;
  const cutStr = new Date(Date.now()-14*864e5).toISOString().slice(0,10);
  try {
    // Workouts — only where("date",">="), sort in JS
    const wRows=[];
    (await getDocs(query(collection(db,"workouts"),where("date",">=",cutStr)))).forEach(d=>wRows.push(d.data()));
    wRows.sort((a,b)=>b.date.localeCompare(a.date)||b.ts.seconds-a.ts.seconds);
    const byDate={};
    wRows.forEach(r=>{if(!byDate[r.date])byDate[r.date]=[];byDate[r.date].push(r);});
    wEl.innerHTML=Object.keys(byDate).length===0
      ? `<div class="empty-msg">No workouts in last 14 days</div>`
      : Object.entries(byDate).map(([date,entries])=>`
          <div class="history-day-block">
            <div class="history-date">${fmtDate(date)}</div>
            ${entries.map(e=>`
              <div class="history-ex-row">
                <span class="history-ex-name">${esc(e.exercise)}</span>
                <span class="history-ex-key">${esc(e.workoutKey)}</span>
                <div class="history-sets">${(e.sets||[]).map(s=>`<span class="set-chip">${s.weight}kg x ${s.reps}</span>`).join("")}</div>
              </div>`).join("")}
          </div>`).join("");

    // Food — same pattern
    const fRows=[];
    (await getDocs(query(collection(db,"food"),where("date",">=",cutStr)))).forEach(d=>fRows.push(d.data()));
    fRows.sort((a,b)=>b.date.localeCompare(a.date)||b.ts.seconds-a.ts.seconds);
    const fByDate={};
    fRows.forEach(r=>{if(!fByDate[r.date])fByDate[r.date]=[];fByDate[r.date].push(r);});
    fEl.innerHTML=Object.keys(fByDate).length===0
      ? `<div class="empty-msg">No meals in last 14 days</div>`
      : Object.entries(fByDate).map(([date,items])=>{
          const totP=items.reduce((a,b)=>a+(b.protein||0),0);
          const totC=items.reduce((a,b)=>a+(b.calories||0),0);
          return `<div class="history-day-block">
            <div class="history-date">${fmtDate(date)}<span class="history-totals">${Math.round(totP)}g · ${Math.round(totC)} kcal</span></div>
            ${items.map(f=>`<div class="food-row"><span class="food-row-name">${esc(f.name)}</span><span class="food-row-macro">${f.protein}g</span>${f.calories?`<span class="food-row-cal">${f.calories} kcal</span>`:""}</div>`).join("")}
          </div>`;}).join("");
  } catch(e){
    wEl.innerHTML=fEl.innerHTML=`<div class="empty-msg err">Error: ${e.message}</div>`;
    console.error(e);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  SETTINGS — workout editor + data info
// ══════════════════════════════════════════════════════════════════════════════
function renderSettings() {
  editRowCount=0;
  document.getElementById("settings-content").innerHTML=`
    <div class="settings-block">
      <div class="settings-title">Edit Workouts</div>
      <p class="settings-desc">Tap any workout to add, remove, or edit exercises. Changes are saved to Firebase and sync across devices.</p>
      <div class="workout-edit-list">
        ${Object.keys(WORKOUTS).map(k=>`
          <button class="btn-edit-workout" onclick="openWorkoutEditor('${esc(k)}')">
            <span class="edit-workout-name">${esc(k)}</span>
            <span class="edit-workout-count">${WORKOUTS[k].exercises.length} exercises</span>
            <span class="edit-arrow">›</span>
          </button>`).join("")}
      </div>
      <button class="btn-reset-workouts" onclick="confirmReset()">Reset all to defaults</button>
    </div>

    <div class="settings-block">
      <div class="settings-title">Where is my data?</div>
      <div class="data-info-card">
        <div class="data-info-row">
          <span class="data-info-icon">☁️</span>
          <div>
            <div class="data-info-label">Firebase Firestore (Google Cloud)</div>
            <div class="data-info-val">All workouts and food logs are stored securely in the cloud. Safe even if you clear your browser or change phones.</div>
          </div>
        </div>
        <div class="data-info-row">
          <span class="data-info-icon">🗃️</span>
          <div>
            <div class="data-info-label">Collections stored</div>
            <div class="data-info-val mono">workouts &nbsp;·&nbsp; food &nbsp;·&nbsp; custom_workouts</div>
          </div>
        </div>
        <div class="data-info-row">
          <span class="data-info-icon">🔗</span>
          <div>
            <div class="data-info-label">View your raw data</div>
            <a href="https://console.firebase.google.com/project/gymtracker-3ee02/firestore" target="_blank" class="data-link">Open Firebase Console →</a>
          </div>
        </div>
      </div>
    </div>`;
}

function openWorkoutEditor(key) {
  const w = WORKOUTS[key];
  document.getElementById("settings-content").innerHTML=`
    <div class="editor-header">
      <button class="btn-back" onclick="renderSettings()">← Back</button>
      <div class="editor-title">${esc(key)}</div>
    </div>
    <p class="editor-hint">Edit names, sets, reps, rest, or starting weight. Remove rows with ✕. Add new with the button below.</p>
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
  const el = document.getElementById(`ex-edit-${i}`);
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
    toast(`${key} saved`);
    renderSettings();
  } catch(e){toast("Save failed","err");console.error(e);}
}

async function confirmReset(){
  if(!confirm("Reset ALL workouts to the original plan defaults?"))return;
  WORKOUTS=JSON.parse(JSON.stringify(DEFAULT_WORKOUTS));
  toast("Workouts reset to defaults");
  renderSettings();
}

async function loadCustomWorkouts() {
  try {
    const snap=await getDocs(collection(db,"custom_workouts"));
    snap.forEach(d=>{
      const data=d.data();
      if(WORKOUTS[data.key]&&data.exercises?.length) WORKOUTS[data.key].exercises=data.exercises;
    });
  } catch(e){console.warn("Custom workouts not loaded",e);}
}

// ══════════════════════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════════════════════
window.addEventListener("DOMContentLoaded", async ()=>{
  await loadCustomWorkouts();
  SECTIONS.forEach(s=>{
    document.getElementById(`nav-${s}`).addEventListener("click",()=>showSection(s));
  });
  document.getElementById("btn-add-food").addEventListener("click",addFood);
  ["food-name","food-protein","food-cal"].forEach(id=>{
    document.getElementById(id).addEventListener("keydown",e=>{if(e.key==="Enter")addFood();});
  });
  showSection("workout");
  renderFoodLog();
});

// Expose for inline onclick
window.renderWorkoutUI    = renderWorkoutUI;
window.renderCustomPicker = renderCustomPicker;
window.logExercise        = logExercise;
window.openWorkoutEditor  = openWorkoutEditor;
window.addEditRow         = addEditRow;
window.removeRow          = removeRow;
window.saveEdits          = saveEdits;
window.confirmReset       = confirmReset;