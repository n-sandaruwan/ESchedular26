import { db, isFirebaseConfigured } from '../firebase';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';

// Callbacks registered by data stores to update UI on remote changes
const listeners = {
  overrides: [],
  notices: [],
  lab_attendance: [],
  audit_logs: [],
};

export const subscribeToCloudEvent = (event, callback) => {
  if (listeners[event]) {
    listeners[event].push(callback);
  }
};

const notifySubscribers = (event, data) => {
  if (listeners[event]) {
    listeners[event].forEach((cb) => {
      try { cb(data); } catch (e) { console.error(`Error notifying subscriber for ${event}`, e); }
    });
  }
};

// Initialize Realtime Listeners for Firestore Collections
export const initRealtimeCloudSync = () => {
  if (!isFirebaseConfigured() || !db) {
    console.log("ℹ️ Realtime Cloud Sync: Operating in local persistence mode (Waiting for Firebase keys).");
    return;
  }

  console.log("⚡ Realtime Cloud Sync: Connected to Firebase Firestore!");

  // 1. Listen for Schedule Overrides changes (Cancellations, Reschedules, Swaps)
  try {
    const overridesRef = collection(db, 'schedule_overrides');
    onSnapshot(overridesRef, (snapshot) => {
      const cloudData = [];
      snapshot.forEach((docSnap) => {
        cloudData.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (cloudData.length > 0) {
        localStorage.setItem('mis_schedule_overrides', JSON.stringify(cloudData));
        notifySubscribers('overrides', cloudData);
      }
    }, (err) => {
      console.warn("Firestore overrides subscription notice (using local data):", err);
    });
  } catch (err) {
    console.error("Firestore overrides subscription error:", err);
  }

  // 2. Listen for Department Notices & Announcements
  try {
    const noticesRef = collection(db, 'notices');
    onSnapshot(noticesRef, (snapshot) => {
      const cloudNotices = [];
      snapshot.forEach((docSnap) => {
        cloudNotices.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (cloudNotices.length > 0) {
        // Sort newest first
        cloudNotices.sort((a, b) => b.id - a.id);
        localStorage.setItem('mis_notices', JSON.stringify(cloudNotices));
        notifySubscribers('notices', cloudNotices);
      }
    }, (err) => {
      console.warn("Firestore notices subscription notice (using local data):", err);
    });
  } catch (err) {
    console.error("Firestore notices subscription error:", err);
  }

  // 3. Listen for EE01 - EE12 Lab Attendance records
  try {
    const attendanceRef = collection(db, 'lab_attendance');
    onSnapshot(attendanceRef, (snapshot) => {
      const attendanceMap = {};
      snapshot.forEach((docSnap) => {
        attendanceMap[docSnap.id] = docSnap.data();
      });
      if (Object.keys(attendanceMap).length > 0) {
        localStorage.setItem('eschedular26_lab_attendance', JSON.stringify(attendanceMap));
        notifySubscribers('lab_attendance', attendanceMap);
      }
    }, (err) => {
      console.warn("Firestore lab attendance subscription notice (using local data):", err);
    });
  } catch (err) {
    console.error("Firestore lab attendance subscription error:", err);
  }
};

// Helper to remove any undefined fields before sending to Firestore (Firestore rejects undefined values)
const sanitizeFirestoreData = (data) => {
  if (!data || typeof data !== 'object') return data;
  const clean = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined && data[key] !== null) {
      if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
        clean[key] = sanitizeFirestoreData(data[key]);
      } else {
        clean[key] = data[key];
      }
    }
  });
  return clean;
};

// Save a Schedule Override (Cancellation/Reschedule/Swap) to Cloud
export const pushOverrideToCloud = async (override) => {
  if (!isFirebaseConfigured() || !db) return;
  try {
    const docId = String(override.id || `${override.date}_${override.module}`);
    const cleanPayload = sanitizeFirestoreData(override);
    await setDoc(doc(db, 'schedule_overrides', docId), cleanPayload);
    console.log(`✅ Override synced to cloud: ${docId}`, cleanPayload);
  } catch (err) {
    console.error("Failed to push override to cloud:", err);
  }
};

// Save a Department Notice to Cloud
export const pushNoticeToCloud = async (notice) => {
  if (!isFirebaseConfigured() || !db) return;
  try {
    const docId = String(notice.id || Date.now());
    const cleanPayload = sanitizeFirestoreData(notice);
    await setDoc(doc(db, 'notices', docId), cleanPayload);
    console.log(`✅ Notice synced to cloud: ${docId}`, cleanPayload);
  } catch (err) {
    console.error("Failed to push notice to cloud:", err);
  }
};

// Save EE Lab Attendance record to Cloud
export const pushLabAttendanceToCloud = async (dateStr, labName, records) => {
  if (!isFirebaseConfigured() || !db) return;
  try {
    // Sanitize doc id
    const docId = `${dateStr}_${labName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const payload = sanitizeFirestoreData({
      date: dateStr,
      lab_name: labName,
      records: records,
      updated_at: new Date().toISOString(),
    });
    await setDoc(doc(db, 'lab_attendance', docId), payload);
    console.log(`✅ Lab Attendance synced to cloud: ${docId}`);
  } catch (err) {
    console.error("Failed to push lab attendance to cloud:", err);
  }
};
