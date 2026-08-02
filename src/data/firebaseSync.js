import { db, isFirebaseConfigured } from '../firebase';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';

// Callbacks registered by data stores to update UI on remote changes
const listeners = {
  overrides: [],
  notices: [],
  lab_attendance: [],
  audit_logs: [],
  daily_logs: [],
  module_hours: [],
  assessments: []
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
      console.warn("Firestore overrides subscription notice:", err);
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
        cloudNotices.sort((a, b) => b.id - a.id);
        localStorage.setItem('mis_notices', JSON.stringify(cloudNotices));
        notifySubscribers('notices', cloudNotices);
      }
    }, (err) => {
      console.warn("Firestore notices subscription notice:", err);
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
      console.warn("Firestore lab attendance subscription notice:", err);
    });
  } catch (err) {
    console.error("Firestore lab attendance subscription error:", err);
  }

  // 4. Listen for Daily Evening Lecture Logs
  try {
    const dailyLogsRef = collection(db, 'daily_logs');
    onSnapshot(dailyLogsRef, (snapshot) => {
      const logsData = [];
      snapshot.forEach((docSnap) => {
        logsData.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (logsData.length > 0) {
        logsData.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        localStorage.setItem('mis_daily_logs', JSON.stringify(logsData));
        notifySubscribers('daily_logs', logsData);
      }
    }, (err) => {
      console.warn("Firestore daily_logs subscription notice:", err);
    });
  } catch (err) {
    console.error("Firestore daily_logs subscription error:", err);
  }

  // 5. Listen for Module Hours & Course Progress
  try {
    const moduleHoursRef = collection(db, 'module_hours');
    onSnapshot(moduleHoursRef, (snapshot) => {
      const hoursData = [];
      snapshot.forEach((docSnap) => {
        hoursData.push({ code: docSnap.id, ...docSnap.data() });
      });
      if (hoursData.length > 0) {
        localStorage.setItem('mis_module_hours', JSON.stringify(hoursData));
        notifySubscribers('module_hours', hoursData);
      }
    }, (err) => {
      console.warn("Firestore module_hours subscription notice:", err);
    });
  } catch (err) {
    console.error("Firestore module_hours subscription error:", err);
  }

  // 6. Listen for Course Assessments
  try {
    const assessmentsRef = collection(db, 'assessments');
    onSnapshot(assessmentsRef, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (list.length > 0) {
        localStorage.setItem('mis_module_assessments', JSON.stringify(list));
        notifySubscribers('assessments', list);
      }
    }, (err) => {
      console.warn("Firestore assessments subscription notice:", err);
    });
  } catch (err) {
    console.error("Firestore assessments subscription error:", err);
  }

  // 7. Listen for Audit Logs
  try {
    const auditLogsRef = collection(db, 'audit_logs');
    onSnapshot(auditLogsRef, (snapshot) => {
      const auditList = [];
      snapshot.forEach((docSnap) => {
        auditList.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (auditList.length > 0) {
        auditList.sort((a, b) => b.id - a.id);
        localStorage.setItem('mis_audit_logs', JSON.stringify(auditList));
        notifySubscribers('audit_logs', auditList);
      }
    }, (err) => {
      console.warn("Firestore audit_logs subscription notice:", err);
    });
  } catch (err) {
    console.error("Firestore audit_logs subscription error:", err);
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

// Save Daily Evening Logs to Cloud
export const pushDailyLogsToCloud = async (logs) => {
  if (!isFirebaseConfigured() || !db || !Array.isArray(logs)) return;
  try {
    for (const log of logs) {
      const docId = String(log.id || `${log.date}_${log.module}`);
      await setDoc(doc(db, 'daily_logs', docId), sanitizeFirestoreData(log));
    }
    console.log("✅ Daily logs synced to cloud");
  } catch (err) {
    console.error("Failed to push daily logs to cloud:", err);
  }
};

// Save Module Hours to Cloud
export const pushModuleHoursToCloud = async (hoursArray) => {
  if (!isFirebaseConfigured() || !db || !Array.isArray(hoursArray)) return;
  try {
    for (const mod of hoursArray) {
      const docId = String(mod.code);
      await setDoc(doc(db, 'module_hours', docId), sanitizeFirestoreData(mod));
    }
    console.log("✅ Module hours synced to cloud");
  } catch (err) {
    console.error("Failed to push module hours to cloud:", err);
  }
};

// Save Assessments to Cloud
export const pushAssessmentsToCloud = async (assessments) => {
  if (!isFirebaseConfigured() || !db || !Array.isArray(assessments)) return;
  try {
    for (const item of assessments) {
      const docId = String(item.id);
      await setDoc(doc(db, 'assessments', docId), sanitizeFirestoreData(item));
    }
    console.log("✅ Assessments synced to cloud");
  } catch (err) {
    console.error("Failed to push assessments to cloud:", err);
  }
};

// Save Audit Logs to Cloud
export const pushAuditLogsToCloud = async (logs) => {
  if (!isFirebaseConfigured() || !db || !Array.isArray(logs)) return;
  try {
    for (const log of logs) {
      const docId = String(log.id || Date.now());
      await setDoc(doc(db, 'audit_logs', docId), sanitizeFirestoreData(log));
    }
  } catch (err) {
    console.error("Failed to push audit logs to cloud:", err);
  }
};
