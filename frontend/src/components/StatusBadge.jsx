import React from 'react';

const variants = {
  queued:       'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  scheduled:    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  claimed:      'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  running:      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  completed:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  failed:       'bg-red-500/10 text-red-400 border border-red-500/20',
  dead_letter:  'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  active:       'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  idle:         'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  paused:       'bg-amber-500/10 text-amber-400 border border-amber-500/20',
};

const dots = {
  running: 'bg-yellow-400',
  active:  'bg-emerald-400',
  queued:  'bg-blue-400',
};

export default function StatusBadge({ status }) {
  const key = status?.toLowerCase().replace(/\s+/g, '_');
  const classes = variants[key] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  const dotColor = dots[key];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {dotColor && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />}
      {status?.charAt(0).toUpperCase() + status?.slice(1).replace(/_/g, ' ')}
    </span>
  );
}
