import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search, LogIn, UserPlus, Command, LogOut, User, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'Job completed', message: 'email-sender #1042 finished successfully.', time: '2m ago', read: false },
  { id: 2, title: 'Queue paused', message: 'payments-queue was paused by admin.', time: '15m ago', read: false },
  { id: 3, title: 'Worker offline', message: 'Worker node-3 went offline unexpectedly.', time: '1h ago', read: true },
  { id: 4, title: 'Job failed', message: 'report-gen #998 failed after 3 retries.', time: '3h ago', read: true },
];

export default function Navbar() {
  const [focused, setFocused] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const bellRef = useRef(null);
  const userRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const handleLogout = () => {
    logout();
    setUserOpen(false);
    navigate('/login');
  };

  return (
    <header style={{
      height: '64px',
      borderBottom: '1px solid #262626',
      backgroundColor: 'rgba(10,10,10,0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      flexShrink: 0,
    }}>

      {/* Search Bar */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '380px' }}>
          <Search style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            width: '15px', height: '15px', color: '#64748b', pointerEvents: 'none'
          }} />
          <input
            type="text"
            placeholder="Search queues, jobs, projects..."
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              width: '100%',
              backgroundColor: focused ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${focused ? 'rgba(99,102,241,0.5)' : '#2d2d2d'}`,
              borderRadius: '10px',
              padding: '8px 40px 8px 36px',
              color: '#f1f5f9',
              fontSize: '13px',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
            }}
          />
          <div style={{
            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', gap: '2px',
            backgroundColor: '#1e1e1e', border: '1px solid #333',
            borderRadius: '5px', padding: '2px 5px',
          }}>
            <Command style={{ width: '10px', height: '10px', color: '#64748b' }} />
            <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>K</span>
          </div>
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

        {/* Bell */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setBellOpen((o) => !o); setUserOpen(false); }}
            style={{
              position: 'relative', padding: '8px', borderRadius: '8px', cursor: 'pointer',
              color: bellOpen ? '#f1f5f9' : '#64748b',
              background: bellOpen ? 'rgba(255,255,255,0.05)' : 'transparent',
              border: `1px solid ${bellOpen ? '#2d2d2d' : 'transparent'}`,
              display: 'flex', alignItems: 'center', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = '#2d2d2d'; e.currentTarget.style.color = '#f1f5f9'; }}
            onMouseLeave={e => {
              if (!bellOpen) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.color = '#64748b';
              }
            }}
            title="Notifications"
          >
            <Bell style={{ width: '18px', height: '18px' }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '5px', right: '5px',
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: '#6366f1', border: '2px solid #0a0a0a'
              }} />
            )}
          </button>

          {/* Notifications dropdown */}
          {bellOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: '340px', backgroundColor: '#111', border: '1px solid #262626',
              borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              overflow: 'hidden', zIndex: 100,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #1e1e1e' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: '11px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontWeight: 600 }}>{unreadCount}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ fontSize: '12px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setBellOpen(false)} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                    <X style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>

              {/* Notification items */}
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} style={{
                      padding: '12px 16px', borderBottom: '1px solid #1a1a1a',
                      backgroundColor: n.read ? 'transparent' : 'rgba(99,102,241,0.05)',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = n.read ? 'transparent' : 'rgba(99,102,241,0.05)'}
                      onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '13px', fontWeight: n.read ? 400 : 600, color: n.read ? '#94a3b8' : '#f1f5f9' }}>{n.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#475569' }}>{n.time}</span>
                          {!n.read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#6366f1', flexShrink: 0 }} />}
                        </div>
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', lineHeight: 1.4 }}>{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', backgroundColor: '#262626' }} />

        {/* Logged-in user menu */}
        {user ? (
          <div ref={userRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setUserOpen((o) => !o); setBellOpen(false); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 12px', borderRadius: '9px', fontSize: '13px', fontWeight: 500,
                color: '#cbd5e1', background: 'rgba(255,255,255,0.04)',
                border: '1px solid #2d2d2d', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = '#404040'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = '#2d2d2d'; }}
            >
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {user.username?.[0]?.toUpperCase() ?? <User style={{ width: '12px', height: '12px' }} />}
              </div>
              <span>{user.username}</span>
              <ChevronDown style={{ width: '13px', height: '13px', color: '#64748b' }} />
            </button>

            {userOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: '180px', backgroundColor: '#111', border: '1px solid #262626',
                borderRadius: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                overflow: 'hidden', zIndex: 100,
              }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e1e' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{user.username}</p>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', padding: '10px 14px', fontSize: '13px',
                    color: '#f87171', background: 'none', border: 'none',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut style={{ width: '14px', height: '14px' }} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Login */}
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '8px 16px', borderRadius: '9px', fontSize: '13px', fontWeight: 500,
              color: '#cbd5e1', textDecoration: 'none',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid #2d2d2d',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = '#404040'; e.currentTarget.style.color = '#f1f5f9'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = '#2d2d2d'; e.currentTarget.style.color = '#cbd5e1'; }}
            >
              <LogIn style={{ width: '15px', height: '15px' }} />
              Login
            </Link>

            {/* Register */}
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '8px 16px', borderRadius: '9px', fontSize: '13px', fontWeight: 600,
              color: '#fff', textDecoration: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 0 16px rgba(99,102,241,0.3)',
              border: '1px solid rgba(99,102,241,0.3)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <UserPlus style={{ width: '15px', height: '15px' }} />
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
