import { pushLabAttendanceToCloud } from './firebaseSync';
import { getSriLankaDateStr, getSriLankaTimestampStr } from '../utils/dateUtils';

// EE01 to EE12 Group Codes Mapping
export const LAB_GROUPS = [
  { id: 1, code: 'EE01', name: 'Electrical Group 01' },
  { id: 2, code: 'EE02', name: 'Electrical Group 02' },
  { id: 3, code: 'EE03', name: 'Electrical Group 03' },
  { id: 4, code: 'EE04', name: 'Electrical Group 04' },
  { id: 5, code: 'EE05', name: 'Electrical Group 05' },
  { id: 6, code: 'EE06', name: 'Electrical Group 06' },
  { id: 7, code: 'EE07', name: 'Electrical Group 07' },
  { id: 8, code: 'EE08', name: 'Electrical Group 08' },
  { id: 9, code: 'EE09', name: 'Electrical Group 09' },
  { id: 10, code: 'EE10', name: 'Electrical Group 10' },
  { id: 11, code: 'EE11', name: 'Electrical Group 11' },
  { id: 12, code: 'EE12', name: 'Electrical Group 12' },
];

// Module Total Lab Session Counts & Official Venues
export const MODULE_LAB_COUNTS = [
  { code: 'EE3301', name: 'Analog Electronics', totalLabs: 4, location: 'Communication Laboratory' },
  { code: 'EE3306', name: 'Signals and Systems', totalLabs: 4, location: 'Communication Laboratory' },
  { code: 'EE3203', name: 'Electrical and Electronic Measurements', totalLabs: 3, location: 'Electronic and Measurement Laboratory' },
  { code: 'EE3304', name: 'Engineering Electromagnetism', totalLabs: 2, location: 'Communication Laboratory', note: 'Lab 1 omitted, Lab 2 scheduled' },
];

// Official 75 Students assigned across EE01 to EE12
export const INITIAL_STUDENTS = [
  // EE01
  { reg_no: 'EG/2024/6011', name: 'ABINASH K.', group_id: 1, group_code: 'EE01' },
  { reg_no: 'EG/2024/6029', name: 'ALUWIHARE A.A.L.N.', group_id: 1, group_code: 'EE01' },
  { reg_no: 'EG/2024/6046', name: 'ANVER S.A.', group_id: 1, group_code: 'EE01' },
  { reg_no: 'EG/2024/6057', name: 'ASHEEM M.J.M.', group_id: 1, group_code: 'EE01' },
  { reg_no: 'EG/2024/6058', name: 'ASRA A.A.F.', group_id: 1, group_code: 'EE01' },
  { reg_no: 'EG/2024/6060', name: 'ATHUKORALA S.A.S.N.', group_id: 1, group_code: 'EE01' },

  // EE02
  { reg_no: 'EG/2024/6076', name: 'BIHANGA M.A.P.', group_id: 2, group_code: 'EE02' },
  { reg_no: 'EG/2024/6110', name: 'DILMITH P.D.', group_id: 2, group_code: 'EE02' },
  { reg_no: 'EG/2024/6114', name: 'DILSHAN M.D.', group_id: 2, group_code: 'EE02' },
  { reg_no: 'EG/2024/6127', name: 'DISSANAYAKE D.M.I.B.', group_id: 2, group_code: 'EE02' },
  { reg_no: 'EG/2024/6148', name: 'FERNANDO M.J.C.', group_id: 2, group_code: 'EE02' },
  { reg_no: 'EG/2024/6149', name: 'FERNANDO M.Y.H.', group_id: 2, group_code: 'EE02' },
  { reg_no: 'EG/2024/6156', name: 'GAMAGE H.G.H.K.', group_id: 2, group_code: 'EE02' },

  // EE03
  { reg_no: 'EG/2024/6158', name: 'GANGODA P.B.G.O.J.B.', group_id: 3, group_code: 'EE03' },
  { reg_no: 'EG/2024/6161', name: 'GODEVITHANA G.V.S.S.S.', group_id: 3, group_code: 'EE03' },
  { reg_no: 'EG/2024/6164', name: 'GUNARATHNE H.D.D.D.', group_id: 3, group_code: 'EE03' },
  { reg_no: 'EG/2024/6169', name: 'GUNATHILAKA S.N.', group_id: 3, group_code: 'EE03' },
  { reg_no: 'EG/2024/6172', name: 'GUNAWARDANA J.T.A.', group_id: 3, group_code: 'EE03' },
  { reg_no: 'EG/2024/6176', name: 'GUNAWARDHANE D.G.S.I.', group_id: 3, group_code: 'EE03' },

  // EE04
  { reg_no: 'EG/2024/6184', name: 'HEMANTHA M.W.I.S.', group_id: 4, group_code: 'EE04' },
  { reg_no: 'EG/2024/6189', name: 'HERATH J.H.M.N.H.K.', group_id: 4, group_code: 'EE04' },
  { reg_no: 'EG/2024/6197', name: 'HULANGAMUWA S.W.M.D.C.', group_id: 4, group_code: 'EE04' },
  { reg_no: 'EG/2024/6198', name: 'IDDAMALGODA I.D.I.A.', group_id: 4, group_code: 'EE04' },
  { reg_no: 'EG/2024/6201', name: 'INDUMINA I.G.I.', group_id: 4, group_code: 'EE04' },
  { reg_no: 'EG/2024/6203', name: 'JANAGE A.K.', group_id: 4, group_code: 'EE04' },
  { reg_no: 'EG/2024/6216', name: 'JAYASEKARA J.M.A.D.', group_id: 4, group_code: 'EE04' },

  // EE05
  { reg_no: 'EG/2024/6221', name: 'JAYASOORIYA W.D.C.N.', group_id: 5, group_code: 'EE05' },
  { reg_no: 'EG/2024/6230', name: 'JAYAWARDENA J.G.T.D.', group_id: 5, group_code: 'EE05' },
  { reg_no: 'EG/2024/6232', name: 'JAYAWARDHANA W.D.G.S.S.', group_id: 5, group_code: 'EE05' },
  { reg_no: 'EG/2024/6234', name: 'JAYAWEERA W.P.K.', group_id: 5, group_code: 'EE05' },
  { reg_no: 'EG/2024/6238', name: 'KAARKY I.', group_id: 5, group_code: 'EE05' },
  { reg_no: 'EG/2024/6253', name: 'KAVEESHANA M.P.W.H.', group_id: 5, group_code: 'EE05' },
  { reg_no: 'EG/2024/6256', name: 'KEERTHIRATHNA G.G.P.K.B.', group_id: 5, group_code: 'EE05' },

  // EE06
  { reg_no: 'EG/2024/6263', name: 'KRISHNAMOORTHY R.', group_id: 6, group_code: 'EE06' },
  { reg_no: 'EG/2024/6272', name: 'KUMARAPELI K.A.D.M.', group_id: 6, group_code: 'EE06' },
  { reg_no: 'EG/2024/6273', name: 'KUMARASINGHA N.T.R.', group_id: 6, group_code: 'EE06' },
  { reg_no: 'EG/2024/6276', name: 'KUMARASIRI M.A.K.M.', group_id: 6, group_code: 'EE06' },
  { reg_no: 'EG/2024/6281', name: 'KURUPPU K.M.A.P.', group_id: 6, group_code: 'EE06' },
  { reg_no: 'EG/2024/6290', name: 'LOCHANA H.M.V.H.K.', group_id: 6, group_code: 'EE06' },

  // EE07
  { reg_no: 'EG/2024/6299', name: 'MADURAWALA M.A.B.', group_id: 7, group_code: 'EE07' },
  { reg_no: 'EG/2024/6326', name: 'MUSARRAF M.A.F.', group_id: 7, group_code: 'EE07' },
  { reg_no: 'EG/2024/6327', name: 'NADHEERA A.A.', group_id: 7, group_code: 'EE07' },
  { reg_no: 'EG/2024/6335', name: 'NETHSHANI J.M.N.', group_id: 7, group_code: 'EE07' },
  { reg_no: 'EG/2024/6344', name: 'NIMSARA W.L.G.', group_id: 7, group_code: 'EE07' },
  { reg_no: 'EG/2024/6360', name: 'PAVITHTHIRAN S.', group_id: 7, group_code: 'EE07' },

  // EE08
  { reg_no: 'EG/2024/6363', name: 'PERAMUNA P.R.D.P.', group_id: 8, group_code: 'EE08' },
  { reg_no: 'EG/2024/6377', name: 'PIYUMIKA U.S.', group_id: 8, group_code: 'EE08' },
  { reg_no: 'EG/2024/6381', name: 'PRABHASHWARA G.R.M.M.', group_id: 8, group_code: 'EE08' },
  { reg_no: 'EG/2024/6382', name: 'PRABUDYA H.S.', group_id: 8, group_code: 'EE08' },
  { reg_no: 'EG/2024/6384', name: 'PREMARATHNA P.A.K.S.A.', group_id: 8, group_code: 'EE08' },
  { reg_no: 'EG/2024/6388', name: 'PRIYADARSHANI D.M.G.', group_id: 8, group_code: 'EE08' },

  // EE09
  { reg_no: 'EG/2024/6390', name: 'PRIYANKARAGE N.M.', group_id: 9, group_code: 'EE09' },
  { reg_no: 'EG/2024/6410', name: 'RANATHUNGA G.C.S.', group_id: 9, group_code: 'EE09' },
  { reg_no: 'EG/2024/6413', name: 'RANAWEERA G.M.S.P.', group_id: 9, group_code: 'EE09' },
  { reg_no: 'EG/2024/6419', name: 'RASMIKA N.K.', group_id: 9, group_code: 'EE09' },
  { reg_no: 'EG/2024/6420', name: 'RATHNASEKARA R.T.A.A.N.', group_id: 9, group_code: 'EE09' },
  { reg_no: 'EG/2024/6430', name: 'RATHNAYAKA R.M.T.R.', group_id: 9, group_code: 'EE09' },

  // EE10
  { reg_no: 'EG/2024/6433', name: 'RATHNAYAKE A.U.', group_id: 10, group_code: 'EE10' },
  { reg_no: 'EG/2024/6436', name: 'RATHNAYAKE R.M.N.C.', group_id: 10, group_code: 'EE10' },
  { reg_no: 'EG/2024/6443', name: 'SAMARADIWAKARA S.M.U.S.', group_id: 10, group_code: 'EE10' },
  { reg_no: 'EG/2024/6445', name: 'SAMARAKOON W.M.E.G.A.I.B.', group_id: 10, group_code: 'EE10' },
  { reg_no: 'EG/2024/6451', name: 'SAMINDI A.W.R.R.', group_id: 10, group_code: 'EE10' },
  { reg_no: 'EG/2024/6458', name: 'SANDARUWAN N.G.N.', group_id: 10, group_code: 'EE10' },

  // EE11
  { reg_no: 'EG/2024/6463', name: 'SARADI K.A.M.T.', group_id: 11, group_code: 'EE11' },
  { reg_no: 'EG/2024/6475', name: 'SENEVIRATNE M.M.B.P.', group_id: 11, group_code: 'EE11' },
  { reg_no: 'EG/2024/6476', name: 'SEWMINI B.G.D.H.I.', group_id: 11, group_code: 'EE11' },
  { reg_no: 'EG/2024/6497', name: 'SURESH N.', group_id: 11, group_code: 'EE11' },
  { reg_no: 'EG/2024/6498', name: 'SWARNAJITH S.G.B.', group_id: 11, group_code: 'EE11' },
  { reg_no: 'EG/2024/6505', name: 'THENNAKOON T.M.C.N.', group_id: 11, group_code: 'EE11' },

  // EE12
  { reg_no: 'EG/2024/6506', name: 'THENNAKOON T.M.K.N.', group_id: 12, group_code: 'EE12' },
  { reg_no: 'EG/2024/6514', name: 'UMAYANTHA G.G.E.', group_id: 12, group_code: 'EE12' },
  { reg_no: 'EG/2024/6521', name: 'VISHVAJITH S.', group_id: 12, group_code: 'EE12' },
  { reg_no: 'EG/2024/6535', name: 'WIDURUSINGHE L.S.', group_id: 12, group_code: 'EE12' },
  { reg_no: 'EG/2024/6548', name: 'WIJEWEERA C.D.', group_id: 12, group_code: 'EE12' },
  { reg_no: 'EG/2024/6550', name: 'DE SILVA S.I.M', group_id: 12, group_code: 'EE12' },
];

// Helper array generators for groups
const GROUPS_1_TO_8 = ['EE01', 'EE02', 'EE03', 'EE04', 'EE05', 'EE06', 'EE07', 'EE08'];
const GROUPS_9_TO_12 = ['EE09', 'EE10', 'EE11', 'EE12'];
const GROUPS_1_TO_10 = ['EE01', 'EE02', 'EE03', 'EE04', 'EE05', 'EE06', 'EE07', 'EE08', 'EE09', 'EE10'];
const GROUPS_11_TO_12 = ['EE11', 'EE12'];
const ALL_GROUPS = ['EE01', 'EE02', 'EE03', 'EE04', 'EE05', 'EE06', 'EE07', 'EE08', 'EE09', 'EE10', 'EE11', 'EE12'];

// Helper to expand groups array into individual schedule objects
function expandScheduleEntries(week, date, time, lab_name, venue, groups) {
  return groups.map((gCode) => {
    const groupObj = LAB_GROUPS.find((g) => g.code === gCode);
    return {
      id: `${week}_${date}_${gCode}_${lab_name.replace(/[^a-zA-Z0-9]/g, '')}`,
      week,
      date,
      time,
      lab_name,
      venue,
      group_code: gCode,
      group_id: groupObj ? groupObj.id : 1,
    };
  });
}

// Complete 13-Week Semester Lab Schedule
export const INITIAL_SCHEDULE = [
  // Week 2
  ...expandScheduleEntries('Week 2', '2026-08-05', '08:30 AM - 11:30 AM', 'EE3301 Analog Electronics (Lab 1: Diodes & Practical Applications)', 'Communication Laboratory', GROUPS_1_TO_10),
  ...expandScheduleEntries('Week 2', '2026-08-07', '01:30 PM - 04:30 PM', 'EE3301 Analog Electronics (Lab 1: Diodes & Practical Applications)', 'Communication Laboratory', GROUPS_11_TO_12),

  // Week 3
  ...expandScheduleEntries('Week 3', '2026-08-12', '08:30 AM - 11:30 AM', 'EE3306 Signals & Systems (Lab 1: Continuous-Time Signal Analysis)', 'Communication Laboratory', GROUPS_1_TO_8),
  ...expandScheduleEntries('Week 3', '2026-08-14', '01:30 PM - 04:30 PM', 'EE3306 Signals & Systems (Lab 1: Continuous-Time Signal Analysis)', 'Communication Laboratory', GROUPS_9_TO_12),

  // Week 4
  ...expandScheduleEntries('Week 4', '2026-08-19', '08:30 AM - 11:30 AM', 'EE3301 Analog Electronics (Lab 2: Basic Amplifiers & Biasing)', 'Communication Laboratory', GROUPS_9_TO_12),
  ...expandScheduleEntries('Week 4', '2026-08-19', '08:30 AM - 11:30 AM', 'EE3203 Measurements (Lab 1: DC & AC Bridges)', 'Electronic and Measurement Laboratory', GROUPS_1_TO_8),
  ...expandScheduleEntries('Week 4', '2026-08-21', '01:30 PM - 04:30 PM', 'EE3301 Analog Electronics (Lab 2: Basic Amplifiers & Biasing)', 'Communication Laboratory', GROUPS_1_TO_8),
  ...expandScheduleEntries('Week 4', '2026-08-21', '01:30 PM - 04:30 PM', 'EE3203 Measurements (Lab 1: DC & AC Bridges)', 'Electronic and Measurement Laboratory', GROUPS_9_TO_12),

  // Week 6
  ...expandScheduleEntries('Week 6', '2026-09-02', '08:30 AM - 11:30 AM', 'EE3306 Signals & Systems (Lab 2: MATLAB Continuous Signals)', 'Communication Laboratory', ALL_GROUPS),
  ...expandScheduleEntries('Week 6', '2026-09-04', '01:30 PM - 04:30 PM', 'EE3203 Measurements (Lab 2: Oscilloscope Probe Testing)', 'Electronic and Measurement Laboratory', GROUPS_1_TO_8),

  // Week 7
  ...expandScheduleEntries('Week 7', '2026-09-09', '08:30 AM - 11:30 AM', 'EE3203 Measurements (Lab 2: Oscilloscope Probe Testing)', 'Electronic and Measurement Laboratory', GROUPS_9_TO_12),
  ...expandScheduleEntries('Week 7', '2026-09-11', '01:30 PM - 04:30 PM', 'EE3306 Signals & Systems (Lab 3: Analog/Digital Conversion)', 'Communication Laboratory', GROUPS_1_TO_8),

  // Week 9
  ...expandScheduleEntries('Week 9', '2026-09-23', '08:30 AM - 11:30 AM', 'EE3301 Analog Electronics (Lab 3: Op-Amps & Applications)', 'Communication Laboratory', GROUPS_1_TO_10),
  ...expandScheduleEntries('Week 9', '2026-09-25', '01:30 PM - 04:30 PM', 'EE3301 Analog Electronics (Lab 3: Op-Amps & Applications)', 'Communication Laboratory', GROUPS_11_TO_12),

  // Week 10
  ...expandScheduleEntries('Week 10', '2026-09-30', '08:30 AM - 11:30 AM', 'EE3306 Signals & Systems (Lab 3: Analog/Digital Conversion)', 'Communication Laboratory', GROUPS_9_TO_12),
  ...expandScheduleEntries('Week 10', '2026-10-02', '01:30 PM - 04:30 PM', 'EE3304 Engineering Electromagnetism (Lab 2: Basic Principles)', 'Communication Laboratory', ALL_GROUPS),

  // Week 11
  ...expandScheduleEntries('Week 11', '2026-10-07', '08:30 AM - 11:30 AM', 'EE3306 Signals & Systems (Lab 4: MATLAB Discrete Signals)', 'Communication Laboratory', ALL_GROUPS),
  ...expandScheduleEntries('Week 11', '2026-10-09', '01:30 PM - 04:30 PM', 'EE3301 Analog Electronics (Lab 4: Oscillators & Analog Filters)', 'Communication Laboratory', GROUPS_9_TO_12),

  // Week 12
  ...expandScheduleEntries('Week 12', '2026-10-14', '08:30 AM - 11:30 AM', 'EE3301 Analog Electronics (Lab 4: Oscillators & Analog Filters)', 'Communication Laboratory', GROUPS_1_TO_8),
  ...expandScheduleEntries('Week 12', '2026-10-16', '01:30 PM - 04:30 PM', 'EE3203 Measurements (Lab 3: Spectrum Analyzer)', 'Electronic and Measurement Laboratory', GROUPS_1_TO_8),

  // Week 13
  ...expandScheduleEntries('Week 13', '2026-10-21', '08:30 AM - 11:30 AM', 'EE3203 Measurements (Lab 3: Spectrum Analyzer)', 'Electronic and Measurement Laboratory', GROUPS_9_TO_12),
];

const LOCAL_STORAGE_KEY = 'eschedular26_lab_attendance';

export function getStoredAttendance() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to load attendance from LocalStorage', e);
    return {};
  }
}

// Helper to save attendance records for a date and lab name
export function saveStoredAttendance(dateStr, labName, attendanceMap) {
  const current = getStoredAttendance();
  const key = `${dateStr}_${labName}`;
  current[key] = {
    date: dateStr,
    lab_name: labName,
    updated_at: getSriLankaTimestampStr(),
    records: attendanceMap, // { reg_no: true/false }
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  pushLabAttendanceToCloud(dateStr, labName, attendanceMap);
  return current;
}

// Export Attendance CSV helper
export function exportAttendanceCSV() {
  const attendanceData = getStoredAttendance();
  const rows = [['Date', 'RegNo', 'StudentName', 'GroupCode', 'LabName', 'Status']];

  Object.values(attendanceData).forEach((entry) => {
    const dateStr = entry.date;
    const labName = entry.lab_name;
    const records = entry.records || {};

    Object.entries(records).forEach(([regNo, isPresent]) => {
      const student = INITIAL_STUDENTS.find((s) => s.reg_no === regNo);
      const name = student ? student.name : 'Unknown';
      const groupCode = student ? student.group_code : '-';
      rows.push([
        dateStr,
        regNo,
        `"${name}"`,
        groupCode,
        `"${labName}"`,
        isPresent ? 'Present' : 'Absent',
      ]);
    });
  });

  if (rows.length === 1) {
    // If no records stored yet, export all 75 students with default status
    INITIAL_STUDENTS.forEach((student) => {
      rows.push([
        getSriLankaDateStr(),
        student.reg_no,
        `"${student.name}"`,
        student.group_code,
        '"Scheduled Lab"',
        'Present',
      ]);
    });
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `EE_Lab_Attendance_Export_${getSriLankaDateStr()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
