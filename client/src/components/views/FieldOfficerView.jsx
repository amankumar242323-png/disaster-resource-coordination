import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  IconRadio,
  IconAlertTriangle,
  IconMapPin,
  IconSend,
  IconClock,
  IconCheckCircle2,
  IconPackage
} from '../Icons';

export const FieldOfficerView = () => {
  const {
    shelters,
    fieldReports,
    submitFieldReport,
    networkState,
    resourceRequests,
    updateRequestStatus
  } = useApp();

  const [reportForm, setReportForm] = useState({
    author: 'Officer Vikrant Patil (Sector 4 Unit)',
    shelterId: shelters[0]?.id || '',
    location: 'Bayview Coastal Zone A (GPS: 13.0827, 80.2707)',
    severity: 'High',
    hazardType: 'Flash Flood / Access Road Submerged',
    content: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportForm.content.trim()) return;

    setIsSubmitting(true);
    await submitFieldReport(reportForm);
    setIsSubmitting(false);

    setReportForm((prev) => ({
      ...prev,
      content: ''
    }));
  };

  // Find requests assigned / in transit to sector
  const incomingSupplies = resourceRequests.filter((r) => r.status === 'in_transit');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>

      {/* Officer Status Header */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        borderLeft: '4px solid var(--color-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <IconRadio size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Field Operations Console</h3>
              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Team Bravo</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Officer Vikrant Patil • Assigned Sector: Coastal Zone A & Delta Ridge
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Link Quality:</span>
          <span className={`badge ${
            networkState === 'online' ? 'badge-success' : networkState === 'slow-3g' ? 'badge-warning' : 'badge-emergency'
          }`}>
            {networkState.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Primary Action: Transmit Situation Report (Designed for Low-Bandwidth / Offline) */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconAlertTriangle size={20} style={{ color: 'var(--color-warning)' }} />
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Submit Unstructured Situation Report</h3>
          </div>
          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
            Idempotent NoSQL Event Stream
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Real-time intelligence from the ground. If your radio or cellular link drops during submission, your update will be securely saved to the Outbox and will auto-sync upon reconnection.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Sector / Landmark Coordinates</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={reportForm.location}
                  onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Related Relief Shelter</label>
              <select
                className="form-control"
                value={reportForm.shelterId}
                onChange={(e) => setReportForm({ ...reportForm, shelterId: e.target.value })}
              >
                {shelters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.district})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Observed Hazard / Emergency Type *</label>
              <select
                className="form-control"
                value={reportForm.hazardType}
                onChange={(e) => setReportForm({ ...reportForm, hazardType: e.target.value })}
              >
                <option value="Flash Flood / Access Road Submerged">Flash Flood / Access Road Submerged</option>
                <option value="Structural Damage / Bridge Hazard">Structural Damage / Bridge Hazard</option>
                <option value="Waterborne Illness Outbreak Threat">Waterborne Illness Outbreak Threat</option>
                <option value="Stranded Civilians Cluster">Stranded Civilians Cluster</option>
                <option value="Generator Fuel / Power Depleted">Generator Fuel / Power Depleted</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Urgency & Severity Rating *</label>
              <select
                className="form-control"
                value={reportForm.severity}
                onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
              >
                <option value="Low">Low (Informational / Precautionary)</option>
                <option value="Medium">Medium (Potential delay)</option>
                <option value="High">High (Immediate barrier to operations)</option>
                <option value="Extreme">Extreme (Imminent threat to human life)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Situation Detail & Field Observations *</label>
            <textarea
              required
              rows="4"
              placeholder="Describe road accessibility, water depth, stranded counts, specific equipment needed (e.g. 4x4 trucks, water purification, boat rescue)..."
              className="form-control"
              value={reportForm.content}
              onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-dim)' }}>
              🔒 Protected with Auto-Generated Idempotency Key
            </span>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !reportForm.content.trim()}
              style={{ minWidth: '180px' }}
            >
              {isSubmitting ? (
                <>Transmitting...</>
              ) : (
                <>
                  <IconSend size={15} /> Send Field Dispatch
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Incoming Assigned Resources Requiring Acknowledgment */}
      {incomingSupplies.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <IconPackage size={20} style={{ color: 'var(--color-warning)' }} />
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Incoming Supply Transits In Your Sector</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Confirm delivery receipt on ground once the supply convoy reaches your shelter.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {incomingSupplies.map((req) => (
              <div key={req.id} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{req.resourceName}</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    Quantity: <strong>{req.quantity} {req.unit}</strong> • Urgency: <span style={{ color: 'var(--color-emergency)', fontWeight: 600 }}>{req.urgency}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    Note: {req.notes}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ background: 'var(--color-success)' }}
                  onClick={() => updateRequestStatus(req.id, 'delivered')}
                >
                  <IconCheckCircle2 size={15} /> Confirm Arrival & Unload
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical Situation Log */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem' }}>Sector Situation Intelligence Log</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {fieldReports.map((report) => (
            <div key={report.id} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.15rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge ${
                    report.severity === 'Extreme' ? 'badge-emergency' : report.severity === 'High' ? 'badge-warning' : 'badge-info'
                  }`}>
                    {report.severity}
                  </span>
                  <span style={{ fontWeight: 700 }}>{report.hazardType}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <IconClock size={13} />
                  <span>{report.timestamp}</span>
                  {report.syncedOffline && (
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Synced via Outbox</span>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', margin: '0 0 0.65rem 0', lineHeight: 1.5 }}>
                {report.content}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <IconMapPin size={13} /> {report.location}
                </span>
                <span>By: {report.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
