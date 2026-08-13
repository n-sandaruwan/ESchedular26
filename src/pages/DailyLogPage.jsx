import React, { useState, useEffect } from 'react';
import { getStoredDailyLogs, saveStoredDailyLogs } from '../data/dailyLogsData';
import { getStoredModuleHours, saveStoredModuleHours } from '../data/moduleHoursData';
import { getSriLankaDateStr } from '../utils/dateUtils';

import { subscribeToCloudEvent } from '../data/firebaseSync';

function DailyLogPage() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const isAdmin = localStorage.getItem('mis_role') === 'admin';

  useEffect(() => {
    const refresh = () => setLogs(getStoredDailyLogs());
    refresh();

    window.addEventListener('daily_logs_updated', refresh);

    const unsubscribe = subscribeToCloudEvent('daily_logs', (newLogs) => {
      setLogs(newLogs);
    });

    return () => {
      window.removeEventListener('daily_logs_updated', refresh);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleDeleteLog = (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this log entry? This will also subtract the logged hours from the module total.')) return;

    const currentLogs = getStoredDailyLogs();
    const logToDelete = currentLogs.find(l => l.id === id);
    if (!logToDelete) return;

    // 1. Remove from logs
    const updatedLogs = currentLogs.filter(l => l.id !== id);
    saveStoredDailyLogs(updatedLogs);
    setLogs(updatedLogs);

    // 2. Subtract hours from module
    const currentHours = getStoredModuleHours();
    const updatedHours = currentHours.map(m => {
      if (m.code === logToDelete.module) {
        return { ...m, conductedHours: Math.max(0, m.conductedHours - logToDelete.hours) };
      }
      return m;
    });
    saveStoredModuleHours(updatedHours);
  };

  const filteredLogs = logs.filter((item) => {
    const matchesModule = selectedModule === 'ALL' || item.module === selectedModule;
    const matchesSearch =
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.date.includes(searchQuery);
    return matchesModule && matchesSearch;
  });

  const totalConductedHours = filteredLogs.reduce((sum, item) => sum + Number(item.hours), 0);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Log ID', 'Date', 'Module Code', 'Conducted Hours', 'Topic / Content Covered', 'Venue', 'Instructor'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.date}"`,
      `"${l.module}"`,
      l.hours,
      `"${l.topic.replace(/"/g, '""')}"`,
      `"${l.venue}"`,
      `"${l.instructor}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Department_MIS_Lecture_Logs_${getSriLankaDateStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-stack-lg max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card rounded-xl p-stack-md flex flex-col md:flex-row justify-between md:items-center gap-stack-md">
        <div>
          <span className="font-label-bold text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Daily Log Matrix
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface mt-1">Daily Lecture Logs</h2>
          <p className="text-on-surface-variant text-xs mt-0.5">Spreadsheet grid view of all completed lectures, topics, and hour breakdowns.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="btn-electric px-3.5 py-2 rounded-lg text-xs font-label-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(56,189,248,0.3)]"
          >
            <span className="material-symbols-outlined text-sm">download</span> Export to CSV (.xlsx)
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-card p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="flex items-center bg-surface-container px-3 py-2 rounded-lg border border-white/5 w-full sm:w-72 focus-within:border-primary">
            <span className="material-symbols-outlined text-on-surface-variant text-base mr-2">search</span>
            <input
              type="text"
              placeholder="Search topic, venue, instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-on-surface placeholder-on-surface-variant/60 w-full"
            />
          </div>

          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="bg-surface-container border border-white/5 text-on-surface text-xs rounded-lg px-3 py-2 outline-none font-label-bold cursor-pointer"
          >
            <option value="ALL">All Modules</option>
            <option value="EE3203">EE3203 - Measurements</option>
            <option value="EE3202">EE3202 - DSA</option>
            <option value="EE3304">EE3304 - Electromagnetism</option>
            <option value="IS3301">IS3301 - Complex Analysis</option>
            <option value="EE3306">EE3306 - Signals & Systems</option>
            <option value="IS3321">IS3321 - Management</option>
            <option value="EE3205">EE3205 - Power & Energy</option>
            <option value="EE3301">EE3301 - Analog Electronics</option>
            <option value="IS3322">IS3322 - Society & Engineers</option>
          </select>
        </div>

        <div className="text-xs font-label-bold text-on-surface-variant">
          Records: <b className="text-primary">{filteredLogs.length}</b> | Total Conducted: <b className="text-secondary">{totalConductedHours} hrs</b>
        </div>
      </div>

      {/* Spreadsheet Data Grid */}
      <div className="glass-card rounded-xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/80 border-b border-white/5 text-xs font-label-bold text-on-surface-variant uppercase tracking-wider">
                <th className="p-4">Date</th>
                <th className="p-4">Module</th>
                <th className="p-4 text-center">Conducted Hours</th>
                <th className="p-4">Topic / Coverage</th>
                <th className="p-4">Venue</th>
                <th className="p-4">Instructor</th>
                {isAdmin && <th className="p-4 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? "7" : "6"} className="p-8 text-center text-on-surface-variant">
                    No matching lecture logs found for this filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-label-mono text-xs text-primary font-semibold">{log.date}</td>
                    <td className="p-4">
                      <span className="font-label-mono text-xs px-2 py-0.5 bg-surface-container border border-white/10 rounded font-bold text-on-surface">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-label-mono text-xs font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full border border-secondary/20">
                        +{log.hours} hrs
                      </span>
                    </td>
                    <td className="p-4 font-body-md text-on-surface font-medium">{log.topic}</td>
                    <td className="p-4 text-xs text-on-surface-variant">{log.venue}</td>
                    <td className="p-4 text-xs text-on-surface-variant">{log.instructor}</td>
                    {isAdmin && (
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="bg-error/10 text-error hover:bg-error hover:text-white px-2 py-1 rounded-md text-xs font-label-bold border border-error/20 transition-colors"
                          title="Delete this log"
                        >
                          <span className="material-symbols-outlined text-[16px] align-middle">delete</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DailyLogPage;
