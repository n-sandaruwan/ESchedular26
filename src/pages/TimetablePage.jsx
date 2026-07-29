import React, { useState } from 'react';
import { weeklyTimetable } from '../data/timetableData';
import { exportSemesterScheduleCSV } from '../data/scheduleStore';

function TimetablePage() {
  const days = [
    { fullName: 'Monday', short: 'Mon', key: 'Monday' },
    { fullName: 'Tuesday', short: 'Tue', key: 'Tuesday' },
    { fullName: 'Wednesday', short: 'Wed', key: 'Wednesday' },
    { fullName: 'Thursday', short: 'Thu', key: 'Thursday' },
    { fullName: 'Friday', short: 'Fri', key: 'Friday' }
  ];

  // Determine current day of week to default active tab
  const getTodayDayName = () => {
    const d = new Date().getDay();
    const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const current = dayMap[d];
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(current) ? current : 'Monday';
  };

  const [activeDay, setActiveDay] = useState(getTodayDayName());
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week'

  const defaultTimetable = weeklyTimetable;

  const getTypeBadgeClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'lecture': return 'bg-electric-blue/15 text-electric-blue border-electric-blue/30';
      case 'practical': case 'lab': return 'bg-emerald-glow/15 text-emerald-glow border-emerald-glow/30';
      case 'tutorial': return 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30';
      default: return 'bg-coral-vibe/15 text-coral-vibe border-coral-vibe/30';
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <span className="font-label-mono text-[10px] sm:text-xs text-electric-blue bg-electric-blue/10 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
            Semester 3 Schedule
          </span>
          <h1 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface mt-1">Master Timetable</h1>
          <p className="text-on-surface-variant text-xs sm:text-sm mt-0.5">Mobile-optimized weekly timetable for Engineering students.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Download Full Schedule Button */}
          <button
            onClick={exportSemesterScheduleCSV}
            className="btn-electric px-3.5 py-2 rounded-lg text-xs font-bold font-label-mono flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(0,212,255,0.3)] hover:scale-105 transition-all"
            title="Download full semester schedule with live reschedules & cancellations"
          >
            <span className="material-symbols-outlined text-sm">download</span> Download Live Schedule (.csv)
          </button>

          {/* View Mode Switcher (Day vs Full Week) */}
          <div className="flex items-center bg-surface-container-lowest p-1 rounded-lg border border-glass-stroke">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-md text-xs font-label-mono font-bold transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-electric-blue text-slate-900 shadow-[0_0_10px_rgba(0,212,255,0.4)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-md text-xs font-label-mono font-bold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-electric-blue text-slate-900 shadow-[0_0_10px_rgba(0,212,255,0.4)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Full Week
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'day' ? (
        <>
          {/* Mobile-First Segmented Day Pills */}
          <div className="glass-panel p-1.5 rounded-xl border border-glass-stroke flex items-center justify-between gap-1 overflow-x-auto">
            {days.map((d) => {
              const isActive = activeDay === d.key;
              const isToday = getTodayDayName() === d.key;
              const slotCount = defaultTimetable[d.key]?.length || 0;

              return (
                <button
                  key={d.key}
                  onClick={() => setActiveDay(d.key)}
                  className={`flex-1 min-w-[64px] py-2.5 px-2 rounded-lg transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-0.5 relative ${
                    isActive
                      ? 'bg-electric-blue text-slate-900 font-bold shadow-[0_0_12px_rgba(0,212,255,0.5)]'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-body-md text-xs font-bold">{d.short}</span>
                    {isToday && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-slate-900' : 'bg-emerald-glow animate-pulse'}`}></span>
                    )}
                  </div>
                  <span className={`font-label-mono text-[9px] ${isActive ? 'text-slate-800 font-bold' : 'text-on-surface-variant/70'}`}>
                    {slotCount} Class{slotCount > 1 ? 'es' : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Daily Schedule Cards View */}
          <div className="glass-panel rounded-xl p-4 sm:p-6 flex flex-col gap-3.5">
            <div className="flex justify-between items-center pb-3 border-b border-glass-stroke">
              <h3 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-blue">event_note</span>
                {activeDay}'s Schedule
              </h3>
              <span className="text-xs font-label-mono text-electric-blue bg-electric-blue/10 px-2.5 py-1 rounded border border-electric-blue/30 font-semibold">
                {defaultTimetable[activeDay]?.length} Sessions
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {defaultTimetable[activeDay]?.map((slot, index) => (
                <div
                  key={index}
                  className="bg-surface-container/60 border border-glass-stroke hover:border-electric-blue/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-surface-container-lowest px-3 py-2 rounded-lg border border-glass-stroke text-center min-w-[110px]">
                      <span className="font-label-mono text-xs font-bold text-electric-blue flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {slot.time}
                      </span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-body-md font-bold text-on-surface text-base">{slot.module}</h4>
                        <span className={`text-[10px] font-label-mono px-2 py-0.5 rounded border ${getTypeBadgeClass(slot.type)}`}>
                          {slot.type}
                        </span>
                      </div>
                      <p className="text-on-surface-variant text-xs mt-0.5 font-medium">{slot.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-on-surface-variant border-t sm:border-t-0 border-glass-stroke pt-2 sm:pt-0">
                    <div className="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1 rounded border border-glass-stroke">
                      <span className="material-symbols-outlined text-electric-blue text-xs">location_on</span>
                      <span className="font-label-mono text-xs font-bold text-on-surface">{slot.hall}</span>
                    </div>
                    {slot.instructor && (
                      <span className="text-xs text-on-surface-variant">{slot.instructor}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Full Week Mobile Accordion Timeline View */
        <div className="flex flex-col gap-4">
          {days.map((d) => (
            <div key={d.key} className="glass-panel rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center pb-2 border-b border-glass-stroke">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-electric-blue text-base">today</span>
                  <h3 className="font-headline-md text-base font-bold text-on-surface">{d.fullName}</h3>
                </div>
                <span className="font-label-mono text-xs text-emerald-glow bg-emerald-glow/10 px-2 py-0.5 rounded font-bold">
                  {defaultTimetable[d.key]?.length} Classes
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {defaultTimetable[d.key]?.map((slot, index) => (
                  <div key={index} className="bg-surface-container/50 p-3 rounded-lg border border-glass-stroke flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-mono text-xs text-electric-blue font-bold">{slot.time}</span>
                        <span className="font-body-md font-bold text-on-surface text-sm">{slot.module}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">{slot.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2.5 py-1 rounded border border-glass-stroke self-end sm:self-auto">
                      <span className="material-symbols-outlined text-xs text-electric-blue">location_on</span>
                      <span className="font-label-mono text-xs font-bold text-on-surface">{slot.hall}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TimetablePage;
