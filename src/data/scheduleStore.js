import { weeklyTimetable } from './timetableData';
import { getStoredModuleHours, saveStoredModuleHours } from './moduleHoursData';
import { getStoredDailyLogs, saveStoredDailyLogs, addAuditLog } from './dailyLogsData';
import { pushOverrideToCloud, pushNoticeToCloud, deleteOverrideFromCloud, deleteNoticeFromCloud } from './firebaseSync';
import { pushRecordToGoogleSheetWebhook } from './googleSheetsSync';
import { getSriLankaDateStr } from '../utils/dateUtils';

// Initial Schedule Overrides (Cancellations, Reschedules, Swaps per date)
export const initialOverrides = [
  { id: 1, date: '2026-07-29', module: 'ALL', status: 'Canceled', reason: 'Esala Full Moon Poya Day Holiday', time: 'All Day' }
];

export const getStoredOverrides = () => {
  const local = localStorage.getItem('mis_schedule_overrides');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        // Clean out any lab initial override (id: 2 or Lab 1)
        const cleaned = parsed.filter(p => p.id !== 2 && !p.reason?.includes('Lab 1'));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem('mis_schedule_overrides', JSON.stringify(cleaned));
        }
        return cleaned;
      }
    } catch (e) { return initialOverrides; }
  }
  return initialOverrides;
};

export const saveStoredOverrides = (overrides) => {
  localStorage.setItem('mis_schedule_overrides', JSON.stringify(overrides));
  if (Array.isArray(overrides)) {
    overrides.forEach(o => pushOverrideToCloud(o));
  }
  window.dispatchEvent(new Event('schedule_overrides_updated'));
};

// Initial Notices Feed
export const initialNotices = [
  { id: 1, title: 'Department Holiday Notice', date: '2026-07-29', type: 'Holiday', content: 'Wednesday July 29 is Esala Full Moon Poya Day. Regular physical lectures resume Thursday July 30.' },
  { id: 2, title: 'Semester Started 27th July', date: '2026-07-27', type: 'Announcement', content: 'Semester 3 academic lectures are officially in progress.' }
];

export const getStoredNotices = () => {
  const local = localStorage.getItem('mis_notices');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(n => n.id !== 3 && !n.title?.includes('LAB RESCHEDULED'));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem('mis_notices', JSON.stringify(cleaned));
        }
        return cleaned;
      }
    } catch (e) { return initialNotices; }
  }
  return initialNotices;
};

export const addNotice = (title, content, type = 'Alert', date = getSriLankaDateStr()) => {
  const current = getStoredNotices();
  const newNotice = { id: Date.now(), title, content, type, date };
  const updated = [newNotice, ...current];
  localStorage.setItem('mis_notices', JSON.stringify(updated));
  pushNoticeToCloud(newNotice);
  pushRecordToGoogleSheetWebhook({ type: 'Notice Broadcast', title, content, date, status: type });
  return updated;
};

export const removeNotice = (id) => {
  const current = getStoredNotices();
  const updated = current.filter(n => n.id !== id);
  localStorage.setItem('mis_notices', JSON.stringify(updated));
  deleteNoticeFromCloud(id);
  addAuditLog('Removed Notice', `Admin deleted notice ID: ${id}`);
  window.dispatchEvent(new Event('notices_updated'));
  return updated;
};

export const updateNotice = (id, title, content) => {
  const current = getStoredNotices();
  let updatedNotice = null;
  const updated = current.map(n => {
    if (n.id === id) {
      updatedNotice = { ...n, title, content };
      return updatedNotice;
    }
    return n;
  });
  localStorage.setItem('mis_notices', JSON.stringify(updated));
  if (updatedNotice) {
    pushNoticeToCloud(updatedNotice);
  }
  addAuditLog('Updated Notice', `Admin edited notice: "${title}"`);
  window.dispatchEvent(new Event('notices_updated'));
  return updated;
};

// Helper: Parse time range string like "08:30 - 10:30" or "08:30 AM - 10:30 AM" into minutes from midnight
export const parseTimeRangeToMinutes = (timeStr) => {
  if (!timeStr) return { startMin: 510, endMin: 630 };

  const convertToMin = (str) => {
    const s = str.trim().toUpperCase();
    const isPM = s.includes('PM');
    const isAM = s.includes('AM');
    const clean = s.replace(/AM|PM/g, '').trim();
    const parts = clean.split(':');
    let h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;

    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;

    if (!isPM && !isAM && h >= 1 && h <= 7) {
      h += 12;
    }

    return h * 60 + m;
  };

  const parts = timeStr.split('-');
  if (parts.length < 2) return { startMin: 510, endMin: 630 };

  const startMin = convertToMin(parts[0]);
  const endMin = convertToMin(parts[1]);

  return { startMin, endMin };
};

// Helper: Get Day Name from YYYY-MM-DD string (Timezone Independent)
export const getDayNameFromDate = (dateStr) => {
  if (!dateStr) return 'Monday';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return days[d.getDay()] || 'Monday';
};

// Helper: Module Code to Title Mapping
export const getModuleName = (moduleCode) => {
  const moduleNames = {
    'EE3203': 'Electrical & Electronic Measurements',
    'EE3202': 'Data Structures & Algorithms',
    'EE3304': 'Engineering Electromagnetism',
    'IS3301': 'Complex Analysis and Mathematical Transforms',
    'EE3306': 'Signals & Systems',
    'IS3321': 'Management for Engineers',
    'EE3205': 'Power & Energy',
    'EE3301': 'Analog Electronics',
    'IS3322': 'Society & the Engineers',
    'CCSSD': 'Soft Skills Development'
  };
  return moduleNames[moduleCode] || moduleCode;
};

// Helper: Get Modules Scheduled on a Specific Date (Including Overrides & Minutes)
export const getModulesForDate = (dateStr) => {
  if (!dateStr) return [];
  const dayName = getDayNameFromDate(dateStr);
  const baseSlots = weeklyTimetable[dayName] || [];
  const overrides = getStoredOverrides().filter(o => o.date === dateStr);

  const result = [];
  baseSlots.forEach(slot => {
    const override = overrides.find(o => o.module === slot.module || o.module === 'ALL');
    
    let timeRange = slot.time;
    let venue = slot.hall;
    let status = 'Scheduled';
    let reason = '';
    let swapModule = '';
    let isRescheduled = false;

    if (override) {
      status = override.status;
      reason = override.reason || '';
      swapModule = override.swapModule || '';
      if (override.status === 'Rescheduled') {
        isRescheduled = true;
      }
      if (override.time) timeRange = override.time;
      if (override.venue) venue = override.venue;
    }

    const { startMin, endMin } = parseTimeRangeToMinutes(timeRange);

    result.push({
      ...slot,
      time: timeRange,
      hall: venue,
      status,
      reason,
      swapModule,
      isRescheduled,
      startMin: slot.startMin || startMin,
      endMin: slot.endMin || endMin
    });
  });

  // Include any extra rescheduled slots for this date
  overrides.forEach(o => {
    if (o.status === 'Rescheduled' && !result.some(r => r.module === o.module)) {
      const timeRange = o.time || '10:30 - 12:30';
      const { startMin, endMin } = parseTimeRangeToMinutes(timeRange);
      const realName = getModuleName(o.module);
      result.push({
        time: timeRange,
        module: o.module,
        name: realName,
        hall: o.venue || 'LT1',
        type: 'Lecture',
        status: 'Rescheduled',
        isRescheduled: true,
        reason: o.reason || '',
        startMin,
        endMin
      });
    }
  });

  // Sort chronologically by startMin
  result.sort((a, b) => a.startMin - b.startMin);

  return result;
};

// Function: Un-cancel / Restore a Canceled Lecture
export const uncancelScheduleSlot = ({ date, module, reason = '' }) => {
  const currentOverrides = getStoredOverrides();
  const overridesToRemove = currentOverrides.filter(o => o.date === date && (o.module === module || o.module === 'ALL'));
  
  overridesToRemove.forEach(o => {
    deleteOverrideFromCloud(o.id || `${o.date}_${o.module}`);
  });

  const updatedOverrides = currentOverrides.filter(o => !(o.date === date && (o.module === module || o.module === 'ALL')));
  saveStoredOverrides(updatedOverrides);

  // Broadcast Restoration Notice
  const noticeTitle = `✅ LECTURE RESTORED: ${module} (${date})`;
  const noticeContent = `The ${module} lecture scheduled for ${date} has been RESTORED / UN-CANCELED. ${reason ? 'Note: ' + reason : 'Regular class schedule applies.'}`;
  addNotice(noticeTitle, noticeContent, 'Announcement', date);

  // Audit Trail
  addAuditLog('Schedule Restored', `Restored/Un-canceled ${module} on ${date}. ${reason ? 'Details: ' + reason : 'Regular schedule restored.'}`);

  return updatedOverrides;
};

// Function: Reschedule / Cancel / Swap a Lecture (Admin Action)
export const modifyScheduleSlot = ({ date, module, status, newTime = '', newVenue = '', reason = '', swapModule = '' }) => {
  if (status === 'Scheduled' || status === 'Restored' || status === 'Uncanceled') {
    return uncancelScheduleSlot({ date, module, reason });
  }

  const currentOverrides = getStoredOverrides();
  const existingOverride = currentOverrides.find(o => o.date === date && o.module === module);
  const isRecancel = existingOverride && existingOverride.status === 'Canceled';

  const newOverride = {
    id: existingOverride ? existingOverride.id : Date.now(),
    date,
    module,
    status,
    time: newTime || '',
    venue: newVenue || '',
    reason: reason || '',
    swapModule: swapModule || ''
  };

  const updatedOverrides = [newOverride, ...currentOverrides.filter(o => !(o.date === date && o.module === module))];
  saveStoredOverrides(updatedOverrides);
  pushOverrideToCloud(newOverride);

  // Auto Broadcast Notice
  let noticeTitle = '';
  let noticeContent = '';

  if (status === 'Canceled') {
    noticeTitle = isRecancel ? `⚠️ LECTURE RE-CANCELED: ${module} (${date})` : `⚠️ LECTURE CANCELED: ${module} (${date})`;
    noticeContent = `The ${module} lecture scheduled for ${date} has been ${isRecancel ? 'RE-CANCELED with updated details' : 'CANCELED'}. ${reason ? 'Reason: ' + reason : ''}`;
  } else if (status === 'Rescheduled') {
    noticeTitle = `🔄 LECTURE RESCHEDULED: ${module}`;
    noticeContent = `The ${module} lecture for ${date} has been RESCHEDULED to ${newTime} at venue ${newVenue}.`;
  } else if (status === 'Swapped') {
    noticeTitle = `🔀 LECTURE SWAPPED: ${module} ↔ ${swapModule}`;
    noticeContent = `The ${module} lecture slot on ${date} has been SWAPPED with ${swapModule}.`;
  }

  if (noticeTitle) {
    addNotice(noticeTitle, noticeContent, status, date);
  }

  // Audit Trail
  addAuditLog(`Schedule ${status}`, `Set ${module} on ${date} to ${status}. Details: ${noticeContent}`);
};

// Export Full Semester Schedule with all live modifications to CSV
export const exportSemesterScheduleCSV = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const overrides = getStoredOverrides();

  let csvContent = "Day,Time Slot,Module Code,Module Title,Venue / Hall,Session Type,Current Status,Remarks / Notes\n";

  days.forEach(dayName => {
    const slots = weeklyTimetable[dayName] || [];
    slots.forEach(slot => {
      const override = overrides.find(o => o.module === slot.module);
      let status = 'Scheduled';
      let venue = slot.hall || 'LT1';
      let time = slot.time || '08:30 - 10:30';
      let remark = '';

      if (override) {
        status = override.status;
        if (override.status === 'Rescheduled') {
          time = override.time || time;
          venue = override.venue || venue;
          remark = `Rescheduled to ${override.date} (${override.reason || ''})`;
        } else if (override.status === 'Canceled') {
          remark = `Canceled for ${override.date} (${override.reason || ''})`;
        } else if (override.status === 'Swapped') {
          remark = `Swapped with ${override.swapModule}`;
        }
      }

      csvContent += `"${dayName}","${time}","${slot.module}","${slot.name.replace(/"/g, '""')}","${venue}","${slot.type}","${status}","${remark}"\n`;
    });
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Faculty_of_Engineering_Semester_3_Schedule_2026.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
