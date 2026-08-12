// src/utils/dateUtils.js

export const SEMESTER_START_DATE = '2026-07-27';

// Get current date string in YYYY-MM-DD format for Sri Lanka timezone
export const getSriLankaDateStr = (dateObj = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
};

// Get current date string, clamped to not be before SEMESTER_START_DATE
export const getValidSemesterDateStr = (dateObj = new Date()) => {
  const dateStr = getSriLankaDateStr(dateObj);
  return dateStr < SEMESTER_START_DATE ? SEMESTER_START_DATE : dateStr;
};

// Get current ISO-like string for Sri Lanka timezone (YYYY-MM-DDTHH:mm:ss)
export const getSriLankaTimestampStr = (dateObj = new Date()) => {
  const formatted = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(dateObj);
  
  return formatted.replace(' ', 'T');
};

// Get the day of week (0-6) for Sri Lanka timezone (0 = Sunday, 1 = Monday...)
export const getSriLankaDayOfWeek = (dateObj = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    weekday: 'short'
  });
  const dayStr = formatter.format(dateObj);
  const days = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
  return days[dayStr];
};

// Returns a Date object that, in the local machine's timezone, has the same year/month/date/hours/minutes as the current Sri Lankan time.
// This is useful for Date math (like .getDay() and .getHours()) without changing existing logic.
export const getSriLankaDateObj = () => {
  return new Date(getSriLankaTimestampStr());
};

