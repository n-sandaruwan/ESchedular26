import React, { useState, useEffect } from 'react';
import {
  LAB_GROUPS,
  INITIAL_STUDENTS,
  INITIAL_SCHEDULE,
  getStoredAttendance,
  saveStoredAttendance,
  exportAttendanceCSV,
} from '../data/labTrackerData';
import { getSriLankaDateObj, getSriLankaDateStr } from '../utils/dateUtils';

function LabTrackerPage() {
  const role = localStorage.getItem('mis_role') || 'student';
  const isAdmin = role === 'admin';
  const isLabAdmin = role === 'lab_admin';
  const canMarkAttendance = isAdmin || isLabAdmin;

  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'search' | 'group' | 'leader' | 'admin'
  const [searchDigits, setSearchDigits] = useState('');
  const [searchedStudent, setSearchedStudent] = useState(null);
  const [studentSchedule, setStudentSchedule] = useState([]);
  const [searchError, setSearchError] = useState('');

  // Group Lookup state
  const [selectedGroupLookupCode, setSelectedGroupLookupCode] = useState('EE01');

  const getLocalTodayDateStr = () => {
    const d = getSriLankaDateObj();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Daily Schedule state
  const todayStr = getLocalTodayDateStr();
  const [selectedDate, setSelectedDate] = useState(getLocalTodayDateStr());

  // Local Storage attendance sync
  const [storedAttendance, setStoredAttendance] = useState({});

  // Leader Portal state
  const [selectedGroupCode, setSelectedGroupCode] = useState('EE01');
  const [leaderAttendance, setLeaderAttendance] = useState({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  useEffect(() => {
    setStoredAttendance(getStoredAttendance());
  }, []);

  // Date Navigation Steppers (Matching Dashboard style)
  const handlePreviousDay = () => {
    try {
      const parts = selectedDate.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day - 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    } catch (e) {
      console.error('Error going to previous day', e);
    }
  };

  const handleNextDay = () => {
    try {
      const parts = selectedDate.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day + 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    } catch (e) {
      console.error('Error going to next day', e);
    }
  };

  const getDayNameFromDateString = (dateStr) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    } catch (e) {
      return 'DAY';
    }
  };

  const getFormattedPillDate = (dateStr) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Perform student search ONLY when search button is clicked
  const performStudentSearch = (val) => {
    const query = val.trim().toUpperCase();
    if (!query) {
      setSearchedStudent(null);
      setStudentSchedule([]);
      setSearchError('Please enter your 4-digit registration number (e.g. 6458 or 6011).');
      return;
    }

    const digitsOnly = query.replace(/\D/g, '');

    const student = INITIAL_STUDENTS.find((s) => {
      const studentDigits = s.reg_no.replace(/\D/g, '');
      return (
        (digitsOnly.length >= 3 && studentDigits.endsWith(digitsOnly)) ||
        (digitsOnly.length > 0 && studentDigits === digitsOnly) ||
        s.reg_no.toUpperCase().includes(query) ||
        s.name.toUpperCase().includes(query)
      );
    });

    if (student) {
      setSearchedStudent(student);
      const schedule = INITIAL_SCHEDULE.filter(
        (sch) => sch.group_code === student.group_code || sch.group_id === student.group_id
      );
      setStudentSchedule(schedule);
      setSearchError('');
    } else {
      setSearchedStudent(null);
      setStudentSchedule([]);
      setSearchError(
        `No student found matching "${query}". Please check your 4-digit number (e.g. 6458, 6011, or 6554).`
      );
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performStudentSearch(searchDigits);
  };

  // Helper: Check if a lab is completed for a student
  const isLabCompleted = (sch, studentRegNo) => {
    const key = `${sch.date}_${sch.lab_name}`;
    const attendanceEntry = storedAttendance[key];

    if (attendanceEntry && attendanceEntry.records && attendanceEntry.records[studentRegNo] !== undefined) {
      return attendanceEntry.records[studentRegNo] === true;
    }
    return false;
  };

  // Calculate completion statistics for searched student
  const calculateStudentProgress = () => {
    if (!searchedStudent || studentSchedule.length === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = studentSchedule.filter((sch) => isLabCompleted(sch, searchedStudent.reg_no)).length;
    const total = studentSchedule.length;
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent };
  };

  const studentProgress = calculateStudentProgress();

  // Group Lookup calculations
  const groupLookupObj = LAB_GROUPS.find((g) => g.code === selectedGroupLookupCode) || LAB_GROUPS[0];
  const groupLookupMembers = INITIAL_STUDENTS.filter((s) => s.group_code === selectedGroupLookupCode);
  const groupLookupSchedule = INITIAL_SCHEDULE.filter((sch) => sch.group_code === selectedGroupLookupCode);

  // Daily Schedule Categorization by Lab Subject
  const getCategorizedDailyLabs = () => {
    const dailyScheduleEntries = INITIAL_SCHEDULE.filter((sch) => sch.date === selectedDate);
    const labMap = new Map();

    dailyScheduleEntries.forEach((sch) => {
      if (!labMap.has(sch.lab_name)) {
        labMap.set(sch.lab_name, {
          lab_name: sch.lab_name,
          week: sch.week,
          time: sch.time,
          venue: sch.venue,
          groups: [sch.group_code],
        });
      } else {
        const existing = labMap.get(sch.lab_name);
        if (!existing.groups.includes(sch.group_code)) {
          existing.groups.push(sch.group_code);
        }
      }
    });

    return Array.from(labMap.values());
  };

  const categorizedDailyLabs = getCategorizedDailyLabs();

  // Date Formatter Helper for Big Dashboard Date Banner
  const formatDashboardDate = (dateString) => {
    try {
      const parts = dateString.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  // Current active group object for Leader portal
  const currentGroupObj = LAB_GROUPS.find((g) => g.code === selectedGroupCode) || LAB_GROUPS[0];

  const currentLeaderSchedule = INITIAL_SCHEDULE.find(
    (sch) => sch.date === selectedDate && (sch.group_code === selectedGroupCode || sch.group_id === currentGroupObj.id)
  );

  const groupStudents = INITIAL_STUDENTS.filter(
    (s) => s.group_code === selectedGroupCode || s.group_id === currentGroupObj.id
  );

  // Sync attendance map for selected leader group
  useEffect(() => {
    if (currentLeaderSchedule) {
      const key = `${selectedDate}_${currentLeaderSchedule.lab_name}`;
      const entry = storedAttendance[key];
      const initialMap = {};
      groupStudents.forEach((s) => {
        initialMap[s.reg_no] =
          entry && entry.records && entry.records[s.reg_no] !== undefined
            ? entry.records[s.reg_no]
            : null;
      });
      setLeaderAttendance(initialMap);
    }
  }, [selectedGroupCode, selectedDate, storedAttendance]);

  const handleToggleAttendance = (regNo) => {
    setLeaderAttendance((prev) => ({
      ...prev,
      [regNo]: prev[regNo] === true ? false : prev[regNo] === false ? null : true,
    }));
  };

  const handleToggleAll = (status) => {
    const updated = {};
    groupStudents.forEach((s) => {
      updated[s.reg_no] = status;
    });
    setLeaderAttendance(updated);
  };

  const executeSaveAttendance = () => {
    if (!currentLeaderSchedule) return;

    // Fill unselected students (null) as false (Absent) upon saving
    const finalizedAttendance = { ...leaderAttendance };
    groupStudents.forEach((s) => {
      if (finalizedAttendance[s.reg_no] === null || finalizedAttendance[s.reg_no] === undefined) {
        finalizedAttendance[s.reg_no] = false;
      }
    });

    const updatedData = saveStoredAttendance(
      selectedDate,
      currentLeaderSchedule.lab_name,
      finalizedAttendance
    );
    setStoredAttendance(updatedData);
    setSaveSuccessMsg(
      `Attendance for ${currentLeaderSchedule.lab_name} (${selectedGroupCode}) saved successfully!`
    );
    setTimeout(() => setSaveSuccessMsg(''), 4000);
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
  };

  const handleSaveAttendance = (e) => {
    e.preventDefault();
    if (!currentLeaderSchedule) return;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Attendance Submission',
      message: `Are you sure you want to save attendance for ${currentLeaderSchedule.lab_name} (${selectedGroupCode}) on ${selectedDate}? This will update the daily schedule and student records.`,
      onConfirm: executeSaveAttendance,
    });
  };

  // Admin stats computation
  const calculateAdminStats = () => {
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalMarkedRecords = 0;

    Object.values(storedAttendance).forEach((entry) => {
      const records = entry.records || {};
      Object.values(records).forEach((val) => {
        totalMarkedRecords++;
        if (val) totalPresent++;
        else totalAbsent++;
      });
    });

    const attendanceRate =
      totalMarkedRecords > 0
        ? ((totalPresent / totalMarkedRecords) * 100).toFixed(1)
        : '100.0';

    return { totalPresent, totalAbsent, totalMarkedRecords, attendanceRate };
  };

  const adminStats = calculateAdminStats();

  // Admin Features Calculations
  const [absentSearch, setAbsentSearch] = useState('');

  // 1. Calculate Unmarked / Forgotten Attendance Sessions (ONLY past dates OR today if not marked before midnight)
  const calculateUnmarkedSessions = () => {
    const realTodayStr = getSriLankaDateStr();
    const unmarkedMap = new Map();

    INITIAL_SCHEDULE.forEach((sch) => {
      // Alert ONLY if session date has passed OR is today
      if (sch.date <= realTodayStr) {
        const key = `${sch.date}_${sch.lab_name}`;
        const entry = storedAttendance[key];
        const groupStudents = INITIAL_STUDENTS.filter(
          (s) => s.group_code === sch.group_code || s.group_id === sch.group_id
        );
        const hasRecords =
          entry &&
          entry.records &&
          groupStudents.some((s) => entry.records[s.reg_no] !== undefined);

        if (!hasRecords) {
          const sessionKey = `${sch.date}_${sch.group_code}_${sch.lab_name}`;
          if (!unmarkedMap.has(sessionKey)) {
            const isToday = sch.date === realTodayStr;
            unmarkedMap.set(sessionKey, {
              ...sch,
              isToday,
            });
          }
        }
      }
    });

    return Array.from(unmarkedMap.values());
  };

  // 2. Calculate Lab Progress Summaries (Completed vs Pending Groups for each unique Lab)
  const calculateLabProgressSummaries = () => {
    const labMap = new Map();

    INITIAL_SCHEDULE.forEach((sch) => {
      if (!labMap.has(sch.lab_name)) {
        labMap.set(sch.lab_name, new Set());
      }
      labMap.get(sch.lab_name).add(sch.group_code);
    });

    const summaries = [];

    labMap.forEach((allGroupsSet, labName) => {
      const allGroups = Array.from(allGroupsSet).sort();
      const doneGroups = [];
      const pendingGroups = [];

      allGroups.forEach((gCode) => {
        const schEntries = INITIAL_SCHEDULE.filter(
          (s) => s.lab_name === labName && s.group_code === gCode
        );
        let isDone = false;
        schEntries.forEach((sch) => {
          const key = `${sch.date}_${sch.lab_name}`;
          const entry = storedAttendance[key];
          const groupStudents = INITIAL_STUDENTS.filter(
            (s) => s.group_code === gCode || s.group_id === (LAB_GROUPS.find((g) => g.code === gCode) || {}).id
          );
          if (
            entry &&
            entry.records &&
            groupStudents.some((s) => entry.records[s.reg_no] !== undefined)
          ) {
            isDone = true;
          }
        });

        if (isDone) {
          doneGroups.push(gCode);
        } else {
          pendingGroups.push(gCode);
        }
      });

      const percentage =
        allGroups.length > 0
          ? Math.round((doneGroups.length / allGroups.length) * 100)
          : 0;

      summaries.push({
        lab_name: labName,
        totalGroups: allGroups,
        doneGroups,
        pendingGroups,
        percentage,
      });
    });

    return summaries;
  };

  // 3. Calculate Absentee Records across all saved labs
  const calculateAbsenteeRecords = () => {
    const absentees = [];
    Object.values(storedAttendance).forEach((entry) => {
      const records = entry.records || {};
      Object.entries(records).forEach(([regNo, statusVal]) => {
        if (statusVal === false) {
          const student = INITIAL_STUDENTS.find((s) => s.reg_no === regNo);
          absentees.push({
            date: entry.date,
            lab_name: entry.lab_name,
            reg_no: regNo,
            name: student ? student.name : 'Unknown',
            group_code: student ? student.group_code : '-',
          });
        }
      });
    });
    return absentees;
  };

  const unmarkedSessions = calculateUnmarkedSessions();
  const labProgressSummaries = calculateLabProgressSummaries();
  const absenteeRecords = calculateAbsenteeRecords();
  const filteredAbsentees = absenteeRecords.filter(
    (r) =>
      r.name.toLowerCase().includes(absentSearch.toLowerCase()) ||
      r.reg_no.toLowerCase().includes(absentSearch.toLowerCase()) ||
      r.group_code.toLowerCase().includes(absentSearch.toLowerCase()) ||
      r.lab_name.toLowerCase().includes(absentSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Sleek Confirmation Modal Dialog */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-surface-container border border-primary/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center border-t-4 border-t-secondary">
            <div className="w-12 h-12 rounded-full bg-secondary/20 border border-secondary/40 text-secondary flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">help_outline</span>
            </div>
            <h3 className="font-extrabold text-on-surface text-lg">{confirmModal.title}</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">{confirmModal.message}</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-on-surface hover:bg-white/5 text-xs font-label-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="btn-electric px-6 py-2.5 rounded-xl text-xs font-label-bold shadow-lg cursor-pointer"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sleek Top Banner Header with Tile Navigation */}
      <div className="bg-surface-container/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-xl">biotech</span>
          </div>
          <div>
            <h1 className="font-headline-lg font-extrabold text-on-surface text-lg sm:text-xl tracking-tight">
              EE Semester 3 Lab Portal
            </h1>
            <span className="text-[10px] font-mono text-primary/80 font-bold uppercase tracking-wider block">
              EE01 – EE12 Academic Directory
            </span>
          </div>
        </div>

        {/* Responsive Navigation Tile Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <button
            onClick={() => setActiveTab('daily')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-primary/20 border-primary text-primary font-bold shadow-lg shadow-primary/10'
                : 'bg-black/30 border-white/5 text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-xl">calendar_today</span>
            <span className="text-xs font-label-bold text-center">Daily Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-primary/20 border-primary text-primary font-bold shadow-lg shadow-primary/10'
                : 'bg-black/30 border-white/5 text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-xl">person_search</span>
            <span className="text-xs font-label-bold text-center">Student Lookup</span>
          </button>

          <button
            onClick={() => setActiveTab('group')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'group'
                ? 'bg-primary/20 border-primary text-primary font-bold shadow-lg shadow-primary/10'
                : 'bg-black/30 border-white/5 text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-xl">groups</span>
            <span className="text-xs font-label-bold text-center">Group Lookup</span>
          </button>

          <button
            onClick={() => setActiveTab('leader')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'leader'
                ? 'bg-secondary/20 border-secondary text-secondary font-bold shadow-lg shadow-secondary/10'
                : 'bg-black/30 border-white/5 text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-xl">how_to_reg</span>
            <span className="text-xs font-label-bold text-center">Leader Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer col-span-2 sm:col-span-1 ${
              activeTab === 'admin'
                ? 'bg-tertiary/20 border-tertiary text-tertiary font-bold shadow-lg shadow-tertiary/10'
                : 'bg-black/30 border-white/5 text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-xl">insights</span>
            <span className="text-xs font-label-bold text-center">Admin</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Student Schedule Lookup */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="bg-surface-container/60 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(56,189,248,0.12)] max-w-xl mx-auto space-y-2">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 flex items-center rounded-xl overflow-hidden border border-primary/30">
                <span className="px-3 py-2.5 bg-primary/10 text-primary font-mono text-sm font-extrabold select-none border-r border-primary/20">
                  EG/2024/
                </span>
                <input
                  type="text"
                  value={searchDigits}
                  onChange={(e) => setSearchDigits(e.target.value)}
                  placeholder="6458"
                  required
                  className="w-full px-3 py-2.5 bg-black/60 text-on-surface placeholder-on-surface-variant/40 text-sm font-mono focus:outline-none focus:bg-black/80 transition-all"
                />
              </div>

              <button
                type="submit"
                className="btn-electric px-5 py-2.5 rounded-xl text-xs font-label-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-base">search</span>
                <span>Search</span>
              </button>
            </form>

            {searchError && (
              <div className="p-2.5 bg-error/15 border border-error/30 rounded-xl text-error text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {searchedStudent ? (
            <div className="bg-surface-container/60 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary/30 via-indigo-500/20 to-secondary/30 border border-primary/40 flex items-center justify-center text-primary font-bold text-xl shadow-lg shrink-0">
                    {searchedStudent.name[0]}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="font-bold text-on-surface text-base sm:text-lg tracking-tight truncate">{searchedStudent.name}</h3>
                    <p className="text-xs text-on-surface-variant font-mono">Reg No: {searchedStudent.reg_no}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-between sm:justify-start gap-2 shadow-md">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">groups</span>
                      <span className="text-[10px] text-on-surface-variant font-label-bold uppercase">Group</span>
                    </div>
                    <span className="text-sm font-extrabold font-mono text-primary">{searchedStudent.group_code}</span>
                  </div>

                  <div className="px-3.5 py-1.5 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary flex flex-col justify-center gap-1 shadow-md sm:w-48">
                    <div className="flex justify-between items-center text-[10px] font-label-bold uppercase">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">published_with_changes</span>
                        <span>Progress</span>
                      </span>
                      <span className="text-secondary font-mono font-bold">{studentProgress.completed}/{studentProgress.total} ({studentProgress.percent}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-secondary/20">
                      <div
                        className="h-full bg-secondary transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(78,222,163,0.6)]"
                        style={{ width: `${studentProgress.percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-on-surface text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
                    <span>13-Week Lab Timetable ({studentSchedule.length} Sessions)</span>
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {studentSchedule.map((sch) => {
                    const completed = isLabCompleted(sch, searchedStudent.reg_no);
                    return (
                      <div
                        key={sch.id}
                        className={`p-3.5 rounded-xl border transition-all shadow-md relative overflow-hidden backdrop-blur-md ${
                          completed
                            ? 'bg-secondary/5 border-secondary/30 hover:border-secondary/50'
                            : 'bg-black/30 border-white/10 hover:border-primary/40'
                        }`}
                      >
                        <div className={`absolute top-0 left-0 bottom-0 w-1 ${completed ? 'bg-secondary' : 'bg-primary/50'}`}></div>

                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/30 text-primary text-[11px] font-label-bold">
                            {sch.week}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-on-surface-variant font-semibold">
                              📅 {sch.date}
                            </span>
                            {completed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-secondary/20 text-secondary border border-secondary/40 font-mono">
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                                <span>Done</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-on-surface-variant/70 border border-white/10 font-mono">
                                <span className="material-symbols-outlined text-xs text-amber-400">schedule</span>
                                <span>Upcoming</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <h5 className="font-bold text-on-surface text-sm flex items-start gap-2 leading-snug my-1">
                          <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">science</span>
                          <span>{sch.lab_name}</span>
                        </h5>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant pt-1 border-t border-white/5">
                          <span className="flex items-center gap-1 font-mono">
                            <span className="material-symbols-outlined text-xs text-primary/70">location_on</span>
                            <span>{sch.venue}</span>
                          </span>
                          <span className="flex items-center gap-1 text-primary font-mono font-medium">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            <span>{sch.time}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container/30 border border-white/10 rounded-2xl p-6 text-center space-y-1.5 max-w-lg mx-auto">
              <span className="material-symbols-outlined text-3xl text-primary/40 block">find_in_page</span>
              <h3 className="font-bold text-on-surface text-sm">Enter Your 4-Digit Reg No Above</h3>
              <p className="text-xs text-on-surface-variant">
                Type your 4 digits (e.g. <code className="text-primary font-bold">6458</code> or <code className="text-primary font-bold">6011</code>) and click <strong>Search</strong> to view your schedule.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Group Lookup (EE01 - EE12) */}
      {activeTab === 'group' && (
        <div className="space-y-4">
          <div className="bg-surface-container/60 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(56,189,248,0.12)] max-w-md mx-auto space-y-2 text-center">
            <label className="text-xs font-label-bold uppercase text-primary tracking-wider block">
              Select EE Group:
            </label>
            <select
              value={selectedGroupLookupCode}
              onChange={(e) => setSelectedGroupLookupCode(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/80 border border-primary/40 rounded-xl text-on-surface text-base font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-primary shadow-lg cursor-pointer text-center"
            >
              {LAB_GROUPS.map((g) => (
                <option key={g.code} value={g.code} className="bg-surface text-on-surface font-mono">
                  {g.code}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-surface-container/60 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-extrabold text-lg font-mono">
                  {selectedGroupLookupCode}
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-base sm:text-lg">Group {selectedGroupLookupCode}</h3>
                  <p className="text-xs text-on-surface-variant font-mono">
                    {groupLookupMembers.length} Registered Student Members
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-primary text-xs font-mono font-bold w-fit">
                {groupLookupSchedule.length} Scheduled Lab Sessions
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-on-surface text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">groups</span>
                <span>Group {selectedGroupLookupCode} Student Roster</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {groupLookupMembers.map((student) => (
                  <div key={student.reg_no} className="p-2.5 bg-black/40 border border-white/10 rounded-xl flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {student.name[0]}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-on-surface text-xs truncate">{student.name}</h5>
                      <span className="text-[10px] text-on-surface-variant font-mono block">{student.reg_no}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <h4 className="font-bold text-on-surface text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
                <span>13-Week Timetable for Group {selectedGroupLookupCode}</span>
              </h4>

              <div className="space-y-2.5">
                {groupLookupSchedule.map((sch) => (
                  <div
                    key={sch.id}
                    className="p-3.5 rounded-xl bg-black/30 border border-white/10 shadow-md relative overflow-hidden backdrop-blur-md hover:border-primary/40 transition-all"
                  >
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary/50"></div>

                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/30 text-primary text-[11px] font-label-bold">
                        {sch.week}
                      </span>
                      <span className="text-xs font-mono text-on-surface-variant font-semibold">
                        📅 {sch.date}
                      </span>
                    </div>

                    <h5 className="font-bold text-on-surface text-sm flex items-start gap-2 leading-snug my-1">
                      <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">science</span>
                      <span>{sch.lab_name}</span>
                    </h5>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant pt-1 border-t border-white/5">
                      <span className="flex items-center gap-1 font-mono">
                        <span className="material-symbols-outlined text-xs text-primary/70">location_on</span>
                        <span>{sch.venue}</span>
                      </span>
                      <span className="flex items-center gap-1 text-primary font-mono font-medium">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        <span>{sch.time}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Daily Schedule (Highlighting Marked Groups Vividly) */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          <div className="bg-surface-container/60 backdrop-blur-xl border border-primary/30 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto">
            <span className="text-xs text-primary font-mono font-extrabold uppercase tracking-widest flex items-center gap-1.5 bg-primary/10 border border-primary/30 px-3.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              <span>Daily Schedule Date</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight leading-none">
              {formatDashboardDate(selectedDate)}
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              {selectedDate !== todayStr && (
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-bold text-xs shadow-lg shadow-primary/30 hover:opacity-90 transition-all cursor-pointer animate-pulse shrink-0"
                  title="Return to Today"
                >
                  <span className="material-symbols-outlined text-base">today</span>
                  <span>Return to Today</span>
                </button>
              )}

              <div className="flex items-center justify-between bg-black/80 rounded-2xl p-1.5 border border-primary/40 shadow-2xl min-w-[280px] sm:min-w-[340px]">
                <button
                  onClick={handlePreviousDay}
                  className="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary hover:bg-white/10 rounded-xl active:scale-95 transition-all cursor-pointer border border-white/5"
                  title="Previous Day"
                >
                  <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>

                <div className="relative group flex flex-col items-center px-4 py-1 text-center cursor-pointer min-w-[170px]">
                  <span className="text-xs font-mono uppercase tracking-widest text-primary font-black">
                    {selectedDate === todayStr ? 'TODAY' : getDayNameFromDateString(selectedDate)}
                  </span>
                  <span className="text-sm sm:text-base font-extrabold font-mono text-on-surface flex items-center gap-1.5 mt-0.5">
                    <span>{getFormattedPillDate(selectedDate)}</span>
                    <span className="material-symbols-outlined text-xs text-primary">calendar_month</span>
                  </span>

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Click to jump to any date"
                  />
                </div>

                <button
                  onClick={handleNextDay}
                  className="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary hover:bg-white/10 rounded-xl active:scale-95 transition-all cursor-pointer border border-white/5"
                  title="Next Day"
                >
                  <span className="material-symbols-outlined text-2xl">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {categorizedDailyLabs.length === 0 ? (
              <div className="bg-surface-container/30 border border-white/10 rounded-2xl p-8 text-center space-y-1.5">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 block">event_busy</span>
                <p className="font-bold text-on-surface text-sm">No lab sessions scheduled for {selectedDate}.</p>
                <p className="text-xs text-on-surface-variant">Use the date stepper arrows above to inspect another day's schedule.</p>
              </div>
            ) : (
              categorizedDailyLabs.map((lab) => {
                const key = `${selectedDate}_${lab.lab_name}`;
                const entry = storedAttendance[key];
                const isLabMarked = entry && entry.records && Object.keys(entry.records).length > 0;
                const isAllGroups = lab.groups.length >= 12;

                return (
                  <div
                    key={lab.lab_name}
                    className="bg-surface-container/60 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 relative overflow-hidden backdrop-blur-xl hover:border-primary/40 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0 mt-0.5 sm:mt-0">
                          <span className="material-symbols-outlined text-xl">science</span>
                        </div>
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/30 uppercase inline-block">
                            {lab.week}
                          </span>
                          <h4 className="font-extrabold text-on-surface text-lg sm:text-xl leading-snug">
                            {lab.lab_name}
                          </h4>
                        </div>
                      </div>

                      <div className="shrink-0 self-start sm:self-center">
                        {isLabMarked ? (
                          <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold bg-secondary/20 text-secondary border border-secondary/40 font-mono shadow-[0_0_10px_rgba(78,222,163,0.3)] inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            <span>Attendance Marked</span>
                          </span>
                        ) : (
                          <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            <span>Attendance Pending</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm sm:text-base text-on-surface-variant font-mono bg-black/40 p-3 sm:p-3.5 rounded-xl border border-white/10">
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base sm:text-lg text-primary">location_on</span>
                        <span className="font-bold text-on-surface">Venue: {lab.venue}</span>
                      </span>
                      <span className="flex items-center gap-2 text-primary font-bold">
                        <span className="material-symbols-outlined text-base sm:text-lg">schedule</span>
                        <span>Time: {lab.time}</span>
                      </span>
                    </div>

                    {/* Assigned Lab Groups with Glowing Emerald Highlight for Marked Groups */}
                    <div className="space-y-2 pt-1.5">
                      <span className="text-xs sm:text-sm font-extrabold text-on-surface-variant uppercase tracking-wider block">
                        Assigned EE Lab Groups on This Day ({isAllGroups ? 'All 12 Groups' : `${lab.groups.length} Groups`}):
                      </span>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                        {isAllGroups ? (
                          <span className={`px-3.5 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-extrabold shadow-sm ${
                            isLabMarked
                              ? 'bg-secondary/25 text-secondary border border-secondary/50 shadow-[0_0_12px_rgba(78,222,163,0.4)] ring-1 ring-secondary/40'
                              : 'bg-primary/20 text-primary border border-primary/40'
                          }`}>
                            🌐 ALL GROUPS (EE01 – EE12) {isLabMarked ? '✓' : ''}
                          </span>
                        ) : (
                          lab.groups.map((gCode) => {
                            const groupStudents = INITIAL_STUDENTS.filter((s) => s.group_code === gCode);
                            const isGroupMarked = isLabMarked && groupStudents.some((s) => entry.records && entry.records[s.reg_no] !== undefined);

                            return (
                              <span
                                key={gCode}
                                className={`px-3.5 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-all shadow-md ${
                                  isGroupMarked
                                    ? 'bg-secondary/25 text-secondary border border-secondary/50 shadow-[0_0_12px_rgba(78,222,163,0.4)] ring-1 ring-secondary/40'
                                    : 'bg-primary/10 text-primary border border-primary/30'
                                }`}
                              >
                                <span>{gCode}</span>
                                {isGroupMarked && <span className="text-secondary font-bold text-xs">✓</span>}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Lab Leader Portal */}
      {activeTab === 'leader' && (
        <div className="space-y-4">
          {!canMarkAttendance && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-amber-400">lock</span>
                <span>Basic Student Mode: Attendance marking is view-only. Log in as <strong>Lab Admin Mode</strong> to mark attendance.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('mis_role', 'lab_admin');
                  localStorage.setItem('mis_user', 'Lab Administrator');
                  window.location.reload();
                }}
                className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-label-bold transition-colors cursor-pointer self-start sm:self-auto shrink-0"
              >
                Switch to Lab Admin Mode
              </button>
            </div>
          )}

            {/* Large Prominent Control Card for EE Group & Date Selection */}
            <div className="bg-black/40 border border-primary/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/20 border border-secondary/40 flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined text-xl">how_to_reg</span>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-on-surface">Lab Leader Attendance Portal</h2>
                    <p className="text-xs text-on-surface-variant">Select group code (EE01–EE12) and session date below.</p>
                  </div>
                </div>
              </div>

              {/* 2-Column Large Interactive Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. EE Group Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-label-bold uppercase text-primary tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">groups</span>
                    <span>1. Select EE Lab Group:</span>
                  </label>

                  {/* Large Styled Select Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedGroupCode}
                      onChange={(e) => setSelectedGroupCode(e.target.value)}
                      className="w-full h-12 px-4 py-2.5 bg-black/80 border-2 border-primary/40 hover:border-primary focus:border-primary rounded-2xl text-on-surface text-sm sm:text-base font-mono font-black focus:outline-none focus:ring-2 focus:ring-primary shadow-lg cursor-pointer appearance-none pr-10 transition-all"
                    >
                      {LAB_GROUPS.map((g) => (
                        <option key={g.code} value={g.code} className="bg-surface text-on-surface font-mono py-2">
                          {g.code}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none text-xl">
                      unfold_more
                    </span>
                  </div>

                  {/* Horizontal Scroll Quick-Select Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
                    {LAB_GROUPS.map((g) => (
                      <button
                        key={g.code}
                        type="button"
                        onClick={() => setSelectedGroupCode(g.code)}
                        className={`px-3 py-1 rounded-xl text-xs font-mono font-extrabold shrink-0 transition-all cursor-pointer border ${
                          selectedGroupCode === g.code
                            ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/30 scale-105'
                            : 'bg-white/5 text-on-surface-variant/80 border-white/10 hover:border-primary/40 hover:text-primary'
                        }`}
                      >
                        {g.code}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Session Date Selector with Stepper */}
                <div className="space-y-1.5">
                  <label className="text-xs font-label-bold uppercase text-secondary tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    <span>2. Select Session Date:</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePreviousDay}
                      className="w-12 h-12 flex items-center justify-center bg-black/80 border-2 border-white/15 hover:border-secondary hover:text-secondary rounded-2xl text-on-surface active:scale-95 transition-all cursor-pointer shrink-0 shadow-md"
                      title="Previous Day"
                    >
                      <span className="material-symbols-outlined text-xl">chevron_left</span>
                    </button>

                    {/* Big Interactive Date Card Input */}
                    <div className="relative flex-1 h-12 bg-black/80 border-2 border-secondary/40 hover:border-secondary rounded-2xl flex items-center justify-between px-3.5 cursor-pointer shadow-lg transition-all group">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-secondary text-lg shrink-0">event</span>
                        <span className="text-xs sm:text-sm font-extrabold font-mono text-on-surface truncate">
                          {getFormattedPillDate(selectedDate)}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono font-black uppercase text-secondary bg-secondary/10 border border-secondary/30 px-2 py-0.5 rounded-lg shrink-0">
                        {getDayNameFromDateString(selectedDate)}
                      </span>

                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        title="Click to pick any date from calendar"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleNextDay}
                      className="w-12 h-12 flex items-center justify-center bg-black/80 border-2 border-white/15 hover:border-secondary hover:text-secondary rounded-2xl text-on-surface active:scale-95 transition-all cursor-pointer shrink-0 shadow-md"
                      title="Next Day"
                    >
                      <span className="material-symbols-outlined text-xl">chevron_right</span>
                    </button>
                  </div>

                  {/* Return to Today pill if shifted */}
                  {selectedDate !== todayStr && (
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setSelectedDate(todayStr)}
                        className="text-[11px] font-mono font-bold text-secondary hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">today</span>
                        <span>Jump to Today ({getFormattedPillDate(todayStr)})</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 bg-secondary/20 border border-secondary/40 rounded-xl text-secondary text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {currentLeaderSchedule ? (
              <form onSubmit={handleSaveAttendance} className="space-y-4">
                {/* Session Header Card & Quick Action Steppers */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block mb-0.5">{currentLeaderSchedule.week} Session • {selectedGroupCode}</span>
                      <h3 className="font-extrabold text-on-surface text-base">{currentLeaderSchedule.lab_name}</h3>
                      <p className="text-xs text-on-surface-variant font-mono mt-0.5">📍 {currentLeaderSchedule.venue} • 🕒 {currentLeaderSchedule.time}</p>
                    </div>

                    {canMarkAttendance && (
                      <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleAll(true)}
                          className="px-2.5 py-1.5 rounded-xl bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/40 text-[11px] font-label-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 shadow-sm"
                        >
                          <span>✓ All Present</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAll(false)}
                          className="px-2.5 py-1.5 rounded-xl bg-error/15 hover:bg-error/25 text-error border border-error/40 text-[11px] font-label-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 shadow-sm"
                        >
                          <span>✗ All Absent</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAll(null)}
                          className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-on-surface-variant text-[11px] font-label-bold border border-white/10 transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                        >
                          <span>Clear</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Attendance Summary Counter Bar */}
                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <span className="text-on-surface-variant">Roster: <strong className="text-on-surface">{groupStudents.length} Students</strong></span>
                    <div className="flex items-center gap-3">
                      <span className="text-secondary font-bold">Present: {Object.values(leaderAttendance).filter(v => v === true).length}</span>
                      <span className="text-error font-bold">Absent: {Object.values(leaderAttendance).filter(v => v === false).length}</span>
                    </div>
                  </div>
                </div>

                {/* MOBILE VIEW: Ultra-Clean Card List */}
                <div className="block sm:hidden space-y-2.5">
                  {groupStudents.map((student) => {
                    const status = leaderAttendance[student.reg_no];
                    return (
                      <div 
                        key={student.reg_no} 
                        className={`p-3.5 rounded-2xl border transition-all shadow-md backdrop-blur-md ${
                          status === true 
                            ? 'bg-secondary/10 border-secondary/40 shadow-[0_0_12px_rgba(78,222,163,0.15)]' 
                            : status === false 
                            ? 'bg-error/10 border-error/40' 
                            : 'bg-black/40 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                              status === true 
                                ? 'bg-secondary/20 text-secondary border-secondary/40' 
                                : status === false 
                                ? 'bg-error/20 text-error border-error/40' 
                                : 'bg-white/10 text-on-surface border-white/10'
                            }`}>
                              {student.name[0]}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-on-surface text-sm truncate">{student.name}</h4>
                              <span className="text-[11px] text-on-surface-variant font-mono block">{student.reg_no}</span>
                            </div>
                          </div>
                        </div>

                        {canMarkAttendance ? (
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() =>
                                setLeaderAttendance((prev) => ({
                                  ...prev,
                                  [student.reg_no]: prev[student.reg_no] === true ? null : true,
                                }))
                              }
                              className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                                status === true
                                  ? 'bg-secondary text-on-secondary border-secondary shadow-lg shadow-secondary/30 scale-[1.02]'
                                  : 'bg-white/5 text-on-surface-variant border-white/10 hover:bg-secondary/20 hover:text-secondary'
                              }`}
                            >
                              <span className="text-sm">✓</span>
                              <span>Present</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setLeaderAttendance((prev) => ({
                                  ...prev,
                                  [student.reg_no]: prev[student.reg_no] === false ? null : false,
                                }))
                              }
                              className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                                status === false
                                  ? 'bg-error text-on-error border-error shadow-lg shadow-error/30 scale-[1.02]'
                                  : 'bg-white/5 text-on-surface-variant border-white/10 hover:bg-error/20 hover:text-error'
                              }`}
                            >
                              <span className="text-sm">✗</span>
                              <span>Absent</span>
                            </button>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-white/5 text-right">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold border ${
                              status === true
                                ? 'bg-secondary/20 text-secondary border-secondary/40'
                                : status === false
                                ? 'bg-error/20 text-error border-error/40'
                                : 'bg-white/5 text-on-surface-variant/60 border-white/10'
                            }`}>
                              {status === true ? '✓ Present' : status === false ? '✗ Absent' : 'Not Marked'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* DESKTOP VIEW: Sleek Table */}
                <div className="hidden sm:block overflow-x-auto border border-white/10 rounded-2xl">
                  <table className="w-full text-left text-sm text-on-surface-variant">
                    <thead className="bg-black/50 text-on-surface uppercase text-[10px] font-label-bold border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Reg No</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4 text-center">Status Toggle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs bg-black/20">
                      {groupStudents.map((student) => {
                        const status = leaderAttendance[student.reg_no];
                        return (
                          <tr key={student.reg_no} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-on-surface">{student.reg_no}</td>
                            <td className="py-3 px-4 font-bold text-on-surface">{student.name}</td>
                            <td className="py-3 px-4 text-center">
                              {canMarkAttendance ? (
                                <div className="inline-flex items-center gap-2 justify-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLeaderAttendance((prev) => ({
                                        ...prev,
                                        [student.reg_no]: prev[student.reg_no] === true ? null : true,
                                      }))
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                                      status === true
                                        ? 'bg-secondary text-on-secondary border-secondary shadow-md shadow-secondary/20'
                                        : 'bg-white/5 text-on-surface-variant/70 border-white/10 hover:bg-secondary/15 hover:text-secondary'
                                    }`}
                                  >
                                    ✓ Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLeaderAttendance((prev) => ({
                                        ...prev,
                                        [student.reg_no]: prev[student.reg_no] === false ? null : false,
                                      }))
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                                      status === false
                                        ? 'bg-error text-on-error border-error shadow-md shadow-error/20'
                                        : 'bg-white/5 text-on-surface-variant/70 border-white/10 hover:bg-error/15 hover:text-error'
                                    }`}
                                  >
                                    ✗ Absent
                                  </button>
                                </div>
                              ) : (
                                <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                                  status === true
                                    ? 'bg-secondary/20 text-secondary border-secondary/40'
                                    : status === false
                                    ? 'bg-error/20 text-error border-error/40'
                                    : 'bg-white/5 text-on-surface-variant/60 border-white/10'
                                }`}>
                                  {status === true ? '✓ Present' : status === false ? '✗ Absent' : 'Not Marked'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-3 border-t border-white/10">
                  {canMarkAttendance ? (
                    <button
                      type="submit"
                      className="btn-electric w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-label-bold flex items-center justify-center gap-2 shadow-xl cursor-pointer text-center"
                    >
                      <span className="material-symbols-outlined text-base">save</span>
                      <span>Save Attendance Records</span>
                    </button>
                  ) : (
                    <span className="text-xs text-amber-400/80 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">lock</span>
                      <span>Log in as Lab Admin to save attendance changes.</span>
                    </span>
                  )}
                </div>
              </form>
            ) : (
              <div className="p-6 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl mb-1 text-on-surface-variant/50">event_busy</span>
                <p className="font-bold text-on-surface text-sm">No labs scheduled for Group {selectedGroupCode} on {selectedDate}.</p>
              </div>
            )}
        </div>
      )}

      {/* TAB 5: Admin Summary, Lab Progress, Absentees & Exports */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {/* Top KPI Metrics Tile Grid (Matching Navigation Tile Style) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Tile 1: Absent Records */}
            <div className="p-3.5 rounded-xl border bg-black/40 border-white/10 flex flex-col items-center justify-center gap-1.5 transition-all hover:bg-white/5 shadow-md">
              <span className="material-symbols-outlined text-xl sm:text-2xl text-error">person_off</span>
              <span className="text-base sm:text-xl font-extrabold font-mono text-error leading-none">{adminStats.totalAbsent}</span>
              <span className="text-xs font-label-bold text-center text-on-surface">Absent Records</span>
            </div>

            {/* Tile 2: Attendance Rate */}
            <div className="p-3.5 rounded-xl border bg-black/40 border-white/10 flex flex-col items-center justify-center gap-1.5 transition-all hover:bg-white/5 shadow-md">
              <span className="material-symbols-outlined text-xl sm:text-2xl text-primary">analytics</span>
              <span className="text-base sm:text-xl font-extrabold font-mono text-primary leading-none">{adminStats.attendanceRate}%</span>
              <span className="text-xs font-label-bold text-center text-on-surface">Attendance Rate</span>
            </div>

            {/* Tile 3: Unmarked Alerts */}
            <div className="p-3.5 rounded-xl border bg-black/40 border-amber-500/30 bg-amber-500/5 flex flex-col items-center justify-center gap-1.5 transition-all hover:bg-amber-500/10 shadow-md">
              <span className="material-symbols-outlined text-xl sm:text-2xl text-amber-400">warning</span>
              <span className="text-base sm:text-xl font-extrabold font-mono text-amber-400 leading-none">{unmarkedSessions.length}</span>
              <span className="text-xs font-label-bold text-center text-amber-400">Unmarked Alerts</span>
            </div>
          </div>

          {/* 1. End-of-Day / Midnight Unmarked Attendance Warning Card */}
          {unmarkedSessions.length > 0 ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-3 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <span className="material-symbols-outlined text-xl">warning</span>
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-amber-300">
                      Unmarked Attendance Alert ({unmarkedSessions.length} Session{unmarkedSessions.length > 1 ? 's' : ''})
                    </h3>
                    <p className="text-xs text-amber-300/70">Lab sessions scheduled for today (due before midnight) or past dates that were never recorded.</p>
                  </div>
                </div>
                <span className="hidden sm:inline-block px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase">
                  Midnight Audit
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                {unmarkedSessions.map((session, idx) => (
                  <div key={idx} className={`border rounded-xl p-3 space-y-2 text-xs transition-colors ${
                    session.isToday
                      ? 'bg-amber-500/15 border-amber-500/40 shadow-sm'
                      : 'bg-error/10 border-error/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-black/40 text-on-surface border border-white/10">
                        Group {session.group_code}
                      </span>
                      {session.isToday ? (
                        <span className="text-[10px] font-bold text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                          ⏱ Due Today (Midnight)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-error px-1.5 py-0.5 rounded bg-error/20 border border-error/30">
                          🚨 Overdue ({session.date})
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-on-surface line-clamp-1">{session.lab_name}</p>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-2 border-t border-white/5">
                      <span>{session.venue} • {session.time}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(session.date);
                          setSelectedGroupCode(session.group_code);
                          setActiveTab('leader');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-on-surface border border-white/20 text-[11px] font-label-bold cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <span>Mark Now</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-secondary/10 border border-secondary/30 rounded-2xl text-secondary text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>All scheduled lab sessions up to today have complete attendance records!</span>
            </div>
          )}

          {/* 2. Lab Summaries: Group Completion Status per Lab */}
          <div className="bg-surface-container/60 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-on-surface text-base flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">biotech</span>
                  <span>Lab Progress Summaries (Done vs Pending Groups)</span>
                </h3>
                <p className="text-xs text-on-surface-variant">Track which EE groups have completed or are pending for every lab course.</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/30 self-start sm:self-auto">
                {labProgressSummaries.length} Modules Tracked
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {labProgressSummaries.map((labSum) => (
                <div key={labSum.lab_name} className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-primary font-bold uppercase block">EE Lab Course</span>
                      <h4 className="font-bold text-on-surface text-sm">{labSum.lab_name}</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border shrink-0 ${
                      labSum.doneGroups.length === labSum.totalGroups.length
                        ? 'bg-secondary/20 text-secondary border-secondary/40'
                        : 'bg-primary/20 text-primary border-primary/40'
                    }`}>
                      {labSum.doneGroups.length} / {labSum.totalGroups.length} Groups Done
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/10">
                    <div
                      className="bg-gradient-to-r from-primary via-secondary to-tertiary h-full transition-all duration-500"
                      style={{ width: `${labSum.percentage}%` }}
                    ></div>
                  </div>

                  {/* Group Badges List */}
                  <div className="space-y-2 text-xs pt-1">
                    <div>
                      <span className="text-[10px] font-label-bold text-secondary uppercase block mb-1">
                        Completed Groups ({labSum.doneGroups.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {labSum.doneGroups.length > 0 ? (
                          labSum.doneGroups.map((g) => (
                            <span key={g} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-secondary/15 text-secondary border border-secondary/30">
                              ✓ {g}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-on-surface-variant/60 italic">No groups completed yet</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-label-bold text-amber-400 uppercase block mb-1">
                        Pending / Not Done Yet ({labSum.pendingGroups.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {labSum.pendingGroups.length > 0 ? (
                          labSum.pendingGroups.map((g) => (
                            <span key={g} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              ⏱ {g}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-secondary font-bold">🎉 All groups completed this lab!</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Absentee Records Tracker */}
          <div className="bg-surface-container/60 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-on-surface text-base flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-lg">person_off</span>
                  <span>Absentee Records Tracker ({absenteeRecords.length})</span>
                </h3>
                <p className="text-xs text-on-surface-variant">List of students marked Absent in lab attendance logs.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-2 text-on-surface-variant/50 text-base">search</span>
                <input
                  type="text"
                  placeholder="Filter by name, reg no, or group..."
                  value={absentSearch}
                  onChange={(e) => setAbsentSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-error/50 w-full"
                />
              </div>
            </div>

            {filteredAbsentees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-on-surface-variant">
                  <thead className="bg-black/40 text-on-surface uppercase text-[10px] font-label-bold border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Reg No</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Group</th>
                      <th className="py-2.5 px-3">Lab Name</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredAbsentees.map((record, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-on-surface">{record.date}</td>
                        <td className="py-2.5 px-3 font-mono text-on-surface">{record.reg_no}</td>
                        <td className="py-2.5 px-3 font-bold text-on-surface">{record.name}</td>
                        <td className="py-2.5 px-3 font-mono text-primary font-bold">{record.group_code}</td>
                        <td className="py-2.5 px-3 font-medium text-on-surface-variant">{record.lab_name}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-error/20 text-error border border-error/40">
                            ✗ Absent
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl mb-1 text-secondary/60">verified</span>
                <p className="font-bold text-on-surface text-sm">
                  {absenteeRecords.length === 0 ? 'No absent records registered yet.' : 'No absent records found matching your search filter.'}
                </p>
              </div>
            )}
          </div>

          {/* 4. CSV Reports & Group Directory */}
          <div className="bg-surface-container/60 border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-on-surface text-base">Attendance Reports & Exports</h3>
                <p className="text-xs text-on-surface-variant">Download formatted CSV reports for EE01–EE12 academic records.</p>
              </div>

              <button
                onClick={exportAttendanceCSV}
                className="btn-electric px-4 py-2 rounded-xl text-xs font-label-bold flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Export Attendance CSV</span>
              </button>
            </div>

            <div className="p-3 bg-black/30 rounded-xl border border-white/5 text-xs text-on-surface-variant space-y-1.5">
              <p className="font-bold text-on-surface">Official Electrical Engineering Group Directory (EE01 - EE12):</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1 font-mono text-[10px]">
                {LAB_GROUPS.map((g) => {
                  const count = INITIAL_STUDENTS.filter((s) => s.group_code === g.code).length;
                  return (
                    <div key={g.code} className="p-1.5 rounded bg-white/5 border border-white/5 text-center">
                      <span className="font-bold text-primary block">{g.code}</span>
                      <span className="text-on-surface-variant text-[9px]">{count} Students</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LabTrackerPage;
