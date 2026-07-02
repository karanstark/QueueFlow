import React, { useState, useEffect, useRef } from 'react';
import { TerminalSquare, RefreshCw, Download } from 'lucide-react';

// Simulated log entries for display
const generateLogs = () => {
  const entries = [
    { ts: new Date(Date.now() - 10000), level: 'INFO',  msg: 'Worker dfbd2914 registered and started polling.' },
    { ts: new Date(Date.now() - 9000),  level: 'INFO',  msg: 'Job #1 claimed by worker dfbd2914.' },
    { ts: new Date(Date.now() - 8500),  level: 'DEBUG', msg: 'Executing payload: {"task":"send_email","to":"user@example.com"}' },
    { ts: new Date(Date.now() - 8000),  level: 'INFO',  msg: 'Job #1 completed in 512ms.' },
    { ts: new Date(Date.now() - 7000),  level: 'INFO',  msg: 'Job #2 claimed by worker dfbd2914.' },
    { ts: new Date(Date.now() - 6500),  level: 'WARN',  msg: 'Job #2: Retry attempt 1/3 — connection timeout.' },
    { ts: new Date(Date.now() - 6000),  level: 'INFO',  msg: 'Job #2 completed on retry in 1024ms.' },
    { ts: new Date(Date.now() - 5000),  level: 'INFO',  msg: 'Heartbeat received from worker dfbd2914.' },
    { ts: new Date(Date.now() - 4000),  level: 'ERROR', msg: 'Job #3 failed: max retries (3) exceeded. Moving to DLQ.' },
    { ts: new Date(Date.now() - 3000),  level: 'INFO',  msg: 'Worker dfbd2914 polling for next job...' },
    { ts: new Date(Date.now() - 2000),  level: 'INFO',  msg: 'Queue "email-notifications" status: active. 0 pending jobs.' },
    { ts: new Date(Date.now() - 1000),  level: 'DEBUG', msg: 'Stats refreshed. Total jobs: 3, Completed: 2, Failed: 1.' },
  ];
  return entries;
};

const levelColors = {
  INFO:  'text-blue-400',
  DEBUG: 'text-text-secondary',
  WARN:  'text-yellow-400',
  ERROR: 'text-red-400',
};

export default function Logs() {
  const [logs, setLogs] = useState(generateLogs());
  const [filter, setFilter] = useState('ALL');
  const bottomRef = useRef(null);

  const refresh = () => {
    setLogs([...generateLogs(), {
      ts: new Date(), level: 'INFO',
      msg: `Log refresh at ${new Date().toLocaleTimeString()}.`
    }]);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.level === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Execution Logs</h1>
          <p className="text-text-secondary text-sm mt-1">Real-time log viewer for worker and job events</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refresh} className="glass-btn glass-btn-secondary text-sm"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'].map(l => (
          <button key={l} onClick={() => setFilter(l)}
            className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all ${filter === l ? 'bg-accent text-white' : 'bg-dark-surface border border-dark-border text-text-secondary hover:text-text-primary'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Terminal */}
      <div className="glass-panel overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-border bg-dark-surface/80">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="ml-3 text-xs text-text-secondary font-mono">queueflow — logs — bash</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-text-secondary">{filtered.length} entries</span>
          </div>
        </div>
        {/* Log output */}
        <div className="bg-black/60 p-4 h-96 overflow-y-auto font-mono text-xs space-y-1.5">
          {filtered.map((log, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-text-secondary shrink-0">
                {log.ts.toISOString().replace('T', ' ').slice(0, 19)}
              </span>
              <span className={`font-bold shrink-0 w-12 ${levelColors[log.level]}`}>{log.level}</span>
              <span className="text-gray-200">{log.msg}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
