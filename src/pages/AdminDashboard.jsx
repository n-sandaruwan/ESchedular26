import React, { useState, useEffect } from 'react';
import { getStoredModuleHours, saveStoredModuleHours } from '../data/moduleHoursData';
import { getStoredDailyLogs, saveStoredDailyLogs, addAuditLog } from '../data/dailyLogsData';
import { getModulesForDate, modifyScheduleSlot, addNotice } from '../data/scheduleStore';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('reschedule');

  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logModules, setLogModules] = useState([]);
  const [selectedLogModule, setSelectedLogModule] = useState('');
  const [conductedHours, setConductedHours] = useState('');
  const [logNote, setLogNote] = useState('');

  const [reschedTargetModule, setReschedTargetModule] = useState('');
  const [reschedTargetDate, setReschedTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [reschedStartTime, setReschedStartTime] = useState('08:30');
  const [reschedEndTime, setReschedEndTime] = useState('10:30');
  const [reschedVenue, setReschedVenue] = useState('LT1');
  const [reschedRemark, setReschedRemark] = useState('');

  const [cancelDate, setCancelDate] = useState(new Date().toISOString().split('T')[0]);
  const [cancelAvailableModules, setCancelAvailableModules] = useState([]);
  const [selectedCancelModule, setSelectedCancelModule] = useState('');
  const [cancelRemark, setCancelRemark] = useState('');

  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  const [statusMsg, setStatusMsg] = useState('');
  const [conflictWarning, setConflictWarning] = useState('');

  useEffect(() => {
    const list = getModulesForDate(logDate);
    setLogModules(list);
    if (list.length > 0) {
      setSelectedLogModule(list[0].module);
      setConductedHours('2');
    } else {
      setSelectedLogModule('');
      setConductedHours('');
    }
  }, [logDate]);

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

  const handleDailyLogSubmit = (e) => {
    e.preventDefault();
    const hrs = parseInt(conductedHours, 10) || 0;
    if (!selectedLogModule || hrs <= 0) return;

    const currentLogs = getStoredDailyLogs();
    const activeSlot = logModules.find(m => m.module === selectedLogModule);
    const newLog = {
      id: Date.now(),
      date: logDate,
      module: selectedLogModule,
      hours: hrs,
      topic: logNote || 'Regular Class Completed',
      venue: activeSlot?.hall || 'LT1',
      instructor: 'Department Faculty'
    };
    saveStoredDailyLogs([newLog, ...currentLogs]);

    const currentHours = getStoredModuleHours();
    const updatedHours = currentHours.map(m => {
      if (m.code === selectedLogModule) {
        return { ...m, conductedHours: Math.min(m.targetHours, m.conductedHours + hrs) };
      }
      return m;
    });
    saveStoredModuleHours(updatedHours);

    addAuditLog('Evening Lecture Log', `Logged ${hrs} hrs for ${selectedLogModule} on ${logDate} ("${logNote || 'Regular lecture'}").`);
    setStatusMsg(`Successfully logged ${hrs} hrs for ${selectedLogModule} on ${logDate}!`);
    setTimeout(() => setStatusMsg(''), 4000);
    setLogNote('');
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    setConflictWarning('');

    if (!reschedTargetModule || !reschedStartTime || !reschedEndTime) return;

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
  };

  const handleCancellationSubmit = (e) => {
    e.preventDefault();
    if (!selectedCancelModule) return;

    modifyScheduleSlot({
      date: cancelDate,
      module: selectedCancelModule,
      status: 'Canceled',
      reason: cancelRemark || 'Lecturer unavailable'
    });

    setStatusMsg(`Canceled ${selectedCancelModule} for ${cancelDate}! Notice & dashboard alert updated.`);
    setTimeout(() => setStatusMsg(''), 4000);
    setCancelRemark('');
  };

  const handleNoticeSubmit = (e) => {
    e.preventDefault();
    addNotice(noticeTitle, noticeContent);
    addAuditLog('Notice Broadcast', `Posted announcement: "${noticeTitle}".`);
    setStatusMsg(`Notice broadcasted successfully to all dashboards!`);
    setTimeout(() => setStatusMsg(''), 4000);
    setNoticeTitle('');
    setNoticeContent('');
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

      {/* PRIMARY FEATURED TOP CARD: Evening Daily Lecture Log */}
      <form onSubmit={handleDailyLogSubmit} className="glass-card p-stack-md rounded-xl flex flex-col gap-5 border-t-4 border-t-secondary shadow-[0_0_20px_rgba(78,222,163,0.1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
          <div>
            <span className="font-label-bold text-[10px] bg-secondary/20 text-secondary px-2.5 py-1 rounded-full uppercase tracking-wider">
              ⭐ Primary Daily Action
            </span>
            <h3 className="font-headline-md text-xl font-bold text-on-surface flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-secondary">task_alt</span> Evening Daily Lecture Log
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant max-w-sm">
            Select a date to view scheduled modules and log completed hours & topic reviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-label-bold uppercase text-on-surface-variant">1. Select Date (Calendar Popup)</label>
            <div className="relative flex items-center">
              <input
                className={`${inputClasses} pr-10`}
                type="date"
                required
                value={logDate}
                onChange={e => setLogDate(e.target.value)}
                onClick={e => e.target.showPicker && e.target.showPicker()}
              />
              <span
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling;
                  if (input && input.showPicker) input.showPicker();
                }}
                className="material-symbols-outlined absolute right-3 text-secondary cursor-pointer text-base pointer-events-auto"
                title="Open Calendar Picker"
              >
                calendar_month
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-label-bold uppercase text-on-surface-variant">2. Modules Scheduled on {logDate}</label>
            <select className={inputClasses} required value={selectedLogModule} onChange={e => setSelectedLogModule(e.target.value)}>
              {logModules.length === 0 ? (
                <option value="">No classes scheduled on this date</option>
              ) : (
                logModules.map((m, idx) => (
                  <option key={idx} value={m.module}>
                    {m.module} - {m.name || m.module} ({m.time}) {m.status !== 'Scheduled' ? `[${m.status}]` : '[Default Slot]'}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-label-bold uppercase text-on-surface-variant">3. Conducted Hours</label>
            <input className={inputClasses} type="number" placeholder="Hours Conducted (e.g. 2)" required value={conductedHours} onChange={e => setConductedHours(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[11px] font-label-bold uppercase text-on-surface-variant">4. Short Review / Topic Covered</label>
            <input className={inputClasses} placeholder="e.g. Completed Chapter 3 tutorial questions" value={logNote} onChange={e => setLogNote(e.target.value)} />
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedLogModule}
          className="bg-secondary text-on-secondary py-3 rounded-lg font-label-bold text-xs uppercase tracking-wider hover:opacity-90 cursor-pointer disabled:opacity-50 transition-opacity"
        >
          Save Evening Lecture Log
        </button>
      </form>

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
          <form onSubmit={handleCancellationSubmit} className="glass-card p-stack-md rounded-xl flex flex-col gap-4 border-t-4 border-t-error">
            <div>
              <h4 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-error">event_busy</span> Cancellation Tool Panel
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5">Select a date to view active scheduled modules and call off a lecture.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-label-bold uppercase text-on-surface-variant">1. Select Cancellation Date (Calendar)</label>
              <div className="relative flex items-center">
                <input
                  className={`${inputClasses} pr-10`}
                  type="date"
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
                {cancelAvailableModules.length === 0 ? (
                  <option value="">No active classes scheduled on this date</option>
                ) : (
                  cancelAvailableModules.map((m, idx) => (
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
      </div>
    </div>
  );
}

export default AdminDashboard;
