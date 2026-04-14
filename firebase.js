// ─────────────────────────────────────────────────────────────────────────────
//  firebase.js  –  Replace the config object below with YOUR Firebase project
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ✏️  STEP 1: Replace this object with your Firebase project config
//    (Firebase Console → Project Settings → Your apps → SDK setup → Config)
const firebaseConfig = {
  apiKey: "AIzaSyBvM4kNE0KwpCF5ebIOc4sq_yliIthfvSo",
  authDomain: "gymtracker-3ee02.firebaseapp.com",
  projectId: "gymtracker-3ee02",
  storageBucket: "gymtracker-3ee02.firebasestorage.app",
  messagingSenderId: "328239911430",
  appId: "1:328239911430:web:25d7b3f12a6a59a861a987"
};

const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);
