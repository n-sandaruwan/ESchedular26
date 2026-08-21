import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredModuleHours } from '../data/moduleHoursData';

import { subscribeToCloudEvent } from '../data/firebaseSync';

function ModuleTrackerPage() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const refresh = () => setModules(getStoredModuleHours());
    refresh();

    window.addEventListener('module_hours_updated', refresh);
    window.addEventListener('daily_logs_updated', refresh);

    const unsubscribe = subscribeToCloudEvent('module_hours', (newHours) => {
      setModules(newHours);
    });

    return () => {
      window.removeEventListener('module_hours_updated', refresh);
      window.removeEventListener('daily_logs_updated', refresh);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const filteredModules = modules.filter((mod) => {
    return (
      mod.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      
      {/* Sleek Header Toolbar */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 dark:border-white/5 border-black/5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-2xl">view_module</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface">Modules</h2>
              <span className="bg-primary/10 text-primary border border-primary/20 text-xs sm:text-sm font-label-bold px-2.5 py-0.5 rounded-full">
                {modules.length} Courses
              </span>
            </div>
            <p className="text-on-surface-variant text-xs sm:text-sm mt-0.5">Select any module to view details & syllabus.</p>
          </div>
        </div>

        {/* Compact Search Bar */}
        <div className="relative bg-surface-container-low border dark:border-white/10 border-black/10 rounded-xl px-3.5 py-2 flex items-center gap-2 sm:w-72">
          <span className="material-symbols-outlined text-primary text-base">search</span>
          <input
            type="text"
            placeholder="Search module name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs sm:text-sm text-on-surface placeholder-on-surface-variant/50 w-full"
          />
        </div>
      </div>

      {/* Rectangular Module Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredModules.length === 0 ? (
          <div className="col-span-full p-8 text-center glass-card rounded-2xl border dark:border-white/5 border-black/5">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">menu_book</span>
            <p className="text-on-surface font-semibold text-base">No Modules Found</p>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">Try a different search query.</p>
          </div>
        ) : (
          filteredModules.map((mod) => (
            <div
              key={mod.code}
              onClick={() => navigate(`/modules/${mod.code}`)}
              className="glass-card rounded-xl p-4 border dark:border-white/5 border-black/5 hover:border-primary/50 hover:bg-white/[0.04] transition-all cursor-pointer group flex items-center justify-between gap-3.5 shadow-sm"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-label-bold text-xs sm:text-sm px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md font-label-mono shrink-0">
                    {mod.code}
                  </span>
                  <span className="text-xs text-on-surface-variant/80 font-label-mono truncate">
                    {mod.credits || 3} Credits
                  </span>
                </div>
                <h3 className="font-headline-md text-sm sm:text-base font-bold text-on-surface leading-snug group-hover:text-primary transition-colors truncate">
                  {mod.title}
                </h3>
              </div>

              <div className="w-9 h-9 rounded-lg bg-primary/5 border border-primary/10 group-hover:bg-primary/20 group-hover:border-primary/40 flex items-center justify-center text-primary shrink-0 transition-all">
                <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default ModuleTrackerPage;
