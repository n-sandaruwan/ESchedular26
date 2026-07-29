import React, { useState, useEffect } from 'react';
import { getStoredDailyLogs } from '../data/dailyLogsData';

function DailyLogPage() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');

  useEffect(() => {
    setLogs(getStoredDailyLogs());
  }, []);

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

  // CSV Export function
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
    link.setAttribute('download', `Department_MIS_Lecture_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <span className="font-label-mono text-xs text-electric-blue bg-electric-blue/10 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
            Data Retrieval System
          </span>
          <h1 className="font-display-lg text-3xl font-bold text-on-surface mt-2">Daily Evening Lecture Logs</h1>
          <p className="text-on-surface-variant text-sm mt-1">Spreadsheet grid view of all completed lectures, topics, and hour breakdowns.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="btn-electric px-4 py-2.5 rounded-lg text-xs font-bold font-label-mono flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(0,212,255,0.3)]"
          >
            <span className="material-symbols-outlined text-base">download</span> Export to CSV (.xlsx)
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="flex items-center bg-surface-container-lowest px-3 py-2 rounded-lg border border-glass-stroke w-full sm:w-72 focus-within:border-electric-blue">
            <span className="material-symbols-outlined text-on-surface-variant text-base mr-2">search</span>
            <input
              type="text"
              placeholder="Search topic, venue, instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-on-surface placeholder-on-surface-variant w-full"
            />
          </div>

          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="bg-surface-container-lowest border border-glass-stroke text-on-surface text-xs rounded-lg px-3 py-2 outline-none font-label-mono cursor-pointer"
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

        <div className="text-xs font-label-mono text-on-surface-variant">
          Showing <b className="text-electric-blue">{filteredLogs.length}</b> records | Total Hours: <b className="text-emerald-glow">{totalConductedHours} hrs</b>
        </div>
      </div>

      {/* Spreadsheet Data Grid */}
      <div className="glass-panel rounded-xl overflow-hidden border border-glass-stroke">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest/80 border-b border-glass-stroke text-xs font-label-mono text-on-surface-variant uppercase">
                <th className="p-4">Date</th>
                <th className="p-4">Module</th>
                <th className="p-4 text-center">Conducted Hours</th>
                <th className="p-4">Topic / Coverage</th>
                <th className="p-4">Venue</th>
                <th className="p-4">Instructor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-stroke text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-on-surface-variant">
                    No matching lecture logs found for this filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="p-4 font-label-mono text-xs text-electric-blue font-semibold">{log.date}</td>
                    <td className="p-4">
                      <span className="font-label-mono text-xs px-2 py-0.5 bg-surface-container-high border border-glass-stroke rounded font-bold text-on-surface">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-label-mono text-xs font-bold text-emerald-glow bg-emerald-glow/10 px-2.5 py-1 rounded-full border border-emerald-glow/30">
                        +{log.hours} hrs
                      </span>
                    </td>
                    <td className="p-4 font-body-md text-on-surface font-medium">{log.topic}</td>
                    <td className="p-4 font-label-mono text-xs text-on-surface-variant">{log.venue}</td>
                    <td className="p-4 text-xs text-on-surface-variant">{log.instructor}</td>
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
