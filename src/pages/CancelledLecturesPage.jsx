import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStoredOverrides, getModulesForDate } from '../data/scheduleStore';
import { sriLankaHolidays2026 } from '../data/sriLankaHolidaysData';
import { getSriLankaDateStr } from '../utils/dateUtils';

function CancelledLecturesPage() {
  const [cancellations, setCancellations] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, PAST, FUTURE

  useEffect(() => {
    const today = getSriLankaDateStr();
    
    // 1. Get Holiday Cancellations
    const holidayCancellationsMap = new Map();
    
    // Semester 3 Duration
    const semesterStart = '2026-07-27';
    const semesterEnd = '2026-11-29';
    
    sriLankaHolidays2026.forEach(holiday => {
      // Only include holidays within the semester period
      if (holiday.date >= semesterStart && holiday.date <= semesterEnd) {
        // Find what was scheduled on this day
        const modules = getModulesForDate(holiday.date).filter(m => m.status !== 'Swapped' && m.status !== 'Rescheduled' || (m.status === 'Canceled'));
        
        if (modules.length > 0) {
        holidayCancellationsMap.set(holiday.date, {
          id: `hol-${holiday.date}`,
          date: holiday.date,
          title: holiday.name,
          type: 'Holiday',
          icon: holiday.icon,
          isPoya: holiday.isPoya,
          isPast: holiday.date < today,
          isToday: holiday.date === today,
          modules: modules.map(m => ({
            ...m,
            cancelReason: `${holiday.type} - Physical lectures cancelled.`
          }))
        });
        }
      }
    });

    // 2. Get Admin Cancellations
    const overrides = getStoredOverrides().filter(o => o.status === 'Canceled');
    const adminCancellationsMap = new Map();

    overrides.forEach(o => {
      const date = o.date;
      
      // Only include overrides within the semester period
      if (date >= semesterStart && date <= semesterEnd) {
        if (holidayCancellationsMap.has(date)) {
          // If it's already a holiday, just append to existing or skip if it's 'ALL'
          const existing = holidayCancellationsMap.get(date);
          if (o.module !== 'ALL') {
             // It's already fetched via getModulesForDate above since getModulesForDate includes overrides
             // Let's just update the reason if needed
             const mod = existing.modules.find(m => m.module === o.module);
             if (mod) {
               mod.cancelReason = o.reason || 'Cancelled by Admin';
             }
          }
        } else {
          // Create new admin cancellation entry for this date
          if (!adminCancellationsMap.has(date)) {
            adminCancellationsMap.set(date, {
              id: `admin-${date}`,
              date: date,
              title: 'Admin Cancellation',
              type: 'Manual',
              icon: 'event_busy',
              isPast: date < today,
              isToday: date === today,
              modules: []
            });
          }
          
          const entry = adminCancellationsMap.get(date);
          
          if (o.module === 'ALL') {
            // Fetch all base modules for this day
            const allModules = getModulesForDate(date);
            entry.modules = allModules.map(m => ({
              ...m,
              cancelReason: o.reason || 'Cancelled by Admin'
            }));
          } else {
            // Find specific module info or create fallback
            const allModulesForDay = getModulesForDate(date);
            const specificModule = allModulesForDay.find(m => m.module === o.module) || {
              module: o.module,
              name: 'Unknown Module',
              time: o.time || 'N/A',
              hall: o.venue || 'N/A'
            };
            
            // prevent duplicates
            if (!entry.modules.find(m => m.module === o.module)) {
              entry.modules.push({
                ...specificModule,
                cancelReason: o.reason || 'Cancelled by Admin'
              });
            }
          }
        }
      }
    });

    // Merge and Sort chronologically (oldest first)
    const allCancellations = [...holidayCancellationsMap.values(), ...adminCancellationsMap.values()];
    allCancellations.sort((a, b) => a.date.localeCompare(b.date));
    
    setCancellations(allCancellations);
  }, []);

  const filteredCancellations = cancellations.filter(c => {
    if (filter === 'PAST') return c.isPast;
    if (filter === 'FUTURE') return !c.isPast;
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto animate-fade-in">
      
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">event_busy</span>
            Cancelled Lectures
          </h2>
          <p className="text-on-surface-variant font-body-md mt-1">
            Track all past and upcoming lecture cancellations due to holidays or admin overrides.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex bg-surface-container-low p-1 rounded-xl border border-white/5">
          {['ALL', 'PAST', 'FUTURE'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-label-bold transition-all cursor-pointer ${
                filter === f
                  ? 'bg-primary text-on-primary shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {f === 'ALL' ? 'All' : f === 'PAST' ? 'Past' : 'Upcoming'}
            </button>
          ))}
        </div>
      </section>

      {/* Cancellations List */}
      <div className="space-y-4">
        {filteredCancellations.length === 0 ? (
          <div className="glass-card p-12 rounded-xl text-center border border-white/5">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/50 mb-3">check_circle</span>
            <h3 className="font-headline-md text-on-surface mb-1">No Cancellations Found</h3>
            <p className="text-sm text-on-surface-variant">There are no cancelled lectures matching your filter.</p>
          </div>
        ) : (
          filteredCancellations.map((item) => (
            <div key={item.id} className="glass-card rounded-xl overflow-hidden border border-white/5 group transition-all hover:border-white/10">
              
              {/* Card Header (Holiday/Admin Info) */}
              <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 ${
                item.type === 'Holiday' 
                  ? (item.isPoya ? 'bg-yellow-500/5' : 'bg-pink-500/5') 
                  : 'bg-error/5'
              }`}>
                <div className="flex items-center gap-3">
                  <span className={item.type === 'Manual' ? 'material-symbols-outlined text-3xl' : 'text-3xl'}>
                    {item.icon}
                  </span>
                  <div>
                    <h3 className={`font-headline-md text-lg font-bold ${
                      item.type === 'Holiday' ? (item.isPoya ? 'text-yellow-500' : 'text-pink-400') : 'text-error'
                    }`}>
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-label-mono text-on-surface-variant mt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                        {item.date}
                      </span>
                      <span>•</span>
                      <span className="uppercase tracking-wider">{item.type} Cancellation</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex gap-2">
                  {item.isToday && (
                    <span className="bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded text-[10px] font-label-bold uppercase">Today</span>
                  )}
                  {item.isPast ? (
                    <span className="bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded text-[10px] font-label-bold uppercase">Past</span>
                  ) : (
                    <span className="bg-secondary/20 text-secondary border border-secondary/30 px-2 py-1 rounded text-[10px] font-label-bold uppercase">Upcoming</span>
                  )}
                </div>
              </div>

              {/* Affected Modules Details */}
              <div className="p-4 bg-surface/30">
                <h4 className="text-xs font-label-bold text-on-surface-variant uppercase tracking-wider mb-3">Affected Sessions</h4>
                
                {item.modules.length === 0 ? (
                  <p className="text-sm text-on-surface-variant italic">No lectures were scheduled for this day.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {item.modules.map((mod, idx) => (
                      <div key={idx} className="relative overflow-hidden bg-gradient-to-br from-surface-container to-surface-container-low p-4 rounded-xl border border-white/10 hover:border-error/30 transition-all shadow-lg">
                        
                        {/* Diagonal warning stripes background */}
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(244,63,94,0.02)_10px,rgba(244,63,94,0.02)_20px)] pointer-events-none"></div>
                        
                        <div className="flex justify-between items-start z-10 relative mb-3">
                          <Link to={`/modules/${mod.module}`} className="font-headline-md font-bold text-error hover:text-error/80 transition-colors text-[15px] pr-2">
                            {mod.module}: {mod.name}
                          </Link>
                          <div className="shrink-0 ml-2">
                            <span className="text-[10px] font-label-bold text-error bg-error/10 border border-error/20 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(244,63,94,0.1)] whitespace-nowrap">
                              {mod.time}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 z-10 relative">
                          <span className="text-xs text-on-surface-variant flex items-center gap-1.5 font-label-mono">
                            <span className="material-symbols-outlined text-[16px] text-primary/70">location_on</span>
                            {mod.hall || mod.venue}
                          </span>
                          
                          <div className="mt-1 pt-3 border-t border-error/10 flex items-start gap-2">
                            <span className="material-symbols-outlined text-[16px] text-error shrink-0">error</span>
                            <p className="text-xs font-body-md text-error/90 leading-tight">
                              {mod.cancelReason || 'Session Cancelled'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default CancelledLecturesPage;
