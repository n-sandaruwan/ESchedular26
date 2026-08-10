import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStoredModuleHours, saveStoredModuleHours } from '../data/moduleHoursData';
import { weeklyTimetable } from '../data/timetableData';
import { getStoredAssessments, toggleAssessmentStatus, addAssessment, removeAssessment } from '../data/assessmentData';
import { getStoredOverrides } from '../data/scheduleStore';
import { getSriLankaDateObj } from '../utils/dateUtils';

function ModulePage() {
  const { moduleId } = useParams();
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [canceledSessions, setCanceledSessions] = useState([]);

  useEffect(() => {
    const list = getStoredModuleHours();
    setModules(list);
    const targetCode = (moduleId || '').trim().toUpperCase();
    const match = list.find(m => (m.code || '').toUpperCase() === targetCode) || list[0];
    setSelectedModule(match);
    setAssessments(getStoredAssessments());
    
    const overrides = getStoredOverrides();
    const canceled = overrides
      .filter(o => (o.module || '').toUpperCase() === (match?.code || targetCode) && o.status === 'Canceled')
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    setCanceledSessions(canceled);
  }, [moduleId]);

  const role = localStorage.getItem('mis_role');
  const isAdmin = role === 'admin';

  if (!selectedModule) {
    return <div className="p-8 text-center text-on-surface-variant text-sm">Loading module data...</div>;
  }

  const targetHours = selectedModule.targetHours || 45;
  const conductedHours = selectedModule.conductedHours || 0;
  const weeklyHours = selectedModule.weeklyHours || 2;
  const percentage = Math.min(100, Math.round((conductedHours / targetHours) * 100));
  const remainingHours = Math.max(0, targetHours - conductedHours);

  const handleAddHour = (amount) => {
    const updated = modules.map(m => {
      if (m.code === selectedModule.code) {
        const newConducted = Math.max(0, Math.min(m.targetHours || 45, Math.round(((m.conductedHours || 0) + amount) * 10) / 10));
        return { ...m, conductedHours: newConducted };
      }
      return m;
    });
    setModules(updated);
    saveStoredModuleHours(updated);
    setSelectedModule({
      ...selectedModule,
      conductedHours: Math.max(0, Math.min(targetHours, Math.round((conductedHours + amount) * 10) / 10))
    });
  };

  const handleStatusToggle = (id, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'Scheduled' : 'Completed';
    const updated = toggleAssessmentStatus(id, nextStatus);
    setAssessments(updated);
  };

  // CA Tracker: Add Assessment Modal state
  const [addModal, setAddModal] = useState({ isOpen: false });
  const [newCA, setNewCA] = useState({ title: '', type: 'Continuous Assessment', date: '', time: '', venue: '', weight: '', notes: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, title: '' });

  const handleAddCA = (e) => {
    e.preventDefault();
    if (!newCA.title.trim()) return;
    const updated = addAssessment({ ...newCA, moduleCode: selectedModule.code });
    setAssessments(updated);
    setNewCA({ title: '', type: 'Continuous Assessment', date: '', time: '', venue: '', weight: '', notes: '' });
    setAddModal({ isOpen: false });
  };

  const handleDeleteCA = (id) => {
    const updated = removeAssessment(id);
    setAssessments(updated);
    setDeleteConfirm({ isOpen: false, id: null, title: '' });
  };

  const currentCode = (selectedModule?.code || '').toUpperCase();
  const allModuleAssessments = (assessments || []).filter(a => (a.moduleCode || '').toUpperCase() === currentCode);
  // Students only see Scheduled items; admins see everything
  const moduleAssessments = isAdmin
    ? allModuleAssessments
    : allModuleAssessments.filter(a => a.status === 'Scheduled');

  const getModuleSessions = () => {
    const sessions = [];
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    daysOrder.forEach(day => {
      const slots = weeklyTimetable[day] || [];
      slots.forEach(slot => {
        if ((slot.module || '').toUpperCase() === currentCode) {
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
              {Array.isArray(selectedModule.teachers) && selectedModule.teachers.length > 0 ? (
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
            <h4 className="font-headline-md font-bold text-on-surface text-base">Venue: {selectedModule.venue || 'TBA'}</h4>
            <p className="text-xs sm:text-sm text-on-surface-variant/80">Allocation: {weeklyHours} hrs / week</p>
          </div>
        </div>
      </div>

      {/* Assessment & Marks Evaluation Scheme Card */}
      {Array.isArray(selectedModule.gradingScheme) && selectedModule.gradingScheme.length > 0 && (
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
                  {Array.isArray(cat.components) && cat.components.map((comp, cIdx) => (
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

      {/* Necessary Conditions to Pass the Module */}
      {Array.isArray(selectedModule.passingConditions) && selectedModule.passingConditions.length > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border-white/5 space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-lg">verified</span> Necessary Conditions to Pass
            </h3>
            <span className="font-label-bold text-xs sm:text-sm text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 font-label-mono">
              Must Meet All
            </span>
          </div>

          <div className="space-y-2">
            {selectedModule.passingConditions.map((condition, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-surface-container/60 rounded-xl border border-white/5">
                <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-amber-400 font-label-bold text-[10px]">{idx + 1}</span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface leading-relaxed font-medium">{condition}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ═══ CA Tracker ═══ */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border-white/5 space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div>
            <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">assignment</span> CA Tracker
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              {isAdmin ? 'Schedule, track and mark assessments for this module.' : 'Upcoming assessments and exams for this module.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-label-bold text-xs sm:text-sm text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              {moduleAssessments.length} {isAdmin ? 'Total' : 'Upcoming'}
            </span>
            {isAdmin && (
              <button
                onClick={() => setAddModal({ isOpen: true })}
                className="btn-electric px-3 py-1.5 rounded-xl text-xs font-label-bold flex items-center gap-1 cursor-pointer shadow-[0_0_12px_rgba(56,189,248,0.3)]"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span> Schedule
              </button>
            )}
          </div>
        </div>

        {moduleAssessments.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">event_available</span>
            <p className="text-on-surface-variant text-xs sm:text-sm font-medium">
              {isAdmin ? 'No assessments scheduled yet. Click "Schedule" above to add one.' : 'No upcoming assessments for this module.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {moduleAssessments.map((item) => {
              const isCompleted = item.status === 'Completed';
              const isScheduled = item.status === 'Scheduled';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 relative overflow-hidden ${
                    isCompleted
                      ? 'bg-secondary/5 border-secondary/20'
                      : isScheduled
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-surface-container/60 border-white/5'
                  }`}
                >
                  {/* Left accent bar */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${isCompleted ? 'bg-secondary' : 'bg-primary'}`}></div>

                  <div className="space-y-2 pl-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-label-bold text-xs px-2.5 py-0.5 rounded-md bg-surface-container border border-white/10 text-on-surface-variant">
                        {item.type}{item.weight ? ` • ${item.weight}` : ''}
                      </span>

                      {/* Status Badge */}
                      <span className={`font-label-bold text-xs px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-secondary/15 text-secondary border-secondary/30 shadow-[0_0_8px_rgba(78,222,163,0.3)]'
                          : isScheduled
                          ? 'bg-primary/15 text-primary border-primary/30'
                          : 'bg-tertiary/15 text-tertiary border-tertiary/30'
                      }`}>
                        <span className="material-symbols-outlined text-xs">
                          {isCompleted ? 'check_circle' : isScheduled ? 'schedule' : 'hourglass_top'}
                        </span>
                        <span>{item.status}</span>
                      </span>
                    </div>

                    <h4 className="font-headline-md font-bold text-on-surface text-sm sm:text-base leading-snug">
                      {item.title}
                    </h4>

                    <div className="space-y-1 text-xs sm:text-sm text-on-surface-variant pt-1">
                      {item.date && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-primary">event</span>
                          <span className="font-label-mono text-on-surface">{item.date}{item.time ? ` (${item.time})` : ''}</span>
                        </div>
                      )}
                      {item.venue && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                          <span>Venue: <b className="text-on-surface">{item.venue}</b></span>
                        </div>
                      )}
                      {item.notes && (
                        <p className="text-xs text-on-surface-variant/80 italic pt-1 border-t border-white/5">
                          📌 {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs pl-1">
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, id: item.id, title: item.title })}
                        className="text-xs text-error/70 hover:text-error font-label-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">delete</span> Remove
                      </button>
                      <button
                        onClick={() => handleStatusToggle(item.id, item.status)}
                        className={`text-xs font-label-bold px-3 py-1 rounded-lg border cursor-pointer transition-all active:scale-95 ${
                          isCompleted
                            ? 'text-on-surface-variant border-white/10 hover:bg-white/5'
                            : 'text-secondary bg-secondary/10 border-secondary/20 hover:bg-secondary/20 shadow-[0_0_8px_rgba(78,222,163,0.15)]'
                        }`}
                      >
                        {isCompleted ? '↩ Mark Scheduled' : '✓ Mark Completed'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Add Assessment Modal (Admin) ═══ */}
      {addModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-surface-container border border-primary/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border-t-4 border-t-primary">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md font-bold text-on-surface text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_task</span> Schedule Assessment
              </h3>
              <button onClick={() => setAddModal({ isOpen: false })} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">Adding assessment for <b className="text-primary">{selectedModule.code} — {selectedModule.title}</b></p>

            <form onSubmit={handleAddCA} className="space-y-3">
              <div>
                <label className="text-xs font-label-bold text-on-surface-variant uppercase tracking-wider block mb-1">Title *</label>
                <input type="text" value={newCA.title} onChange={(e) => setNewCA({...newCA, title: e.target.value})} required placeholder="e.g. In-Class Test 1" className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded-xl text-on-surface text-sm placeholder-on-surface-variant/40 focus:outline-none focus:border-primary" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-label-bold text-on-surface-variant uppercase tracking-wider block mb-1">Type</label>
                  <select value={newCA.type} onChange={(e) => setNewCA({...newCA, type: e.target.value})} className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary cursor-pointer">
                    <option value="Continuous Assessment">Continuous Assessment</option>
                    <option value="In-Class Test">In-Class Test</option>
                    <option value="Take Home Assignment">Take Home Assignment</option>
                    <option value="Mini Project">Mini Project</option>
                    <option value="Lab Assessment">Lab Assessment</option>
                    <option value="End Semester Exam">End Semester Exam</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-label-bold text-on-surface-variant uppercase tracking-wider block mb-1">Weight</label>
                  <input type="text" value={newCA.weight} onChange={(e) => setNewCA({...newCA, weight: e.target.value})} placeholder="e.g. 20%" className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded-xl text-on-surface text-sm placeholder-on-surface-variant/40 focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-label-bold text-on-surface-variant uppercase tracking-wider block mb-1">Date</label>
                  <input type="date" value={newCA.date} onChange={(e) => setNewCA({...newCA, date: e.target.value})} className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-label-bold text-on-surface-variant uppercase tracking-wider block mb-1">Time</label>
                  <input type="text" value={newCA.time} onChange={(e) => setNewCA({...newCA, time: e.target.value})} placeholder="e.g. 10:30 AM" className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded-xl text-on-surface text-sm placeholder-on-surface-variant/40 focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="text-xs font-label-bold text-on-surface-variant uppercase tracking-wider block mb-1">Venue</label>
                <input type="text" value={newCA.venue} onChange={(e) => setNewCA({...newCA, venue: e.target.value})} placeholder="e.g. NCC / LT1" className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded-xl text-on-surface text-sm placeholder-on-surface-variant/40 focus:outline-none focus:border-primary" />
              </div>

              <div>
                <label className="text-xs font-label-bold text-on-surface-variant uppercase tracking-wider block mb-1">Notes (optional)</label>
                <input type="text" value={newCA.notes} onChange={(e) => setNewCA({...newCA, notes: e.target.value})} placeholder="Additional details..." className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded-xl text-on-surface text-sm placeholder-on-surface-variant/40 focus:outline-none focus:border-primary" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setAddModal({ isOpen: false })} className="px-5 py-2.5 rounded-xl border border-white/10 text-on-surface hover:bg-white/5 text-xs font-label-bold cursor-pointer">Cancel</button>
                <button type="submit" className="btn-electric px-6 py-2.5 rounded-xl text-xs font-label-bold shadow-lg cursor-pointer flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">add_task</span> Schedule Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Delete Confirmation Modal ═══ */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-surface-container border border-error/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center border-t-4 border-t-error">
            <div className="w-14 h-14 rounded-full bg-error/15 border border-error/30 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>
            <h3 className="font-headline-md font-bold text-on-surface text-lg">Remove Assessment?</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Are you sure you want to permanently delete <b className="text-error">"{deleteConfirm.title}"</b>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={() => setDeleteConfirm({ isOpen: false, id: null, title: '' })} className="px-5 py-2.5 rounded-xl border border-white/10 text-on-surface hover:bg-white/5 text-xs font-label-bold cursor-pointer">Cancel</button>
              <button onClick={() => handleDeleteCA(deleteConfirm.id)} className="px-6 py-2.5 rounded-xl bg-error text-on-error text-xs font-label-bold shadow-lg cursor-pointer flex items-center gap-1.5 hover:bg-error/90">
                <span className="material-symbols-outlined text-sm">delete</span> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Card 1: Completed Hours */}
        <div className="glass-card p-3.5 rounded-xl flex items-center justify-between border-white/5">
          <div>
            <span className="text-xs font-label-bold uppercase text-on-surface-variant/80 tracking-wider">Conducted</span>
            <h3 className="text-xl sm:text-2xl font-bold text-secondary mt-0.5">{conductedHours} hrs</h3>
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
            <h3 className="text-xl sm:text-2xl font-bold text-primary mt-0.5">{targetHours} hrs</h3>
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
            <h3 className="text-xl sm:text-2xl font-bold text-on-surface mt-0.5">{weeklyHours} hrs/wk</h3>
            <p className="text-xs text-on-surface-variant/70 truncate">Venue: {selectedModule.venue || 'TBA'}</p>
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
              {weeklyHours > 0 ? Math.ceil(remainingHours / weeklyHours) : 0} Weeks
            </h4>
          </div>

          <div className="bg-surface-container/60 p-3.5 rounded-xl border border-white/5">
            <span className="text-xs font-label-bold text-on-surface-variant/80 uppercase tracking-wider">Primary Venue</span>
            <h4 className="font-headline-md font-bold text-on-surface text-base mt-0.5">{selectedModule.venue || 'TBA'}</h4>
          </div>

          <div className="bg-surface-container/60 p-3.5 rounded-xl border border-white/5">
            <span className="text-xs font-label-bold text-on-surface-variant/80 uppercase tracking-wider">Course Status</span>
            <h4 className={`font-headline-md font-bold text-base mt-0.5 ${percentage >= 80 ? 'text-secondary' : 'text-primary'}`}>
              {percentage >= 100 ? 'Completed' : percentage >= 50 ? 'On Track' : 'In Progress'}
            </h4>
          </div>
        </div>
      </div>

      {/* Upcoming Lecture Times & Dates Panel */}
      <div className="glass-card rounded-2xl p-4 space-y-3 border-white/5">
        <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
          <div>
            <h3 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">event</span>
              Upcoming Lecture Times & Dates
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Scheduled weekly lecture slots for {selectedModule.code}</p>
          </div>
          <span className="font-label-bold text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
            {moduleSessions.length} Session{moduleSessions.length > 1 ? 's' : ''} / Week
          </span>
        </div>

        {moduleSessions.length === 0 ? (
          <div className="p-4 text-center text-on-surface-variant text-xs">
            No scheduled recurring lecture slots found for this module.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {moduleSessions.map((session, index) => {
              const nextDateStr = getNextDateForDay(session.day);
              return (
                <div
                  key={index}
                  className="bg-surface-container/60 border border-white/5 hover:border-primary/40 rounded-xl p-3.5 flex flex-col justify-between gap-2 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
                      <h4 className="font-headline-md font-bold text-on-surface text-sm">{session.day}</h4>
                    </div>
                    <span className="font-label-bold text-xs px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                      Next: {nextDateStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
                    <div className="flex items-center gap-1.5 font-label-bold text-primary">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      <span>{session.time}</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-0.5 rounded-lg border border-white/5">
                      <span className="material-symbols-outlined text-xs text-on-surface-variant">location_on</span>
                      <span className="font-label-bold text-on-surface text-xs">{session.hall}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Canceled Sessions Panel */}
      {canceledSessions.length > 0 && (
        <div className="glass-card rounded-2xl p-4 space-y-3 border-error/20 bg-error/5">
          <div className="flex justify-between items-center pb-2.5 border-b border-error/10">
            <div>
              <h3 className="font-headline-md text-base font-bold text-error flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-base">event_busy</span>
                Canceled Sessions
              </h3>
              <p className="text-xs text-error/80 mt-0.5">Recorded cancellations for this module</p>
            </div>
            <span className="font-label-bold text-xs text-error bg-error/10 px-2.5 py-0.5 rounded-full border border-error/20">
              {canceledSessions.length} Canceled
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {canceledSessions.map((session, index) => (
              <div
                key={index}
                className="bg-surface-container/80 border border-error/10 hover:border-error/30 rounded-xl p-3.5 flex flex-col justify-between gap-2 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-error text-sm">event_busy</span>
                    <h4 className="font-headline-md font-bold text-on-surface text-sm">{session.date}</h4>
                  </div>
                  <span className="font-label-bold text-xs px-2.5 py-0.5 rounded-full bg-error/10 text-error border border-error/20">
                    Canceled
                  </span>
                </div>

                {session.reason && (
                  <div className="pt-2 border-t border-white/5 text-xs">
                    <p className="text-on-surface-variant italic">"{session.reason}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModulePage;
