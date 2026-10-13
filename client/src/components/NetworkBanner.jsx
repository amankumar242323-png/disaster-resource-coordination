import React from 'react';
import { useApp } from '../context/AppContext';
import {
  IconWifiOff,
  IconRefreshCw,
  IconAlertTriangle,
  IconRadio
} from './Icons';

export const NetworkBanner = () => {
  const { networkState, outbox, syncOutboxNow, declarations, circuitBreaker } = useApp();

  const activeDecl = declarations[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.25rem' }}>
      {/* Network Alert (Offline or Congested) */}
      {networkState === 'offline' && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid var(--color-emergency)',
          color: 'var(--text-main)',
          padding: '0.65rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <IconWifiOff size={18} style={{ color: 'var(--color-emergency)' }} />
            <span>
              <strong>Offline Mode Active:</strong> Field connections severed. All updates are buffered locally in Outbox with idempotent keys.
            </span>
          </div>
          {outbox.length > 0 && (
            <span className="badge badge-emergency">
              {outbox.length} pending
            </span>
          )}
        </div>
      )}

      {networkState === 'slow-3g' && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid var(--color-warning)',
          color: 'var(--text-main)',
          padding: '0.65rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <IconRefreshCw size={18} style={{ color: 'var(--color-warning)' }} />
            <span>
              <strong>Congested 3G Network:</strong> 1800ms high-latency link. Retry mechanism & rate-limit throttling in effect.
            </span>
          </div>
        </div>
      )}

      {/* External Circuit Breaker Alert if Open */}
      {circuitBreaker === 'OPEN' && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid var(--color-emergency)',
          padding: '0.5rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.825rem'
        }}>
          <IconAlertTriangle size={16} style={{ color: 'var(--color-emergency)' }} />
          <span>
            <strong>External Feed Circuit Breaker Tripped:</strong> Government SOAP weather gateway unresponsive; cached broadcast used.
          </span>
        </div>
      )}

      {/* Active Disaster Declaration Broadcast */}
      {activeDecl && (
        <div style={{
          background: 'var(--color-primary-bg)',
          border: '1px solid var(--border-accent)',
          padding: '0.55rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.825rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="badge badge-emergency" style={{ fontSize: '0.65rem' }}>
              <span className="pulse-dot" style={{ backgroundColor: '#ef4444' }} /> {activeDecl.warningLevel}
            </span>
            <span style={{ fontWeight: 600 }}>{activeDecl.type}</span>
            <span style={{ color: 'var(--text-muted)' }}>— Wind: {activeDecl.windSpeed} | Districts: {activeDecl.affectedDistricts.join(', ')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            <IconRadio size={14} />
            <span>Feed: {activeDecl.source} ({activeDecl.lastPoll})</span>
          </div>
        </div>
      )}
    </div>
  );
};
