import React from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel px-3 py-2 text-sm border-accent/30">
        <p className="text-text-secondary mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Job Throughput - Area Chart
export function ThroughputChart({ data }) {
  const chartData = data?.length ? data : Array.from({ length: 12 }, (_, i) => ({
    time: `${i + 1}:00`,
    completed: Math.floor(Math.random() * 80 + 20),
    failed: Math.floor(Math.random() * 10),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
        <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
        <Area type="monotone" dataKey="completed" stroke="#6366f1" fill="url(#completedGrad)" strokeWidth={2} name="Completed" />
        <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="url(#failedGrad)" strokeWidth={2} name="Failed" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Queue Distribution - Pie Chart
export function QueueDistributionChart({ data }) {
  const chartData = data?.length ? data : [
    { name: 'Email', value: 35 },
    { name: 'Payment', value: 25 },
    { name: 'Export', value: 20 },
    { name: 'Image', value: 20 },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.9} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Worker Utilization - Bar Chart
export function WorkerUtilizationChart({ data }) {
  const chartData = data?.length ? data : [
    { worker: 'W-01', cpu: 72, mem: 55 },
    { worker: 'W-02', cpu: 45, mem: 38 },
    { worker: 'W-03', cpu: 89, mem: 67 },
    { worker: 'W-04', cpu: 23, mem: 20 },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
        <XAxis dataKey="worker" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
        <Bar dataKey="cpu" fill="#6366f1" radius={[4, 4, 0, 0]} name="CPU %" maxBarSize={30} />
        <Bar dataKey="mem" fill="#10b981" radius={[4, 4, 0, 0]} name="Mem %" maxBarSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Failure Rate - Line Chart
export function FailureRateChart({ data }) {
  const chartData = data?.length ? data : Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    rate: parseFloat((Math.random() * 8 + 1).toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
        <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} name="Failure %" />
      </LineChart>
    </ResponsiveContainer>
  );
}
