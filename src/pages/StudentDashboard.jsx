import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStoredModuleHours, saveStoredModuleHours } from '../data/moduleHoursData';
import { 
  getModulesForDate, 
  getStoredNotices, 
  getDayNameFromDate, 
  exportSemesterScheduleCSV,
  modifyScheduleSlot
} from '../data/scheduleStore';
import { getHolidayForDate } from '../data/sriLankaHolidaysData';
import { getStoredDailyLogs, saveStoredDailyLogs, addAuditLog } from '../data/dailyLogsData';
import { subscribeToCloudEvent } from '../data/firebaseSync';
import SriLankanCalendarWidget from '../components/SriLankanCalendarWidget';
import { getSriLankaDateObj } from '../utils/dateUtils';

function StudentDashboard() {
  const navigate = useNavigate();
  const getLocalTodayDateStr = (d = new Date()) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(getLocalTodayDateStr());
  const [moduleHours, setModuleHours] = useState([]);
  const [notices, setNotices] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [adminActionMsg, setAdminActionMsg] = useState('');

  const role = localStorage.getItem('mis_role');
  const isAdmin = role === 'admin';

  const todayDateStr = getLocalTodayDateStr(currentTime);
  const selectedDayName = getDayNameFromDate(selectedDate);
  const selectedHoliday = getHolidayForDate(selectedDate);
  const isViewingToday = selectedDate === todayDateStr;

  useEffect(() => {
    setModuleHours(getStoredModuleHours());
    setNotices(getStoredNotices());

    subscribeToCloudEvent('overrides', () => {
      setCurrentTime(new Date());
    });

    subscribeToCloudEvent('notices', (newNotices) => {
      setNotices(newNotices);
    });

    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setNotices(getStoredNotices());
      setModuleHours(getStoredModuleHours());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hrs = currentTime.getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formattedLiveTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const handleStepDate = (offsetDays) => {
    const parts = selectedDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const d = new Date(year, month, day + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleGoToToday = () => {
    setSelectedDate(todayDateStr);
  };

  const handleQuickCancelClass = (moduleCode) => {
    if (window.confirm(`Are you sure you want to CANCEL the ${moduleCode} lecture on ${selectedDate}?`)) {
      modifyScheduleSlot({
        date: selectedDate,
        module: moduleCode,
        status: 'Canceled',
        reason: 'Canceled via Quick Admin Action on Dashboard'
      });
      setAdminActionMsg(`Canceled ${moduleCode} on ${selectedDate}`);
      setTimeout(() => setAdminActionMsg(''), 3500);
    }
  };

  const handleQuickLogHours = (moduleCode, hours = 2) => {
    const currentLogs = getStoredDailyLogs();
    const newLog = {
      id: Date.now(),
      date: selectedDate,
      module: moduleCode,
      hours: hours,
      topic: 'Regular Lecture Session Completed',
      venue: 'LT1',
      instructor: 'Department Lecturer'
    };
    saveStoredDailyLogs([newLog, ...currentLogs]);

    const currentHours = getStoredModuleHours();
    const updatedHours = currentHours.map(m => {
      if (m.code === moduleCode) {
        return { ...m, conductedHours: Math.min(m.targetHours, m.conductedHours + hours) };
      }
      return m;
    });
    saveStoredModuleHours(updatedHours);
    setModuleHours(updatedHours);

    addAuditLog('Quick Log', `Logged +${hours} hrs for ${moduleCode} on ${selectedDate}`);
    setAdminActionMsg(`Logged +${hours} hrs for ${moduleCode}!`);
    setTimeout(() => setAdminActionMsg(''), 3500);
  };

  const getComputedSchedule = (dateStr) => {
    const rawSlots = getModulesForDate(dateStr);
    const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    const isToday = dateStr === todayDateStr;
    const isPast = dateStr < todayDateStr;
    const isFuture = dateStr > todayDateStr;

    return rawSlots.map((slot) => {
      let liveStatus = slot.status || 'Scheduled';
      let progressPercent = 0;
      let minsRemaining = 0;
      let minsUntilStart = 0;

      if (slot.status === 'Canceled' || slot.status === 'Rescheduled' || slot.status === 'Swapped') {
        liveStatus = slot.status;
      } else if (selectedHoliday) {
        liveStatus = 'Holiday';
      } else if (isPast) {
        liveStatus = 'Done';
      } else if (isFuture) {
        liveStatus = 'Upcoming';
      } else if (isToday) {
        const start = slot.startMin || 510;
        const end = slot.endMin || 630;

        if (nowMin > end) {
          liveStatus = 'Done';
        } else if (nowMin >= start && nowMin <= end) {
          liveStatus = 'Ongoing';
          const totalDuration = Math.max(1, end - start);
          progressPercent = Math.min(100, Math.max(0, Math.round(((nowMin - start) / totalDuration) * 100)));
          minsRemaining = Math.max(0, end - nowMin);
        } else {
          liveStatus = 'Upcoming';
          minsUntilStart = Math.max(0, start - nowMin);
        }
      }

      return {
        ...slot,
        liveStatus,
        progressPercent,
        minsRemaining,
        minsUntilStart
      };
    });
  };

  const computedSchedule = getComputedSchedule(selectedDate);

  const filteredSchedule = computedSchedule.filter(slot => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ONGOING') return slot.liveStatus === 'Ongoing';
    if (statusFilter === 'UPCOMING') return slot.liveStatus === 'Upcoming';
    if (statusFilter === 'DONE') return slot.liveStatus === 'Done';
    if (statusFilter === 'CANCELED') return slot.liveStatus === 'Canceled';
    return true;
  });

  const activeOngoingCount = computedSchedule.filter(s => s.liveStatus === 'Ongoing').length;
  const totalTodayClasses = computedSchedule.length;

  const formattedDisplayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="space-y-3 max-w-[1440px] mx-auto">
      
      {/* Top Welcome & Live Clock Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-stack-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              {getGreeting()}{isAdmin ? ', Administrator' : ''}
            </h2>
            {activeOngoingCount > 0 && (
              <span className="bg-secondary/20 text-secondary border border-secondary/30 px-2.5 py-0.5 rounded-full text-xs font-label-bold flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                {activeOngoingCount} Class Ongoing
              </span>
            )}
          </div>
          <p className="text-on-surface-variant flex flex-wrap items-center gap-2 text-xs sm:text-sm font-body-md mt-1">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">school</span> 
              26th Batch, Faculty of Engineering, UOR
            </span>
            <span className="text-outline-variant/60 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-0.5 rounded-full text-xs font-label-mono shadow-[0_0_12px_rgba(56,189,248,0.2)]">
              <span className="material-symbols-outlined text-xs animate-spin" style={{ animationDuration: '6s' }}>schedule</span>
              <span className="font-bold">{formattedLiveTime}</span>
            </span>
          </p>
        </div>

        {/* Date Stepper & Quick Return to Today */}
        <div className="flex items-center justify-center md:justify-end gap-2 w-full md:w-auto">
          
          {/* Quick Return to Today Button (Visible when viewing past/future dates) */}
          {!isViewingToday && (
            <button
              onClick={handleGoToToday}
              className="flex items-center gap-1.5 text-xs font-label-bold px-3 py-2.5 rounded-xl bg-primary text-on-primary hover:opacity-90 transition-all shadow-[0_0_12px_rgba(56,189,248,0.5)] cursor-pointer shrink-0 animate-pulse"
              title="Return to Today's Schedule"
            >
              <span className="material-symbols-outlined text-sm">today</span>
              <span>Return to Today</span>
            </button>
          )}

          {/* Date Stepper Container */}
          <div className="flex items-center justify-between bg-surface-container-low rounded-xl p-1 border border-white/5 shadow-sm max-w-xs w-full sm:w-auto">
            <button
              onClick={() => handleStepDate(-1)}
              className="w-touch-target h-touch-target flex items-center justify-center text-on-surface-variant hover:bg-white/5 rounded-lg active:scale-95 transition-all cursor-pointer"
              title="Previous Day"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <div 
              onClick={handleGoToToday}
              className="px-stack-md flex flex-col items-center min-w-[120px] cursor-pointer hover:opacity-80 transition-opacity"
              title="Click to reset to Today"
            >
              <span className="font-label-bold text-label-bold text-primary uppercase tracking-widest text-[11px]">
                {isViewingToday ? 'Today' : selectedDayName}
              </span>
              <span className="font-body-md text-xs font-semibold text-on-surface">
                {formattedDisplayDate}
              </span>
            </div>

            <button
              onClick={() => handleStepDate(1)}
              className="w-touch-target h-touch-target flex items-center justify-center text-on-surface-variant hover:bg-white/5 rounded-lg active:scale-95 transition-all cursor-pointer"
              title="Next Day"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Admin Quick Toast Notification */}
      {adminActionMsg && (
        <div className="bg-secondary/20 border border-secondary text-secondary p-3 rounded-xl text-center font-label-bold text-xs animate-bounce">
          {adminActionMsg}
        </div>
      )}

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        
        {/* Daily Lectures Timeline (Column 1-8) */}
        <div className="lg:col-span-8 flex flex-col gap-gutter">
          <div className="glass-card rounded-xl p-stack-md">
            
            {/* Header Controls & Status Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-stack-sm mb-stack-md border-b border-white/5 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline-md text-headline-md text-on-surface">Daily Lectures</h3>
                  <span className="text-xs text-on-surface-variant font-label-mono">({totalTodayClasses} Sessions)</span>
                </div>
                <p className="text-base sm:text-lg font-headline-md text-primary font-bold mt-1 tracking-tight flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg">calendar_month</span>
                  <span>{formattedDisplayDate}</span>
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1 sm:pt-0">
                {[
                  { label: 'All', key: 'ALL' },
                  { label: 'Ongoing', key: 'ONGOING' },
                  { label: 'Upcoming', key: 'UPCOMING' },
                  { label: 'Completed', key: 'DONE' },
                  { label: 'Canceled', key: 'CANCELED' }
                ].map(chip => (
                  <button
                    key={chip.key}
                    onClick={() => setStatusFilter(chip.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-label-bold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === chip.key
                        ? 'bg-primary/20 text-primary border border-primary/40'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Holiday Special Banner if Selected Date is a Sri Lankan Holiday */}
            {selectedHoliday && (
              <div className="mb-stack-md p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedHoliday.icon}</span>
                  <div>
                    <h4 className="font-headline-md text-sm text-yellow-500 font-bold">{selectedHoliday.name}</h4>
                    <p className="text-xs text-on-surface-variant">{selectedHoliday.type} — Physical lectures cancelled.</p>
                  </div>
                </div>
                <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded-full text-xs font-label-bold">
                  Public Holiday
                </span>
              </div>
            )}

            {/* Timeline List View */}
            <div className="relative pl-8">
              {/* Vertical Glowing Line */}
              <div className="absolute left-[15px] top-4 bottom-4 w-[2px] timeline-line rounded-full"></div>

              {filteredSchedule.length === 0 ? (
                <div className="p-8 text-center glass-card rounded-xl border border-white/5 my-4">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">event_busy</span>
                  <p className="text-on-surface font-semibold">No Lectures Found</p>
                  <p className="text-xs text-on-surface-variant mt-1">No sessions match your filter criteria on this date.</p>
                </div>
              ) : (
                filteredSchedule.map((slot, index) => {
                  const isOngoing = slot.liveStatus === 'Ongoing';
                  const isDone = slot.liveStatus === 'Done';
                  const isCanceled = slot.liveStatus === 'Canceled';
                  const isSwapped = slot.liveStatus === 'Swapped' || slot.liveStatus === 'Rescheduled';
                  const isHoliday = slot.liveStatus === 'Holiday';

                  return (
                    <div key={index} className="relative mb-stack-lg last:mb-0 group">
                      {/* Timeline Node Pill */}
                      <div className={`absolute -left-[23px] top-3.5 w-4 h-4 rounded-full border-4 border-surface ${
                        isOngoing 
                          ? 'bg-primary shadow-[0_0_10px_rgba(56,189,248,0.8)] animate-pulse-glow'
                          : isCanceled
                          ? 'bg-error'
                          : isDone
                          ? 'bg-secondary opacity-60'
                          : isSwapped
                          ? 'bg-tertiary'
                          : 'bg-on-surface-variant'
                      }`}></div>

                      {/* Main Lecture Card */}
                      <div className={`glass-card rounded-xl p-stack-md transition-all ${
                        isOngoing ? 'border-primary/40 bg-primary/5 active-glow' : 'hover:bg-white/5'
                      }`}>
                        
                        {/* Slot Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-stack-sm mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-label-bold text-xs uppercase tracking-wider ${
                                (isCanceled || isHoliday) ? 'text-error line-through' : isOngoing ? 'text-primary' : 'text-on-surface-variant'
                              }`}>
                                {slot.time}
                              </span>

                              {/* Live Countdown Indicators */}
                              {isOngoing && (
                                <span className="text-[11px] text-primary font-label-bold bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                  Ends in {slot.minsRemaining} mins
                                </span>
                              )}
                              {slot.liveStatus === 'Upcoming' && slot.minsUntilStart > 0 && slot.minsUntilStart <= 120 && (
                                <span className="text-[11px] text-secondary font-label-bold bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20">
                                  Starts in {slot.minsUntilStart} mins
                                </span>
                              )}
                            </div>

                            <h4 className={`font-headline-md text-headline-md text-on-surface leading-tight ${
                              (isCanceled || isHoliday) ? 'line-through opacity-50' : ''
                            }`}>
                              <Link to={`/modules/${slot.module}`} className="hover:text-primary transition-colors">
                                {slot.module}: {slot.name}
                              </Link>
                            </h4>
                          </div>

                          {/* Live Status Badge */}
                          <div className="shrink-0 flex items-center gap-2">
                            {isOngoing && (
                              <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-lg font-label-bold text-xs flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                Live Ongoing
                              </span>
                            )}
                            {isDone && (
                              <span className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 rounded-lg font-label-bold text-xs">
                                ✓ Conducted
                              </span>
                            )}
                            {slot.liveStatus === 'Upcoming' && (
                              <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-lg font-label-bold text-xs">
                                Upcoming
                              </span>
                            )}
                            {isCanceled && (
                              <span className="bg-error/20 text-error border border-error/30 px-3 py-1 rounded-lg font-label-bold text-xs">
                                Canceled
                              </span>
                            )}
                            {isSwapped && (
                              <span className="bg-tertiary/20 text-tertiary border border-tertiary/30 px-3 py-1 rounded-lg font-label-bold text-xs">
                                {slot.liveStatus}
                              </span>
                            )}
                            {isHoliday && (
                              <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded-lg font-label-bold text-xs">
                                Holiday
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Lecture Meta Details */}
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-on-surface-variant text-xs mt-3">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                            Venue: <b className="text-on-surface">{slot.hall}</b>
                          </span>
                        </div>

                        {/* Live Session Progress Bar for Ongoing Lectures */}
                        {isOngoing && (
                          <div className="mt-4 pt-3 border-t border-white/5 space-y-1">
                            <div className="flex justify-between text-[11px] font-label-bold">
                              <span className="text-primary flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">schedule</span>
                                Live Lecture Progress
                              </span>
                              <span className="text-secondary">{slot.progressPercent}% Completed</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(56,189,248,0.6)]"
                                style={{ width: `${slot.progressPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Reason / Remarks if Canceled or Rescheduled */}
                        {slot.reason && (
                          <p className="mt-3 text-xs text-error italic bg-error/5 p-2 rounded-lg border border-error/10">
                            Note: {slot.reason}
                          </p>
                        )}

                        {/* Inline Admin Controls (Only visible to Admin) */}
                        {isAdmin && (
                          <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-end gap-2">
                            <span className="text-[10px] font-label-bold text-on-surface-variant mr-auto">Admin Controls:</span>
                            <button
                              onClick={() => handleQuickLogHours(slot.module, 2)}
                              className="px-2.5 py-1 rounded bg-secondary/10 text-secondary border border-secondary/20 text-xs font-label-bold hover:bg-secondary/20 cursor-pointer"
                              title="Log 2 hours for this class into Daily Logs"
                            >
                              + Log 2h to Logs
                            </button>
                            <button
                              onClick={() => navigate('/admin')}
                              className="px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-label-bold hover:bg-primary/20 cursor-pointer"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleQuickCancelClass(slot.module)}
                              className="px-2.5 py-1 rounded bg-error/10 text-error border border-error/20 text-xs font-label-bold hover:bg-error/20 cursor-pointer"
                            >
                              Cancel Class
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Section (Column 9-12) */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          
          {/* 1. Module Completion Progress */}
          <div className="glass-card rounded-xl p-stack-md space-y-stack-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest text-xs">
                Course Progress
              </h3>
              <Link to="/modules" className="text-xs text-primary hover:underline font-label-bold">
                View All
              </Link>
            </div>

            <div className="space-y-stack-md">
              {moduleHours.slice(0, 4).map((mod) => {
                const percent = Math.min(100, Math.round((mod.conductedHours / mod.targetHours) * 100));
                const isHigh = percent >= 75;
                const isMedium = percent >= 45 && percent < 75;

                return (
                  <div key={mod.code}>
                    <div className="flex justify-between text-xs mb-1 font-label-bold">
                      <span className="text-on-surface">{mod.code}: {mod.title}</span>
                      <span className={isHigh ? 'text-secondary' : isMedium ? 'text-primary' : 'text-tertiary'}>
                        {percent}% ({mod.conductedHours}/{mod.targetHours}h)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHigh ? 'bg-secondary shadow-[0_0_10px_rgba(78,222,163,0.3)]' : isMedium ? 'bg-primary shadow-[0_0_10px_rgba(56,189,248,0.3)]' : 'bg-tertiary shadow-[0_0_10px_rgba(255,188,191,0.3)]'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Calendar Widget */}
          <SriLankanCalendarWidget selectedDate={selectedDate} onSelectDate={(d) => setSelectedDate(d)} />

          {/* 3. Department Announcements Feed */}
          <div className="glass-card rounded-xl p-stack-md space-y-stack-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest text-xs">
                Announcements
              </h3>
              {isAdmin && (
                <Link to="/admin" className="text-xs text-secondary hover:underline flex items-center gap-0.5 font-label-bold">
                  <span className="material-symbols-outlined text-xs">add</span> Post Notice
                </Link>
              )}
            </div>

            <div className="space-y-stack-md">
              {notices.map((notice) => (
                <div key={notice.id} className="flex gap-stack-md p-2.5 hover:bg-white/5 rounded-xl transition-colors group border border-white/5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    notice.type === 'Holiday' ? 'bg-tertiary/20 text-tertiary' : notice.type === 'Canceled' ? 'bg-error/20 text-error' : 'bg-primary/20 text-primary'
                  }`}>
                    <span className="material-symbols-outlined text-xl">
                      {notice.type === 'Holiday' ? 'brightness_3' : notice.type === 'Canceled' ? 'event_busy' : 'campaign'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h5 className="font-headline-md text-on-surface leading-tight text-xs font-bold truncate">
                        {notice.title}
                      </h5>
                      <span className="text-[10px] text-on-surface-variant/60 whitespace-nowrap font-label-mono">
                        {notice.date}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      {notice.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
