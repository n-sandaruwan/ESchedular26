import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStoredModuleHours, saveStoredModuleHours } from '../data/moduleHoursData';
import { weeklyTimetable } from '../data/timetableData';
import { getStoredAssessments, toggleAssessmentStatus } from '../data/assessmentData';
import { getStoredOverrides, uncancelScheduleSlot, modifyScheduleSlot } from '../data/scheduleStore';
import { subscribeToCloudEvent } from '../data/firebaseSync';
import { getSriLankaDateObj } from '../utils/dateUtils';

function ModulePage() {
  const { moduleId } = useParams();
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [canceledSessions, setCanceledSessions] = useState([]);
  const [rescheduledSessions, setRescheduledSessions] = useState([]);

  const refreshModuleData = () => {
    const list = getStoredModuleHours();
    setModules(list);
    const match = list.find(m => m.code === moduleId) || list[0];
    setSelectedModule(match);
    setAssessments(getStoredAssessments());
    
    const overrides = getStoredOverrides();
    const moduleOverrides = overrides.filter(o => o.module === (match?.code || moduleId));

    const canceled = moduleOverrides
      .filter(o => o.status === 'Canceled')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const rescheduled = moduleOverrides
      .filter(o => o.status === 'Rescheduled')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    setCanceledSessions(canceled);
    setRescheduledSessions(rescheduled);
  };

  useEffect(() => {
    refreshModuleData();

    window.addEventListener('schedule_overrides_updated', refreshModuleData);
    window.addEventListener('daily_logs_updated', refreshModuleData);
    window.addEventListener('module_hours_updated', refreshModuleData);

    subscribeToCloudEvent('overrides', refreshModuleData);
    subscribeToCloudEvent('daily_logs', refreshModuleData);
    subscribeToCloudEvent('module_hours', refreshModuleData);

    return () => {
      window.removeEventListener('schedule_overrides_updated', refreshModuleData);
      window.removeEventListener('daily_logs_updated', refreshModuleData);
      window.removeEventListener('module_hours_updated', refreshModuleData);
    };
  }, [moduleId]);

  const handleUncancelSession = (sessionDate, moduleCode) => {
    if (window.confirm(`Are you sure you want to RESTORE / UN-CANCEL the ${moduleCode} session on ${sessionDate}?`)) {
      uncancelScheduleSlot({ date: sessionDate, module: moduleCode, reason: 'Restored via Module Page' });
      refreshModuleData();
    }
  };

  const handleRecancelSession = (sessionDate, moduleCode, currentReason) => {
    const newReason = prompt(`Re-cancel ${moduleCode} on ${sessionDate}.\nEnter updated cancellation reason:`, currentReason || 'Lecturer unavailable');
    if (newReason === null) return;
    modifyScheduleSlot({
      date: sessionDate,
      module: moduleCode,
      status: 'Canceled',
      reason: newReason || 'Lecturer unavailable'
    });
    refreshModuleData();
  };

  const role = localStorage.getItem('mis_role');
  const isAdmin = role === 'admin';

  if (!selectedModule) {
    return <div className="p-8 text-center text-on-surface-variant text-sm">Loading module data...</div>;
  }

  const percentage = Math.min(100, Math.round((selectedModule.conductedHours / selectedModule.targetHours) * 100));
  const remainingHours = Math.max(0, selectedModule.targetHours - selectedModule.conductedHours);

  const handleAddHour = (amount) => {
    const updated = modules.map(m => {
      if (m.code === selectedModule.code) {
        const newConducted = Math.max(0, Math.min(m.targetHours, Math.round((m.conductedHours + amount) * 10) / 10));
        return { ...m, conductedHours: newConducted };
      }
      return m;
    });
    setModules(updated);
    saveStoredModuleHours(updated);
    setSelectedModule({
      ...selectedModule,
      conductedHours: Math.max(0, Math.min(selectedModule.targetHours, Math.round((selectedModule.conductedHours + amount) * 10) / 10))
    });
  };

  const handleStatusToggle = (id, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'Scheduled' : 'Completed';
    const updated = toggleAssessmentStatus(id, nextStatus);
    setAssessments(updated);
  };

  const moduleAssessments = assessments.filter(a => a.moduleCode === selectedModule.code);

  const getModuleSessions = () => {
    const sessions = [];
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    daysOrder.forEach(day => {
      const slots = weeklyTimetable[day] || [];
      slots.forEach(slot => {
        if (slot.module === selectedModule.code) {
          sessions.push({ day, ...slot });
        }
      });
    });
    return sessions;
  };

  const moduleSessions = getModuleSessions();

  const getNextDateForDay = (dayName) => {
    const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    const targetDay = dayMap[dayName];
    const today = getSriLankaDateObj();
    const currentDay = today.getDay();

    let distance = targetDay - currentDay;
    if (distance < 0) distance += 7;
    if (distance === 0 && today.getHours() >= 18) distance = 7;

    const nextDate = getSriLankaDateObj();
    nextDate.setDate(today.getDate() + distance);
    return nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-3 max-w-5xl mx-auto">
      {/* Top Banner Navigation */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-white/5">
        <div>
          <Link to="/modules" className="text-primary text-xs flex items-center gap-1 mb-2 hover:underline font-label-bold">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Module Tracker
          </Link>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-label-bold text-xs px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md font-label-mono">
              {selectedModule.code}
            </span>
            <h2 className="font-headline-md text-base sm:text-xl font-bold text-on-surface leading-tight">
              {selectedModule.title}
            </h2>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleAddHour(0.5)}
              className="btn-electric px-3 py-1.5 rounded-xl text-xs font-label-bold flex items-center gap-1 cursor-pointer shadow-[0_0_12px_rgba(56,189,248,0.3)]"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span> Log +30 Mins
            </button>
            <button
              onClick={() => handleAddHour(-0.5)}
              className="bg-surface-container border border-white/10 text-on-surface-variant hover:text-on-surface px-3 py-1.5 rounded-xl text-xs font-label-bold cursor-pointer"
            >
              -30 Mins
            </button>
          </div>
        )}
      </div>

      {/* Module Metadata Card */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border-white/5 space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">badge</span> Module Information
          </h3>
          <span className="font-label-bold text-xs sm:text-sm text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            {selectedModule.credits || 3} Credits
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-surface-container/60 p-4 rounded-xl border border-white/5 space-y-1.5">
            <span className="text-xs sm:text-sm font-label-bold text-on-surface-variant uppercase tracking-wider">Module Coordinator</span>
            <h4 className="font-headline-md font-bold text-on-surface text-base leading-snug">{selectedModule.coordinator || 'Department Faculty'}</h4>
            {selectedModule.email && (
              <a href={`mailto:${selectedModule.email}`} className="text-primary hover:underline font-label-mono text-xs sm:text-sm block truncate">
                ✉️ {selectedModule.email}
              </a>
            )}
          </div>

          <div className="bg-surface-container/60 p-4 rounded-xl border border-white/5 space-y-1.5">
            <span className="text-xs sm:text-sm font-label-bold text-on-surface-variant uppercase tracking-wider">Teaching Team</span>
            <div className="space-y-1">
              {selectedModule.teachers && selectedModule.teachers.length > 0 ? (
                selectedModule.teachers.map((t, idx) => (
                  <p key={idx} className="font-body-md text-on-surface text-xs sm:text-sm font-medium">• {t}</p>
                ))
              ) : (
                <p className="font-body-md text-on-surface text-xs sm:text-sm font-medium">{selectedModule.coordinator || 'Department Faculty'}</p>
              )}
            </div>
          </div>

          <div className="bg-surface-container/60 p-4 rounded-xl border border-white/5 space-y-1.5">
            <span className="text-xs sm:text-sm font-label-bold text-on-surface-variant uppercase tracking-wider">Venue & Allocation</span>
            <h4 className="font-headline-md font-bold text-on-surface text-base">Venue: {selectedModule.venue}</h4>
            <p className="text-xs sm:text-sm text-on-surface-variant/80">Allocation: {selectedModule.weeklyHours} hrs / week</p>
          </div>
        </div>
      </div>

      {/* Assessment & Marks Evaluation Scheme Card */}
      {selectedModule.gradingScheme && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border-white/5 space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">assignment_turned_in</span> Assessment & Marks Evaluation Scheme
            </h3>
            <span className="font-label-bold text-xs sm:text-sm text-secondary bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20 font-label-mono">
              100% Evaluation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {selectedModule.gradingScheme.map((cat, idx) => (
              <div key={idx} className="bg-surface-container/60 p-3.5 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="font-headline-md text-xs sm:text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    {cat.category}
                  </span>
                  <span className="font-label-bold text-xs sm:text-sm text-primary font-label-mono bg-primary/10 px-2 py-0.5 rounded">
                    {cat.weight}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {cat.components.map((comp, cIdx) => (
                    <div key={cIdx} className="flex items-center justify-between text-xs sm:text-sm text-on-surface-variant">
                      <span className="flex items-center gap-1.5">
                        <span className="text-on-surface-variant/60">•</span>
                        <span>{comp.name}</span>
                      </span>
                      <span className="font-label-mono font-bold text-on-surface text-xs bg-surface-container-low px-2 py-0.5 rounded border border-white/5">
                        {comp.weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Necessary Conditions to Pass the Module Card */}
      {selectedModule.passConditions && selectedModule.passConditions.length > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border-amber-500/25 bg-amber-500/5 space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
            <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-xl">verified_user</span> Necessary Conditions to Pass Module
            </h3>
            <span className="font-label-bold text-xs sm:text-sm text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 font-label-mono">
              Mandatory Cutoffs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedModule.passConditions.map((cond, idx) => (
              <div key={idx} className="bg-surface-container/80 p-4 rounded-xl border border-amber-500/20 space-y-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-400"></div>
                <div className="flex justify-between items-center">
                  <span className="font-headline-md text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">gavel</span>
                    {cond.title}
                  </span>
                  <span className="font-label-bold text-xs text-amber-400 font-label-mono bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    Min {cond.minPercentage}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface leading-snug font-medium">
                  {cond.criteria}
                </p>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Required Pass Mark:</span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{cond.minMarks}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assessment & Lab Tracker Panel */}
      <div className="glass-card rounded-2xl p-3.5 sm:p-4 border-white/5 space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <h3 className="font-headline-md text-xs sm:text-sm font-bold text-on-surface flex items-center gap-1.5 uppercase tracking-wider">
            <span className="material-symbols-outlined text-primary text-base">science</span> Assessment Tracker
          </h3>
          <span className="font-label-bold text-[11px] text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 shrink-0 font-label-mono">
            {moduleAssessments.length} Items
          </span>
        </div>

        {moduleAssessments.length === 0 ? (
          <div className="p-3 text-center text-on-surface-variant text-xs">
            No assessment components recorded.
          </div>
        ) : (
          <div className="space-y-1.5">
            {moduleAssessments.map((item) => {
              const isCompleted = item.status === 'Completed';

              return (
                <div
                  key={item.id}
                  className={`px-3 py-2 rounded-lg border transition-all flex items-center justify-between gap-2.5 ${
                    isCompleted
                      ? 'bg-secondary/5 border-secondary/20 hover:border-secondary/35'
                      : 'bg-surface-container/50 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isCompleted ? 'bg-secondary shadow-[0_0_6px_rgba(78,222,163,0.5)]' : 'bg-primary/70'}`}></span>
                    <span className="font-headline-md font-bold text-on-surface text-xs sm:text-sm truncate">
                      {item.title}
                    </span>
                    <span className="font-label-bold text-[10px] px-1.5 py-0.5 rounded bg-surface-container border border-white/10 text-on-surface-variant/80 font-label-mono shrink-0">
                      {item.weight}
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isAdmin ? (
                      <button
                        onClick={() => handleStatusToggle(item.id, item.status)}
                        className={`font-label-bold text-[11px] px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                          isCompleted
                            ? 'bg-secondary/20 text-secondary border-secondary/40 hover:bg-secondary/30'
                            : 'bg-primary/20 text-primary border-primary/40 hover:bg-primary/30'
                        }`}
                        title="Toggle completion (Admin)"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {isCompleted ? 'check_circle' : 'pending_actions'}
                        </span>
                        <span>{isCompleted ? 'Done ✓' : 'Mark Done'}</span>
                      </button>
                    ) : (
                      <span
                        className={`font-label-bold text-[11px] px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${
                          isCompleted
                            ? 'bg-secondary/15 text-secondary border-secondary/30'
                            : 'bg-surface-container-highest/80 text-on-surface-variant/70 border-white/10'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {isCompleted ? 'check_circle' : 'schedule'}
                        </span>
                        <span>{isCompleted ? 'Done' : 'Pending'}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Progress Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Card 1: Completed Hours */}
        <div className="glass-card p-3.5 rounded-xl flex items-center justify-between border-white/5">
          <div>
            <span className="text-xs font-label-bold uppercase text-on-surface-variant/80 tracking-wider">Conducted</span>
            <h3 className="text-xl sm:text-2xl font-bold text-secondary mt-0.5">{selectedModule.conductedHours} hrs</h3>
            <p className="text-xs text-on-surface-variant/70">Logged by faculty</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-xl">timelapse</span>
          </div>
        </div>

        {/* Card 2: Target Hours */}
        <div className="glass-card p-3.5 rounded-xl flex items-center justify-between border-white/5">
          <div>
            <span className="text-xs font-label-bold uppercase text-on-surface-variant/80 tracking-wider">Target</span>
            <h3 className="text-xl sm:text-2xl font-bold text-primary mt-0.5">{selectedModule.targetHours} hrs</h3>
            <p className="text-xs text-on-surface-variant/70">Required total</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-xl">flag</span>
          </div>
        </div>

        {/* Card 3: Remaining Hours */}
        <div className="glass-card p-3.5 rounded-xl flex items-center justify-between border-white/5">
          <div>
            <span className="text-xs font-label-bold uppercase text-on-surface-variant/80 tracking-wider">Remaining</span>
            <h3 className="text-xl sm:text-2xl font-bold text-tertiary mt-0.5">{remainingHours} hrs</h3>
            <p className="text-xs text-on-surface-variant/70">Left in semester</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary shrink-0">
            <span className="material-symbols-outlined text-xl">hourglass_empty</span>
          </div>
        </div>

        {/* Card 4: Weekly Allocation */}
        <div className="glass-card p-3.5 rounded-xl flex items-center justify-between border-white/5">
          <div>
            <span className="text-xs font-label-bold uppercase text-on-surface-variant/80 tracking-wider">Weekly</span>
            <h3 className="text-xl sm:text-2xl font-bold text-on-surface mt-0.5">{selectedModule.weeklyHours} hrs/wk</h3>
            <p className="text-xs text-on-surface-variant/70 truncate">Venue: {selectedModule.venue}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-container border border-white/5 flex items-center justify-center text-on-surface-variant shrink-0">
            <span className="material-symbols-outlined text-xl">calendar_view_week</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Details Panel */}
      <div className="glass-card rounded-2xl p-4 space-y-3 border-white/5">
        <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
          <div>
            <h3 className="font-headline-md text-base font-bold text-on-surface">Module Completion Status</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Real-time lecture hours completion rate for {selectedModule.code}</p>
          </div>
          <span className="font-label-bold text-2xl font-bold text-primary">{percentage}%</span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-surface-container-low rounded-full h-3 p-0.5 border border-white/5 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        {/* Status Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="bg-surface-container/60 p-3.5 rounded-xl border border-white/5">
            <span className="text-xs font-label-bold text-on-surface-variant/80 uppercase tracking-wider">Estimated Weeks Left</span>
            <h4 className="font-headline-md font-bold text-on-surface text-base mt-0.5">
              {selectedModule.weeklyHours > 0 ? Math.ceil(remainingHours / selectedModule.weeklyHours) : 0} Weeks
            </h4>
          </div>

          <div className="bg-surface-container/60 p-3.5 rounded-xl border border-white/5">
            <span className="text-xs font-label-bold text-on-surface-variant/80 uppercase tracking-wider">Primary Venue</span>
            <h4 className="font-headline-md font-bold text-on-surface text-base mt-0.5">{selectedModule.venue}</h4>
          </div>

          <div className="bg-surface-container/60 p-3.5 rounded-xl border border-white/5">
            <span className="text-xs font-label-bold text-on-surface-variant/80 uppercase tracking-wider">Course Status</span>
            <h4 className={`font-headline-md font-bold text-base mt-0.5 ${percentage >= 80 ? 'text-secondary' : 'text-primary'}`}>
              {percentage >= 100 ? 'Completed' : percentage >= 50 ? 'On Track' : 'In Progress'}
            </h4>
          </div>
        </div>
      </div>

      {/* Rescheduled Sessions Panel */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-3.5 border-white/5">
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <div>
            <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">update</span>
              Rescheduled Sessions
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Recorded rescheduled lecture slots for {selectedModule.code}</p>
          </div>
          <span className="font-label-bold text-xs text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            {rescheduledSessions.length} Rescheduled
          </span>
        </div>

        {rescheduledSessions.length === 0 ? (
          <div className="p-4 text-center text-on-surface-variant text-xs">
            No rescheduled lecture slots recorded for {selectedModule.code}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rescheduledSessions.map((session, index) => (
              <div
                key={index}
                className="bg-surface-container/70 border border-primary/20 hover:border-primary/40 bg-primary/5 rounded-xl p-4 flex flex-col justify-between gap-2.5 transition-all shadow-md"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">update</span>
                    <h4 className="font-headline-md font-bold text-on-surface text-sm">{session.date}</h4>
                  </div>
                  <span className="font-label-bold text-xs px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                    🔄 Rescheduled
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs pt-2 border-t border-white/5">
                  {session.time && (
                    <span className="flex items-center gap-1 text-primary font-label-bold">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {session.time}
                    </span>
                  )}
                  {session.venue && (
                    <span className="flex items-center gap-1 text-on-surface-variant font-label-bold">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      Venue: <strong className="text-on-surface">{session.venue}</strong>
                    </span>
                  )}
                </div>

                {session.reason && (
                  <div className="pt-2 border-t border-white/5 text-xs">
                    <p className="text-on-surface-variant italic font-body-md">"{session.reason}"</p>
                  </div>
                )}

                {isAdmin && (
                  <div className="pt-2.5 border-t border-white/5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleUncancelSession(session.date, selectedModule.code)}
                      className="px-2.5 py-1 rounded bg-secondary/15 text-secondary border border-secondary/30 text-xs font-label-bold hover:bg-secondary/25 cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">undo</span> Un-cancel / Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecancelSession(session.date, selectedModule.code, session.reason)}
                      className="px-2.5 py-1 rounded bg-error/15 text-error border border-error/30 text-xs font-label-bold hover:bg-error/25 cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">edit_note</span> Re-cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Canceled Sessions Panel */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-3.5 border-error/20 bg-error/5">
        <div className="flex justify-between items-center pb-3 border-b border-error/10">
          <div>
            <h3 className="font-headline-md text-base sm:text-lg font-bold text-error flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-xl">event_busy</span>
              Canceled Sessions
            </h3>
            <p className="text-xs text-error/80 mt-0.5">Recorded cancellations for {selectedModule.code}</p>
          </div>
          <span className="font-label-bold text-xs text-error bg-error/10 px-3 py-1 rounded-full border border-error/20">
            {canceledSessions.length} Canceled
          </span>
        </div>

        {canceledSessions.length === 0 ? (
          <div className="p-4 text-center text-on-surface-variant text-xs">
            No canceled sessions recorded for {selectedModule.code}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {canceledSessions.map((session, index) => (
              <div
                key={index}
                className="bg-surface-container/70 border border-error/20 hover:border-error/40 bg-error/5 rounded-xl p-4 flex flex-col justify-between gap-2.5 transition-all shadow-md"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-error text-base">event_busy</span>
                    <h4 className="font-headline-md font-bold text-on-surface text-sm">{session.date}</h4>
                  </div>
                  <span className="font-label-bold text-xs px-2.5 py-0.5 rounded-full bg-error/10 text-error border border-error/20">
                    Canceled
                  </span>
                </div>

                {session.reason && (
                  <div className="pt-2 border-t border-white/5 text-xs">
                    <p className="text-on-surface-variant italic font-body-md">"{session.reason}"</p>
                  </div>
                )}

                {isAdmin && (
                  <div className="pt-2.5 border-t border-white/5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleUncancelSession(session.date, selectedModule.code)}
                      className="px-2.5 py-1 rounded bg-secondary/15 text-secondary border border-secondary/30 text-xs font-label-bold hover:bg-secondary/25 cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">undo</span> Un-cancel / Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecancelSession(session.date, selectedModule.code, session.reason)}
                      className="px-2.5 py-1 rounded bg-error/15 text-error border border-error/30 text-xs font-label-bold hover:bg-error/25 cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">edit_note</span> Re-cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ModulePage;
