import React, { useState } from 'react';
import { studentRegistry } from '../data/dailyLogsData';

function StudentLookupPage() {
  const [queryRegNo, setQueryRegNo] = useState('');
  const [studentResult, setStudentResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanQuery = queryRegNo.trim().toUpperCase();

    const found = studentRegistry.find(
      s => s.regNo.toUpperCase() === cleanQuery || s.regNo.endsWith(cleanQuery)
    );

    if (found) {
      setStudentResult(found);
    } else {
      setStudentResult(null);
      setErrorMsg(`No student record found for "${queryRegNo}". Try EG/2023/001, EG/2023/015, or EG/2023/042.`);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-xl">
        <span className="font-label-mono text-xs text-electric-blue bg-electric-blue/10 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
          Student Portal
        </span>
        <h1 className="font-display-lg text-3xl font-bold text-on-surface mt-2">Registration Number Lookup</h1>
        <p className="text-on-surface-variant text-sm mt-1">Search your registration number to view your lab group allocation, practical slot, and personalized schedule.</p>
      </div>

      {/* Lookup Card Form */}
      <div className="glass-panel p-6 rounded-xl max-w-2xl mx-auto w-full">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-base">badge</span>
            <input
              type="text"
              required
              placeholder="Enter Registration No (e.g. EG/2023/042)"
              value={queryRegNo}
              onChange={(e) => setQueryRegNo(e.target.value)}
              className="w-full bg-surface-container-lowest border border-glass-stroke text-on-surface text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-electric-blue font-label-mono"
            />
          </div>
          <button type="submit" className="btn-electric px-6 py-2.5 rounded-lg font-bold text-sm cursor-pointer">
            Lookup Student
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-coral-vibe/15 border border-coral-vibe/30 text-coral-vibe text-xs">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Result Display Card */}
      {studentResult && (
        <div className="glass-panel-elevated p-6 rounded-xl max-w-2xl mx-auto w-full flex flex-col gap-5 border border-electric-blue/40 shadow-[0_0_20px_rgba(0,212,255,0.15)]">
          <div className="flex justify-between items-center pb-4 border-b border-glass-stroke">
            <div>
              <span className="font-label-mono text-xs text-electric-blue font-bold">{studentResult.regNo}</span>
              <h3 className="font-headline-md text-2xl font-bold text-on-surface mt-0.5">{studentResult.name}</h3>
            </div>
            <span className="font-label-mono text-xs px-3 py-1 rounded-full bg-emerald-glow/15 text-emerald-glow border border-emerald-glow/30 font-bold">
              Active Student
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-container/60 p-4 rounded-lg border border-glass-stroke">
              <span className="text-xs font-label-mono text-on-surface-variant uppercase">Assigned Lab Group</span>
              <h4 className="font-body-md font-bold text-electric-blue text-lg mt-1">{studentResult.labGroup}</h4>
            </div>

            <div className="bg-surface-container/60 p-4 rounded-lg border border-glass-stroke">
              <span className="text-xs font-label-mono text-on-surface-variant uppercase">Weekly Practical Slot</span>
              <h4 className="font-body-md font-bold text-on-surface text-sm mt-1">{studentResult.practicalSlot}</h4>
            </div>
          </div>

          <div className="bg-surface-container-lowest/60 p-4 rounded-lg border border-glass-stroke text-xs text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-electric-blue text-base">info</span>
            Please report to your assigned laboratory venue 5 minutes before your practical slot time.
          </div>
        </div>
      )}

      {/* Sample Registration Numbers Quick Pills */}
      <div className="glass-panel p-4 rounded-xl max-w-2xl mx-auto w-full flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
        <span className="font-label-mono font-semibold">Try Quick Demos:</span>
        {studentRegistry.map((s) => (
          <button
            key={s.regNo}
            onClick={() => {
              setQueryRegNo(s.regNo);
              setStudentResult(s);
              setErrorMsg('');
            }}
            className="px-2.5 py-1 rounded bg-surface-container border border-glass-stroke text-electric-blue hover:bg-electric-blue/10 cursor-pointer font-label-mono"
          >
            {s.regNo} ({s.labGroup})
          </button>
        ))}
      </div>
    </div>
  );
}

export default StudentLookupPage;
