import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DisasterMap } from '../DisasterMap';
import { AuthModal } from '../AuthModal';
import {
  IconLifeBuoy,
  IconMapPin,
  IconPhone,
  IconAlertTriangle,
  IconCheckCircle2,
  IconUsers,
  IconDroplet,
  IconSend,
  IconLogIn,
  IconUserPlus
} from '../Icons';

export const PublicView = () => {
  const { shelters, submitAssistanceRequest, currentUser } = useApp();
  const [showSosModal, setShowSosModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [filterAcceptingOnly, setFilterAcceptingOnly] = useState(false);

  // SOS Form State
  const [sosForm, setSosForm] = useState({
    name: '',
    phone: '',
    location: '',
    peopleCount: 1,
    neededAssistance: 'Evacuation & Boat Rescue',
    urgency: 'Critical',
    nearestShelterId: shelters[0]?.id || '',
    description: ''
  });

  const handleSosSubmit = (e) => {
    e.preventDefault();
    submitAssistanceRequest(sosForm);
    setShowSosModal(false);
    setSosForm({
      name: '',
      phone: '',
      location: '',
      peopleCount: 1,
      neededAssistance: 'Evacuation & Boat Rescue',
      urgency: 'Critical',
      nearestShelterId: shelters[0]?.id || '',
      description: ''
    });
  };

  const displayedShelters = filterAcceptingOnly
    ? shelters.filter((s) => s.status === 'Accepting People')
    : shelters;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Hero SOS Banner */}
      <div className="glass-panel" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(30, 41, 59, 0.8) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-emergency">Citizen Emergency Portal</span>
            <span className="badge badge-info">24/7 Operations</span>
          </div>
          <h2 style={{ fontSize: '1.85rem', marginBottom: '0.5rem', color: '#ffffff' }}>
            Are you or your family stranded in the disaster zone?
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Find active shelters accepting evacuees with food and medical care, or transmit an emergency SOS beacon to nearby disaster response boats.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-danger btn-lg"
            onClick={() => setShowSosModal(true)}
            style={{
              padding: '0.85rem 1.6rem',
              fontSize: '1rem',
              boxShadow: 'var(--shadow-glow-red)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}
          >
            <span className="pulse-dot" style={{ backgroundColor: '#ffffff' }} />
            Transmit Emergency SOS
          </button>

          {!currentUser && (
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={() => setShowAuthModal({ isOpen: true, mode: 'login' })}
            >
              <IconLogIn size={16} /> Official Sign In / Register
            </button>
          )}
        </div>
      </div>

      {/* Emergency Hotline Directory Cards */}
      <div className="grid-4">
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--color-emergency)' }}>
          <span className="stat-label">Disaster Control Center</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>1077 / 112</span>
          <span className="stat-meta">State Emergency Operations</span>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <span className="stat-label">Flood Rescue & Boats</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>+91 44 2859 3990</span>
          <span className="stat-meta">Coast Guard & NDRF Taskforce</span>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <span className="stat-label">Medical Emergencies</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>108 / 102</span>
          <span className="stat-meta">Ambulance & Trauma Dispatch</span>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <span className="stat-label">Drinking Water Hotline</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>+91 44 4567 8900</span>
          <span className="stat-meta">Emergency Water Tanker Supply</span>
        </div>
      </div>

      {/* Interactive Shelter Map Section */}
      <div>
        <DisasterMap />
      </div>

      {/* Shelter Directory Grid with Occupancy & Acceptance Status */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0' }}>Nearby Relief Shelters</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Live occupancy and status reported by onsite managers
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterAcceptingOnly}
                onChange={(e) => setFilterAcceptingOnly(e.target.checked)}
              />
              Show Only Shelters Accepting Evacuees
            </label>
          </div>
        </div>

        <div className="grid-2">
          {displayedShelters.map((shelter) => {
            const isFull = shelter.occupancy >= shelter.capacity;
            const remainingSpots = shelter.capacity - shelter.occupancy;

            return (
              <div key={shelter.id} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span className={`badge ${
                      shelter.status === 'Accepting People' ? 'badge-success' : 'badge-emergency'
                    }`}>
                      {shelter.status}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: remainingSpots > 0 ? 'var(--color-success)' : 'var(--color-emergency)' }}>
                      {remainingSpots > 0 ? `${remainingSpots} spots open` : 'At maximum capacity'}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem' }}>{shelter.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>
                    <IconMapPin size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                    {shelter.address} ({shelter.district})
                  </p>

                  {/* Occupancy bar */}
                  <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden', margin: '0.5rem 0' }}>
                    <div style={{
                      width: `${Math.min(100, (shelter.occupancy / shelter.capacity) * 100)}%`,
                      height: '100%',
                      background: isFull ? 'var(--color-emergency)' : 'var(--color-primary)'
                    }} />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.75rem',
                  fontSize: '0.85rem'
                }}>
                  <a
                    href={`tel:${shelter.phone}`}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    <IconPhone size={14} /> Call Helpline: {shelter.phone}
                  </a>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setSosForm((prev) => ({ ...prev, nearestShelterId: shelter.id }));
                      setShowSosModal(true);
                    }}
                  >
                    Request Pickup Here
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Citizen Safety & Relief Advisories */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Emergency Public Safety Advisories</h3>
        <div className="grid-3">
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning)', marginBottom: '0.4rem', fontWeight: 600 }}>
              <IconDroplet size={18} /> Safe Drinking Water
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
              Flood waters contaminate municipal lines. Boil all tap water for at least 3 minutes or use chlorination tablets before drinking.
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-emergency)', marginBottom: '0.4rem', fontWeight: 600 }}>
              <IconAlertTriangle size={18} /> Power & Electrocution Hazard
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
              Avoid wading through water near downed power lines or flooded transformers. Turn off mains if water enters ground floor.
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', marginBottom: '0.4rem', fontWeight: 600 }}>
              <IconLifeBuoy size={18} /> Vertical Evacuation
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
              If streets are rapidly flooding and you cannot reach a shelter, move to the 2nd floor or roof with drinking water and flashlights.
            </p>
          </div>
        </div>
      </div>

      {/* SOS Modal */}
      {showSosModal && (
        <div className="modal-overlay" onClick={() => setShowSosModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--color-emergency)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <IconLifeBuoy size={18} />
                </div>
                <h3 style={{ margin: 0 }}>Emergency Citizen Assistance (SOS)</h3>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowSosModal(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Submitting this will broadcast your distress call to active field rescue units and shelter coordinators. (Works completely offline via Outbox queue).
            </p>

            <form onSubmit={handleSosSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name or Family Contact *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  className="form-control"
                  value={sosForm.name}
                  onChange={(e) => setSosForm({ ...sosForm, name: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="form-control"
                    value={sosForm.phone}
                    onChange={(e) => setSosForm({ ...sosForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Number of People Stranded *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    className="form-control"
                    value={sosForm.peopleCount}
                    onChange={(e) => setSosForm({ ...sosForm, peopleCount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Current Exact Location / Landmark *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2nd Floor, Green Valley Apt, Lowland Basin near River Bridge"
                  className="form-control"
                  value={sosForm.location}
                  onChange={(e) => setSosForm({ ...sosForm, location: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Assistance Needed *</label>
                  <select
                    className="form-control"
                    value={sosForm.neededAssistance}
                    onChange={(e) => setSosForm({ ...sosForm, neededAssistance: e.target.value })}
                  >
                    <option value="Evacuation & Boat Rescue">Evacuation & Boat Rescue</option>
                    <option value="Emergency Food & Drinking Water">Emergency Food & Drinking Water</option>
                    <option value="Urgent Medical Care / Insulin">Urgent Medical Care / Insulin</option>
                    <option value="Elderly / Infant Assistance">Elderly / Infant Assistance</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Urgency Level</label>
                  <select
                    className="form-control"
                    value={sosForm.urgency}
                    onChange={(e) => setSosForm({ ...sosForm, urgency: e.target.value })}
                  >
                    <option value="Critical">Critical (Immediate Danger / Rising Water)</option>
                    <option value="High">High (Need aid within 4-6 hours)</option>
                    <option value="Moderate">Moderate (Stocks low)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target / Nearest Relief Shelter</label>
                <select
                  className="form-control"
                  value={sosForm.nearestShelterId}
                  onChange={(e) => setSosForm({ ...sosForm, nearestShelterId: e.target.value })}
                >
                  {shelters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Urgent Notes (optional)</label>
                <textarea
                  rows="2"
                  placeholder="e.g. 1 senior citizen in wheelchair, battery for medical device low."
                  className="form-control"
                  value={sosForm.description}
                  onChange={(e) => setSosForm({ ...sosForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSosModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  <IconSend size={16} /> Broadcast Emergency Beacon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal for Officials */}
      <AuthModal
        isOpen={showAuthModal.isOpen}
        initialMode={showAuthModal.mode}
        onClose={() => setShowAuthModal({ isOpen: false, mode: 'login' })}
      />
    </div>
  );
};
