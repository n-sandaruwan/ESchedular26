import React, { useState, useEffect } from 'react';
import { getStoredAuditLogs } from '../data/dailyLogsData';

function AuditLogPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setLogs(getStoredAuditLogs());
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-xl flex justify-between items-center">
        <div>
          <span className="font-label-mono text-xs text-electric-blue bg-electric-blue/10 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
            System Compliance & History
          </span>
          <h1 className="font-display-lg text-3xl font-bold text-on-surface mt-2">Audit Trail Log</h1>
          <p className="text-on-surface-variant text-sm mt-1">Immutable history log recording all schedule modifications, cancellations, and lecture hour edits.</p>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-lg border border-glass-stroke">
          <span className="material-symbols-outlined text-electric-blue text-base">history</span>
          <span className="font-label-mono text-xs text-on-surface-variant">{logs.length} Actions Logged</span>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="glass-panel rounded-xl p-6 flex flex-col gap-4">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">No audit log entries recorded yet.</div>
        ) : (
          logs.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container/50 border border-glass-stroke rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface-container border border-glass-stroke flex items-center justify-center text-electric-blue mt-0.5">
                  <span className="material-symbols-outlined text-xl">manage_history</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-body-md font-bold text-on-surface text-base">{item.action}</h4>
                    <span className="font-label-mono text-[11px] px-2 py-0.5 bg-electric-blue/10 text-electric-blue rounded border border-electric-blue/30 font-semibold">
                      {item.user}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-sm mt-1">{item.details}</p>
                </div>
              </div>

              <div className="text-right flex sm:flex-col justify-between items-end border-t sm:border-t-0 border-glass-stroke pt-2 sm:pt-0">
                <span className="font-label-mono text-xs text-electric-blue font-semibold">{item.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AuditLogPage;
