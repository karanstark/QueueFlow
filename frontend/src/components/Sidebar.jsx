import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Folder, 
  Layers, 
  ListChecks, 
  HardHat, 
  BarChart3, 
  TerminalSquare, 
  Skull, 
  Settings,
  Database
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Projects', path: '/projects', icon: Folder },
  { name: 'Queues', path: '/queues', icon: Layers },
  { name: 'Jobs', path: '/jobs', icon: ListChecks },
  { name: 'Workers', path: '/workers', icon: HardHat },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Logs', path: '/logs', icon: TerminalSquare },
  { name: 'Dead Letter Queue', path: '/dlq', icon: Skull },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-dark-border bg-dark-surface/50 backdrop-blur-md flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-dark-border mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-accent/20 p-2 rounded-lg text-accent animate-pulse-glow">
            <Database className="w-6 h-6" />
          </div>
          <span className="text-lg font-semibold tracking-wide text-text-primary">
            QueueFlow
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent/15 text-accent border border-accent/20 shadow-[inset_0_0_10px_rgba(99,102,241,0.1)]'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-dark-border mt-auto">
        <div className="bg-dark-border/30 rounded-lg p-4 flex flex-col gap-2 border border-white/5">
          <p className="text-xs text-text-secondary">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <span className="text-sm font-medium text-success">All Systems Operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
