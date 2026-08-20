import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LAB_GROUPS,
  INITIAL_STUDENTS,
  INITIAL_SCHEDULE,
  getStoredAttendance,
  saveStoredAttendance
} from '../data/labTrackerData';
import { getSriLankaDateObj, getSriLankaDateStr, SEMESTER_START_DATE } from '../utils/dateUtils';

function LabAdminPortal() {
  const navigate = useNavigate();
  const role = localStorage.getItem('mis_role') || 'student';
  const isLabAdmin = role === 'lab_admin';
  const isAdmin = role === 'admin';
  const canMarkAttendance = isAdmin || isLabAdmin;

  // Retrieve saved group from local storage or default to empty string
  const [labGroup, setLabGroup] = useState(() => {
    return localStorage.getItem('mis_lab_admin_group') || '';
  });

  const getLocalTodayDateStr = () => {
    const d = getSriLankaDateObj();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    return dateStr < SEMESTER_START_DATE ? SEMESTER_START_DATE : dateStr;
  };

  const todayStr = getLocalTodayDateStr();
  const [selectedDate, setSelectedDate] = useState(getLocalTodayDateStr());
  const [storedAttendance, setStoredAttendance] = useState({});
  
  // Attendance State
  const [leaderAttendance, setLeaderAttendance] = useState({});
  const [sessionNote, setSessionNote] = useState('');
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

    const handleAttendanceUpdate = () => {
      setStoredAttendance(getStoredAttendance());
    };
    window.addEventListener('lab_attendance_updated', handleAttendanceUpdate);

    return () => {
      window.removeEventListener('lab_attendance_updated', handleAttendanceUpdate);
    };
  }, []);

  // Save selected group
  const handleSelectGroup = (groupCode) => {
    setLabGroup(groupCode);
    localStorage.setItem('mis_lab_admin_group', groupCode);
  };

  const handleSwitchGroup = () => {
    setLabGroup('');
    localStorage.removeItem('mis_lab_admin_group');
  };

  // Date Navigation
  const handlePreviousDay = () => {
    try {
      const parts = selectedDate.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day - 1);
      const prevDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (prevDate < SEMESTER_START_DATE) return;
      setSelectedDate(prevDate);
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
      setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
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

  // Group specific data
  const currentGroupObj = LAB_GROUPS.find((g) => g.code === labGroup) || LAB_GROUPS[0];
  const groupStudents = INITIAL_STUDENTS.filter(
    (s) => s.group_code === labGroup || s.group_id === currentGroupObj.id
  );
  const currentLeaderSchedule = INITIAL_SCHEDULE.find(
    (sch) => sch.date === selectedDate && (sch.group_code === labGroup || sch.group_id === currentGroupObj.id)
  );

  // Group Progress Calculation
  const calculateGroupProgress = () => {
    if (!labGroup) return { completed: 0, total: 0, percentage: 0 };
    
    // Find all unique lab names this group has scheduled
    const allGroupLabs = INITIAL_SCHEDULE.filter(sch => sch.group_code === labGroup || sch.group_id === currentGroupObj.id);
    const total = allGroupLabs.length;
    let completed = 0;

    allGroupLabs.forEach(sch => {
      const safeLabName = sch.lab_name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const key = `${sch.date}_${safeLabName}`;
      const entry = storedAttendance[key];
      if (entry && entry.records && groupStudents.some((s) => entry.records[s.reg_no] !== undefined)) {
        completed++;
      }
    });

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const groupProgress = calculateGroupProgress();
  
  // Upcoming schedule for this group
  const upcomingSchedule = INITIAL_SCHEDULE.filter(
    (sch) => (sch.group_code === labGroup || sch.group_id === currentGroupObj.id) && sch.date >= todayStr
  ).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5); // next 5 labs

  useEffect(() => {
    if (currentLeaderSchedule && labGroup) {
      const safeLabName = currentLeaderSchedule.lab_name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const key = `${selectedDate}_${safeLabName}`;
      const entry = storedAttendance[key];
      const initialMap = {};
      groupStudents.forEach((s) => {
        initialMap[s.reg_no] =
          entry && entry.records && entry.records[s.reg_no] !== undefined
            ? entry.records[s.reg_no]
            : null;
      });
      setLeaderAttendance(initialMap);
      setSessionNote(entry && entry.note ? entry.note : '');
    }
  }, [labGroup, selectedDate, storedAttendance]);

  const handleToggleAll = (status) => {
    const updated = {};
    groupStudents.forEach((s) => {
      updated[s.reg_no] = status;
    });
    setLeaderAttendance(updated);
  };

  const executeSaveAttendance = () => {
    if (!currentLeaderSchedule) return;

    const finalizedAttendance = { ...leaderAttendance };
    groupStudents.forEach((s) => {
      if (finalizedAttendance[s.reg_no] === null || finalizedAttendance[s.reg_no] === undefined) {
        finalizedAttendance[s.reg_no] = false;
      }
    });

    const updatedData = saveStoredAttendance(
      selectedDate,
      currentLeaderSchedule.lab_name,
      finalizedAttendance,
      sessionNote
    );
    setStoredAttendance(updatedData);
    setSaveSuccessMsg(
      `Attendance for ${currentLeaderSchedule.lab_name} saved successfully!`
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
      message: `Are you sure you want to save attendance for ${currentLeaderSchedule.lab_name} on ${selectedDate}?`,
      onConfirm: executeSaveAttendance,
    });
  };

  // If no group is selected, show the selection screen
  if (!labGroup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 px-4 animate-fadeIn">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary mx-auto shadow-[0_0_20px_rgba(56,189,248,0.2)]">
            <span className="material-symbols-outlined text-3xl">groups</span>
          </div>
          <h1 className="font-headline-lg font-extrabold text-3xl text-on-surface tracking-tight">Select Your Lab Group</h1>
          <p className="text-on-surface-variant font-body-md text-sm max-w-md mx-auto">
            Welcome to the Lab Admin Portal. Please select your assigned lab group to access your personalized dashboard.
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-4 max-w-2xl w-full">
          {LAB_GROUPS.map((g) => (
            <button
              key={g.code}
              onClick={() => handleSelectGroup(g.code)}
              className="group bg-surface-container/60 hover:bg-primary/10 border border-white/10 hover:border-primary/40 p-4 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1"
            >
              <span className="font-mono text-xl font-bold text-on-surface group-hover:text-primary transition-colors">{g.code}</span>
              <span className="text-[10px] text-on-surface-variant group-hover:text-primary/70 uppercase tracking-widest font-label-bold">Select</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Dashboard View for the Selected Group
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Confirmation Modal */}
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

      {/* Header Profile Card */}
      <div className="bg-surface-container/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <span className="font-mono text-xl font-black">{labGroup}</span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-primary/80 font-bold uppercase tracking-wider block">Lab Admin Portal</span>
            <h1 className="font-headline-lg font-extrabold text-on-surface text-xl sm:text-2xl tracking-tight">
              Group {labGroup} Dashboard
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSwitchGroup}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-on-surface-variant text-xs font-label-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">swap_horiz</span> Switch Group
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Left Column - Attendance Marker */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-black/40 border border-primary/30 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/20 border border-secondary/40 flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-xl">how_to_reg</span>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-on-surface">Mark Lab Attendance</h2>
                  <p className="text-xs text-on-surface-variant">Select session date below.</p>
                </div>
              </div>
            </div>

            {/* Session Date Selector with Stepper */}
            <div className="space-y-1.5 mb-6 max-w-sm">
              <label className="text-xs font-label-bold uppercase text-secondary tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                <span>Session Date:</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviousDay}
                  className="w-12 h-12 flex items-center justify-center bg-black/80 border-2 border-white/15 hover:border-secondary hover:text-secondary rounded-2xl text-on-surface active:scale-95 transition-all cursor-pointer shrink-0 shadow-md"
                >
                  <span className="material-symbols-outlined text-xl">chevron_left</span>
                </button>

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
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextDay}
                  className="w-12 h-12 flex items-center justify-center bg-black/80 border-2 border-white/15 hover:border-secondary hover:text-secondary rounded-2xl text-on-surface active:scale-95 transition-all cursor-pointer shrink-0 shadow-md"
                >
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </button>
              </div>

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

            {saveSuccessMsg && (
              <div className="mb-4 p-3 bg-secondary/20 border border-secondary/40 rounded-xl text-secondary text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {currentLeaderSchedule ? (
              <form onSubmit={handleSaveAttendance} className="space-y-4">
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block mb-0.5">{currentLeaderSchedule.week} Session • {labGroup}</span>
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

                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <span className="text-on-surface-variant">Roster: <strong className="text-on-surface">{groupStudents.length} Students</strong></span>
                    <div className="flex items-center gap-3">
                      <span className="text-secondary font-bold">Present: {Object.values(leaderAttendance).filter(v => v === true).length}</span>
                      <span className="text-error font-bold">Absent: {Object.values(leaderAttendance).filter(v => v === false).length}</span>
                    </div>
                  </div>
                </div>

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

                {canMarkAttendance && (
                  <div className="bg-black/30 border border-white/10 rounded-2xl p-3.5 space-y-1.5 shadow-md">
                    <label className="text-xs font-label-bold uppercase text-secondary tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">edit_note</span>
                      <span>Lab Session Note / Remarks (Optional):</span>
                    </label>
                    <input
                      type="text"
                      value={sessionNote}
                      onChange={(e) => setSessionNote(e.target.value)}
                      placeholder="e.g. Completed Experiment 3, Bench 4 multimeter calibrated, all hardware tested..."
                      className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-xl text-xs sm:text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                    />
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-white/10">
                  <button
                    type="submit"
                    className="btn-electric w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-label-bold flex items-center justify-center gap-2 shadow-xl cursor-pointer text-center"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    <span>Save Attendance Records & Notes</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl mb-1 text-on-surface-variant/50">event_busy</span>
                <p className="font-bold text-on-surface text-sm">No labs scheduled for Group {labGroup} on {selectedDate}.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Stats and Upcoming Schedule */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Progress Card */}
          <div className="bg-surface-container/60 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-lg">data_usage</span>
              Lab Progress Overview
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant">Completion Rate</p>
                  <p className="text-3xl font-extrabold font-mono text-primary">{groupProgress.percentage}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant">Labs Finished</p>
                  <p className="text-sm font-bold text-on-surface">{groupProgress.completed} / {groupProgress.total}</p>
                </div>
              </div>

              <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden border border-white/5">
                <div
                  className="bg-primary h-full transition-all duration-1000 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                  style={{ width: `${groupProgress.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Upcoming Schedule Card */}
          <div className="bg-surface-container/60 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">event_upcoming</span>
                Upcoming Lab Sessions
              </h3>
            </div>

            <div className="space-y-3">
              {upcomingSchedule.length > 0 ? (
                upcomingSchedule.map((sch, idx) => (
                  <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-3 flex gap-3 hover:border-secondary/30 transition-colors">
                    <div className="flex flex-col items-center justify-center bg-secondary/10 text-secondary rounded-lg px-2 py-1 min-w-[50px] border border-secondary/20">
                      <span className="text-[10px] font-label-bold uppercase">{getDayNameFromDateString(sch.date)}</span>
                      <span className="text-sm font-bold font-mono">{sch.date.split('-')[2]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-on-surface line-clamp-1">{sch.lab_name}</h4>
                      <p className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[10px]">schedule</span>
                        {sch.time}
                      </p>
                      <p className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[10px]">location_on</span>
                        {sch.venue}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-on-surface-variant">
                  <p className="text-xs">No upcoming labs scheduled for {labGroup}.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default LabAdminPortal;
