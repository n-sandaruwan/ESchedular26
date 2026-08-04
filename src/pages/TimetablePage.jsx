import React, { useState } from 'react';
import { weeklyTimetable } from '../data/timetableData';
import { getSriLankaDateObj } from '../utils/dateUtils';

function TimetablePage() {
  const days = [
    { fullName: 'Monday', short: 'Mon', key: 'Monday' },
    { fullName: 'Tuesday', short: 'Tue', key: 'Tuesday' },
    { fullName: 'Wednesday', short: 'Wed', key: 'Wednesday' },
    { fullName: 'Thursday', short: 'Thu', key: 'Thursday' },
    { fullName: 'Friday', short: 'Fri', key: 'Friday' }
  ];

  const getTodayDayName = () => {
    const d = getSriLankaDateObj().getDay();
    const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const current = dayMap[d];
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(current) ? current : 'Monday';
  };

  const [activeDay, setActiveDay] = useState(getTodayDayName());
  const [selectedModule, setSelectedModule] = useState('All');
  const [selectedHall, setSelectedHall] = useState('All');

  const activeDayIndex = days.findIndex(d => d.key === activeDay);

  const defaultTimetable = weeklyTimetable;

  const handleDirectDownloadPDF = () => {
    const link = document.createElement('a');
    link.href = './TimeTable-Elec.pdf';
    link.download = 'TimeTable-Elec.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter slots by selected dropdown criteria
  const daySlots = (defaultTimetable[activeDay] || []).filter((slot) => {
    if (selectedModule !== 'All' && !slot.module.toLowerCase().includes(selectedModule.toLowerCase())) return false;
    if (selectedHall !== 'All' && !slot.hall.toLowerCase().includes(selectedHall.toLowerCase())) return false;
    return true;
  });

  // Split into morning and afternoon for lunch break divider placement
  const morningSlots = daySlots.filter(s => (s.startMin || 0) < 720);
  const afternoonSlots = daySlots.filter(s => (s.startMin || 0) >= 720);

  const renderSlotCard = (slot, index) => {
    const now = getSriLankaDateObj();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const isToday = getTodayDayName() === activeDay;
    const startMin = slot.startMin || 510;
    const endMin = slot.endMin || 630;

    let status = slot.status || 'Scheduled';
    if (isToday) {
      if (nowMin > endMin) status = 'Conducted';
      else if (nowMin >= startMin && nowMin <= endMin) status = 'Ongoing';
      else status = 'Upcoming';
    }

    const isOngoing = status === 'Ongoing';
    const isUpcoming = status === 'Upcoming';

    // Time formatting
    const [startTimeStr, endTimeStr] = slot.time.split(' - ');

    return (
      <div key={index} className="lecture-item mb-3 relative">
        {/* Timeline Node */}
        {isOngoing ? (
          <div className="absolute -left-[30px] top-6 w-4 h-4 bg-secondary rounded-full border-4 border-surface z-10 shadow-[0_0_15px_rgba(78,222,163,0.8)] animate-pulse"></div>
        ) : isUpcoming ? (
          <div className="absolute -left-[30px] top-6 w-4 h-4 bg-surface rounded-full border-2 border-primary z-10 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          </div>
        ) : (
          <div className="absolute -left-[30px] top-6 w-4 h-4 bg-surface-container border-2 border-outline-variant rounded-full z-10"></div>
        )}

        {/* Glass Card */}
        <div className={`rounded-2xl p-5 border transition-all ${
          isOngoing ? 'glass-card ongoing-glow border-secondary/30' : 'glass-card border-white/5 hover:bg-white/5'
        }`}>
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-0.5">
              <p className={`font-label-bold text-label-bold ${isOngoing ? 'text-secondary' : 'text-primary'}`}>
                {startTimeStr}
              </p>
              <p className="text-on-surface-variant/60 text-label-sm">{endTimeStr}</p>
            </div>

            <span className={`px-3 py-1 rounded-full font-label-bold text-[10px] uppercase tracking-wider border ${
              isOngoing
                ? 'bg-secondary-container/20 text-secondary border-secondary/30'
                : isUpcoming
                ? 'bg-primary-container/20 text-primary border-primary/20'
                : 'bg-surface-container-high text-on-surface-variant border-white/5'
            }`}>
              {status}
            </span>
          </div>

          <h3 className="font-headline-md text-headline-md text-on-surface mb-3 leading-snug">
            {slot.module}: {slot.name}
          </h3>

          <div className="flex items-center gap-1.5 text-on-surface-variant/70 text-label-sm">
            <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
            <span>Venue: <b className="text-on-surface font-normal">{slot.hall}</b></span>
          </div>

          {/* Ongoing Live Progress Bar */}
          {isOngoing && (
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-4">
              <div
                className="h-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.6)] transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, Math.round(((nowMin - startMin) / (endMin - startMin)) * 100)))}%`
                }}
              ></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-grow pt-4 pb-12 max-w-2xl mx-auto w-full">
      {/* Header & Filters */}
      <section className="mb-stack-lg space-y-gutter">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Weekly Schedule</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Filter by module or lecture venue</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDirectDownloadPDF}
              className="flex items-center gap-1.5 text-xs text-on-primary bg-primary border border-primary/40 px-3.5 py-2 rounded-xl hover:opacity-90 transition-all font-label-bold cursor-pointer shadow-[0_0_12px_rgba(56,189,248,0.3)]"
            >
              <span className="material-symbols-outlined text-sm">download</span> Download Official Timetable (PDF)
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-primary/80 bg-primary/10 px-3 py-2 rounded-xl border border-primary/20 text-xs font-label-bold">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              <span>Semester 3 Matrix</span>
            </div>
          </div>
        </div>

        {/* Sleek Modern Filter Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Module Filter Chip */}
          <div className="filter-chip flex items-center gap-2 px-4 py-2 rounded-xl flex-shrink-0">
            <span className="material-symbols-outlined text-[18px] text-primary">auto_stories</span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-transparent border-none p-0 text-label-bold text-on-surface focus:ring-0 appearance-none w-full text-xs cursor-pointer"
            >
              <option value="All" className="bg-surface-container text-on-surface">All Modules</option>
              <option value="EE3301" className="bg-surface-container text-on-surface">EE3301 - Analog Electronics</option>
              <option value="EE3202" className="bg-surface-container text-on-surface">EE3202 - Data Structures</option>
              <option value="EE3203" className="bg-surface-container text-on-surface">EE3203 - Measurements</option>
              <option value="EE3304" className="bg-surface-container text-on-surface">EE3304 - Electromagnetism</option>
              <option value="EE3205" className="bg-surface-container text-on-surface">EE3205 - Power & Energy</option>
              <option value="EE3306" className="bg-surface-container text-on-surface">EE3306 - Signals & Systems</option>
              <option value="IS3301" className="bg-surface-container text-on-surface">IS3301 - Complex Analysis</option>
              <option value="IS3321" className="bg-surface-container text-on-surface">IS3321 - Management</option>
              <option value="IS3322" className="bg-surface-container text-on-surface">IS3322 - Society & Engineers</option>
            </select>
            <span className="material-symbols-outlined text-[16px] text-outline pointer-events-none">expand_more</span>
          </div>

          {/* Hall Filter Chip */}
          <div className="filter-chip flex items-center gap-2 px-4 py-2 rounded-xl flex-shrink-0">
            <span className="material-symbols-outlined text-[18px] text-primary">meeting_room</span>
            <select
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
              className="bg-transparent border-none p-0 text-label-bold text-on-surface focus:ring-0 appearance-none w-full text-xs cursor-pointer"
            >
              <option value="All" className="bg-surface-container text-on-surface">All Venues / Halls</option>
              <option value="NCC" className="bg-surface-container text-on-surface">NCC</option>
              <option value="LT1" className="bg-surface-container text-on-surface">LT1</option>
              <option value="LT2" className="bg-surface-container text-on-surface">LT2</option>
              <option value="AUD" className="bg-surface-container text-on-surface">AUD (Auditorium)</option>
              <option value="NLH2" className="bg-surface-container text-on-surface">NLH2</option>
            </select>
            <span className="material-symbols-outlined text-[16px] text-outline pointer-events-none">expand_more</span>
          </div>
        </div>
      </section>

      {/* Segmented Control Day Switcher */}
      <nav className="segmented-control p-1 rounded-full flex items-center mb-stack-lg relative overflow-hidden">
        <div
          className="day-tab-active-bg"
          style={{
            width: 'calc(20% - 4px)',
            left: `calc(${activeDayIndex * 20}% + 4px)`
          }}
        ></div>

        {days.map((d) => {
          const isActive = activeDay === d.key;
          return (
            <button
              key={d.key}
              onClick={() => setActiveDay(d.key)}
              className={`relative z-10 flex-1 py-2.5 text-center font-label-bold transition-colors duration-300 cursor-pointer text-xs sm:text-sm ${
                isActive ? 'text-on-primary font-bold' : 'text-on-surface-variant/80 hover:text-on-surface'
              }`}
            >
              {d.short}
            </button>
          );
        })}
      </nav>

      {/* Dynamic Timeline Container */}
      <div className="relative pl-10">
        {/* Enhanced Vertical Line */}
        <div className="absolute left-4 top-0 bottom-0 w-[2px] timeline-line"></div>

        {daySlots.length === 0 ? (
          <div className="p-8 text-center glass-card rounded-2xl border border-white/5">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">event_busy</span>
            <p className="text-on-surface font-semibold">No Lectures Found</p>
            <p className="text-xs text-on-surface-variant mt-1">No sessions match your filter on this day.</p>
          </div>
        ) : (
          <>
            {/* Morning Sessions */}
            {morningSlots.map((slot, idx) => renderSlotCard(slot, idx))}

            {/* Lunch Break Divider (Only if there are afternoon slots or standard day) */}
            {morningSlots.length > 0 && (
              <div className="relative py-6 flex items-center gap-4 opacity-50 my-2">
                <div className="h-px flex-grow bg-outline-variant"></div>
                <span className="material-symbols-outlined text-[18px] text-primary">restaurant</span>
                <span className="font-label-bold text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">Lunch Break (11:30 - 12:30)</span>
                <div className="h-px flex-grow bg-outline-variant"></div>
              </div>
            )}

            {/* Afternoon Sessions */}
            {afternoonSlots.map((slot, idx) => renderSlotCard(slot, idx + 100))}
          </>
        )}
      </div>
    </div>
  );
}

export default TimetablePage;
