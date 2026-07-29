import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStoredModuleHours, resetToInitialHours } from '../data/moduleHoursData';
import { getModulesForDate, getStoredNotices, getDayNameFromDate, removeNotice, updateNotice, exportSemesterScheduleCSV } from '../data/scheduleStore';
import SriLankanCalendarWidget from '../components/SriLankanCalendarWidget';

function StudentDashboard() {
  const [notices, setNotices] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [moduleHours, setModuleHours] = useState([]);
  const [editingNotice, setEditingNotice] = useState(null);

  const role = localStorage.getItem('mis_role');
  const isAdmin = role === 'admin';

  const todayDateStr = currentTime.toISOString().split('T')[0];
  const selectedDayName = getDayNameFromDate(selectedDate);

  useEffect(() => {
    // Load module hours & notices
    setModuleHours(getStoredModuleHours());
    setNotices(getStoredNotices());

    // Live clock timer update every 30 seconds
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setNotices(getStoredNotices());
      setModuleHours(getStoredModuleHours());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleResetHours = () => {
    const res = resetToInitialHours();
    setModuleHours(res);
  };

  const handleDeleteNotice = (id) => {
    if (window.confirm("Are you sure you want to remove this notice?")) {
      const updated = removeNotice(id);
      setNotices(updated);
    }
  };

  const handleSaveNoticeEdit = (e) => {
    e.preventDefault();
    if (!editingNotice) return;
    const updated = updateNotice(editingNotice.id, editingNotice.title, editingNotice.content);
    setNotices(updated);
    setEditingNotice(null);
  };

  // Date Stepper Handlers (Timezone & Month boundary safe)
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

  // Compute live lecture status for selected date (past, present, future)
  const getComputedSchedule = (dateStr) => {
    const rawSlots = getModulesForDate(dateStr);
    const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    const isToday = dateStr === todayDateStr;
    const isPast = dateStr < todayDateStr;
    const isFuture = dateStr > todayDateStr;

    return rawSlots.map((slot) => {
      let liveStatus = slot.status || 'Scheduled';

      if (slot.status === 'Canceled' || slot.status === 'Rescheduled' || slot.status === 'Swapped') {
        liveStatus = slot.status;
      } else if (dateStr === '2026-07-29') {
        liveStatus = 'Holiday';
      } else if (isPast) {
        liveStatus = 'Done';
      } else if (isFuture) {
        liveStatus = 'Scheduled';
      } else if (isToday) {
        if (nowMin > slot.endMin) {
          liveStatus = 'Done';
        } else if (nowMin >= slot.startMin && nowMin <= slot.endMin) {
          liveStatus = 'Ongoing';
        } else {
          liveStatus = 'Upcoming';
        }
      }
      return { ...slot, liveStatus };
    });
  };

  const currentSchedule = getComputedSchedule(selectedDate);

  // Visual style badge mappings for CANCELED, RESCHEDULED, SWAPPED, ONGOING, DONE, SCHEDULED
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'canceled':
        return {
          bar: 'bg-coral-vibe shadow-[0_0_10px_rgba(255,107,107,0.8)]',
          text: 'text-coral-vibe font-bold',
          label: 'Canceled',
          bg: 'bg-coral-vibe/15 border-coral-vibe/40',
          card: 'border-coral-vibe/30 bg-coral-vibe/5'
        };
      case 'rescheduled':
        return {
          bar: 'bg-[#FBBF24] shadow-[0_0_10px_rgba(251,191,36,0.8)]',
          text: 'text-[#FBBF24] font-bold',
          label: 'Rescheduled',
          bg: 'bg-[#FBBF24]/15 border-[#FBBF24]/40',
          card: 'border-[#FBBF24]/30 bg-[#FBBF24]/5'
        };
      case 'swapped':
        return {
          bar: 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8)]',
          text: 'text-purple-300 font-bold',
          label: 'Swapped',
          bg: 'bg-purple-500/15 border-purple-500/40',
          card: 'border-purple-500/30 bg-purple-500/5'
        };
      case 'holiday':
        return {
          bar: 'bg-coral-vibe',
          text: 'text-coral-vibe font-semibold',
          label: 'Holiday',
          bg: 'bg-coral-vibe/10 border-coral-vibe/30',
          card: 'border-glass-stroke'
        };
      case 'ongoing':
        return {
          bar: 'bg-emerald-glow shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse',
          text: 'text-emerald-glow font-bold animate-pulse',
          label: 'Ongoing Now',
          bg: 'bg-emerald-glow/15 border-emerald-glow/40',
          card: 'border-emerald-glow/50 bg-emerald-glow/5 shadow-[0_0_15px_rgba(52,211,153,0.15)]'
        };
      case 'done':
        return {
          bar: 'bg-emerald-glow shadow-[0_0_8px_rgba(52,211,153,0.8)]',
          text: 'text-emerald-glow font-bold',
          label: 'Completed / Done',
          bg: 'bg-emerald-glow/15 border-emerald-glow/40',
          card: 'border-emerald-glow/30 bg-emerald-glow/5'
        };
      default:
        return {
          bar: 'bg-electric-blue shadow-[0_0_8px_rgba(0,212,255,0.6)]',
          text: 'text-electric-blue font-bold',
          label: 'Scheduled',
          bg: 'bg-electric-blue/15 border-electric-blue/40',
          card: 'border-glass-stroke hover:bg-surface-container'
        };
    }
  };

  // Helper: Format YYYY-MM-DD to clean DD/MM
  const formatDDMM = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return `${parts[2]}/${parts[1]}`;
  };

  return (
    <div className="flex flex-col gap-[24px]">
      {/* Welcome & Live Banner */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-2">
        <div>
          <h1 className="font-display-lg text-[32px] md:text-[44px] font-bold text-on-surface mb-1">Welcome Back.</h1>
          <p className="font-body-lg text-[16px] md:text-[18px] text-on-surface-variant">
            Semester Started: <span className="text-emerald-glow font-semibold">27th July 2026</span> | Today is <span className="text-electric-blue font-semibold">{getDayNameFromDate(todayDateStr)}</span> ({formatDDMM(todayDateStr)})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportSemesterScheduleCSV}
            className="px-3 py-1.5 rounded-full bg-surface-container-high border border-glass-stroke text-xs text-electric-blue font-semibold hover:text-on-surface cursor-pointer flex items-center gap-1.5"
            title="Download full schedule"
          >
            <span className="material-symbols-outlined text-[16px]">download</span> Export
          </button>
          <button
            onClick={handleResetHours}
            title="Reset hours to actual completed totals"
            className="px-3 py-1.5 rounded-full bg-surface-container-high border border-glass-stroke text-xs text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            Reset Hours
          </button>
          <div className="bg-surface-container-high rounded-full px-4 py-2 border border-glass-stroke flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-glow shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
            <span className="font-label-mono text-[13px] text-on-surface-variant">
              Live Time: <span className="text-on-surface font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
        {/* Lecture Schedule Window with Dynamic Stepper Navigation */}
        <div className="glass-panel rounded-xl p-6 lg:col-span-2 flex flex-col min-h-[440px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-headline-md text-[22px] font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-blue">calendar_today</span>
                Schedule for {selectedDayName} <span className="font-label-mono text-electric-blue font-bold text-lg">({formatDDMM(selectedDate)})</span>
              </h3>
              <p className="text-xs font-body-md text-on-surface-variant mt-0.5">Toggle previous/upcoming dates or reset to today.</p>
            </div>

            {/* Date Navigation & Touch-Friendly DD/MM Stepper Controls */}
            <div className="flex items-center gap-1.5 bg-surface-container-lowest p-1 rounded-xl border border-glass-stroke self-start sm:self-auto">
              <button
                onClick={() => handleStepDate(-1)}
                title="Previous Day"
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>

              <span className="font-label-mono text-xs font-bold text-electric-blue px-3 py-1.5 rounded-lg bg-electric-blue/10 border border-electric-blue/30">
                {formatDDMM(selectedDate)}
              </span>

              <button
                onClick={() => handleStepDate(1)}
                title="Next Day"
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>

              {selectedDate !== todayDateStr && (
                <button
                  onClick={handleGoToToday}
                  title="Reset to Today"
                  className="px-2.5 py-1.5 rounded-lg bg-electric-blue/15 text-electric-blue border border-electric-blue/30 font-label-mono text-[11px] font-bold hover:bg-electric-blue/25 transition-all cursor-pointer ml-1"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
            {currentSchedule.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center p-8 border border-dashed border-glass-stroke rounded-xl">
                <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-2">event_busy</span>
                <p className="text-on-surface font-semibold">No classes scheduled for {selectedDate}</p>
                <p className="text-on-surface-variant text-xs mt-1">Use arrow controls above to view other days.</p>
              </div>
            ) : (
              currentSchedule.map((lec, idx) => {
                const badge = getStatusBadge(lec.liveStatus);
                const isCanceled = lec.liveStatus === 'Canceled';
                return (
                  <div
                    key={idx}
                    className={`bg-surface-container/50 border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200 ${badge.card}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-1.5 h-12 rounded-full ${badge.bar}`}></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-body-md font-bold text-base ${isCanceled ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                            {lec.module}
                          </h4>
                          <span className="text-xs text-on-surface-variant">({lec.name})</span>
                        </div>
                        <p className="text-on-surface-variant text-xs flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 font-label-mono text-electric-blue">
                            <span className="material-symbols-outlined text-[14px]">schedule</span> {lec.newTime || lec.time}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">location_on</span> {lec.newVenue || lec.hall}
                          </span>
                        </p>
                        {lec.reason && <p className="text-coral-vibe text-[11px] mt-0.5 font-semibold">Notice: {lec.reason}</p>}
                      </div>
                    </div>

                    <div className={`px-3 py-1 rounded-full border ${badge.bg}`}>
                      <span className={`font-label-mono text-[11px] uppercase ${badge.text}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Sri Lanka Calendar & Notices */}
        <div className="flex flex-col gap-[24px]">
          <SriLankanCalendarWidget selectedDate={selectedDate} onSelectDate={setSelectedDate} />

          {/* Live Notices Feed */}
          <div className="glass-panel-elevated rounded-xl p-6 flex flex-col relative overflow-hidden">
            <h3 className="font-headline-md text-[22px] font-semibold text-on-surface flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-coral-vibe">campaign</span>
              Notices & Alerts
            </h3>
            <div className="flex flex-col gap-4 flex-1 overflow-y-auto max-h-80">
              {notices.map((notice) => (
                <div key={notice.id} className="border-b border-glass-stroke pb-4 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-label-mono text-[11px] text-electric-blue bg-electric-blue/10 px-2 py-0.5 rounded font-bold">
                      {notice.date}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {notice.type && (
                        <span className={`text-[10px] font-label-mono px-2 py-0.5 rounded font-bold uppercase ${
                          notice.type === 'Canceled' ? 'bg-coral-vibe/20 text-coral-vibe border border-coral-vibe/30' : 'bg-emerald-glow/20 text-emerald-glow border border-emerald-glow/30'
                        }`}>
                          {notice.type}
                        </span>
                      )}

                      {/* Admin-Only Edit & Remove Controls */}
                      {isAdmin && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => setEditingNotice(notice)}
                            className="p-1 text-on-surface-variant hover:text-electric-blue rounded transition-colors cursor-pointer"
                            title="Edit Notice (Admin)"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteNotice(notice.id)}
                            className="p-1 text-on-surface-variant hover:text-coral-vibe rounded transition-colors cursor-pointer"
                            title="Remove Notice (Admin)"
                          >
                            <span className="material-symbols-outlined text-xs">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <h4 className="font-body-md font-bold text-on-surface mt-1.5 text-sm">{notice.title}</h4>
                  <p className="text-on-surface-variant text-xs mt-1 leading-relaxed">{notice.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Edit Notice Modal Popup */}
      {editingNotice && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveNoticeEdit} className="glass-panel p-6 rounded-xl max-w-md w-full flex flex-col gap-4 border border-electric-blue/40 shadow-[0_0_25px_rgba(0,212,255,0.2)]">
            <div className="flex justify-between items-center pb-2 border-b border-glass-stroke">
              <h3 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-blue">edit_note</span> Edit Notice (Admin)
              </h3>
              <button
                type="button"
                onClick={() => setEditingNotice(null)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-label-mono uppercase text-on-surface-variant">Title</label>
              <input
                className="bg-surface-container-lowest border border-glass-stroke text-on-surface rounded-lg p-2.5 text-xs outline-none focus:border-electric-blue font-body-md"
                required
                value={editingNotice.title}
                onChange={e => setEditingNotice({ ...editingNotice, title: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-label-mono uppercase text-on-surface-variant">Notice Content</label>
              <textarea
                className="bg-surface-container-lowest border border-glass-stroke text-on-surface rounded-lg p-2.5 text-xs outline-none focus:border-electric-blue font-body-md h-28 resize-none"
                required
                value={editingNotice.content}
                onChange={e => setEditingNotice({ ...editingNotice, content: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingNotice(null)}
                className="px-4 py-2 rounded-lg bg-surface-container-high border border-glass-stroke text-xs font-bold text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-electric px-5 py-2 rounded-lg text-xs font-bold font-label-mono cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Module Lecture Hours Tracker Grid */}
      <div className="mt-4">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-headline-md text-[22px] font-semibold text-on-surface">Module Lecture Hours Tracker</h2>
            <p className="text-xs text-on-surface-variant mt-1">Real-time conducted lecture hours since Semester Start (27th July 2026).</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {moduleHours.map((mod) => {
            const pct = Math.min(100, Math.round((mod.conductedHours / mod.targetHours) * 100));
            return (
              <Link
                key={mod.code}
                to={`/modules/${mod.code}`}
                className="glass-panel rounded-xl p-5 hover:-translate-y-1 transition-transform duration-300 group block"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-label-mono text-xs px-2.5 py-1 bg-electric-blue/15 text-electric-blue border border-electric-blue/30 rounded font-bold">
                    {mod.code}
                  </span>
                  <span className="font-label-mono text-xs font-bold text-emerald-glow">
                    {mod.conductedHours} / {mod.targetHours} hrs ({pct}%)
                  </span>
                </div>

                <h4 className="font-body-lg text-[16px] font-bold text-on-surface group-hover:text-electric-blue transition-colors leading-snug">
                  {mod.title}
                </h4>

                {/* Progress bar */}
                <div className="w-full bg-surface-container-lowest rounded-full h-2.5 mt-4 overflow-hidden border border-glass-stroke">
                  <div
                    className="bg-gradient-to-r from-electric-blue to-emerald-glow h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-xs text-on-surface-variant font-label-mono mt-3">
                  <span>Completed: <b className="text-emerald-glow">{mod.conductedHours} hrs</b></span>
                  <span>Target: <b className="text-on-surface">{mod.targetHours} hrs</b></span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
