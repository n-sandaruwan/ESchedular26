import React, { useState, useEffect } from 'react';
import { getStoredAuditLogs } from '../data/dailyLogsData';

function AuditLogPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setLogs(getStoredAuditLogs());
  }, []);

  return (
    <div className="space-y-stack-lg max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card rounded-xl p-stack-md flex justify-between items-center">
        <div>
          <span className="font-label-bold text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            System History & Audit
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface mt-1">Audit Trail Log</h2>
          <p className="text-on-surface-variant text-xs mt-0.5">
            Immutable history log recording all schedule modifications, cancellations, and lecture hour edits.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-surface-container px-3.5 py-2 rounded-xl border border-white/5">
          <span className="material-symbols-outlined text-primary text-base">history</span>
          <span className="font-label-mono text-xs text-on-surface-variant">{logs.length} Actions Logged</span>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="glass-card rounded-xl p-stack-md flex flex-col gap-4">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant text-sm">No audit log entries recorded yet.</div>
        ) : (
          logs.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container/60 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mt-0.5 shrink-0">
                  <span className="material-symbols-outlined text-xl">manage_history</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline-md font-bold text-on-surface text-base">{item.action}</h4>
                    <span className="font-label-bold text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20">
                      {item.user}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-xs mt-1">{item.details}</p>
                </div>
              </div>

              <div className="text-right flex sm:flex-col justify-between items-end border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                <span className="font-label-mono text-xs text-primary font-semibold">{item.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AuditLogPage;
