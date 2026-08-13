// Initial Daily Evening Lecture Logs (Started July 27th, 2026)
export const initialDailyLogs = [
  { id: 1, date: '2026-07-27', module: 'EE3203', hours: 2, topic: 'Introduction & Measurement Errors', venue: 'NCC', instructor: 'Dr. Fernando' },
  { id: 2, date: '2026-07-27', module: 'EE3202', hours: 1, topic: 'Array & Linked List Fundamentals', venue: 'LT1', instructor: 'Dr. Perera' },
  { id: 3, date: '2026-07-27', module: 'EE3304', hours: 2, topic: 'Electrostatics & Coulomb\'s Law', venue: 'NLH2', instructor: 'Prof. Silva' },
  { id: 4, date: '2026-07-27', module: 'IS3301', hours: 2, topic: 'Complex Numbers & Functions', venue: 'AUD', instructor: 'Dr. Jayawardena' },
  { id: 5, date: '2026-07-28', module: 'EE3306', hours: 1, topic: 'Signals & Continuous Systems Overview', venue: 'LT2', instructor: 'Dr. Fernando' },
  { id: 6, date: '2026-07-28', module: 'EE3202', hours: 2, topic: 'Stack & Queue ADT Implementation', venue: 'LT2', instructor: 'Dr. Perera' },
  { id: 7, date: '2026-07-28', module: 'IS3321', hours: 2, topic: 'Management Principles for Engineers', venue: 'AUD', instructor: 'Ms. Bandara' },
  { id: 8, date: '2026-07-28', module: 'EE3205', hours: 2, topic: 'Power Systems & Energy Sources', venue: 'LT1', instructor: 'Prof. Silva' },
  { id: 9, date: '2026-07-28', module: 'EE3301', hours: 1, topic: 'Diode Circuits & Rectifiers', venue: 'LT2', instructor: 'Dr. Perera' }
];

// Initial Audit Trail Entries
export const initialAuditLogs = [
  { id: 101, timestamp: '2026-07-27 18:30', user: 'Admin (Evening Log)', action: 'Logged Lectures', details: 'Added 4 completed lectures for 27th July (7 total hours).' },
  { id: 102, timestamp: '2026-07-28 18:00', user: 'Admin (Evening Log)', action: 'Logged Lectures', details: 'Added 5 completed lectures for 28th July (8 total hours).' },
  { id: 103, timestamp: '2026-07-29 08:00', user: 'Admin', action: 'Holiday Notice', details: 'Set Wednesday 29th July as Department Holiday.' }
];

// Sample Student Registration Lookup Dataset
export const studentRegistry = [
  { regNo: 'EG/2023/001', name: 'A. B. Perera', labGroup: 'Group A1', practicalSlot: 'Wed 08:30 - 11:30 (Electronics Lab)' },
  { regNo: 'EG/2023/015', name: 'K. L. Silva', labGroup: 'Group A2', practicalSlot: 'Wed 08:30 - 11:30 (Software Lab)' },
  { regNo: 'EG/2023/042', name: 'M. N. Fernando', labGroup: 'Group B1', practicalSlot: 'Fri 01:30 - 03:30 (Power Lab)' },
  { regNo: 'EG/2023/088', name: 'S. T. Bandara', labGroup: 'Group B2', practicalSlot: 'Fri 01:30 - 03:30 (Machines Lab)' },
  { regNo: 'EG/2023/120', name: 'R. P. Jayawardena', labGroup: 'Group C1', practicalSlot: 'Wed 08:30 - 11:30 (Measurement Lab)' }
];

import { getStoredModuleHours, saveStoredModuleHours, recalculateModuleHoursFromLogs } from './moduleHoursData';
import { pushDailyLogsToCloud, pushAuditLogsToCloud } from './firebaseSync';
import { getSriLankaTimestampStr } from '../utils/dateUtils';

// Local Storage Wrappers
export const getStoredDailyLogs = () => {
  const local = localStorage.getItem('mis_daily_logs');
  if (local) {
    try { return JSON.parse(local); } catch (e) { return initialDailyLogs; }
  }
  return initialDailyLogs;
};

export const saveStoredDailyLogs = (logs) => {
  localStorage.setItem('mis_daily_logs', JSON.stringify(logs));
  pushDailyLogsToCloud(logs);
  recalculateModuleHoursFromLogs();
  window.dispatchEvent(new Event('daily_logs_updated'));
  window.dispatchEvent(new Event('module_hours_updated'));
  window.dispatchEvent(new Event('schedule_overrides_updated'));
};

export const deleteDailyLogByModuleAndDate = (dateStr, moduleCode) => {
  const currentLogs = getStoredDailyLogs();
  const logsToDelete = currentLogs.filter(l => l.date === dateStr && l.module === moduleCode);
  if (logsToDelete.length === 0) return false;

  const totalHoursToSubtract = logsToDelete.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);

  // 1. Remove matching logs from mis_daily_logs
  const updatedLogs = currentLogs.filter(l => !(l.date === dateStr && l.module === moduleCode));
  saveStoredDailyLogs(updatedLogs);

  // 2. Subtract conducted hours from mis_module_hours
  const currentHours = getStoredModuleHours();
  const updatedHours = currentHours.map(m => {
    if (m.code === moduleCode) {
      return { ...m, conductedHours: Math.max(0, m.conductedHours - totalHoursToSubtract) };
    }
    return m;
  });
  saveStoredModuleHours(updatedHours);

  // 3. Add Audit Log
  addAuditLog('Reset Conducted Status', `Reset/Removed conducted log for ${moduleCode} on ${dateStr} (-${totalHoursToSubtract} hrs)`);

  window.dispatchEvent(new Event('daily_logs_updated'));
  window.dispatchEvent(new Event('schedule_overrides_updated'));

  return true;
};

export const getStoredAuditLogs = () => {
  const local = localStorage.getItem('mis_audit_logs');
  if (local) {
    try { return JSON.parse(local); } catch (e) { return initialAuditLogs; }
  }
  return initialAuditLogs;
};

export const addAuditLog = (action, details, user = 'Admin') => {
  const current = getStoredAuditLogs();
  const newEntry = {
    id: Date.now(),
    timestamp: getSriLankaTimestampStr().replace('T', ' ').substring(0, 16),
    user,
    action,
    details
  };
  const updated = [newEntry, ...current];
  localStorage.setItem('mis_audit_logs', JSON.stringify(updated));
  pushAuditLogsToCloud(updated);
  return updated;
};
