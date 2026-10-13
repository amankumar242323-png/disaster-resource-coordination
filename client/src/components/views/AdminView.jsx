import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  IconShield,
  IconActivity,
  IconRadio,
  IconAlertTriangle,
  IconRefreshCw,
  IconCheckCircle2,
  IconFileText
} from '../Icons';

export const AdminView = () => {
  const {
    declarations,
    circuitBreaker,
    setCircuitBreaker,
    addToast,
    shelters
  } = useApp();

  const [activeTab, setActiveTab] = useState('resilience'); // 'resilience' | 'declarations' | 'logs'

  // Simulated Correlation-ID logs
  const [logs] = useState([
    { id: 'corr-89a12c', timestamp: '01:14:02', verb: 'POST', endpoint: '/reports', status: 201, latency: '194ms', idempotency: 'VALID' },
    { id: 'corr-99b33d', timestamp: '01:12:45', verb: 'POST', endpoint: '/resource-requests', status: 200, latency: '210ms', idempotency: 'DEDUPLICATED' },
    { id: 'corr-44e11a', timestamp: '01:10:19', verb: 'POST', endpoint: '/soap/imd-weather-feed', status: 504, latency: '3000ms', idempotency: 'CIRCUIT_BREAKER_TRIPPED' },
    { id: 'corr-23f88b', timestamp: '01:08:50', verb: 'GET', endpoint: '/graphql', status: 200, latency: '340ms', idempotency: 'CACHE_HIT' },
    { id: 'corr-11c99x', timestamp: '01:05:12', verb: 'PATCH', endpoint: '/shelters/sh-101/inventory', status: 200, latency: '180ms', idempotency: 'VALID' }
  ]);

  const handleCircuitBreakerToggle = (state) => {
    setCircuitBreaker(state);
    if (state === 'OPEN') {
      addToast('Circuit Breaker TRIPPED: Failing fast on government SOAP feed to protect DRC availability.', 'emergency');
    } else if (state === 'HALF_OPEN') {
      addToast('Circuit Breaker set to HALF_OPEN: Probing SOAP feed with canary requests.', 'warning');
    } else {
      addToast('Circuit Breaker RESET to CLOSED: External SOAP feed healthy.', 'success');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Admin Title Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-emergency">Super Administrator</span>
            <span className="badge badge-info">System Architecture & Resilience</span>
          </div>
          <h2 style={{ fontSize: '1.65rem', margin: 0 }}>Disaster Administration & Feed Gateway</h2>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'resilience' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('resilience')}
          >
            <IconActivity size={14} /> Circuit Breaker & SOAP
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'declarations' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('declarations')}
          >
            <IconRadio size={14} /> Declarations
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('logs')}
          >
            <IconFileText size={14} /> Correlation Logs
          </button>
        </div>
      </div>

      {/* Tab 1: Circuit Breaker & External SOAP Integration */}
      {activeTab === 'resilience' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0' }}>External Government SOAP / WSDL Feed Gateway</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Monitors upstream government meteorological alerts. Protected by a timeout circuit breaker.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Breaker State:</span>
                <span className={`badge ${
                  circuitBreaker === 'CLOSED' ? 'badge-success' : circuitBreaker === 'OPEN' ? 'badge-emergency' : 'badge-warning'
                }`}>
                  {circuitBreaker}
                </span>
              </div>
            </div>

            <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>SOAP Endpoint</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                  https://met.gov.in/ws/alerts.wsdl
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Timeout Threshold</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.2rem' }}>
                  3000 ms (Fail-fast fallback)
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Trip Sensitivity</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.2rem' }}>
                  5 failures in 30 sec window
                </div>
              </div>
            </div>

            {/* Circuit Breaker Interactive Simulation Controls */}
            <div style={{
              background: 'var(--bg-tertiary)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <strong style={{ fontSize: '0.9rem' }}>Simulate Circuit Breaker States:</strong>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Test how the platform handles upstream government service slowdowns without freezing core shelter logistics.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${circuitBreaker === 'CLOSED' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleCircuitBreakerToggle('CLOSED')}
                >
                  <IconCheckCircle2 size={14} /> Normal (Closed)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${circuitBreaker === 'OPEN' ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => handleCircuitBreakerToggle('OPEN')}
                >
                  <IconAlertTriangle size={14} /> Trip Breaker (Open)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${circuitBreaker === 'HALF_OPEN' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleCircuitBreakerToggle('HALF_OPEN')}
                >
                  <IconRefreshCw size={14} /> Probe (Half-Open)
                </button>
              </div>
            </div>
          </div>

          {/* System Health Overview */}
          <div className="grid-3">
            <div className="glass-panel stat-card">
              <span className="stat-label">Cache ETag Hit Ratio</span>
              <span className="stat-value" style={{ color: 'var(--color-success)' }}>94.2%</span>
              <span className="stat-meta">Shelter inventory polling bandwidth saved</span>
            </div>

            <div className="glass-panel stat-card">
              <span className="stat-label">Rate Limiting Status</span>
              <span className="stat-value" style={{ color: 'var(--color-primary)' }}>Normal</span>
              <span className="stat-meta">Surge cap: 100 requests / min / IP</span>
            </div>

            <div className="glass-panel stat-card">
              <span className="stat-label">Idempotency Locks</span>
              <span className="stat-value" style={{ color: 'var(--color-info)' }}>Active</span>
              <span className="stat-meta">Zero duplicate allocations detected</span>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Disaster Declarations */}
      {activeTab === 'declarations' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Active Disaster Declarations & Weather Alerts</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {declarations.map((decl) => (
              <div key={decl.id} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span className="badge badge-emergency" style={{ marginBottom: '0.4rem' }}>
                      {decl.warningLevel}
                    </span>
                    <h4 style={{ margin: '0.25rem 0', fontSize: '1.25rem' }}>{decl.type}</h4>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {decl.id}
                  </span>
                </div>

                <div className="grid-3" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Declared At: </span>
                    <strong>{decl.declaredAt}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Peak Wind Speed: </span>
                    <strong>{decl.windSpeed}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Source: </span>
                    <strong>{decl.source}</strong>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Affected Sectors: </span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    {decl.affectedDistricts.join(' • ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Correlation-ID Distributed Tracing Logs */}
      {activeTab === 'logs' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0' }}>Correlation-ID Structured Logs</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Every request carries an end-to-end correlation ID to debug stuck requests in seconds during a crisis.
              </p>
            </div>
            <span className="badge badge-info">Real-Time Trace</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '0.5rem' }}>Correlation ID</th>
                  <th style={{ padding: '0.5rem' }}>Time</th>
                  <th style={{ padding: '0.5rem' }}>Verb</th>
                  <th style={{ padding: '0.5rem' }}>Endpoint</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                  <th style={{ padding: '0.5rem' }}>Latency</th>
                  <th style={{ padding: '0.5rem' }}>Idempotency / Cache</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.65rem 0.5rem', color: 'var(--color-primary)' }}>{log.id}</td>
                    <td style={{ padding: '0.65rem 0.5rem', color: 'var(--text-muted)' }}>{log.timestamp}</td>
                    <td style={{ padding: '0.65rem 0.5rem', fontWeight: 'bold' }}>{log.verb}</td>
                    <td style={{ padding: '0.65rem 0.5rem' }}>{log.endpoint}</td>
                    <td style={{ padding: '0.65rem 0.5rem' }}>
                      <span className={`badge ${log.status === 200 || log.status === 201 ? 'badge-success' : 'badge-emergency'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem' }}>{log.latency}</td>
                    <td style={{ padding: '0.65rem 0.5rem' }}>
                      <span className="badge badge-muted">{log.idempotency}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
