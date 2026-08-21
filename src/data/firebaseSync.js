import { db, isFirebaseConfigured } from '../firebase';
import { doc, setDoc, onSnapshot, collection, deleteDoc, getDocs, query, limit } from 'firebase/firestore';
import { getSriLankaTimestampStr } from '../utils/dateUtils';

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

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Debounced event dispatchers to prevent UI thrashing
const dispatchOverridesUpdated = debounce(() => window.dispatchEvent(new Event('schedule_overrides_updated')), 300);
const dispatchNoticesUpdated = debounce(() => window.dispatchEvent(new Event('notices_updated')), 300);
const dispatchLabAttendanceUpdated = debounce(() => window.dispatchEvent(new Event('lab_attendance_updated')), 300);
const dispatchDailyLogsUpdated = debounce(() => {
  window.dispatchEvent(new Event('daily_logs_updated'));
  window.dispatchEvent(new Event('module_hours_updated'));
  window.dispatchEvent(new Event('schedule_overrides_updated'));
}, 300);
const dispatchModuleHoursUpdated = debounce(() => window.dispatchEvent(new Event('module_hours_updated')), 300);


// Reliable Retry Wrapper for Cloud Writes (Handles momentary network disconnects & blips)
const withRetry = async (fn, maxRetries = 3, initialDelayMs = 500) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) {
        console.error(`🚨 Cloud write failed after ${maxRetries} attempts:`, err);
        throw err;
      }
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      console.warn(`⚠️ Cloud write attempt ${attempt} failed. Retrying in ${delay}ms...`, err);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

// Global Online/Offline & Tab Sync Lifecycle Listeners
if (typeof window !== 'undefined') {
  // Re-sync instantly when device regains internet connection
  window.addEventListener('online', () => {
    console.log("🌐 Network reconnected! Flushing cloud sync & refreshing UI state...");
    window.dispatchEvent(new Event('schedule_overrides_updated'));
    window.dispatchEvent(new Event('daily_logs_updated'));
    window.dispatchEvent(new Event('module_hours_updated'));
    window.dispatchEvent(new Event('notices_updated'));
    window.dispatchEvent(new Event('lab_attendance_updated'));
  });

  // Re-check state on tab focus or screen unlock
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      window.dispatchEvent(new Event('schedule_overrides_updated'));
      window.dispatchEvent(new Event('daily_logs_updated'));
      window.dispatchEvent(new Event('module_hours_updated'));
      window.dispatchEvent(new Event('notices_updated'));
    }
  });

  // Real-time tab sync on same browser
  window.addEventListener('storage', (e) => {
    if (e.key === 'mis_schedule_overrides') window.dispatchEvent(new Event('schedule_overrides_updated'));
    if (e.key === 'mis_daily_logs') window.dispatchEvent(new Event('daily_logs_updated'));
    if (e.key === 'mis_module_hours') window.dispatchEvent(new Event('module_hours_updated'));
    if (e.key === 'mis_notices') window.dispatchEvent(new Event('notices_updated'));
    if (e.key === 'eschedular26_lab_attendance') window.dispatchEvent(new Event('lab_attendance_updated'));
  });
}

// Initialize Realtime Listeners for Firestore Collections
export const initRealtimeCloudSync = () => {
  if (!isFirebaseConfigured() || !db) {
    console.log("ℹ️ Realtime Cloud Sync: Operating in local persistence mode (Waiting for Firebase keys).");
    return;
  }

  console.log("⚡ Realtime Cloud Sync: Connected to Firebase Firestore!");

  // 1. Listen for Schedule Overrides changes (Cancellations, Reschedules, Swaps)
  try {
    const overridesRef = query(collection(db, 'schedule_overrides'), limit(1000));
    onSnapshot(overridesRef, (snapshot) => {
      const cloudData = [];
      snapshot.forEach((docSnap) => {
        cloudData.push({ id: docSnap.id, ...docSnap.data() });
      });
      localStorage.setItem('mis_schedule_overrides', JSON.stringify(cloudData));
      notifySubscribers('overrides', cloudData);
      dispatchOverridesUpdated();
    }, (err) => {
      console.warn("Firestore overrides subscription notice:", err);
    });
  } catch (err) {
    console.error("Firestore overrides subscription error:", err);
  }

  // 2. Listen for Department Notices & Announcements
  try {
    const noticesRef = query(collection(db, 'notices'), limit(1000));
    onSnapshot(noticesRef, (snapshot) => {
      const cloudNotices = [];
      snapshot.forEach((docSnap) => {
        cloudNotices.push({ id: docSnap.id, ...docSnap.data() });
      });
      cloudNotices.sort((a, b) => b.id - a.id);
      localStorage.setItem('mis_notices', JSON.stringify(cloudNotices));
      notifySubscribers('notices', cloudNotices);
      dispatchNoticesUpdated();
    }, (err) => {
      console.warn("Firestore notices subscription notice:", err);
    });
  } catch (err) {
    console.error("Firestore notices subscription error:", err);
  }

  // 3. Listen for EE01 - EE12 Lab Attendance records
  try {
    const attendanceRef = query(collection(db, 'lab_attendance'), limit(1000));
    onSnapshot(attendanceRef, (snapshot) => {
      const attendanceMap = {};
      snapshot.forEach((docSnap) => {
        attendanceMap[docSnap.id] = docSnap.data();
      });
      localStorage.setItem('eschedular26_lab_attendance', JSON.stringify(attendanceMap));
      notifySubscribers('lab_attendance', attendanceMap);
      dispatchLabAttendanceUpdated();
    }, (err) => {
      console.warn("Firestore lab attendance subscription notice:", err);
    });
  } catch (err) {
    console.error("Firestore lab attendance subscription error:", err);
  }

  // 4. Listen for Daily Evening Lecture Logs
  try {
    const dailyLogsRef = query(collection(db, 'daily_logs'), limit(1000));
    onSnapshot(dailyLogsRef, (snapshot) => {
      const logsData = [];
      snapshot.forEach((docSnap) => {
        logsData.push({ id: docSnap.id, ...docSnap.data() });
      });
      logsData.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      localStorage.setItem('mis_daily_logs', JSON.stringify(logsData));
      notifySubscribers('daily_logs', logsData);
      dispatchDailyLogsUpdated();
    }, (err) => {
      console.warn("Firestore daily_logs subscription notice:", err);
    });
  } catch (err) {
    console.error("Firestore daily_logs subscription error:", err);
  }

  // 5. Listen for Module Hours & Course Progress
  try {
    const moduleHoursRef = query(collection(db, 'module_hours'), limit(1000));
    onSnapshot(moduleHoursRef, (snapshot) => {
      const hoursData = [];
      snapshot.forEach((docSnap) => {
        hoursData.push({ code: docSnap.id, ...docSnap.data() });
      });
      localStorage.setItem('mis_module_hours', JSON.stringify(hoursData));
      notifySubscribers('module_hours', hoursData);
      dispatchModuleHoursUpdated();
    }, (err) => {
      console.warn("Firestore module_hours subscription notice:", err);
    });
  } catch (err) {
    console.error("Firestore module_hours subscription error:", err);
  }

  // 6. Listen for Course Assessments
  try {
    const assessmentsRef = query(collection(db, 'assessments'), limit(1000));
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
    const auditLogsRef = query(collection(db, 'audit_logs'), limit(1000));
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
    await withRetry(() => setDoc(doc(db, 'schedule_overrides', docId), cleanPayload));
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
    await withRetry(() => setDoc(doc(db, 'notices', docId), cleanPayload));
    console.log(`✅ Notice synced to cloud: ${docId}`, cleanPayload);
  } catch (err) {
    console.error("Failed to push notice to cloud:", err);
  }
};

// Save EE Lab Attendance record to Cloud
export const pushLabAttendanceToCloud = async (dateStr, labName, records, note = '') => {
  if (!isFirebaseConfigured() || !db) return;
  try {
    const docId = `${dateStr}_${labName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const payload = sanitizeFirestoreData({
      date: dateStr,
      lab_name: labName,
      records: records,
      note: note || '',
      updated_at: getSriLankaTimestampStr(),
    });
    await withRetry(() => setDoc(doc(db, 'lab_attendance', docId), payload));
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
      await withRetry(() => setDoc(doc(db, 'daily_logs', docId), sanitizeFirestoreData(log)));
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
      await withRetry(() => setDoc(doc(db, 'module_hours', docId), sanitizeFirestoreData(mod)));
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
      await withRetry(() => setDoc(doc(db, 'assessments', docId), sanitizeFirestoreData(item)));
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
      await withRetry(() => setDoc(doc(db, 'audit_logs', docId), sanitizeFirestoreData(log)));
    }
  } catch (err) {
    console.error("Failed to push audit logs to cloud:", err);
  }
};

// Delete Daily Log document from Cloud Firestore
export const deleteDailyLogFromCloud = async (docId) => {
  if (!isFirebaseConfigured() || !db || !docId) return;
  try {
    await withRetry(() => deleteDoc(doc(db, 'daily_logs', String(docId))));
    console.log(`✅ Deleted daily log from cloud: ${docId}`);
  } catch (err) {
    console.error("Failed to delete daily log from cloud:", err);
  }
};

// Wipe all Daily Logs & reset Module Conducted Hours to 0 in Cloud Firestore
export const clearCloudDailyLogsAndHours = async () => {
  if (!isFirebaseConfigured() || !db) return;
  try {
    const dailyLogsRef = collection(db, 'daily_logs');
    const logsSnap = await getDocs(dailyLogsRef);
    const deletePromises = [];
    logsSnap.forEach((docSnap) => {
      deletePromises.push(withRetry(() => deleteDoc(doc(db, 'daily_logs', docSnap.id))));
    });
    await Promise.all(deletePromises);

    const moduleHoursRef = collection(db, 'module_hours');
    const hoursSnap = await getDocs(moduleHoursRef);
    const updatePromises = [];
    hoursSnap.forEach((docSnap) => {
      updatePromises.push(withRetry(() => setDoc(doc(db, 'module_hours', docSnap.id), { conductedHours: 0 }, { merge: true })));
    });
    await Promise.all(updatePromises);
    console.log("✅ Successfully cleared all daily logs and reset module hours in Cloud Firestore!");
  } catch (err) {
    console.error("Failed to clear cloud daily logs and hours:", err);
  }
};



// Wipe all Daily Logs, Schedule Overrides & reset Module Conducted Hours to 0 in Cloud Firestore & LocalStorage (Preserving Lab Logs)
export const clearCloudLectureLogsAndOverrides = async () => {
  localStorage.setItem('mis_daily_logs', JSON.stringify([]));
  localStorage.setItem('mis_schedule_overrides', JSON.stringify([]));

  if (!isFirebaseConfigured() || !db) return;
  try {
    // 1. Delete all daily_logs
    const dailyLogsRef = collection(db, 'daily_logs');
    const logsSnap = await getDocs(dailyLogsRef);
    const deletePromises = [];
    logsSnap.forEach((docSnap) => {
      deletePromises.push(withRetry(() => deleteDoc(doc(db, 'daily_logs', docSnap.id))));
    });
    await Promise.all(deletePromises);

    // 2. Delete all schedule_overrides (Cancellations, Reschedules)
    const overridesRef = collection(db, 'schedule_overrides');
    const overridesSnap = await getDocs(overridesRef);
    const deleteOverridePromises = [];
    overridesSnap.forEach((docSnap) => {
      deleteOverridePromises.push(withRetry(() => deleteDoc(doc(db, 'schedule_overrides', docSnap.id))));
    });
    await Promise.all(deleteOverridePromises);

    // 3. Reset conductedHours in module_hours to 0
    const moduleHoursRef = collection(db, 'module_hours');
    const hoursSnap = await getDocs(moduleHoursRef);
    const updatePromises = [];
    hoursSnap.forEach((docSnap) => {
      updatePromises.push(withRetry(() => setDoc(doc(db, 'module_hours', docSnap.id), { conductedHours: 0 }, { merge: true })));
    });
    await Promise.all(updatePromises);

    console.log("✅ Successfully cleared all lecture logs & schedule overrides in Cloud Firestore!");
  } catch (err) {
    console.error("Failed to clear cloud lecture logs and overrides:", err);
  }

  window.dispatchEvent(new Event('daily_logs_updated'));
  window.dispatchEvent(new Event('schedule_overrides_updated'));
  window.dispatchEvent(new Event('module_hours_updated'));
};

// Wipe all Lab Attendance records in Cloud Firestore
export const clearCloudLabAttendance = async () => {
  if (!isFirebaseConfigured() || !db) return;
  try {
    const attendanceRef = collection(db, 'lab_attendance');
    const snap = await getDocs(attendanceRef);
    const deletePromises = [];
    snap.forEach((docSnap) => {
      deletePromises.push(withRetry(() => deleteDoc(doc(db, 'lab_attendance', docSnap.id))));
    });
    await Promise.all(deletePromises);
    console.log("✅ Successfully cleared all lab attendance records in Cloud Firestore!");
  } catch (err) {
    console.error("Failed to clear cloud lab attendance:", err);
  }
};

// Delete Schedule Override document from Cloud Firestore
export const deleteOverrideFromCloud = async (docId) => {
  if (!isFirebaseConfigured() || !db || !docId) return;
  try {
    await withRetry(() => deleteDoc(doc(db, 'schedule_overrides', String(docId))));
    console.log(`✅ Deleted schedule override from cloud: ${docId}`);
  } catch (err) {
    console.error("Failed to delete schedule override from cloud:", err);
  }
};

// Delete Department Notice document from Cloud Firestore
export const deleteNoticeFromCloud = async (docId) => {
  if (!isFirebaseConfigured() || !docId) return;
  try {
    await withRetry(() => deleteDoc(doc(db, 'notices', String(docId))));
    console.log(`✅ Deleted notice from cloud: ${docId}`);
  } catch (err) {
    console.error("Failed to delete notice from cloud:", err);
  }
};
