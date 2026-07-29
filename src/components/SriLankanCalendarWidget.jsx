import React, { useState } from 'react';
import { sriLankaHolidays2026, getHolidayForDate } from '../data/sriLankaHolidaysData';

function SriLankanCalendarWidget({ selectedDate, onSelectDate }) {
  // Initialized to July 2026 (Semester 3 start month)
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(6); // 0-indexed: 6 = July

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Generate calendar days for the current viewMonth & viewYear
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Shift start to Monday (0 = Mon, 6 = Sun)
  const startOffset = (firstDayOfMonth + 6) % 7;

  const daysArray = [];
  for (let i = 0; i < startOffset; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  // Get upcoming Sri Lankan holidays for list display
  const upcomingHolidays = sriLankaHolidays2026.filter(h => h.date >= '2026-07-27');

  return (
    <div className="glass-panel rounded-xl p-5 flex flex-col gap-4">
      <div className="flex justify-between items-center pb-3 border-b border-glass-stroke">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-coral-vibe">calendar_month</span>
          <h3 className="font-headline-md text-base font-bold text-on-surface">
            Calendar
          </h3>
        </div>

        {/* Month Switcher Controls */}
        <div className="flex items-center gap-1 bg-surface-container-lowest px-2 py-1 rounded-lg border border-glass-stroke">
          <button
            onClick={handlePrevMonth}
            className="text-on-surface-variant hover:text-on-surface p-0.5 cursor-pointer"
            title="Previous Month"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <span className="font-label-mono text-xs font-bold text-electric-blue min-w-[90px] text-center">
            {monthNames[viewMonth]} {viewYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="text-on-surface-variant hover:text-on-surface p-0.5 cursor-pointer"
            title="Next Month"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Grid Days Header */}
      <div className="grid grid-cols-7 gap-1 text-center font-label-mono text-[11px] text-on-surface-variant uppercase font-semibold">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span className="text-coral-vibe font-bold">Sat</span>
        <span className="text-coral-vibe font-bold">Sun</span>
      </div>

      {/* Grid Days Matrix */}
      <div className="grid grid-cols-7 gap-1.5 text-center font-label-mono text-xs">
        {daysArray.map((day, idx) => {
          if (!day) {
            return <div key={idx} className="h-9"></div>;
          }

          const mmStr = String(viewMonth + 1).padStart(2, '0');
          const ddStr = String(day).padStart(2, '0');
          const dateStr = `${viewYear}-${mmStr}-${ddStr}`;
          const isSelected = selectedDate === dateStr;
          const holiday = getHolidayForDate(dateStr);
          const todayDateStr = new Date().toISOString().split('T')[0];
          const isToday = dateStr === todayDateStr;
          const isPast = dateStr < todayDateStr;

          let dayStyle = 'bg-surface-container/40 border-glass-stroke text-on-surface hover:bg-surface-container-high';

          if (isSelected) {
            dayStyle = 'bg-electric-blue text-slate-900 font-bold border-electric-blue shadow-[0_0_12px_rgba(0,212,255,0.6)]';
          } else if (isToday) {
            dayStyle = 'bg-emerald-glow/20 border-emerald-glow text-emerald-glow font-bold ring-2 ring-emerald-glow/60 shadow-[0_0_12px_rgba(52,211,153,0.5)]';
          } else if (holiday) {
            dayStyle = 'bg-coral-vibe/15 border-coral-vibe/50 text-coral-vibe font-bold';
          } else if (isPast) {
            dayStyle = 'bg-surface-container-lowest/30 border-glass-stroke/40 text-on-surface-variant/40';
          }

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(dateStr)}
              title={holiday ? `${holiday.name} (${holiday.type})` : isPast ? `${dateStr} (Finished Day)` : dateStr}
              className={`h-9 rounded-lg flex flex-col items-center justify-center relative transition-all cursor-pointer border ${dayStyle}`}
            >
              <span className={isPast && !isSelected && !isToday ? 'line-through opacity-50 font-normal' : ''}>{day}</span>
              {holiday && (
                <span className="absolute -bottom-0.5 text-[9px] leading-none">
                  {holiday.icon}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sri Lanka Holidays List Feed */}
      <div className="mt-2 pt-3 border-t border-glass-stroke flex flex-col gap-2">
        <span className="text-[11px] font-label-mono uppercase text-on-surface-variant font-semibold flex items-center gap-1">
          <span className="material-symbols-outlined text-xs text-coral-vibe">event</span>
          Upcoming Holidays
        </span>
        <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
          {upcomingHolidays.map((h, i) => (
            <button
              key={i}
              onClick={() => onSelectDate(h.date)}
              className="flex items-center justify-between bg-surface-container-lowest p-2 rounded-lg border border-glass-stroke hover:border-coral-vibe/40 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{h.icon}</span>
                <div>
                  <h4 className="font-body-md font-bold text-on-surface text-xs">{h.name}</h4>
                  <span className="text-[10px] text-on-surface-variant font-label-mono">{h.type}</span>
                </div>
              </div>
              <span className="font-label-mono text-xs text-coral-vibe font-semibold">
                {h.date.split('-')[2]}/{h.date.split('-')[1]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SriLankanCalendarWidget;
