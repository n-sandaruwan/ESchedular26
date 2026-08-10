import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Paste your Firebase Web App credentials from https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: "AIzaSyBzfNA8V2voziY1f3qgWB0pSRyRxM4Qhvo",
  authDomain: "eschedular26.firebaseapp.com",
  projectId: "eschedular26",
  storageBucket: "eschedular26.firebasestorage.app",
  messagingSenderId: "283044413530",
  appId: "1:283044413530:web:2d54a69d4ea9d57b471863",
  measurementId: "G-3H7520G0K7"
};

// Helper: Check if Firebase Config has been initialized with user's real keys
export const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
};

let app;
let auth = null;
let db = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);

  try {
    enableIndexedDbPersistence(db).catch((err) => {
      console.warn('Firestore persistence note:', err?.message || err);
    });
  } catch (pErr) {
    console.warn('Firestore persistence unsupported:', pErr);
  }
} catch (error) {
  console.warn("Firebase initialization error:", error);
}

export { auth, db };
