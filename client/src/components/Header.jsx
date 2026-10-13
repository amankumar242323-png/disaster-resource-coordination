import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { USER_ROLES } from '../services/mockData';
import { AuthModal } from './AuthModal';
import {
  IconShield,
  IconSun,
  IconMoon,
  IconRefreshCw,
  IconPackage,
  IconLogIn,
  IconLogOut,
  IconUserPlus
} from './Icons';

export const Header = () => {
  const {
    role,
    setRole,
    theme,
    setTheme,
    currentUser,
    logoutUser,
    networkState,
    outbox,
    syncOutboxNow
  } = useApp();

  const [showOutboxModal, setShowOutboxModal] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({ isOpen: false, mode: 'login' });

  const currentRoleObj = USER_ROLES.find((r) => r.id === role) || USER_ROLES[0];

  return (
    <>
      <header className="header-bar" style={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0.75rem 1.5rem',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Brand Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-emergency), var(--color-primary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--shadow-md)'
            }}>
              <IconShield size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                  DRC <span style={{ color: 'var(--color-primary)' }}>Relief</span>
                </span>
                <span className="badge badge-emergency" style={{ fontSize: '0.65rem' }}>
                  <span className="pulse-dot" style={{ backgroundColor: 'var(--color-emergency)' }} /> Live Ops
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
                Disaster Resource Coordination & Resilience Mesh
              </p>
            </div>
          </div>

          {/* Controls: Outbox, Role, Mode, Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>

            {/* Outbox Badge button */}
            <button
              type="button"
              className={`btn btn-sm ${outbox.length > 0 ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setShowOutboxModal(true)}
              style={{ position: 'relative' }}
              title="Resilient Outbox & Idempotency Queue"
            >
              <IconPackage size={15} />
              <span>Outbox</span>
              {outbox.length > 0 && (
                <span style={{
                  background: '#ffffff',
                  color: '#ef4444',
                  borderRadius: '10px',
                  padding: '0.1rem 0.45rem',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}>
                  {outbox.length}
                </span>
              )}
            </button>

            {/* Persona / Role Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.45rem 0.85rem',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {USER_ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label} ({r.badge})
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Switcher (Dark / Light) */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                style={{
                  border: '1px solid var(--border-accent)',
                  padding: '0.45rem 0.75rem',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? (
                  <>
                    <IconMoon size={15} style={{ color: 'var(--color-primary)' }} />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <IconSun size={15} style={{ color: '#f59e0b' }} />
                    <span>Light Mode</span>
                  </>
                )}
              </button>
            </div>

            {/* User Auth Section */}
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div
                  onClick={() => setAuthModalConfig({ isOpen: true, mode: 'login' })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-accent)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.35rem 0.65rem',
                    cursor: 'pointer'
                  }}
                  title="Signed In: Click to view profile / switch account"
                >
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                  <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', maxWidth: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 600 }}>
                      {currentUser.role}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={logoutUser}
                  style={{ padding: '0.45rem 0.65rem' }}
                  title="Sign Out"
                >
                  <IconLogOut size={15} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setAuthModalConfig({ isOpen: true, mode: 'login' })}
                >
                  <IconLogIn size={14} /> Sign In
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setAuthModalConfig({ isOpen: true, mode: 'register' })}
                >
                  <IconUserPlus size={14} /> Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Outbox Modal */}
      {showOutboxModal && (
        <div className="modal-overlay" onClick={() => setShowOutboxModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconPackage size={22} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ margin: 0 }}>Offline Outbox Queue</h3>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowOutboxModal(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Actions submitted during bad network connectivity are locked with unique <strong>Idempotency Keys</strong> to prevent double-allocations and duplicate records when retried.
            </p>

            {outbox.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)'
              }}>
                <IconShield size={36} style={{ color: 'var(--color-success)', marginBottom: '0.5rem' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>All queues clear!</p>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>No pending offline mutations.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                {outbox.map((item) => (
                  <div key={item.id} style={{
                    background: 'var(--bg-tertiary)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '4px solid var(--color-warning)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</span>
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Pending Sync</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                      Idempotency Key: {item.idempotencyKey}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Queued at: {item.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowOutboxModal(false)}
              >
                Close
              </button>
              {outbox.length > 0 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    syncOutboxNow();
                    setShowOutboxModal(false);
                  }}
                  disabled={networkState === 'offline'}
                >
                  <IconRefreshCw size={15} /> Force Sync Queue
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalConfig.isOpen}
        initialMode={authModalConfig.mode}
        onClose={() => setAuthModalConfig({ isOpen: false, mode: 'login' })}
      />
    </>
  );
};
