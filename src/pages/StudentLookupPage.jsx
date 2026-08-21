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
    <div className="space-y-stack-lg max-w-2xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card p-stack-md rounded-xl">
        <span className="font-label-bold text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Student Portal
        </span>
        <h2 className="font-headline-md text-headline-md text-on-surface mt-2">Registration Number Lookup</h2>
        <p className="text-on-surface-variant text-xs mt-1">
          Search your registration number to view your lab group allocation, practical slot, and personalized schedule.
        </p>
      </div>

      {/* Lookup Card Form */}
      <div className="glass-card p-stack-md rounded-xl w-full">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-base">badge</span>
            <input
              type="text"
              required
              placeholder="Enter Registration No (e.g. EG/2023/042)"
              value={queryRegNo}
              onChange={(e) => setQueryRegNo(e.target.value)}
              className="w-full bg-surface-container border dark:border-white/5 border-black/5 text-on-surface text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-primary font-label-bold"
            />
          </div>
          <button type="submit" className="btn-electric px-6 py-2.5 rounded-lg font-label-bold text-sm cursor-pointer shadow-[0_0_12px_rgba(56,189,248,0.3)]">
            Lookup Student
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Result Display Card */}
      {studentResult && (
        <div className="glass-card p-stack-md rounded-xl w-full flex flex-col gap-4 border-primary/40 active-glow">
          <div className="flex justify-between items-center pb-3 border-b dark:border-white/5 border-black/5">
            <div>
              <span className="font-label-bold text-xs text-primary">{studentResult.regNo}</span>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mt-0.5">{studentResult.name}</h3>
            </div>
            <span className="font-label-bold text-xs px-3 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
              Active Student
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-container/60 p-4 rounded-xl border dark:border-white/5 border-black/5">
              <span className="text-xs font-label-bold text-on-surface-variant uppercase tracking-wider">Assigned Lab Group</span>
              <h4 className="font-headline-md font-bold text-primary text-lg mt-1">{studentResult.labGroup}</h4>
            </div>

            <div className="bg-surface-container/60 p-4 rounded-xl border dark:border-white/5 border-black/5">
              <span className="text-xs font-label-bold text-on-surface-variant uppercase tracking-wider">Weekly Practical Slot</span>
              <h4 className="font-body-md font-semibold text-on-surface text-sm mt-1">{studentResult.practicalSlot}</h4>
            </div>
          </div>

          <div className="bg-surface-container-low p-3.5 rounded-xl border dark:border-white/5 border-black/5 text-xs text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">info</span>
            Please report to your assigned laboratory venue 5 minutes before your practical slot time.
          </div>
        </div>
      )}

      {/* Sample Registration Numbers Quick Pills */}
      <div className="glass-card p-4 rounded-xl w-full flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
        <span className="font-label-bold">Try Quick Demos:</span>
        {studentRegistry.map((s) => (
          <button
            key={s.regNo}
            onClick={() => {
              setQueryRegNo(s.regNo);
              setStudentResult(s);
              setErrorMsg('');
            }}
            className="px-2.5 py-1 rounded-lg bg-surface-container border dark:border-white/5 border-black/5 text-primary hover:bg-primary/10 cursor-pointer font-label-bold text-xs transition-colors"
          >
            {s.regNo} ({s.labGroup})
          </button>
        ))}
      </div>
    </div>
  );
}

export default StudentLookupPage;
