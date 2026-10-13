import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DisasterMap } from '../DisasterMap';
import {
  IconActivity,
  IconPackage,
  IconAlertTriangle,
  IconCheckCircle2,
  IconRefreshCw,
  IconSend,
  IconUsers,
  IconFileText
} from '../Icons';

export const CoordinatorDashboard = () => {
  const {
    shelters,
    resourceRequests,
    submitResourceRequest,
    updateRequestStatus,
    fieldReports
  } = useApp();

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedShelterId, setSelectedShelterId] = useState(shelters[0]?.id || '');
  const [showGraphQLInspector, setShowGraphQLInspector] = useState(false);

  // Transfer Request Form
  const [transferForm, setTransferForm] = useState({
    fromShelterId: shelters[1]?.id || '',
    toShelterId: shelters[0]?.id || '',
    resourceName: 'Potable Drinking Water (20L)',
    category: 'Water',
    quantity: 50,
    unit: 'cans',
    urgency: 'Critical',
    requestedBy: 'Coordinator Control Command',
    notes: 'Urgent transfer to alleviate acute deficit.'
  });

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    submitResourceRequest(transferForm);
    setShowTransferModal(false);
  };

  // Computed metrics
  const totalCapacity = shelters.reduce((acc, s) => acc + s.capacity, 0);
  const totalOccupancy = shelters.reduce((acc, s) => acc + s.occupancy, 0);
  const pendingRequests = resourceRequests.filter((r) => r.status === 'pending');
  const inTransitRequests = resourceRequests.filter((r) => r.status === 'in_transit');

  let criticalSuppliesCount = 0;
  shelters.forEach((s) => {
    s.inventory.forEach((item) => {
      if (item.status === 'Critical') criticalSuppliesCount++;
    });
  });

  const activeShelter = shelters.find((s) => s.id === selectedShelterId) || shelters[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Top Coordinator Actions & Overview */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-info">Coordinator Operations</span>
            <span className="badge badge-success">Aggregated Live View</span>
          </div>
          <h2 style={{ fontSize: '1.65rem', margin: 0 }}>Relief Logistics & Inventory Command</h2>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowGraphQLInspector(!showGraphQLInspector)}
          >
            <IconFileText size={15} />
            {showGraphQLInspector ? 'Hide GraphQL Inspector' : 'Inspect GraphQL Query'}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowTransferModal(true)}
          >
            <IconSend size={15} /> Create Resource Transfer Request
          </button>
        </div>
      </div>

      {/* High-Level Operational Metrics */}
      <div className="grid-4">
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <span className="stat-label">Total Evacuees</span>
          <span className="stat-value">{totalOccupancy} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {totalCapacity}</span></span>
          <span className="stat-meta">{Math.round((totalOccupancy / totalCapacity) * 100)}% overall sector occupancy</span>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--color-emergency)' }}>
          <span className="stat-label">Critical Shortages</span>
          <span className="stat-value" style={{ color: 'var(--color-emergency)' }}>{criticalSuppliesCount}</span>
          <span className="stat-meta">Items below emergency threshold</span>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <span className="stat-label">Transfers In Transit</span>
          <span className="stat-value" style={{ color: 'var(--color-warning)' }}>{inTransitRequests.length}</span>
          <span className="stat-meta">{pendingRequests.length} awaiting dispatch approval</span>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <span className="stat-label">Active Relief Sites</span>
          <span className="stat-value" style={{ color: 'var(--color-success)' }}>{shelters.length}</span>
          <span className="stat-meta">Coordinated across 4 zones</span>
        </div>
      </div>

      {/* GraphQL Query Inspector (Demonstrates Course Goal: REST + GraphQL side by side) */}
      {showGraphQLInspector && (
        <div className="glass-panel" style={{
          padding: '1.25rem',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid var(--border-accent)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-info" style={{ fontFamily: 'var(--font-mono)' }}>GraphQL Single-Roundtrip Endpoint</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>POST /graphql</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
              1 Round Trip vs 5 Separate REST Calls (Saves ~1200ms on 3G)
            </span>
          </div>

          <pre style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: '#38bdf8',
            overflowX: 'auto',
            margin: 0
          }}>
{`query GetCoordinatorDashboardAggregate {
  shelters(activeDisaster: "VAAYU") {
    id
    name
    district
    occupancy
    capacity
    status
    inventory {
      name
      quantity
      unit
      status
    }
    recentFieldReports(limit: 3) {
      hazardType
      severity
      timestamp
    }
  }
}`}
          </pre>
        </div>
      )}

      {/* Active Resource Allocation & Transfer Requests */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0' }}>Resource Allocation & Inter-Shelter Transfers</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Protected with client-side Idempotency Keys to prevent duplicate allocations during network retries.
            </p>
          </div>
          <span className="badge badge-warning">
            {pendingRequests.length} Pending Approval
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Request ID & Key</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Resource</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>From Shelter</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Destination</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Urgency</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resourceRequests.map((req) => {
                const fromShelter = shelters.find((s) => s.id === req.fromShelterId);
                const toShelter = shelters.find((s) => s.id === req.toShelterId);

                return (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ fontWeight: 700 }}>{req.id}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {req.idempotencyKey.slice(0, 16)}...
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ fontWeight: 600 }}>{req.resourceName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {req.quantity} {req.unit} ({req.category})
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem' }}>
                      {fromShelter?.name || req.fromShelterId}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem' }}>
                      {toShelter?.name || req.toShelterId}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <span className={`badge ${
                        req.urgency === 'Critical' ? 'badge-emergency' : req.urgency === 'Urgent' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {req.urgency}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <span className={`badge ${
                        req.status === 'delivered' ? 'badge-success' : req.status === 'in_transit' ? 'badge-warning' : 'badge-muted'
                      }`}>
                        {req.status === 'in_transit' ? 'In Transit' : req.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        {req.status === 'pending' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => updateRequestStatus(req.id, 'in_transit')}
                          >
                            Approve & Dispatch
                          </button>
                        )}
                        {req.status === 'in_transit' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--color-success)' }}
                            onClick={() => updateRequestStatus(req.id, 'delivered')}
                          >
                            <IconCheckCircle2 size={14} /> Confirm Delivered
                          </button>
                        )}
                        {req.status === 'delivered' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>
                            Stock Transferred ✓
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shelter Map Integration */}
      <DisasterMap onSelectShelter={(shelter) => setSelectedShelterId(shelter.id)} />

      {/* Comprehensive Shelter Inventory Browser */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0' }}>Shelter Supply Depots</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Inspect and rebalance resource buffers across shelters.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select Shelter:</span>
            <select
              value={selectedShelterId}
              onChange={(e) => setSelectedShelterId(e.target.value)}
              className="form-control"
              style={{ width: 'auto' }}
            >
              {shelters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeShelter && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem'
            }}>
              {activeShelter.inventory.map((item) => (
                <div key={item.id} style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>{item.category}</span>
                      <span className={`badge ${
                        item.status === 'Critical' ? 'badge-emergency' : item.status === 'Low' ? 'badge-warning' : 'badge-success'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{item.name}</div>
                  </div>

                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                        {item.quantity} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.unit}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        Min Threshold: {item.minThreshold} {item.unit}
                      </div>
                    </div>

                    {item.status === 'Critical' && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          setTransferForm((prev) => ({
                            ...prev,
                            toShelterId: activeShelter.id,
                            resourceName: item.name,
                            category: item.category,
                            unit: item.unit
                          }));
                          setShowTransferModal(true);
                        }}
                      >
                        Request Restock
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transfer Request Modal */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconSend size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ margin: 0 }}>Create Resource Transfer Order</h3>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowTransferModal(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Transfer requests are executed idempotently to protect inventory counts against duplicate allocations during network retries.
            </p>

            <form onSubmit={handleTransferSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Source Shelter (Origin) *</label>
                  <select
                    className="form-control"
                    value={transferForm.fromShelterId}
                    onChange={(e) => setTransferForm({ ...transferForm, fromShelterId: e.target.value })}
                  >
                    {shelters.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Destination Shelter *</label>
                  <select
                    className="form-control"
                    value={transferForm.toShelterId}
                    onChange={(e) => setTransferForm({ ...transferForm, toShelterId: e.target.value })}
                  >
                    {shelters.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Resource Item *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={transferForm.resourceName}
                  onChange={(e) => setTransferForm({ ...transferForm, resourceName: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-control"
                    value={transferForm.quantity}
                    onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={transferForm.unit}
                    onChange={(e) => setTransferForm({ ...transferForm, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Urgency Level</label>
                  <select
                    className="form-control"
                    value={transferForm.urgency}
                    onChange={(e) => setTransferForm({ ...transferForm, urgency: e.target.value })}
                  >
                    <option value="Critical">Critical (Life Threat / Out of Stock)</option>
                    <option value="Urgent">Urgent (Under 24hr Buffer)</option>
                    <option value="Routine">Routine (General Rebalancing)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-control"
                    value={transferForm.category}
                    onChange={(e) => setTransferForm({ ...transferForm, category: e.target.value })}
                  >
                    <option value="Food">Food / Rations</option>
                    <option value="Water">Potable Water</option>
                    <option value="Medicine">Medicine & First Aid</option>
                    <option value="Bedding">Bedding & Cots</option>
                    <option value="Rescue">Rescue Equipment</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Coordinator Notes</label>
                <textarea
                  rows="2"
                  className="form-control"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTransferModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <IconSend size={15} /> Authorize Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
