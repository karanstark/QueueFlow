import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, User, Shield, Bell, Database } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your account preferences and platform configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar nav */}
        <div className="space-y-1">
          {[
            { icon: User, label: 'Profile', active: true },
            { icon: Shield, label: 'Security' },
            { icon: Bell, label: 'Notifications' },
            { icon: Database, label: 'System' },
          ].map(item => (
            <button key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${item.active ? 'bg-accent/10 text-accent border border-accent/20' : 'text-text-secondary hover:bg-dark-surface hover:text-text-primary'}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Profile Card */}
          <div className="glass-panel p-6">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-accent" /> Profile Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Username</label>
                <input defaultValue={user?.username} className="glass-input w-full" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Email Address</label>
                <input defaultValue={user?.email} className="glass-input w-full" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Account Created</label>
                <input defaultValue={user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'} className="glass-input w-full" readOnly />
              </div>
              <button className="glass-btn glass-btn-primary text-sm" disabled>Save Changes (Demo)</button>
            </div>
          </div>

          {/* API Configuration */}
          <div className="glass-panel p-6">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-accent" /> API Configuration
            </h2>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Backend URL', value: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000' },
                { label: 'API Version', value: '/api' },
                { label: 'Auth Strategy', value: 'JWT Bearer Token' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                  <span className="text-text-secondary">{item.label}</span>
                  <code className="font-mono text-xs text-accent bg-accent/10 px-2 py-1 rounded">{item.value}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
