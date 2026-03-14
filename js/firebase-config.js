/**
 * AutoFeed AI – Firebase Configuration
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCinHLVgx5gElHRutrn77W7hOV3kdXJZSM",
  authDomain: "autofeed-ai-20225.firebaseapp.com",
  projectId: "autofeed-ai-20225",
  storageBucket: "autofeed-ai-20225.firebasestorage.app",
  messagingSenderId: "187086104891",
  appId: "1:187086104891:web:8b0912608eefb282e8ef1e",
  measurementId: "G-4RS5DTQ63S"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
console.log("🔥 Firebase Initialized with Project:", firebaseConfig.projectId);
