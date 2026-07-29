import { weeklyTimetable } from './timetableData';
import { getStoredModuleHours, saveStoredModuleHours } from './moduleHoursData';
import { getStoredDailyLogs, saveStoredDailyLogs, addAuditLog } from './dailyLogsData';

// Initial Schedule Overrides (Cancellations, Reschedules, Swaps per date)
export const initialOverrides = [
  { id: 1, date: '2026-07-29', module: 'ALL', status: 'Canceled', reason: 'Department Holiday', time: 'All Day' }
];

export const getStoredOverrides = () => {
  const local = localStorage.getItem('mis_schedule_overrides');
  if (local) {
    try { return JSON.parse(local); } catch (e) { return initialOverrides; }
  }
  return initialOverrides;
};

export const saveStoredOverrides = (overrides) => {
  localStorage.setItem('mis_schedule_overrides', JSON.stringify(overrides));
};

// Initial Notices Feed
export const initialNotices = [
  { id: 1, title: 'Department Holiday Notice', date: '2026-07-29', type: 'Holiday', content: 'Wednesday July 29 is a department holiday. Regular lectures resume Thursday July 30.' },
  { id: 2, title: 'Semester Started 27th July', date: '2026-07-27', type: 'Announcement', content: 'Semester 3 academic lectures are officially in progress.' }
];

export const getStoredNotices = () => {
  const local = localStorage.getItem('mis_notices');
  if (local) {
    try { return JSON.parse(local); } catch (e) { return initialNotices; }
  }
  return initialNotices;
};

export const addNotice = (title, content, type = 'Alert', date = new Date().toISOString().split('T')[0]) => {
  const current = getStoredNotices();
  const newNotice = { id: Date.now(), title, content, type, date };
  const updated = [newNotice, ...current];
  localStorage.setItem('mis_notices', JSON.stringify(updated));
  return updated;
};

export const removeNotice = (id) => {
  const current = getStoredNotices();
  const updated = current.filter(n => n.id !== id);
  localStorage.setItem('mis_notices', JSON.stringify(updated));
  addAuditLog('Removed Notice', `Admin deleted notice ID: ${id}`);
  return updated;
};

export const updateNotice = (id, title, content) => {
  const current = getStoredNotices();
  const updated = current.map(n => {
    if (n.id === id) {
      return { ...n, title, content };
    }
    return n;
  });
  localStorage.setItem('mis_notices', JSON.stringify(updated));
  addAuditLog('Updated Notice', `Admin edited notice: "${title}"`);
  return updated;
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

// Helper: Get Modules Scheduled on a Specific Date (Including Overrides)
export const getModulesForDate = (dateStr) => {
  if (!dateStr) return [];
  const dayName = getDayNameFromDate(dateStr);
  const baseSlots = weeklyTimetable[dayName] || [];
  const overrides = getStoredOverrides().filter(o => o.date === dateStr);

  const result = [];
  baseSlots.forEach(slot => {
    const override = overrides.find(o => o.module === slot.module || o.module === 'ALL');
    if (override) {
      if (override.status === 'Canceled') {
        result.push({ ...slot, status: 'Canceled', reason: override.reason });
      } else if (override.status === 'Rescheduled') {
        result.push({ ...slot, status: 'Rescheduled', newTime: override.time, newVenue: override.venue });
      } else if (override.status === 'Swapped') {
        result.push({ ...slot, status: 'Swapped', swapModule: override.swapModule });
      } else {
        result.push({ ...slot, status: override.status });
      }
    } else {
      result.push({ ...slot, status: 'Scheduled' });
    }
  });

  // Include any extra rescheduled slots for this date
  overrides.forEach(o => {
    if (o.status === 'Rescheduled' && !result.some(r => r.module === o.module)) {
      result.push({
        time: o.time || '10:30 - 12:30',
        module: o.module,
        name: `Rescheduled ${o.module}`,
        hall: o.venue || 'LT1',
        type: 'Lecture',
        status: 'Rescheduled'
      });
    }
  });

  return result;
};

// Function: Reschedule / Cancel / Swap a Lecture (Admin Action)
export const modifyScheduleSlot = ({ date, module, status, newTime, newVenue, reason, swapModule }) => {
  const currentOverrides = getStoredOverrides();

  const newOverride = {
    id: Date.now(),
    date,
    module,
    status,
    time: newTime,
    venue: newVenue,
    reason,
    swapModule
  };

  const updatedOverrides = [newOverride, ...currentOverrides.filter(o => !(o.date === date && o.module === module))];
  saveStoredOverrides(updatedOverrides);

  // Auto Broadcast Notice
  let noticeTitle = '';
  let noticeContent = '';

  if (status === 'Canceled') {
    noticeTitle = `⚠️ LECTURE CANCELED: ${module} (${date})`;
    noticeContent = `The ${module} lecture scheduled for ${date} has been CANCELED. ${reason ? 'Reason: ' + reason : ''}`;
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
