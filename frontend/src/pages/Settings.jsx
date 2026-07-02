import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Bell, Database, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const TABS = ['Profile', 'Security', 'Notifications', 'System'];
const TAB_ICONS = { Profile: User, Security: Shield, Notifications: Bell, System: Database };

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Profile');

  // Profile tab state
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // Security tab state
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [secMsg, setSecMsg] = useState('');
  const [secErr, setSecErr] = useState('');

  // Notification prefs state (local only — stored in localStorage)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('qf_notif_prefs') || '{}'); } catch { return {}; }
  });

  const saveNotifPrefs = (key, value) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    localStorage.setItem('qf_notif_prefs', JSON.stringify(updated));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSecMsg(''); setSecErr('');
    if (newPass !== confirmPass) { setSecErr('New passwords do not match.'); return; }
    if (newPass.length < 6) { setSecErr('Password must be at least 6 characters.'); return; }
    try {
      // Re-login with old password to verify, then register with new password is not directly supported
      // We call a change-password endpoint — if not available, show info
      await api.patch('/api/auth/change-password', { old_password: oldPass, new_password: newPass });
      setSecMsg('Password updated successfully.');
      setOldPass(''); setNewPass(''); setConfirmPass('');
    } catch (err) {
      // Endpoint may not exist yet — show a graceful message
      if (err.response?.status === 404) {
        setSecErr('Password change coming soon — update your account via the API directly for now.');
      } else {
        setSecErr(err.response?.data?.detail || 'Failed to update password.');
      }
    }
  };

  const handleLogoutAll = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <div className="glass-panel p-8 text-center">
          <AlertCircle className="w-10 h-10 text-warning mx-auto mb-3" />
          <p className="text-text-primary font-medium mb-2">You're not logged in</p>
          <p className="text-text-secondary text-sm mb-4">Sign in to manage your account settings.</p>
          <button onClick={() => navigate('/login')} className="glass-btn glass-btn-primary text-sm">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your account preferences and platform configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-1">
          {TABS.map(tab => {
            const Icon = TAB_ICONS[tab];
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all
                  ${activeTab === tab
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-text-secondary hover:bg-dark-surface hover:text-text-primary border border-transparent'}`}>
                <Icon className="w-4 h-4" /> {tab}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-5">

          {/* ── Profile Tab ── */}
          {activeTab === 'Profile' && (
            <div className="glass-panel p-6 space-y-4">
              <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <User className="w-4 h-4 text-accent" /> Profile Information
              </h2>
              {profileMsg && <div className="bg-success/10 border border-success/30 text-emerald-400 text-sm rounded-lg p-3 flex items-center gap-2"><Check className="w-4 h-4" />{profileMsg}</div>}
              {profileErr && <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg p-3">{profileErr}</div>}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Username</label>
                <input value={user?.username || ''} className="glass-input w-full" readOnly
                  style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                <p className="text-xs text-text-secondary mt-1">Username cannot be changed after registration.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Email Address</label>
                <input value={user?.email || ''} className="glass-input w-full" readOnly
                  style={{ opacity: 0.7, cursor: 'not-allowed' }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Account Created</label>
                <input value={user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  className="glass-input w-full" readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Account ID</label>
                <input value={`#${user?.id || '—'}`} className="glass-input w-full" readOnly
                  style={{ opacity: 0.7, cursor: 'not-allowed' }} />
              </div>
            </div>
          )}

          {/* ── Security Tab ── */}
          {activeTab === 'Security' && (
            <div className="space-y-5">
              <div className="glass-panel p-6">
                <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-accent" /> Change Password
                </h2>
                {secMsg && <div className="bg-success/10 border border-success/30 text-emerald-400 text-sm rounded-lg p-3 mb-4 flex items-center gap-2"><Check className="w-4 h-4" />{secMsg}</div>}
                {secErr && <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg p-3 mb-4">{secErr}</div>}
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Current Password</label>
                    <div className="relative">
                      <input type={showOld ? 'text' : 'password'} value={oldPass}
                        onChange={e => setOldPass(e.target.value)} className="glass-input w-full pr-10" required />
                      <button type="button" onClick={() => setShowOld(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                        {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">New Password</label>
                    <div className="relative">
                      <input type={showNew ? 'text' : 'password'} value={newPass}
                        onChange={e => setNewPass(e.target.value)} className="glass-input w-full pr-10" required />
                      <button type="button" onClick={() => setShowNew(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Confirm New Password</label>
                    <input type="password" value={confirmPass}
                      onChange={e => setConfirmPass(e.target.value)} className="glass-input w-full" required />
                  </div>
                  <button type="submit" className="glass-btn glass-btn-primary text-sm">Update Password</button>
                </form>
              </div>

              <div className="glass-panel p-6">
                <h2 className="text-base font-semibold text-text-primary mb-1 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-400" /> Danger Zone
                </h2>
                <p className="text-text-secondary text-sm mb-4">Sign out from all devices by logging out now.</p>
                <button onClick={handleLogoutAll}
                  className="glass-btn glass-btn-danger text-sm">
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* ── Notifications Tab ── */}
          {activeTab === 'Notifications' && (
            <div className="glass-panel p-6">
              <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent" /> Notification Preferences
              </h2>
              <div className="space-y-4">
                {[
                  { key: 'job_completed', label: 'Job Completed', desc: 'Notify when a job finishes successfully' },
                  { key: 'job_failed', label: 'Job Failed', desc: 'Notify when a job fails or exceeds retries' },
                  { key: 'queue_paused', label: 'Queue Paused', desc: 'Notify when a queue is paused' },
                  { key: 'worker_offline', label: 'Worker Offline', desc: 'Notify when a worker goes offline' },
                  { key: 'dlq_entry', label: 'Dead Letter Queue', desc: 'Notify when a job enters the DLQ' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-dark-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{label}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => saveNotifPrefs(key, !notifPrefs[key])}
                      className={`relative w-11 h-6 rounded-full transition-colors ${notifPrefs[key] ? 'bg-accent' : 'bg-dark-border'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notifPrefs[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-secondary mt-4">Preferences are saved locally in your browser.</p>
            </div>
          )}

          {/* ── System Tab ── */}
          {activeTab === 'System' && (
            <div className="space-y-5">
              <div className="glass-panel p-6">
                <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-accent" /> API Configuration
                </h2>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Backend URL', value: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000' },
                    { label: 'API Prefix', value: '/api' },
                    { label: 'Auth Strategy', value: 'JWT Bearer Token' },
                    { label: 'Token Expiry', value: '8 days' },
                    { label: 'Environment', value: import.meta.env.MODE || 'development' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                      <span className="text-text-secondary">{item.label}</span>
                      <code className="font-mono text-xs text-accent bg-accent/10 px-2 py-1 rounded">{item.value}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-6">
                <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-accent" /> Platform Info
                </h2>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Frontend', value: 'React 18 + Vite + Tailwind CSS' },
                    { label: 'Backend', value: 'FastAPI + SQLAlchemy (async)' },
                    { label: 'Database', value: 'SQLite / PostgreSQL' },
                    { label: 'Worker', value: 'Asyncio concurrent job runner' },
                    { label: 'Version', value: 'v1.0.0' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                      <span className="text-text-secondary">{item.label}</span>
                      <span className="text-text-primary text-xs">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
