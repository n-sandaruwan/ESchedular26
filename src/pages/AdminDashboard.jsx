import React, { useState, useEffect } from 'react';
import { getStoredModuleHours, saveStoredModuleHours } from '../data/moduleHoursData';
import { getStoredDailyLogs, saveStoredDailyLogs, addAuditLog } from '../data/dailyLogsData';
import { getModulesForDate, modifyScheduleSlot, addNotice } from '../data/scheduleStore';

function AdminDashboard() {
  // Active Secondary Tool Tab ('reschedule' | 'cancel' | 'notice')
  const [activeTab, setActiveTab] = useState('reschedule');

  // Form 1: Evening Daily Log State (PRIMARY TOP FEATURED FORM)
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logModules, setLogModules] = useState([]);
  const [selectedLogModule, setSelectedLogModule] = useState('');
  const [conductedHours, setConductedHours] = useState('');
  const [logNote, setLogNote] = useState('');

  // Form 2: Reschedule State
  const [reschedTargetModule, setReschedTargetModule] = useState('');
  const [reschedTargetDate, setReschedTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [reschedStartTime, setReschedStartTime] = useState('08:30');
  const [reschedEndTime, setReschedEndTime] = useState('10:30');
  const [reschedVenue, setReschedVenue] = useState('LT1');
  const [reschedRemark, setReschedRemark] = useState('');

  // Form 3: Cancellation State
  const [cancelDate, setCancelDate] = useState(new Date().toISOString().split('T')[0]);
  const [cancelAvailableModules, setCancelAvailableModules] = useState([]);
  const [selectedCancelModule, setSelectedCancelModule] = useState('');
  const [cancelRemark, setCancelRemark] = useState('');

  // Form 4: Notice State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  // Status & Warning Notifications
  const [statusMsg, setStatusMsg] = useState('');
  const [conflictWarning, setConflictWarning] = useState('');

  // Update Evening Log Modules list whenever logDate changes
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

  // Update Cancellation Modules list whenever cancelDate changes
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

  // Submit Primary Evening Daily Log
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

  // Submit Reschedule Form
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

  // Submit Cancellation Form
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

  // Submit Notice Broadcast
  const handleNoticeSubmit = (e) => {
    e.preventDefault();
    addNotice(noticeTitle, noticeContent);
    addAuditLog('Notice Broadcast', `Posted announcement: "${noticeTitle}".`);
    setStatusMsg(`Notice broadcasted successfully to all dashboards!`);
    setTimeout(() => setStatusMsg(''), 4000);
    setNoticeTitle('');
    setNoticeContent('');
  };

  const inputClasses = "bg-surface-container-lowest border border-glass-stroke text-on-surface focus:border-electric-blue outline-none rounded-lg px-3.5 py-2.5 w-full font-body-md text-xs [color-scheme:dark] cursor-pointer";

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-xl">
        <span className="font-label-mono text-xs text-electric-blue bg-electric-blue/10 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
          Admin Control Center
        </span>
        <h1 className="font-display-lg text-3xl font-bold text-on-surface mt-2">Master Schedule & Log Management</h1>
        <p className="text-on-surface-variant text-sm mt-1">Evening Daily Lecture Log is your primary tool. Secondary schedule adjustments available below.</p>
      </div>

      {statusMsg && (
        <div className="bg-emerald-glow/20 border border-emerald-glow text-emerald-glow p-3.5 rounded-xl text-center font-bold text-sm">
          {statusMsg}
        </div>
      )}

      {conflictWarning && (
        <div className="bg-coral-vibe/20 border border-coral-vibe text-coral-vibe p-3.5 rounded-xl text-center font-bold text-xs">
          {conflictWarning}
        </div>
      )}

      {/* PRIMARY FEATURED TOP CARD: Evening Daily Lecture Log */}
      <form onSubmit={handleDailyLogSubmit} className="glass-panel p-6 rounded-xl flex flex-col gap-5 border-t-4 border-t-emerald-glow shadow-[0_0_20px_rgba(52,211,153,0.1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-glass-stroke">
          <div>
            <span className="font-label-mono text-[10px] bg-emerald-glow/20 text-emerald-glow px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              ⭐ Primary Daily Action
            </span>
            <h2 className="font-headline-md text-2xl font-bold text-on-surface flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-emerald-glow">task_alt</span> Evening Daily Lecture Log
            </h2>
          </div>
          <p className="text-xs text-on-surface-variant max-w-sm">
            Select a date to view scheduled modules and log completed hours & topic reviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-label-mono uppercase text-on-surface-variant">1. Select Date (Calendar Popup)</label>
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
                className="material-symbols-outlined absolute right-3 text-emerald-glow cursor-pointer text-base pointer-events-auto"
                title="Open Calendar Picker"
              >
                calendar_month
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-label-mono uppercase text-on-surface-variant">2. Modules Scheduled on {logDate}</label>
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
            <label className="text-[11px] font-label-mono uppercase text-on-surface-variant">3. Conducted Hours</label>
            <input className={inputClasses} type="number" placeholder="Hours Conducted (e.g. 2)" required value={conductedHours} onChange={e => setConductedHours(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[11px] font-label-mono uppercase text-on-surface-variant">4. Short Review / Topic Covered</label>
            <input className={inputClasses} placeholder="e.g. Completed Chapter 3 tutorial questions" value={logNote} onChange={e => setLogNote(e.target.value)} />
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedLogModule}
          className="bg-emerald-glow text-slate-900 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:opacity-90 cursor-pointer disabled:opacity-50"
        >
          Save Evening Lecture Log
        </button>
      </form>

      {/* SECONDARY SCHEDULE CONTROLS SECTION */}
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-glass-stroke">
          <div>
            <h3 className="font-headline-md text-xl font-bold text-on-surface">Schedule Management Tools</h3>
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
                ? 'bg-electric-blue/15 border-electric-blue text-electric-blue font-bold shadow-[0_0_12px_rgba(0,212,255,0.3)]'
                : 'bg-surface-container/50 border-glass-stroke text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-lg">event_repeat</span>
            <span className="text-xs font-body-md font-bold">Reschedule Lecture</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cancel')}
            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'cancel'
                ? 'bg-coral-vibe/15 border-coral-vibe text-coral-vibe font-bold shadow-[0_0_12px_rgba(255,107,107,0.3)]'
                : 'bg-surface-container/50 border-glass-stroke text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-lg">event_busy</span>
            <span className="text-xs font-body-md font-bold">Cancel Lecture</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notice')}
            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'notice'
                ? 'bg-purple-500/15 border-purple-400 text-purple-300 font-bold shadow-[0_0_12px_rgba(192,132,252,0.3)]'
                : 'bg-surface-container/50 border-glass-stroke text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-lg">campaign</span>
            <span className="text-xs font-body-md font-bold">Broadcast Notice</span>
          </button>
        </div>

        {/* TAB 1: Inside Reschedule Tool Panel */}
        {activeTab === 'reschedule' && (
          <form onSubmit={handleRescheduleSubmit} className="glass-panel p-6 rounded-xl flex flex-col gap-4 border-t-4 border-t-electric-blue">
            <div>
              <h4 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-blue">event_repeat</span> Reschedule Lecture Tool
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5">Reschedule any module slot to a new target date, time range, and venue.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-label-mono uppercase text-on-surface-variant">1. Select Module to Reschedule</label>
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
                <label className="text-[11px] font-label-mono uppercase text-on-surface-variant">2. Reschedule Date (Calendar)</label>
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
                    className="material-symbols-outlined absolute right-3 text-electric-blue cursor-pointer text-base pointer-events-auto"
                  >
                    calendar_month
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-mono uppercase text-on-surface-variant">3. New Venue</label>
                <select className={inputClasses} value={reschedVenue} onChange={e => setReschedVenue(e.target.value)}>
                  <option value="LT1">LT1</option>
                  <option value="LT2">LT2</option>
                  <option value="NCC">NCC</option>
                  <option value="NLH2">NLH2</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-surface-container/40 p-3 rounded-lg border border-glass-stroke">
              <span className="text-[11px] font-label-mono uppercase text-on-surface-variant font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-electric-blue">schedule</span>
                4. Time Slot Range (Time Picker Popup)
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-label-mono text-on-surface-variant">Start Time</span>
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
                  <span className="text-[10px] font-label-mono text-on-surface-variant">End Time</span>
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
                <span className="text-[10px] font-label-mono text-on-surface-variant">Presets:</span>
                <button type="button" onClick={() => handleApplyPresetTime('08:30', '10:30')} className="px-2 py-0.5 rounded bg-surface-container-high border border-glass-stroke text-[10px] font-label-mono text-electric-blue hover:bg-electric-blue/15 cursor-pointer">08:30-10:30</button>
                <button type="button" onClick={() => handleApplyPresetTime('10:30', '11:30')} className="px-2 py-0.5 rounded bg-surface-container-high border border-glass-stroke text-[10px] font-label-mono text-electric-blue hover:bg-electric-blue/15 cursor-pointer">10:30-11:30</button>
                <button type="button" onClick={() => handleApplyPresetTime('12:30', '14:30')} className="px-2 py-0.5 rounded bg-surface-container-high border border-glass-stroke text-[10px] font-label-mono text-electric-blue hover:bg-electric-blue/15 cursor-pointer">12:30-02:30</button>
                <button type="button" onClick={() => handleApplyPresetTime('14:30', '16:30')} className="px-2 py-0.5 rounded bg-surface-container-high border border-glass-stroke text-[10px] font-label-mono text-electric-blue hover:bg-electric-blue/15 cursor-pointer">02:30-04:30</button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-label-mono uppercase text-on-surface-variant">5. Remark / Reason</label>
              <input className={inputClasses} placeholder="e.g. Rescheduled due to lab session conflict" value={reschedRemark} onChange={e => setReschedRemark(e.target.value)} />
            </div>

            <button
              type="submit"
              disabled={!reschedTargetModule}
              className="btn-electric py-3 rounded-lg font-bold text-xs uppercase tracking-wider mt-1 cursor-pointer disabled:opacity-50"
            >
              Save Rescheduled Lecture
            </button>
          </form>
        )}

        {/* TAB 2: Inside Cancellation Tool Panel */}
        {activeTab === 'cancel' && (
          <form onSubmit={handleCancellationSubmit} className="glass-panel p-6 rounded-xl flex flex-col gap-4 border-t-4 border-t-coral-vibe">
            <div>
              <h4 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-coral-vibe">event_busy</span> Cancellation Tool Panel
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5">Select a date to view active scheduled modules and call off a lecture.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-label-mono uppercase text-on-surface-variant">1. Select Cancellation Date (Calendar)</label>
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
                  className="material-symbols-outlined absolute right-3 text-coral-vibe cursor-pointer text-base pointer-events-auto"
                >
                  calendar_month
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-label-mono uppercase text-on-surface-variant">
                2. Scheduled Modules on {cancelDate} (Default & Rescheduled)
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
              <label className="text-[11px] font-label-mono uppercase text-on-surface-variant">3. Reason for Cancellation</label>
              <input className={inputClasses} placeholder="e.g. Lecturer out on official duty" required value={cancelRemark} onChange={e => setCancelRemark(e.target.value)} />
            </div>

            <button
              type="submit"
              disabled={!selectedCancelModule}
              className="border border-coral-vibe text-coral-vibe hover:bg-coral-vibe/10 py-3 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              Confirm Lecture Cancellation
            </button>
          </form>
        )}

        {/* TAB 3: Inside Notice Tool Panel */}
        {activeTab === 'notice' && (
          <form onSubmit={handleNoticeSubmit} className="glass-panel p-6 rounded-xl flex flex-col gap-4 border-t-4 border-t-purple-400">
            <div>
              <h4 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400">campaign</span> Broadcast Notice Tool
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5">Post an instant alert to the main student dashboard notice board.</p>
            </div>

            <input className={inputClasses} placeholder="Notice Title" required value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} />
            <textarea className={`${inputClasses} h-28 resize-none`} placeholder="Detailed Announcement..." required value={noticeContent} onChange={e => setNoticeContent(e.target.value)} />

            <button type="submit" className="border border-purple-400 text-purple-300 hover:bg-purple-500/10 py-3 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer">
              Broadcast Notice to All Students
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
