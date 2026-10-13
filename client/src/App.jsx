import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { NetworkBanner } from './components/NetworkBanner';
import { PublicView } from './components/views/PublicView';
import { CoordinatorDashboard } from './components/views/CoordinatorDashboard';
import { FieldOfficerView } from './components/views/FieldOfficerView';
import { AdminView } from './components/views/AdminView';
import { DonorView } from './components/views/DonorView';
import { VolunteerView } from './components/views/VolunteerView';
import { IconShield, IconWifi, IconActivity } from './components/Icons';

const MainLayout = () => {
  const { role, toasts, removeToast } = useApp();

  const renderActiveView = () => {
    switch (role) {
      case 'public':
        return <PublicView />;
      case 'coordinator':
        return <CoordinatorDashboard />;
      case 'field_officer':
        return <FieldOfficerView />;
      case 'admin':
        return <AdminView />;
      case 'donor':
        return <DonorView />;
      case 'volunteer':
        return <VolunteerView />;
      default:
        return <CoordinatorDashboard />;
    }
  };

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        <NetworkBanner />
        {renderActiveView()}
      </main>

      {/* Modern Footer with Architecture Overview */}
      <footer style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '2rem 1.5rem',
        marginTop: 'auto',
        fontSize: '0.825rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              <IconShield size={16} style={{ color: 'var(--color-primary)' }} />
              Disaster Resource Coordination (DRC) — Resilient Service Mesh
            </div>
            <p style={{ margin: 0 }}>
              Engineered for low-bandwidth networks, offline queues, idempotency keys, and circuit breaker fault-tolerance.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span>🔒 Idempotent Deduplication</span>
            <span>⚡ REST + GraphQL</span>
            <span>🛡️ SOAP Circuit Breaker</span>
            <span>📦 Client Outbox Sync</span>
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification Stack */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type || 'info'}`}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            <div>{toast.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
