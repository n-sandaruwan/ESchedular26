import React, { useState, useEffect } from 'react';
import { getStoredModuleHours, saveStoredModuleHours } from '../data/moduleHoursData';
import { getStoredDailyLogs, saveStoredDailyLogs, deleteDailyLogByModuleAndDate, addAuditLog } from '../data/dailyLogsData';
import { getModulesForDate, modifyScheduleSlot, uncancelScheduleSlot, getStoredOverrides, addNotice } from '../data/scheduleStore';
import { getSriLankaDateStr, getValidSemesterDateStr, SEMESTER_START_DATE } from '../utils/dateUtils';
import { exportCompleteDatabaseJSON, restoreCompleteDatabaseJSON } from '../data/backupRestore';
import {
  getStoredSheetCsvUrl,
  saveStoredSheetCsvUrl,
  getStoredSheetWebhookUrl,
  saveStoredSheetWebhookUrl,
  fetchScheduleFromGoogleSheet,
  GOOGLE_APPS_SCRIPT_TEMPLATE
} from '../data/googleSheetsSync';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('reschedule');

  const [reschedTargetModule, setReschedTargetModule] = useState('');
  const [reschedTargetDate, setReschedTargetDate] = useState(getValidSemesterDateStr());
  const [reschedStartTime, setReschedStartTime] = useState('08:30');
  const [reschedEndTime, setReschedEndTime] = useState('10:30');
  const [reschedVenue, setReschedVenue] = useState('LT1');
  const [reschedRemark, setReschedRemark] = useState('');

  const [cancelDate, setCancelDate] = useState(getValidSemesterDateStr());
  const [cancelAvailableModules, setCancelAvailableModules] = useState([]);
  const [selectedCancelModule, setSelectedCancelModule] = useState('');
  const [cancelRemark, setCancelRemark] = useState('');

  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  const [sheetCsvUrl, setSheetCsvUrl] = useState(getStoredSheetCsvUrl());
  const [sheetWebhookUrl, setSheetWebhookUrl] = useState(getStoredSheetWebhookUrl());
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);

  const [statusMsg, setStatusMsg] = useState('');
  const [conflictWarning, setConflictWarning] = useState('');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    btnText: 'Confirm',
    btnStyle: 'btn-electric',
    onConfirm: null
  });

  useEffect(() => {
    const handleOverridesUpdate = () => {
      setCancelAvailableModules(getModulesForDate(cancelDate));
    };
    window.addEventListener('schedule_overrides_updated', handleOverridesUpdate);
    return () => window.removeEventListener('schedule_overrides_updated', handleOverridesUpdate);
  }, [cancelDate]);

  const handleSaveDriveConfig = async (e) => {
    e.preventDefault();
    saveStoredSheetCsvUrl(sheetCsvUrl);
    saveStoredSheetWebhookUrl(sheetWebhookUrl);

    if (sheetCsvUrl) {
      setIsDriveSyncing(true);
      try {
        const res = await fetchScheduleFromGoogleSheet(sheetCsvUrl);
        setStatusMsg(`✅ Successfully synced ${res.count} schedule records live from your Google Drive Sheet!`);
        addAuditLog('Google Drive Sync', `Admin triggered live sync from Google Sheet (${res.count} records).`);
      } catch (err) {
        setConflictWarning(`Failed to fetch from Google Sheet: ${err.message}. Make sure the sheet is published as CSV (File -> Share -> Publish to web -> CSV).`);
      } finally {
        setIsDriveSyncing(false);
      }
    } else {
      setStatusMsg('✅ Google Drive settings saved successfully!');
    }
    setTimeout(() => setStatusMsg(''), 5000);
  };

  useEffect(() => {
    const list = getModulesForDate(cancelDate);
    setCancelAvailableModules(list);
    if (list.length > 0) {
      setSelectedCancelModule(list[0].module);
    } else {
      setSelectedCancelModule('');
    }
  }, [cancelDate]);

  const handleApplyPresetTime = (start, end) => {
    setReschedStartTime(start);
    setReschedEndTime(end);
  };

  // Execution Helpers after Confirmation Modal
  const executeReschedule = () => {
    const formattedTimeSlot = `${reschedStartTime} - ${reschedEndTime}`;

    if (reschedVenue === 'NCC' && formattedTimeSlot.includes('08:30')) {
      setConflictWarning(`⚠️ Time Conflict Alert: Venue ${reschedVenue} has another class at 08:30 AM! Update saved with warning.`);
    }

    modifyScheduleSlot({
      date: reschedTargetDate,
      module: reschedTargetModule,
      status: 'Rescheduled',
      newTime: formattedTimeSlot,
      newVenue: reschedVenue,
      reason: reschedRemark
    });

    setStatusMsg(`Rescheduled ${reschedTargetModule} to ${reschedTargetDate} (${formattedTimeSlot} @ ${reschedVenue})! Master schedule updated.`);
    setTimeout(() => setStatusMsg(''), 4000);
    setReschedRemark('');
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    setConflictWarning('');
    if (!reschedTargetModule || !reschedStartTime || !reschedEndTime) return;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Reschedule Action',
      message: `Are you sure you want to RESCHEDULE ${reschedTargetModule} on ${reschedTargetDate} to ${reschedStartTime} - ${reschedEndTime} (${reschedVenue})? This update will be published instantly.`,
      btnText: 'Confirm Reschedule',
      btnStyle: 'btn-electric',
      onConfirm: () => executeReschedule()
    });
  };

  const executeCancellation = () => {
    modifyScheduleSlot({
      date: cancelDate,
      module: selectedCancelModule,
      status: 'Canceled',
      reason: cancelRemark || 'Lecturer unavailable'
    });

    setStatusMsg(`Canceled ${selectedCancelModule} for ${cancelDate}! Notice & dashboard alert updated.`);
    setTimeout(() => setStatusMsg(''), 4000);
    setCancelRemark('');
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
  };

  const handleCancellationSubmit = (e) => {
    e.preventDefault();
    if (!selectedCancelModule) return;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Lecture Cancellation',
      message: `Are you sure you want to CANCEL ${selectedCancelModule} scheduled on ${cancelDate}? This will notify all enrolled students.`,
      btnText: 'Confirm Cancellation',
      btnStyle: 'bg-error text-on-error hover:bg-error/90 border-error/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
      onConfirm: () => executeCancellation()
    });
  };

  const handleUncancelLecture = (moduleCode) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Un-cancel / Restore Lecture',
      message: `Are you sure you want to RESTORE / UN-CANCEL ${moduleCode} on ${cancelDate}? This will remove the cancellation override and reactivate the class.`,
      btnText: 'Confirm Un-cancel',
      btnStyle: 'bg-secondary text-on-secondary hover:bg-secondary/90 border-secondary/50 shadow-[0_0_15px_rgba(78,222,163,0.3)]',
      onConfirm: () => {
        uncancelScheduleSlot({
          date: cancelDate,
          module: moduleCode,
          reason: 'Restored by Admin via Control Panel'
        });
        setStatusMsg(`Successfully Un-canceled / Restored ${moduleCode} on ${cancelDate}!`);
        setTimeout(() => setStatusMsg(''), 4000);
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
        setCancelAvailableModules(getModulesForDate(cancelDate));
      }
    });
  };

  const handleRecancelLecture = (moduleCode, currentReason = '') => {
    const newReason = prompt(`Re-cancel ${moduleCode} on ${cancelDate}.\nEnter updated cancellation reason:`, currentReason || 'Lecturer unavailable');
    if (newReason === null) return;
    modifyScheduleSlot({
      date: cancelDate,
      module: moduleCode,
      status: 'Canceled',
      reason: newReason || 'Lecturer unavailable'
    });
    setStatusMsg(`Re-canceled ${moduleCode} on ${cancelDate} with updated reason.`);
    setTimeout(() => setStatusMsg(''), 4000);
    setCancelAvailableModules(getModulesForDate(cancelDate));
  };

  const executeNoticeBroadcast = () => {
    addNotice(noticeTitle, noticeContent);
    addAuditLog('Notice Broadcast', `Posted announcement: "${noticeTitle}".`);
    setStatusMsg(`Notice broadcasted successfully to all dashboards!`);
    setTimeout(() => setStatusMsg(''), 4000);
    setNoticeTitle('');
    setNoticeContent('');
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
  };

  const handleNoticeSubmit = (e) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Notice Broadcast',
      message: `Are you sure you want to BROADCAST "${noticeTitle}" to all student dashboards?`,
      btnText: 'Confirm Broadcast',
      btnStyle: 'btn-electric',
      onConfirm: () => executeNoticeBroadcast()
    });
  };

  const handleExitAdmin = () => {
    localStorage.setItem('mis_role', 'student');
    localStorage.removeItem('mis_user');
    window.location.href = '#/';
    window.location.reload();
  };

  const inputClasses = "bg-surface-container border border-white/5 text-on-surface focus:border-primary outline-none rounded-lg px-3.5 py-2.5 w-full font-body-md text-xs [color-scheme:dark] cursor-pointer";

  return (
    <div className="space-y-stack-lg max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card rounded-xl p-stack-md flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <span className="font-label-bold text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Admin Control Panel
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface mt-2">Master Schedule & Log Management</h2>
          <p className="text-on-surface-variant text-xs mt-0.5">Evening Daily Lecture Log is your primary tool. Secondary schedule adjustments available below.</p>
        </div>
        <button
          type="button"
          onClick={handleExitAdmin}
          className="px-4 py-2 rounded-xl bg-error/10 border border-error/30 text-error hover:bg-error/20 font-label-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-sm">logout</span> Leave Admin Mode
        </button>
      </div>

      {statusMsg && (
        <div className="bg-secondary/20 border border-secondary text-secondary p-3.5 rounded-xl text-center font-bold text-xs">
          {statusMsg}
        </div>
      )}

      {conflictWarning && (
        <div className="bg-error/20 border border-error text-error p-3.5 rounded-xl text-center font-bold text-xs">
          {conflictWarning}
        </div>
      )}



      {/* SECONDARY SCHEDULE CONTROLS SECTION */}
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <div>
            <h3 className="font-headline-md text-lg font-bold text-on-surface">Schedule Management Tools</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Select a tool below to open its control panel.</p>
          </div>
        </div>

        {/* Secondary Tool Selection Tabs */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('reschedule')}
            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'reschedule'
                ? 'bg-primary/15 border-primary text-primary font-bold active-glow'
                : 'bg-surface-container/50 border-white/5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-lg">event_repeat</span>
            <span className="text-xs font-label-bold">Reschedule Lecture</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cancel')}
            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'cancel'
                ? 'bg-error/15 border-error text-error font-bold'
                : 'bg-surface-container/50 border-white/5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-lg">event_busy</span>
            <span className="text-xs font-label-bold">Cancel Lecture</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notice')}
            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'notice'
                ? 'bg-tertiary/15 border-tertiary text-tertiary font-bold'
                : 'bg-surface-container/50 border-white/5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-lg">campaign</span>
            <span className="text-xs font-label-bold">Broadcast Notice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drive')}
            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'drive'
                ? 'bg-secondary/15 border-secondary text-secondary font-bold'
                : 'bg-surface-container/50 border-white/5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-lg">table_chart</span>
            <span className="text-xs font-label-bold">Google Sheets Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'backup'
                ? 'bg-secondary/15 border-secondary text-secondary font-bold shadow-[0_0_15px_rgba(78,222,163,0.2)]'
                : 'bg-surface-container/50 border-white/5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-lg text-secondary">verified_user</span>
            <span className="text-xs font-label-bold">Backup & Cloud Health</span>
          </button>
        </div>

        {/* TAB 1: Inside Reschedule Tool Panel */}
        {activeTab === 'reschedule' && (
          <form onSubmit={handleRescheduleSubmit} className="glass-card p-stack-md rounded-xl flex flex-col gap-4 border-t-4 border-t-primary">
            <div>
              <h4 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event_repeat</span> Reschedule Lecture Tool
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5">Reschedule any module slot to a new target date, time range, and venue.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-label-bold uppercase text-on-surface-variant">1. Select Module to Reschedule</label>
              <select className={inputClasses} required value={reschedTargetModule} onChange={e => setReschedTargetModule(e.target.value)}>
                <option value="">Select Module...</option>
                <option value="EE3203">EE3203 - Electrical & Electronic Measurements</option>
                <option value="EE3202">EE3202 - Data Structures & Algorithms</option>
                <option value="EE3304">EE3304 - Engineering Electromagnetism</option>
                <option value="IS3301">IS3301 - Complex Analysis & Math Transforms</option>
                <option value="EE3306">EE3306 - Signals & Systems</option>
                <option value="IS3321">IS3321 - Management for Engineers</option>
                <option value="EE3205">EE3205 - Power & Energy</option>
                <option value="EE3301">EE3301 - Analog Electronics</option>
                <option value="IS3322">IS3322 - Society & the Engineers</option>
                <option value="CCSSD">CCSSD - Soft Skills Development</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-bold uppercase text-on-surface-variant">2. Reschedule Date (Calendar)</label>
                <div className="relative flex items-center">
                  <input
                    className={`${inputClasses} pr-10`}
                    type="date"
                    min={SEMESTER_START_DATE}
                    required
                    value={reschedTargetDate}
                    onChange={e => setReschedTargetDate(e.target.value)}
                    onClick={e => e.target.showPicker && e.target.showPicker()}
                  />
                  <span
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling;
                      if (input && input.showPicker) input.showPicker();
                    }}
                    className="material-symbols-outlined absolute right-3 text-primary cursor-pointer text-base pointer-events-auto"
                  >
                    calendar_month
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-bold uppercase text-on-surface-variant">3. New Venue</label>
                <select className={inputClasses} value={reschedVenue} onChange={e => setReschedVenue(e.target.value)}>
                  <option value="LT1">LT1</option>
                  <option value="LT2">LT2</option>
                  <option value="NCC">NCC</option>
                  <option value="NLH2">NLH2</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-surface-container/40 p-3 rounded-lg border border-white/5">
              <span className="text-[11px] font-label-bold uppercase text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-primary">schedule</span>
                4. Time Slot Range
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-label-bold text-on-surface-variant">Start Time</span>
                  <input
                    className={inputClasses}
                    type="time"
                    required
                    value={reschedStartTime}
                    onChange={e => setReschedStartTime(e.target.value)}
                    onClick={e => e.target.showPicker && e.target.showPicker()}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-label-bold text-on-surface-variant">End Time</span>
                  <input
                    className={inputClasses}
                    type="time"
                    required
                    value={reschedEndTime}
                    onChange={e => setReschedEndTime(e.target.value)}
                    onClick={e => e.target.showPicker && e.target.showPicker()}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-label-bold text-on-surface-variant">Presets:</span>
                <button type="button" onClick={() => handleApplyPresetTime('08:30', '10:30')} className="px-2 py-0.5 rounded bg-surface-container border border-white/5 text-[10px] font-label-bold text-primary hover:bg-primary/10 cursor-pointer">08:30-10:30</button>
                <button type="button" onClick={() => handleApplyPresetTime('10:30', '11:30')} className="px-2 py-0.5 rounded bg-surface-container border border-white/5 text-[10px] font-label-bold text-primary hover:bg-primary/10 cursor-pointer">10:30-11:30</button>
                <button type="button" onClick={() => handleApplyPresetTime('12:30', '14:30')} className="px-2 py-0.5 rounded bg-surface-container border border-white/5 text-[10px] font-label-bold text-primary hover:bg-primary/10 cursor-pointer">12:30-02:30</button>
                <button type="button" onClick={() => handleApplyPresetTime('14:30', '16:30')} className="px-2 py-0.5 rounded bg-surface-container border border-white/5 text-[10px] font-label-bold text-primary hover:bg-primary/10 cursor-pointer">02:30-04:30</button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-label-bold uppercase text-on-surface-variant">5. Remark / Reason</label>
              <input className={inputClasses} placeholder="e.g. Rescheduled due to lab session conflict" value={reschedRemark} onChange={e => setReschedRemark(e.target.value)} />
            </div>

            <button
              type="submit"
              disabled={!reschedTargetModule}
              className="btn-electric py-3 rounded-lg font-label-bold text-xs uppercase tracking-wider mt-1 cursor-pointer disabled:opacity-50"
            >
              Save Rescheduled Lecture
            </button>
          </form>
        )}

        {/* TAB 2: Inside Cancellation Tool Panel */}
        {activeTab === 'cancel' && (
          <div className="space-y-4">
            <form onSubmit={handleCancellationSubmit} className="glass-card p-stack-md rounded-xl flex flex-col gap-4 border-t-4 border-t-error">
              <div>
                <h4 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-error">event_busy</span> Cancellation Tool Panel
                </h4>
                <p className="text-xs text-on-surface-variant mt-0.5">Select a date to view active scheduled modules and call off a lecture, or restore/re-cancel existing slots below.</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-bold uppercase text-on-surface-variant">1. Select Cancellation Date (Calendar)</label>
                <div className="relative flex items-center">
                  <input
                    className={`${inputClasses} pr-10`}
                    type="date"
                    min={SEMESTER_START_DATE}
                    required
                    value={cancelDate}
                    onChange={e => setCancelDate(e.target.value)}
                    onClick={e => e.target.showPicker && e.target.showPicker()}
                  />
                  <span
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling;
                      if (input && input.showPicker) input.showPicker();
                    }}
                    className="material-symbols-outlined absolute right-3 text-error cursor-pointer text-base pointer-events-auto"
                  >
                    calendar_month
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-bold uppercase text-on-surface-variant">
                  2. Scheduled Modules on {cancelDate}
                </label>
                <select className={inputClasses} required value={selectedCancelModule} onChange={e => setSelectedCancelModule(e.target.value)}>
                  {cancelAvailableModules.filter(m => m.status !== 'Canceled').length === 0 ? (
                    <option value="">No active classes scheduled on this date (or all already canceled)</option>
                  ) : (
                    cancelAvailableModules.filter(m => m.status !== 'Canceled').map((m, idx) => (
                      <option key={idx} value={m.module}>
                        {m.module} - {m.name || m.module} ({m.time}) {m.status !== 'Scheduled' ? `[Status: ${m.status}]` : '[Default Slot]'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-bold uppercase text-on-surface-variant">3. Reason for Cancellation</label>
                <input className={inputClasses} placeholder="e.g. Lecturer out on official duty" required value={cancelRemark} onChange={e => setCancelRemark(e.target.value)} />
              </div>

              <button
                type="submit"
                disabled={!selectedCancelModule}
                className="border border-error text-error hover:bg-error/10 py-3 rounded-lg font-label-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                Confirm Lecture Cancellation
              </button>
            </form>

            {/* Currently Canceled / Modified Slots for cancelDate */}
            {cancelAvailableModules.filter(m => m.status === 'Canceled').length > 0 && (
              <div className="glass-card p-stack-md rounded-xl flex flex-col gap-3 border-t-4 border-t-secondary bg-secondary/5">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <div>
                    <h5 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-sm">history_toggle_off</span>
                      Currently Canceled Lectures on {cancelDate}
                    </h5>
                    <p className="text-[11px] text-on-surface-variant">Restore or edit reasons for canceled classes on this date.</p>
                  </div>
                  <span className="text-xs font-label-bold text-error bg-error/10 px-2 py-0.5 rounded border border-error/20">
                    {cancelAvailableModules.filter(m => m.status === 'Canceled').length} Canceled
                  </span>
                </div>

                <div className="space-y-2">
                  {cancelAvailableModules.filter(m => m.status === 'Canceled').map((slot, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-surface-container border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-on-surface">{slot.module}</span>
                          <span className="text-xs text-on-surface-variant">({slot.time})</span>
                          <span className="text-[10px] font-label-bold text-error bg-error/10 px-2 py-0.5 rounded">Canceled</span>
                        </div>
                        {slot.reason && (
                          <p className="text-[11px] text-error/80 italic mt-0.5">Reason: "{slot.reason}"</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUncancelLecture(slot.module)}
                          className="px-3 py-1.5 rounded-lg bg-secondary/15 border border-secondary/30 text-secondary hover:bg-secondary/25 text-xs font-label-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">undo</span> Un-cancel / Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRecancelLecture(slot.module, slot.reason)}
                          className="px-3 py-1.5 rounded-lg bg-error/15 border border-error/30 text-error hover:bg-error/25 text-xs font-label-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">edit_note</span> Re-cancel / Edit Reason
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Inside Notice Tool Panel */}
        {activeTab === 'notice' && (
          <form onSubmit={handleNoticeSubmit} className="glass-card p-stack-md rounded-xl flex flex-col gap-4 border-t-4 border-t-tertiary">
            <div>
              <h4 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">campaign</span> Broadcast Notice Tool
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5">Post an instant alert to the main student dashboard notice board.</p>
            </div>

            <input className={inputClasses} placeholder="Notice Title" required value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} />
            <textarea className={`${inputClasses} h-28 resize-none`} placeholder="Detailed Announcement..." required value={noticeContent} onChange={e => setNoticeContent(e.target.value)} />

            <button type="submit" className="border border-tertiary text-tertiary hover:bg-tertiary/10 py-3 rounded-lg font-label-bold text-xs uppercase tracking-wider cursor-pointer">
              Broadcast Notice to All Students
            </button>
          </form>
        )}

        {/* TAB 4: Google Sheets & Drive Integration Panel */}
        {activeTab === 'drive' && (
          <form onSubmit={handleSaveDriveConfig} className="glass-card p-stack-md rounded-xl flex flex-col gap-4 border-t-4 border-t-secondary">
            <div>
              <h4 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">table_chart</span> Google Sheets & Drive Automatic Live Sync
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Connect your Google Sheet in Google Drive for automatic two-way live schedule updates and attendance logging.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-label-bold uppercase text-on-surface-variant">
                1. Published Google Sheet CSV URL (Fetch Live Timetable from Drive)
              </label>
              <input
                className={inputClasses}
                placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                value={sheetCsvUrl}
                onChange={e => setSheetCsvUrl(e.target.value)}
              />
              <span className="text-[10px] text-on-surface-variant/70">
                To get this URL: In Google Sheets, go to <b>File ➔ Share ➔ Publish to web</b>, select <b>Comma-separated values (.csv)</b>, and copy the link.
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-label-bold uppercase text-on-surface-variant">
                2. Google Apps Script Webhook URL (Push Web App Updates to Drive Sheet)
              </label>
              <input
                className={inputClasses}
                placeholder="https://script.google.com/macros/s/.../exec"
                value={sheetWebhookUrl}
                onChange={e => setSheetWebhookUrl(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowScriptModal(!showScriptModal)}
                className="text-xs text-secondary underline hover:opacity-80 cursor-pointer font-label-bold"
              >
                {showScriptModal ? 'Hide Google Apps Script Instructions' : '📋 Show Google Apps Script Template'}
              </button>

              <button
                type="submit"
                disabled={isDriveSyncing}
                className="btn-electric px-6 py-2.5 rounded-xl text-xs font-label-bold flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">sync</span>
                <span>{isDriveSyncing ? 'Syncing...' : 'Save & Sync Drive Now'}</span>
              </button>
            </div>

            {showScriptModal && (
              <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-2 text-xs">
                <p className="font-bold text-on-surface">Instructions to set up Google Webhook in 1 minute:</p>
                <ol className="list-decimal list-inside space-y-1 text-on-surface-variant text-[11px]">
                  <li>Open your Google Sheet in Google Drive.</li>
                  <li>Click <b>Extensions ➔ Apps Script</b>.</li>
                  <li>Paste the following code and click <b>Deploy ➔ New Deployment</b> (type: <i>Web app</i>, Who has access: <i>Anyone</i>):</li>
                </ol>
                <textarea
                  readOnly
                  className="w-full h-36 bg-black p-3 font-mono text-[10px] text-secondary rounded border border-white/10"
                  value={GOOGLE_APPS_SCRIPT_TEMPLATE}
                />
              </div>
            )}
          </form>
        )}

        {/* TAB 5: Backup & Security Center */}
        {activeTab === 'backup' && (
          <div className="glass-card p-stack-md rounded-xl flex flex-col gap-5 border-t-4 border-t-secondary">
            <div>
              <span className="font-label-bold text-[10px] bg-secondary/20 text-secondary px-2.5 py-1 rounded-full uppercase tracking-wider">
                🛡️ 1-Year Zero-Data-Loss Safety Center
              </span>
              <h4 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-secondary">verified_user</span> System Backup & Data Recovery Center
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Export complete offline JSON snapshots and restore your database instantly to prevent any data loss across 1+ years of academic records.
              </p>
            </div>

            {/* Cloud Sync Status Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-surface-container/60 border border-white/5 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg animate-pulse">cloud_done</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant uppercase font-label-bold">Firebase Cloud</span>
                  <p className="text-xs font-bold text-secondary">7 Collections Synced</p>
                </div>
              </div>

              <div className="p-3 bg-surface-container/60 border border-white/5 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">storage</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant uppercase font-label-bold">IndexedDB Cache</span>
                  <p className="text-xs font-bold text-primary">Offline Persistence Active</p>
                </div>
              </div>

              <div className="p-3 bg-surface-container/60 border border-white/5 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-tertiary/20 text-tertiary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">history</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant uppercase font-label-bold">Daily Snapshot</span>
                  <p className="text-xs font-bold text-tertiary">Auto-Saved Locally</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* 1. Download Backup */}
              <div className="p-4 bg-surface-container/40 border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">download</span>
                  <h5 className="font-bold text-xs text-on-surface">1. Download Full Database Backup</h5>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Save a timestamped <code>.json</code> backup containing all 7 collections (schedules, overrides, notices, lab attendance, daily logs, module progress, assessments, audit logs).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    exportCompleteDatabaseJSON();
                    setStatusMsg("✅ Full Database Backup downloaded successfully!");
                    setTimeout(() => setStatusMsg(''), 4000);
                  }}
                  className="w-full btn-electric py-2.5 rounded-xl text-xs font-label-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Download JSON Backup</span>
                </button>
              </div>

              {/* 2. Restore Backup */}
              <div className="p-4 bg-surface-container/40 border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">upload_file</span>
                  <h5 className="font-bold text-xs text-on-surface">2. Restore Database from File</h5>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Upload an <code>.json</code> backup file to restore all records to both your local browser and Cloud Firestore.
                </p>
                <label className="w-full border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary py-2.5 rounded-xl text-xs font-label-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <span className="material-symbols-outlined text-sm">publish</span>
                  <span>Upload & Restore Backup JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          const res = await restoreCompleteDatabaseJSON(event.target.result);
                          if (res.success) {
                            setStatusMsg("✅ Database restored and pushed live to Cloud Firestore!");
                            setTimeout(() => window.location.reload(), 2000);
                          } else {
                            setConflictWarning(res.message);
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-surface-container border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center transform scale-100 transition-transform">
            
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(56,189,248,0.2)]">
              <span className="material-symbols-outlined text-3xl">info</span>
            </div>
            
            <div>
              <h3 className="font-headline-md font-bold text-on-surface text-xl mb-2">{confirmModal.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 text-on-surface hover:bg-white/5 hover:text-white transition-all text-sm font-label-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-label-bold transition-all shadow-lg cursor-pointer ${confirmModal.btnStyle || 'bg-primary text-on-primary hover:bg-primary/90'}`}
              >
                {confirmModal.btnText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
