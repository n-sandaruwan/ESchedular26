import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Paste your Firebase Web App credentials from https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: "AIzaSyCS2LCU28ZDHbnOBwOlOho8azeEp-CQOuA",
  authDomain: "eschedular26-6a0e7.firebaseapp.com",
  projectId: "eschedular26-6a0e7",
  storageBucket: "eschedular26-6a0e7.firebasestorage.app",
  messagingSenderId: "494259082341",
  appId: "1:494259082341:web:81a1c4b271b622a4f0628c",
  measurementId: "G-H1TMBW5LW0"
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

  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence enabled in primary tab.');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support offline persistence.');
    }
  });
} catch (error) {
  console.warn("Firebase initialization waiting for configuration keys. Falling back to local storage.", error);
}

export { auth, db };
