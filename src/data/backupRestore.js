import { getStoredOverrides, saveStoredOverrides } from './scheduleStore';
import { getStoredNotices } from './scheduleStore';
import { getStoredAttendance, saveStoredAttendance } from './labTrackerData';
import { getStoredDailyLogs, saveStoredDailyLogs, getStoredAuditLogs } from './dailyLogsData';
import { getStoredModuleHours, saveStoredModuleHours } from './moduleHoursData';
import { getStoredAssessments, saveStoredAssessments } from './assessmentData';
import { 
  pushOverrideToCloud, 
  pushNoticeToCloud, 
  pushLabAttendanceToCloud,
  pushDailyLogsToCloud,
  pushModuleHoursToCloud,
  pushAssessmentsToCloud,
  pushAuditLogsToCloud
} from './firebaseSync';

// 1. Export 100% Complete Database to a JSON File
export const exportCompleteDatabaseJSON = () => {
  const backupData = {
    metadata: {
      appName: 'ESchedular26 MIS System',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      system: 'Faculty of Engineering Semester 3 MIS'
    },
    schedule_overrides: getStoredOverrides(),
    notices: getStoredNotices(),
    lab_attendance: getStoredAttendance(),
    daily_logs: getStoredDailyLogs(),
    module_hours: getStoredModuleHours(),
    assessments: getStoredAssessments(),
    audit_logs: getStoredAuditLogs()
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.href = url;
  link.setAttribute('download', `ESchedular26_Full_Database_Backup_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log("✅ Complete database backup exported successfully.");
  return backupData;
};

// 2. Restore Database from a Backup JSON File
export const restoreCompleteDatabaseJSON = async (jsonString) => {
  try {
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup file format.');
    }

    // Restore to Local Storage
    if (data.schedule_overrides && Array.isArray(data.schedule_overrides)) {
      saveStoredOverrides(data.schedule_overrides);
      data.schedule_overrides.forEach(item => pushOverrideToCloud(item));
    }

    if (data.notices && Array.isArray(data.notices)) {
      localStorage.setItem('mis_notices', JSON.stringify(data.notices));
      data.notices.forEach(item => pushNoticeToCloud(item));
    }

    if (data.lab_attendance && typeof data.lab_attendance === 'object') {
      localStorage.setItem('eschedular26_lab_attendance', JSON.stringify(data.lab_attendance));
      Object.values(data.lab_attendance).forEach(entry => {
        if (entry && entry.date && entry.lab_name && entry.records) {
          pushLabAttendanceToCloud(entry.date, entry.lab_name, entry.records);
        }
      });
    }

    if (data.daily_logs && Array.isArray(data.daily_logs)) {
      saveStoredDailyLogs(data.daily_logs);
      pushDailyLogsToCloud(data.daily_logs);
    }

    if (data.module_hours && Array.isArray(data.module_hours)) {
      saveStoredModuleHours(data.module_hours);
      pushModuleHoursToCloud(data.module_hours);
    }

    if (data.assessments && Array.isArray(data.assessments)) {
      saveStoredAssessments(data.assessments);
      pushAssessmentsToCloud(data.assessments);
    }

    if (data.audit_logs && Array.isArray(data.audit_logs)) {
      localStorage.setItem('mis_audit_logs', JSON.stringify(data.audit_logs));
      pushAuditLogsToCloud(data.audit_logs);
    }

    console.log("✅ Database restoration complete. Cloud & Local synced.");
    return { success: true, message: 'Database successfully restored & synced to cloud.' };
  } catch (err) {
    console.error("Database Restoration Error:", err);
    return { success: false, message: `Failed to restore database: ${err.message}` };
  }
};

// 3. Automated Daily Emergency Snapshot (Rolling local safety net)
export const createEmergencyLocalSnapshot = () => {
  try {
    const snapshot = {
      timestamp: new Date().toISOString(),
      schedule_overrides: getStoredOverrides(),
      notices: getStoredNotices(),
      lab_attendance: getStoredAttendance(),
      daily_logs: getStoredDailyLogs(),
      module_hours: getStoredModuleHours(),
      assessments: getStoredAssessments()
    };
    localStorage.setItem('eschedular26_auto_snapshot', JSON.stringify(snapshot));
  } catch (e) {
    console.warn("Emergency snapshot creation notice:", e);
  }
};
