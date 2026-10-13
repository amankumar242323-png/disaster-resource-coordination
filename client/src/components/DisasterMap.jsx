import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  IconMapPin,
  IconUsers,
  IconPhone,
  IconAlertTriangle,
  IconShield,
  IconCheckCircle2
} from './Icons';

export const DisasterMap = ({ onSelectShelter }) => {
  const { shelters } = useApp();
  const [selectedShelterId, setSelectedShelterId] = useState(shelters[0]?.id || null);
  const [filterRadius, setFilterRadius] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedShelter = shelters.find((s) => s.id === selectedShelterId) || shelters[0];

  const filteredShelters = shelters.filter((s) => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.district.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterRadius === 'coastal' && !s.district.includes('Coastal')) return false;
    if (filterRadius === 'riverside' && !s.district.includes('Riverside')) return false;
    return true;
  });

  // Coordinate mapping for SVG view:
  // Base coordinates around 13.05 N, 80.23 E
  const getCoordinatesForSvg = (lat, lng) => {
    const minLat = 12.95, maxLat = 13.15;
    const minLng = 80.15, maxLng = 80.30;

    const x = ((lng - minLng) / (maxLng - minLng)) * 520 + 40;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 320 + 40;
    return { x, y };
  };

  const getStatusColor = (status) => {
    if (status === 'Accepting People') return 'var(--color-success)';
    if (status === 'Near Capacity') return 'var(--color-warning)';
    if (status === 'Full') return 'var(--color-emergency)';
    return '#a855f7';
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', overflow: 'hidden' }}>
      {/* Map Header & Filter controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <IconMapPin size={20} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Relief Grid & Disaster Geospatial Radar</h3>
          <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Offline Vector Tiles</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search shelters or districts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              width: '190px'
            }}
          />
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${filterRadius === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterRadius('all')}
            >
              All Zones
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterRadius === 'coastal' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterRadius('coastal')}
            >
              Coastal (Zone A)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterRadius === 'riverside' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterRadius('riverside')}
            >
              Riverside
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Selected Shelter Quick Info */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
        gap: '1.25rem'
      }}>
        {/* SVG Interactive Map */}
        <div style={{
          position: 'relative',
          background: 'radial-gradient(ellipse at center, var(--bg-tertiary) 0%, var(--bg-primary) 100%)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          minHeight: '380px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {/* Subtle Radar scan lines */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(var(--border-accent) 1px, transparent 1px),
              linear-gradient(90deg, var(--border-accent) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            opacity: 0.35
          }} />

          {/* SVG Map Canvas */}
          <svg
            viewBox="0 0 600 400"
            style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}
          >
            {/* Coastline / River Path Graphic */}
            <path
              d="M 520,0 C 490,120 540,240 480,400"
              fill="none"
              stroke="rgba(6, 182, 212, 0.35)"
              strokeWidth="14"
              strokeDasharray="6 4"
            />
            <text x="490" y="30" fill="rgba(6, 182, 212, 0.7)" fontSize="11" fontFamily="var(--font-mono)">
              BAY COASTLINE (SURGE ZONE)
            </text>

            <path
              d="M 0,220 C 160,200 320,260 480,240"
              fill="none"
              stroke="rgba(59, 130, 246, 0.3)"
              strokeWidth="8"
            />
            <text x="80" y="240" fill="rgba(59, 130, 246, 0.7)" fontSize="10" fontFamily="var(--font-mono)">
              RIVER DELTA BASIN
            </text>

            {/* Hazard / Cyclone Warning Ring */}
            <circle
              cx="440"
              cy="160"
              r="110"
              fill="rgba(239, 68, 68, 0.08)"
              stroke="rgba(239, 68, 68, 0.4)"
              strokeWidth="2"
              strokeDasharray="8 6"
            />
            <text x="350" y="110" fill="var(--color-emergency)" fontSize="10" fontWeight="bold">
              ⚠️ CYCLONE EYE HAZARD RADIUS
            </text>

            {/* Shelter Markers */}
            {filteredShelters.map((shelter) => {
              const { x, y } = getCoordinatesForSvg(shelter.lat, shelter.lng);
              const isSelected = shelter.id === selectedShelterId;
              const color = getStatusColor(shelter.status);

              return (
                <g
                  key={shelter.id}
                  transform={`translate(${x}, ${y})`}
                  onClick={() => {
                    setSelectedShelterId(shelter.id);
                    if (onSelectShelter) onSelectShelter(shelter);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Ping Ring for selected or critical */}
                  {isSelected && (
                    <circle
                      r="22"
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      opacity="0.8"
                      className="pulse-animation"
                    />
                  )}

                  {/* Marker Pin Base */}
                  <circle
                    r={isSelected ? '14' : '10'}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="2"
                    style={{ transition: 'all 0.2s ease' }}
                  />

                  {/* Shelter Icon / Initial */}
                  <text
                    textAnchor="middle"
                    dy="4"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    S
                  </text>

                  {/* Label tag */}
                  <rect
                    x="-60"
                    y={isSelected ? '-38' : '-28'}
                    width="120"
                    height="18"
                    rx="4"
                    fill="rgba(15, 23, 42, 0.88)"
                    stroke={isSelected ? color : 'rgba(255,255,255,0.1)'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y={isSelected ? '-25' : '-16'}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="8.5"
                    fontWeight="600"
                  >
                    {shelter.name.split(' ')[0]} ({shelter.occupancy}/{shelter.capacity})
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Map Legend */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '12px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.4rem 0.75rem',
            display: 'flex',
            gap: '0.85rem',
            fontSize: '0.725rem',
            zIndex: 2
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }} />
              Accepting
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-emergency)' }} />
              Full
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-warning)' }} />
              Near Capacity
            </span>
          </div>
        </div>

        {/* Selected Shelter Details Card */}
        {selectedShelter && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span className={`badge ${
                  selectedShelter.status === 'Accepting People' ? 'badge-success' : 'badge-emergency'
                }`}>
                  {selectedShelter.status}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {selectedShelter.id}
                </span>
              </div>

              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem' }}>{selectedShelter.name}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.85rem 0' }}>
                {selectedShelter.address} • {selectedShelter.district}
              </p>

              {/* Occupancy Progress Bar */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Occupancy</span>
                  <span style={{ fontWeight: 700 }}>
                    {selectedShelter.occupancy} / {selectedShelter.capacity} evacuees ({Math.round((selectedShelter.occupancy / selectedShelter.capacity) * 100)}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (selectedShelter.occupancy / selectedShelter.capacity) * 100)}%`,
                    height: '100%',
                    background: selectedShelter.occupancy >= selectedShelter.capacity ? 'var(--color-emergency)' : 'var(--color-primary)',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>

              {/* Critical Inventory Peek */}
              <div style={{ marginBottom: '1rem' }}>
                <h5 style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Tracked Shelter Supplies
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {selectedShelter.inventory.slice(0, 3).map((item) => (
                    <div key={item.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-tertiary)',
                      padding: '0.4rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.775rem'
                    }}>
                      <span>{item.name}</span>
                      <span className={`badge ${
                        item.status === 'Critical' ? 'badge-emergency' : item.status === 'Low' ? 'badge-warning' : 'badge-success'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact & Action */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <IconPhone size={15} style={{ color: 'var(--color-success)' }} />
                <span>Shelter Helpline: <strong>{selectedShelter.phone}</strong></span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Site Manager: {selectedShelter.manager}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
