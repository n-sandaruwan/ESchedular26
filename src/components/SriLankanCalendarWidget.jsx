import React, { useState } from 'react';
import { getSriLankaDateStr } from '../utils/dateUtils';
import { sriLankaHolidays2026, getHolidayForDate } from '../data/sriLankaHolidaysData';

function SriLankanCalendarWidget({ selectedDate, onSelectDate }) {
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(6);

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

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const startOffset = (firstDayOfMonth + 6) % 7;

  const daysArray = [];
  for (let i = 0; i < startOffset; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const upcomingHolidays = sriLankaHolidays2026.filter(h => h.date >= '2026-07-27');

  return (
    <div className="glass-card rounded-xl p-stack-md flex flex-col gap-4 overflow-hidden relative">
      <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-tertiary/10 blur-[40px] rounded-full"></div>
      
      <div className="flex justify-between items-center pb-3 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">brightness_3</span>
          <h3 className="font-label-bold text-label-bold text-on-surface uppercase tracking-widest text-xs">
            Calendar
          </h3>
        </div>

        {/* Month Switcher Controls */}
        <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg border border-white/5">
          <button
            onClick={handlePrevMonth}
            className="text-on-surface-variant hover:text-on-surface p-0.5 cursor-pointer"
            title="Previous Month"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <span className="font-label-mono text-xs font-bold text-primary min-w-[90px] text-center">
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
      <div className="grid grid-cols-7 gap-1 text-center font-label-mono text-[11px] text-on-surface-variant uppercase font-bold relative z-10">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span className="text-tertiary">Sat</span>
        <span className="text-tertiary">Sun</span>
      </div>

      {/* Grid Days Matrix */}
      <div className="grid grid-cols-7 gap-1.5 text-center font-label-mono text-xs relative z-10">
        {daysArray.map((day, idx) => {
          if (!day) {
            return <div key={idx} className="h-9"></div>;
          }

          const mmStr = String(viewMonth + 1).padStart(2, '0');
          const ddStr = String(day).padStart(2, '0');
          const dateStr = `${viewYear}-${mmStr}-${ddStr}`;
          const isSelected = selectedDate === dateStr;
          const holiday = getHolidayForDate(dateStr);
          const todayDateStr = getSriLankaDateStr();
          const isToday = dateStr === todayDateStr;
          const isPast = dateStr < todayDateStr;

          let dayStyle = 'bg-surface-container/40 border-white/5 text-on-surface hover:bg-surface-container';

          if (isSelected) {
            dayStyle = 'bg-primary text-on-primary font-bold border-primary shadow-[0_0_12px_rgba(56,189,248,0.6)]';
          } else if (isToday) {
            dayStyle = 'bg-secondary/20 border-secondary text-secondary font-bold ring-1 ring-secondary/60 shadow-[0_0_10px_rgba(78,222,163,0.4)]';
          } else if (holiday) {
            dayStyle = 'poya-badge font-bold';
          } else if (isPast) {
            dayStyle = 'bg-surface-container-low/30 border-white/5 text-on-surface-variant/40';
          }

          return (
            <button
              key={idx}
              onClick={() => onSelectDate && onSelectDate(dateStr)}
              title={holiday ? `${holiday.name} (${holiday.type})` : isPast ? `${dateStr} (Past Day)` : dateStr}
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
      <div className="mt-2 pt-3 border-t border-white/5 flex flex-col gap-2 relative z-10">
        <span className="text-[11px] font-label-bold uppercase text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-xs text-tertiary">event</span>
          Upcoming Holidays
        </span>
        <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
          {upcomingHolidays.map((h, i) => (
            <button
              key={i}
              onClick={() => onSelectDate && onSelectDate(h.date)}
              className="flex items-center justify-between bg-surface-container-low p-2 rounded-xl border border-white/5 hover:border-tertiary/40 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{h.icon}</span>
                <div>
                  <h4 className="font-headline-md font-bold text-on-surface text-xs">{h.name}</h4>
                  <span className="text-[10px] text-on-surface-variant font-label-mono">{h.type}</span>
                </div>
              </div>
              <span className="font-label-mono text-xs text-tertiary font-bold">
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
