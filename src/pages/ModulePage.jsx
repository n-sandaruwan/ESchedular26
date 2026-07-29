import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStoredModuleHours, saveStoredModuleHours } from '../data/moduleHoursData';
import { weeklyTimetable } from '../data/timetableData';

function ModulePage() {
  const { moduleId } = useParams();
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
    const list = getStoredModuleHours();
    setModules(list);
    const match = list.find(m => m.code === moduleId) || list[0];
    setSelectedModule(match);
  }, [moduleId]);

  if (!selectedModule) {
    return <div className="p-8 text-center text-on-surface-variant">Loading module data...</div>;
  }

  const percentage = Math.min(100, Math.round((selectedModule.conductedHours / selectedModule.targetHours) * 100));
  const remainingHours = Math.max(0, selectedModule.targetHours - selectedModule.conductedHours);

  const handleAddHour = (amount) => {
    const updated = modules.map(m => {
      if (m.code === selectedModule.code) {
        const newConducted = Math.max(0, Math.min(m.targetHours, m.conductedHours + amount));
        return { ...m, conductedHours: newConducted };
      }
      return m;
    });
    setModules(updated);
    saveStoredModuleHours(updated);
    setSelectedModule({
      ...selectedModule,
      conductedHours: Math.max(0, Math.min(selectedModule.targetHours, selectedModule.conductedHours + amount))
    });
  };

  // Find all weekly timetable sessions for this module
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

  // Helper to get next upcoming date string for a given weekday name
  const getNextDateForDay = (dayName) => {
    const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    const targetDay = dayMap[dayName];
    const today = new Date();
    const currentDay = today.getDay();

    let distance = targetDay - currentDay;
    if (distance < 0) distance += 7;
    if (distance === 0 && today.getHours() >= 18) distance = 7; // past evening, next week

    const nextDate = new Date();
    nextDate.setDate(today.getDate() + distance);
    return nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner Navigation */}
      <div className="glass-panel p-6 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/" className="text-electric-blue text-sm flex items-center gap-1 mb-2 hover:underline">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-label-mono text-xs px-2.5 py-1 bg-electric-blue/15 text-electric-blue border border-electric-blue/30 rounded font-bold">
              {selectedModule.code}
            </span>
            <h1 className="font-display-lg text-2xl md:text-3xl font-bold text-on-surface">{selectedModule.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddHour(1)}
            className="btn-electric px-4 py-2 rounded-lg text-xs font-bold font-label-mono flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span> Log +1 Hour
          </button>
          <button
            onClick={() => handleAddHour(-1)}
            className="bg-surface-container-high border border-glass-stroke text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-lg text-xs font-bold font-label-mono cursor-pointer"
          >
            -1 Hour
          </button>
        </div>
      </div>

      {/* Progress Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Completed Hours */}
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-label-mono uppercase text-on-surface-variant">Conducted Hours</span>
            <h3 className="text-3xl font-bold text-emerald-glow mt-1">{selectedModule.conductedHours} hrs</h3>
            <p className="text-xs text-on-surface-variant mt-1">Logged by faculty</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-glow/10 border border-emerald-glow/30 flex items-center justify-center text-emerald-glow">
            <span className="material-symbols-outlined text-2xl">timelapse</span>
          </div>
        </div>

        {/* Card 2: Target Hours */}
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-label-mono uppercase text-on-surface-variant">Semester Target</span>
            <h3 className="text-3xl font-bold text-electric-blue mt-1">{selectedModule.targetHours} hrs</h3>
            <p className="text-xs text-on-surface-variant mt-1">Required total</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-electric-blue/10 border border-electric-blue/30 flex items-center justify-center text-electric-blue">
            <span className="material-symbols-outlined text-2xl">flag</span>
          </div>
        </div>

        {/* Card 3: Remaining Hours */}
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-label-mono uppercase text-on-surface-variant">Remaining Hours</span>
            <h3 className="text-3xl font-bold text-coral-vibe mt-1">{remainingHours} hrs</h3>
            <p className="text-xs text-on-surface-variant mt-1">Left in semester</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-coral-vibe/10 border border-coral-vibe/30 flex items-center justify-center text-coral-vibe">
            <span className="material-symbols-outlined text-2xl">hourglass_empty</span>
          </div>
        </div>

        {/* Card 4: Weekly Allocation */}
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-label-mono uppercase text-on-surface-variant">Weekly Allocation</span>
            <h3 className="text-3xl font-bold text-on-surface mt-1">{selectedModule.weeklyHours} hrs/wk</h3>
            <p className="text-xs text-on-surface-variant mt-1">Venue: {selectedModule.venue}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container border border-glass-stroke flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-2xl">calendar_view_week</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Details Panel */}
      <div className="glass-panel rounded-xl p-6 flex flex-col gap-6">
        <div className="flex justify-between items-center pb-4 border-b border-glass-stroke">
          <div>
            <h3 className="font-headline-md text-xl font-bold text-on-surface">Module Completion Status</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Real-time lecture hours completion rate for {selectedModule.code}</p>
          </div>
          <span className="font-label-mono text-2xl font-bold text-electric-blue">{percentage}%</span>
        </div>

        {/* Visual Glowing Progress Bar */}
        <div className="w-full bg-surface-container-lowest rounded-full h-4 p-1 border border-glass-stroke overflow-hidden relative">
          <div
            className="bg-gradient-to-r from-electric-blue to-emerald-glow h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(0,212,255,0.6)]"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        {/* Status Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-surface-container/50 p-4 rounded-lg border border-glass-stroke">
            <span className="text-xs font-label-mono text-on-surface-variant uppercase">Estimated Weeks Left</span>
            <h4 className="font-body-md font-bold text-on-surface text-lg mt-1">
              {selectedModule.weeklyHours > 0 ? Math.ceil(remainingHours / selectedModule.weeklyHours) : 0} Weeks
            </h4>
          </div>

          <div className="bg-surface-container/50 p-4 rounded-lg border border-glass-stroke">
            <span className="text-xs font-label-mono text-on-surface-variant uppercase">Primary Venue</span>
            <h4 className="font-body-md font-bold text-on-surface text-lg mt-1">{selectedModule.venue}</h4>
          </div>

          <div className="bg-surface-container/50 p-4 rounded-lg border border-glass-stroke">
            <span className="text-xs font-label-mono text-on-surface-variant uppercase">Course Status</span>
            <h4 className={`font-body-md font-bold text-lg mt-1 ${percentage >= 80 ? 'text-emerald-glow' : 'text-electric-blue'}`}>
              {percentage >= 100 ? 'Completed' : percentage >= 50 ? 'On Track' : 'In Progress'}
            </h4>
          </div>
        </div>
      </div>

      {/* Upcoming Lecture Times & Dates Panel */}
      <div className="glass-panel rounded-xl p-6 flex flex-col gap-5">
        <div className="flex justify-between items-center pb-4 border-b border-glass-stroke">
          <div>
            <h3 className="font-headline-md text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-electric-blue">event</span>
              Upcoming Lecture Times & Dates
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Scheduled weekly lecture slots & upcoming dates for {selectedModule.code}</p>
          </div>
          <span className="font-label-mono text-xs text-electric-blue bg-electric-blue/10 px-2.5 py-1 rounded border border-electric-blue/30 font-semibold">
            {moduleSessions.length} Session{moduleSessions.length > 1 ? 's' : ''} / Week
          </span>
        </div>

        {moduleSessions.length === 0 ? (
          <div className="p-6 text-center text-on-surface-variant text-sm">
            No scheduled recurring lecture slots found for this module.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moduleSessions.map((session, index) => {
              const nextDateStr = getNextDateForDay(session.day);
              return (
                <div
                  key={index}
                  className="bg-surface-container/60 border border-glass-stroke hover:border-electric-blue/40 rounded-xl p-4 flex flex-col justify-between gap-3 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-electric-blue">calendar_today</span>
                      <h4 className="font-body-md font-bold text-on-surface text-base">{session.day}</h4>
                    </div>
                    <span className="font-label-mono text-xs px-2.5 py-1 rounded bg-surface-container-high border border-glass-stroke text-emerald-glow font-bold">
                      Next: {nextDateStr}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-glass-stroke text-sm">
                    <div className="flex items-center gap-1.5 font-label-mono text-electric-blue">
                      <span className="material-symbols-outlined text-base">schedule</span>
                      <span>{session.time}</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1 rounded border border-glass-stroke">
                      <span className="material-symbols-outlined text-xs text-on-surface-variant">location_on</span>
                      <span className="text-xs font-semibold text-on-surface">{session.hall}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ModulePage;
