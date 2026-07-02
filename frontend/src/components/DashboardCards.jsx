import React from 'react';

export default function DashboardCards({ stats }) {
  const cards = [
    { label: 'Total Jobs',       value: stats?.total_jobs ?? 0,        color: 'from-indigo-600 to-purple-600',  textColor: 'text-indigo-400' },
    { label: 'Queued',           value: stats?.queued_jobs ?? 0,        color: 'from-blue-600 to-cyan-600',      textColor: 'text-blue-400' },
    { label: 'Running',          value: stats?.running_jobs ?? 0,       color: 'from-yellow-600 to-orange-600',  textColor: 'text-yellow-400' },
    { label: 'Completed',        value: stats?.completed_jobs ?? 0,     color: 'from-emerald-600 to-teal-600',   textColor: 'text-emerald-400' },
    { label: 'Failed',           value: stats?.failed_jobs ?? 0,        color: 'from-red-600 to-rose-600',       textColor: 'text-red-400' },
    { label: 'Dead Letter Queue',value: stats?.dead_letter ?? 0,        color: 'from-purple-700 to-pink-700',    textColor: 'text-purple-400' },
    { label: 'Active Workers',   value: stats?.active_workers ?? 0,     color: 'from-teal-600 to-green-600',     textColor: 'text-teal-400' },
    { label: 'Total Queues',     value: stats?.total_queues ?? 0,       color: 'from-violet-600 to-indigo-600',  textColor: 'text-violet-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="glass-card p-5 flex flex-col gap-3 group hover:shadow-[0_0_25px_rgba(99,102,241,0.1)] transition-all duration-300"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className={`w-8 h-1 rounded-full bg-gradient-to-r ${card.color} opacity-80`} />
          <p className="text-4xl font-bold text-text-primary">{card.value}</p>
          <p className={`text-xs font-medium uppercase tracking-wider ${card.textColor}`}>{card.label}</p>
        </div>
      ))}
    </div>
  );
}
