import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { USER_ROLES } from '../services/mockData';
import {
  IconLock,
  IconMail,
  IconLogIn,
  IconUserPlus,
  IconShield,
  IconCheckCircle2,
  IconKey
} from './Icons';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { loginUser, registerUser, DEMO_USERS, addToast } = useApp();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register'

  // Login Form
  const [loginForm, setLoginForm] = useState({
    email: 'coordinator@drc.gov.in',
    password: 'password123'
  });

  // Register Form
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'coordinator',
    agency: '',
    phone: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await loginUser(loginForm.email, loginForm.password);
    setIsLoading(false);
    onClose();
  };

  const handleQuickDemoLogin = async (user) => {
    setIsLoading(true);
    await loginUser(user.email, 'password123');
    setIsLoading(false);
    onClose();
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      addToast('Passwords do not match. Please verify.', 'emergency');
      return;
    }
    if (registerForm.password.length < 6) {
      addToast('Password must be at least 6 characters.', 'warning');
      return;
    }

    setIsLoading(true);
    await registerUser(registerForm);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', padding: '1.75rem' }}
      >
        {/* Header with Title and Mode Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--shadow-glow-primary)'
            }}>
              {mode === 'login' ? <IconLogIn size={20} /> : <IconUserPlus size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                {mode === 'login' ? 'Sign In to DRC' : 'Register Relief Account'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Role-Based JWT Authorization & Operations Mesh
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-tertiary)',
          padding: '0.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          gap: '0.25rem'
        }}>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, border: 'none' }}
            onClick={() => setMode('login')}
          >
            <IconLogIn size={14} /> Sign In
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, border: 'none' }}
            onClick={() => setMode('register')}
          >
            <IconUserPlus size={14} /> Create Account
          </button>
        </div>

        {/* LOGIN MODE */}
        {mode === 'login' ? (
          <div>
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    className="form-control"
                    placeholder="officer@drc.gov.in"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Security Password</label>
                <input
                  type="password"
                  required
                  className="form-control"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={isLoading}
              >
                {isLoading ? 'Verifying Credentials...' : 'Authenticate & Sign In'}
              </button>
            </form>

            {/* Quick Demo One-Click Personas */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Instant One-Click Demo Profiles
                </span>
                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Auto-JWT</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '0.5rem'
              }}>
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleQuickDemoLogin(user)}
                    style={{
                      justifyContent: 'flex-start',
                      padding: '0.5rem 0.65rem',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '0.685rem', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                        {user.role}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* REGISTER MODE */
          <div>
            <form onSubmit={handleRegisterSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    className="form-control"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Official / Personal Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="priya@example.com"
                    className="form-control"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Assigned System Role *</label>
                  <select
                    className="form-control"
                    value={registerForm.role}
                    onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                  >
                    {USER_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label} ({r.badge})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="form-control"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Relief Agency / NGO / Organization (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Indian Red Cross Society, NDRF, Civic Volunteer"
                  className="form-control"
                  value={registerForm.agency}
                  onChange={(e) => setRegisterForm({ ...registerForm, agency: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    className="form-control"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    className="form-control"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-dim)', margin: '0.75rem 0' }}>
                <IconKey size={14} style={{ color: 'var(--color-primary)' }} />
                <span>Upon submission, a cryptographically signed mock JWT token is issued.</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={isLoading}
              >
                {isLoading ? 'Registering Account...' : 'Register Account & Issue JWT'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
