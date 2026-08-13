import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStoredModuleHours, saveStoredModuleHours } from '../data/moduleHoursData';
import { 
  getModulesForDate, 
  getStoredNotices, 
  getDayNameFromDate, 
  exportSemesterScheduleCSV,
  modifyScheduleSlot,
  uncancelScheduleSlot,
  removeNotice,
  updateNotice
} from '../data/scheduleStore';
import { getHolidayForDate } from '../data/sriLankaHolidaysData';
import { getStoredDailyLogs, saveStoredDailyLogs, deleteDailyLogByModuleAndDate, addAuditLog } from '../data/dailyLogsData';
import { subscribeToCloudEvent } from '../data/firebaseSync';
import SriLankanCalendarWidget from '../components/SriLankanCalendarWidget';
import { getSriLankaDateObj, SEMESTER_START_DATE, getValidSemesterDateStr } from '../utils/dateUtils';

function StudentDashboard() {
  const navigate = useNavigate();
  const getLocalTodayDateStr = (d = new Date()) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    return dateStr < SEMESTER_START_DATE ? SEMESTER_START_DATE : dateStr;
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(getLocalTodayDateStr());
  const [moduleHours, setModuleHours] = useState([]);
  const [notices, setNotices] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [adminActionMsg, setAdminActionMsg] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    btnText: 'Confirm',
    btnStyle: 'bg-primary text-on-primary',
    onConfirm: null
  });
  const [verifyModal, setVerifyModal] = useState({
    isOpen: false,
    slot: null,
    hours: 1,
    note: ''
  });
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [isEditingNotice, setIsEditingNotice] = useState(false);
  const [editNoticeTitle, setEditNoticeTitle] = useState('');
  const [editNoticeContent, setEditNoticeContent] = useState('');

  const role = localStorage.getItem('mis_role');
  const isAdmin = role === 'admin';

  const todayDateStr = getLocalTodayDateStr(currentTime);
  const selectedDayName = getDayNameFromDate(selectedDate);
  const selectedHoliday = getHolidayForDate(selectedDate);
  const isViewingToday = selectedDate === todayDateStr;

  useEffect(() => {
    setModuleHours(getStoredModuleHours());
    setNotices(getStoredNotices());

    const handleOverridesUpdate = () => {
      setCurrentTime(new Date());
    };
    window.addEventListener('schedule_overrides_updated', handleOverridesUpdate);
    window.addEventListener('daily_logs_updated', handleOverridesUpdate);

    subscribeToCloudEvent('overrides', () => {
      setCurrentTime(new Date());
    });

    subscribeToCloudEvent('daily_logs', () => {
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

    return () => {
      clearInterval(interval);
      window.removeEventListener('schedule_overrides_updated', handleOverridesUpdate);
      window.removeEventListener('daily_logs_updated', handleOverridesUpdate);
    };
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
    const nextDate = `${yyyy}-${mm}-${dd}`;
    if (nextDate < SEMESTER_START_DATE) return;
    setSelectedDate(nextDate);
  };

  const handleGoToToday = () => {
    setSelectedDate(todayDateStr);
  };

  const handleQuickCancelClass = (moduleCode) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Quick Cancellation',
      message: `Are you sure you want to instantly CANCEL the ${moduleCode} lecture on ${selectedDate}?`,
      btnText: 'Confirm Cancellation',
      btnStyle: 'bg-error text-on-error hover:bg-error/90 border-error/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
      onConfirm: () => {
        modifyScheduleSlot({
          date: selectedDate,
          module: moduleCode,
          status: 'Canceled',
          reason: 'Canceled via Quick Admin Action on Dashboard'
        });
        setAdminActionMsg(`Canceled ${moduleCode} on ${selectedDate}`);
        setTimeout(() => setAdminActionMsg(''), 3500);
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleQuickUncancelClass = (moduleCode) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Restore / Un-cancel Lecture',
      message: `Are you sure you want to RESTORE / UN-CANCEL the ${moduleCode} lecture on ${selectedDate}? This will reinstate the class back to Scheduled status.`,
      btnText: 'Confirm Un-cancel',
      btnStyle: 'bg-secondary text-on-secondary hover:bg-secondary/90 border-secondary/50 shadow-[0_0_15px_rgba(78,222,163,0.3)]',
      onConfirm: () => {
        uncancelScheduleSlot({
          date: selectedDate,
          module: moduleCode,
          reason: 'Restored via Quick Admin Action on Daily Dashboard'
        });
        setAdminActionMsg(`Restored / Un-canceled ${moduleCode} on ${selectedDate}`);
        setTimeout(() => setAdminActionMsg(''), 3500);
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleQuickRecancelClass = (moduleCode, currentReason = '') => {
    const newReason = prompt(`Re-cancel ${moduleCode} on ${selectedDate}.\nEnter updated cancellation reason:`, currentReason || 'Lecturer unavailable');
    if (newReason === null) return;
    modifyScheduleSlot({
      date: selectedDate,
      module: moduleCode,
      status: 'Canceled',
      reason: newReason || 'Lecturer unavailable'
    });
    setAdminActionMsg(`Re-canceled ${moduleCode} on ${selectedDate}`);
    setTimeout(() => setAdminActionMsg(''), 3500);
  };

  const handleResetConductedStatus = (moduleCode) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Reset Conducted Status',
      message: `Are you sure you want to RESET / REMOVE the conducted log for ${moduleCode} on ${selectedDate}? This will subtract the logged hours and revert the class status back.`,
      btnText: 'Confirm Reset Log',
      btnStyle: 'bg-orange-500 text-white hover:bg-orange-600 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]',
      onConfirm: () => {
        deleteDailyLogByModuleAndDate(selectedDate, moduleCode);
        setAdminActionMsg(`Reset conducted log for ${moduleCode} on ${selectedDate}`);
        setTimeout(() => setAdminActionMsg(''), 3500);
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
        setCurrentTime(new Date());
      }
    });
  };

  const handleQuickReschedule = (moduleCode) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reschedule Lecture',
      message: `Do you want to navigate to the Admin Control Panel to reschedule the ${moduleCode} lecture on ${selectedDate}?`,
      btnText: 'Go to Reschedule Panel',
      btnStyle: 'btn-electric',
      onConfirm: () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
        navigate('/admin');
      }
    });
  };

  const handleQuickLogHours = (moduleCode, hours = 2, note = '') => {
    const currentLogs = getStoredDailyLogs();
    const cleanNote = note && note.trim() ? note.trim() : 'Regular Lecture Session Completed';
    const newLog = {
      id: Date.now(),
      date: selectedDate,
      module: moduleCode,
      hours: hours,
      topic: cleanNote,
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

    // Fetch daily logs to verify if past lectures actually happened
    const dailyLogs = getStoredDailyLogs();

    return rawSlots.map((slot) => {
      let liveStatus = slot.status || 'Scheduled';
      let progressPercent = 0;
      let minsRemaining = 0;
      let minsUntilStart = 0;

      // Check if this slot has a log entry for the current date
      const logEntry = dailyLogs.find(log => log.date === dateStr && log.module === slot.module);
      const isLogged = !!logEntry;

      if (slot.status === 'Canceled' || slot.status === 'Swapped') {
        liveStatus = slot.status;
      } else if (selectedHoliday) {
        liveStatus = 'Holiday';
      } else if (isPast) {
        liveStatus = isLogged ? 'Done' : 'Awaiting Verification';
      } else if (isFuture) {
        liveStatus = isLogged ? 'Done' : 'Upcoming';
      } else if (isToday) {
        const start = slot.startMin || 510;
        const end = slot.endMin || 630;

        if (isLogged) {
          liveStatus = 'Done';
        } else if (nowMin > end) {
          liveStatus = 'Awaiting Verification';
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
        minsUntilStart,
        logEntry
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
    if (statusFilter === 'UNVERIFIED') return slot.liveStatus === 'Awaiting Verification';
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
              disabled={selectedDate <= SEMESTER_START_DATE}
              className={`w-touch-target h-touch-target flex items-center justify-center text-on-surface-variant hover:bg-white/5 rounded-lg active:scale-95 transition-all ${
                selectedDate <= SEMESTER_START_DATE ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
              }`}
              title={selectedDate <= SEMESTER_START_DATE ? 'Semester starts July 27, 2026' : 'Previous Day'}
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
                  { label: 'Awaiting Verification', key: 'UNVERIFIED' },
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

              {selectedDate < SEMESTER_START_DATE ? (
                <div className="p-8 text-center glass-card rounded-xl border border-primary/30 bg-primary/5 my-4">
                  <span className="material-symbols-outlined text-4xl text-primary mb-2">event_upcoming</span>
                  <p className="text-on-surface font-headline-md text-base font-bold">Semester Has Not Started Yet</p>
                  <p className="text-xs text-on-surface-variant mt-1">Semester 3 officially begins on July 27, 2026. Daily schedules are not available prior to this date.</p>
                  <button
                    onClick={() => setSelectedDate(SEMESTER_START_DATE)}
                    className="mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-bold text-xs cursor-pointer hover:opacity-90 shadow-md inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    Go to Semester Start (July 27, 2026)
                  </button>
                </div>
              ) : filteredSchedule.length === 0 ? (
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
                  const isUnverified = slot.liveStatus === 'Awaiting Verification';
                  const isSwapped = slot.liveStatus === 'Swapped';
                  const isRescheduled = slot.isRescheduled || slot.status === 'Rescheduled';
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
                          : isUnverified
                          ? 'bg-orange-500'
                          : isSwapped || isRescheduled
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
                                (isCanceled || isHoliday) ? 'text-error line-through' : isOngoing ? 'text-primary' : isUnverified ? 'text-orange-500' : 'text-on-surface-variant'
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

                          {/* Live Status Badges */}
                          <div className="shrink-0 flex flex-wrap items-center gap-2">
                            {isRescheduled && (
                              <span className="bg-primary/15 text-primary border border-primary/30 px-3 py-1 rounded-lg font-label-bold text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(56,189,248,0.15)]">
                                <span className="material-symbols-outlined text-[14px]">update</span>
                                Rescheduled
                              </span>
                            )}
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
                            {isUnverified && (
                              <span className="bg-orange-500/20 text-orange-500 border border-orange-500/30 px-3 py-1 rounded-lg font-label-bold text-xs flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">pending_actions</span>
                                Awaiting Verification
                              </span>
                            )}
                            {slot.liveStatus === 'Upcoming' && !isRescheduled && (
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
                                Swapped
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
                            Venue: <strong className="text-on-surface">{slot.hall}</strong>
                          </span>
                        </div>

                        {/* Live Progress Bar for Ongoing Classes */}
                        {isOngoing && (
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-[11px] font-label-bold text-primary">
                              <span>Class Progress</span>
                              <span>{slot.progressPercent}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(56,189,248,0.6)]"
                                style={{ width: `${slot.progressPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Small Note Part if Reason or Topic exists */}
                        {(slot.reason || (slot.logEntry?.topic && slot.logEntry.topic !== 'Regular Class Completed' && slot.logEntry.topic !== 'Regular Lecture Session Completed')) && (
                          <div className="mt-2.5 p-2 rounded-lg bg-surface-container/50 border border-white/5 flex items-center gap-2">
                            <span className="material-symbols-outlined text-xs text-primary shrink-0">info</span>
                            <p className="text-xs text-on-surface-variant italic font-body-md">
                              Note: {slot.reason || slot.logEntry.topic}
                            </p>
                          </div>
                        )}

                        {/* Inline Admin Controls (Only visible to Admin) */}
                        {isAdmin && !isHoliday && !isDone && !isCanceled && (
                          <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-end gap-2">
                            <span className="text-[10px] font-label-bold text-on-surface-variant mr-auto">Admin Controls:</span>
                            {isUnverified ? (
                              <button
                                onClick={() => {
                                  const calcHours = (slot.endMin - slot.startMin) / 60;
                                  setVerifyModal({
                                    isOpen: true,
                                    slot: slot,
                                    hours: calcHours > 0 ? calcHours : 1
                                  });
                                }}
                                className="px-2.5 py-1 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-label-bold hover:bg-orange-500/20 cursor-pointer"
                              >
                                + Verify & Log
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  const calcHours = (slot.endMin - slot.startMin) / 60;
                                  setVerifyModal({
                                    isOpen: true,
                                    slot: slot,
                                    hours: calcHours > 0 ? calcHours : 2,
                                    note: ''
                                  });
                                }}
                                className="px-2.5 py-1 rounded bg-secondary/10 text-secondary border border-secondary/20 text-xs font-label-bold hover:bg-secondary/20 cursor-pointer"
                                title="Verify and log hours & topic note for this class"
                              >
                                + Log Hours & Note
                              </button>
                            )}
                            <button
                              onClick={() => handleQuickReschedule(slot.module)}
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

                        {/* Inline Admin Controls for Canceled Slots */}
                        {isAdmin && !isHoliday && isCanceled && (
                          <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-end gap-2">
                            <span className="text-[10px] font-label-bold text-on-surface-variant mr-auto">Admin Controls (Canceled Slot):</span>
                            <button
                              onClick={() => handleQuickUncancelClass(slot.module)}
                              className="px-2.5 py-1 rounded bg-secondary/15 text-secondary border border-secondary/30 text-xs font-label-bold hover:bg-secondary/25 cursor-pointer shadow-[0_0_10px_rgba(78,222,163,0.2)] flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">undo</span> Un-cancel / Restore Class
                            </button>
                            <button
                              onClick={() => handleQuickRecancelClass(slot.module, slot.reason)}
                              className="px-2.5 py-1 rounded bg-error/15 text-error border border-error/30 text-xs font-label-bold hover:bg-error/25 cursor-pointer flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">edit_note</span> Re-cancel / Edit Reason
                            </button>
                          </div>
                        )}

                        {/* Inline Admin Controls for Conducted Slots */}
                        {isAdmin && !isHoliday && isDone && (
                          <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-end gap-2">
                            <span className="text-[10px] font-label-bold text-on-surface-variant mr-auto">Admin Controls (Conducted Class):</span>
                            <button
                              onClick={() => handleResetConductedStatus(slot.module)}
                              className="px-2.5 py-1 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 text-xs font-label-bold hover:bg-orange-500/25 cursor-pointer shadow-[0_0_10px_rgba(249,115,22,0.2)] flex items-center gap-1"
                              title="Reset conducted status and remove logged hours for this class"
                            >
                              <span className="material-symbols-outlined text-xs">restart_alt</span> Reset Conducted Status
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
                <div
                  key={notice.id}
                  onClick={() => setSelectedNotice(notice)}
                  className="flex gap-stack-md p-3 hover:bg-white/10 rounded-xl transition-all group border border-white/5 hover:border-primary/40 cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden"
                  title="Click to open full notice"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    notice.type === 'Holiday' ? 'bg-tertiary/20 text-tertiary border border-tertiary/30' : notice.type === 'Canceled' || notice.type === 'Alert' ? 'bg-error/20 text-error border border-error/30' : 'bg-primary/20 text-primary border border-primary/30'
                  }`}>
                    <span className="material-symbols-outlined text-xl">
                      {notice.type === 'Holiday' ? 'brightness_3' : notice.type === 'Canceled' ? 'event_busy' : notice.type === 'Alert' ? 'warning' : 'campaign'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h5 className="font-headline-md text-on-surface leading-tight text-xs font-bold truncate group-hover:text-primary transition-colors">
                        {notice.title}
                      </h5>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-snug">
                      {notice.content}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 text-[10px] text-on-surface-variant/70 font-label-mono">
                      <span>{notice.date}</span>
                      <span className="text-primary font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        Read Full <span className="material-symbols-outlined text-xs">open_in_full</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Enhanced Custom Confirmation Modal for Student Dashboard */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-surface-container border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center transform scale-100 transition-transform">
            
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(56,189,248,0.2)]">
              <span className="material-symbols-outlined text-3xl">info</span>
            </div>
            
            <div>
              <h3 className="font-headline-md font-bold text-on-surface text-xl mb-2">{confirmModal.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 text-on-surface hover:bg-white/5 hover:text-white transition-all text-sm font-label-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-label-bold transition-all shadow-lg cursor-pointer ${confirmModal.btnStyle || 'bg-primary text-on-primary hover:bg-primary/90'}`}
              >
                {confirmModal.btnText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify & Log Modal */}
      {verifyModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-surface-container border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center transform scale-100 transition-transform">
            
            <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(249,115,22,0.2)]">
              <span className="material-symbols-outlined text-3xl">pending_actions</span>
            </div>
            
            <div>
              <h3 className="font-headline-md font-bold text-on-surface text-xl mb-2">Verify Lecture</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Confirm the duration to log for <b className="text-primary">{verifyModal.slot?.module}</b> on {selectedDate}.
              </p>
            </div>

            <div className="text-left bg-surface-container-low p-4 rounded-xl border border-white/5 space-y-3 text-sm">
               <div>
                 <label className="text-on-surface-variant font-label-bold text-xs uppercase block mb-1">Duration (Hours)</label>
                 <input
                   type="number"
                   value={verifyModal.hours}
                   onChange={(e) => setVerifyModal({...verifyModal, hours: Number(e.target.value)})}
                   step="0.5"
                   min="0.5"
                   className="w-full bg-surface-container border border-white/10 rounded-lg p-3 text-on-surface font-bold focus:border-primary focus:outline-none"
                 />
               </div>

               <div>
                 <label className="text-on-surface-variant font-label-bold text-xs uppercase block mb-1">Topic / Lecture Note (Optional)</label>
                 <input
                   type="text"
                   placeholder="e.g., Chapter 3 Diode Rectifiers & Tutorial 2"
                   value={verifyModal.note || ''}
                   onChange={(e) => setVerifyModal({...verifyModal, note: e.target.value})}
                   className="w-full bg-surface-container border border-white/10 rounded-lg p-3 text-xs text-on-surface focus:border-primary focus:outline-none placeholder:text-on-surface-variant/40"
                 />
               </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setVerifyModal({ isOpen: false, slot: null, hours: 0, note: '' })}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 text-on-surface hover:bg-white/5 hover:text-white transition-all text-sm font-label-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                   handleQuickLogHours(verifyModal.slot.module, verifyModal.hours, verifyModal.note);
                   setVerifyModal({ isOpen: false, slot: null, hours: 0, note: '' });
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-label-bold transition-all shadow-lg cursor-pointer bg-primary text-on-primary hover:bg-primary/90"
              >
                Confirm & Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Details Popup Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-surface-container border border-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 transform scale-100 transition-transform relative overflow-hidden">
            
            {/* Decorative Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-[50px] rounded-full pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  selectedNotice.type === 'Holiday' ? 'bg-tertiary/20 text-tertiary border border-tertiary/30' : selectedNotice.type === 'Canceled' || selectedNotice.type === 'Alert' ? 'bg-error/20 text-error border border-error/30' : 'bg-primary/20 text-primary border border-primary/30'
                }`}>
                  <span className="material-symbols-outlined text-2xl">
                    {selectedNotice.type === 'Holiday' ? 'brightness_3' : selectedNotice.type === 'Canceled' ? 'event_busy' : selectedNotice.type === 'Alert' ? 'warning' : 'campaign'}
                  </span>
                </div>
                <div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-label-bold uppercase tracking-wider mb-1 ${
                    selectedNotice.type === 'Holiday' ? 'bg-tertiary/20 text-tertiary border border-tertiary/30' : selectedNotice.type === 'Canceled' || selectedNotice.type === 'Alert' ? 'bg-error/20 text-error border border-error/30' : 'bg-primary/20 text-primary border border-primary/30'
                  }`}>
                    {selectedNotice.type || 'Notice'}
                  </span>
                  <h3 className="font-headline-md font-bold text-on-surface text-lg leading-snug">
                    {selectedNotice.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setSelectedNotice(null); setIsEditingNotice(false); }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Close Modal"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Timestamp info */}
            <div className="flex items-center justify-between text-xs text-on-surface-variant font-label-mono bg-surface-container-low/60 px-3.5 py-2 rounded-xl border border-white/5">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">calendar_month</span>
                Date: <b className="text-on-surface">{selectedNotice.date}</b>
              </span>
              <span className="flex items-center gap-1 text-secondary font-bold">
                <span className="material-symbols-outlined text-xs">verified</span> Department MIS Broadcast
              </span>
            </div>

            {/* Main Notice Content */}
            {isEditingNotice ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-label-bold uppercase text-on-surface-variant mb-1 block">Title</label>
                  <input
                    type="text"
                    value={editNoticeTitle}
                    onChange={(e) => setEditNoticeTitle(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/10 rounded-xl p-3 text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-label-bold uppercase text-on-surface-variant mb-1 block">Content</label>
                  <textarea
                    value={editNoticeContent}
                    onChange={(e) => setEditNoticeContent(e.target.value)}
                    rows={5}
                    className="w-full bg-surface-container-low border border-white/10 rounded-xl p-3 text-xs text-on-surface outline-none focus:border-primary resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingNotice(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-xs font-label-bold text-on-surface cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = updateNotice(selectedNotice.id, editNoticeTitle, editNoticeContent);
                      setNotices(updated);
                      setSelectedNotice({ ...selectedNotice, title: editNoticeTitle, content: editNoticeContent });
                      setIsEditingNotice(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-label-bold cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-low/70 p-4 rounded-xl border border-white/5 max-h-60 overflow-y-auto">
                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line font-body-md">
                  {selectedNotice.content}
                </p>
              </div>
            )}

            {/* Footer Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              {isAdmin && !isEditingNotice ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditNoticeTitle(selectedNotice.title);
                      setEditNoticeContent(selectedNotice.content);
                      setIsEditingNotice(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 text-xs font-label-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span> Edit Notice
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Delete this announcement?')) {
                        const updated = removeNotice(selectedNotice.id);
                        setNotices(updated);
                        setSelectedNotice(null);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-error/10 text-error border border-error/30 hover:bg-error/20 text-xs font-label-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span> Delete
                  </button>
                </div>
              ) : (
                <div></div>
              )}

              <button
                type="button"
                onClick={() => { setSelectedNotice(null); setIsEditingNotice(false); }}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-label-bold transition-all shadow-[0_0_12px_rgba(56,189,248,0.4)] cursor-pointer ml-auto"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
