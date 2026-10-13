import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  IconUsers,
  IconCheckCircle2,
  IconMapPin,
  IconPackage,
  IconDroplet,
  IconRefreshCw
} from '../Icons';

export const VolunteerView = () => {
  const { shelters, addToast } = useApp();

  const [assignedShelterId, setAssignedShelterId] = useState(shelters[0]?.id || '');
  const [isCheckedIn, setIsCheckedIn] = useState(true);

  // Distribution Tally State
  const [tallies, setTallies] = useState({
    foodPackets: 142,
    waterBottles: 210,
    blankets: 45
  });

  // Volunteer Task List
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Distribute 150 water cans to evacuees in Sector 2 Pavilion', completed: true },
    { id: 2, title: 'Assist elderly evacuees with cot setup in East Gymnasium', completed: true },
    { id: 3, title: 'Unload incoming truck convoy #TR-402 with IV supplies', completed: false },
    { id: 4, title: 'Inspect stormwater trench barriers along south courtyard', completed: false }
  ]);

  const toggleTask = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const incrementTally = (type, label) => {
    setTallies((prev) => ({
      ...prev,
      [type]: prev[type] + 1
    }));
    addToast(`Logged 1x ${label} handed out!`, 'info', 1500);
  };

  const assignedShelter = shelters.find((s) => s.id === assignedShelterId) || shelters[0];
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>

      {/* Volunteer Check-in Header */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        borderLeft: '4px solid var(--color-success)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <IconUsers size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Volunteer Field Station</h3>
              <span className="badge badge-success">
                {isCheckedIn ? 'Checked-In On Duty' : 'Off-Duty'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Assigned Site: <strong>{assignedShelter.name}</strong> ({assignedShelter.district})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${isCheckedIn ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => {
              setIsCheckedIn(!isCheckedIn);
              addToast(isCheckedIn ? 'Checked out of relief station.' : 'Checked in onsite. Stay safe!', 'info');
            }}
          >
            {isCheckedIn ? 'Check Out of Shift' : 'Check In Onsite'}
          </button>
        </div>
      </div>

      {/* Ground Handout Tally (Large touch buttons for fast physical distribution) */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.25rem 0' }}>Real-Time Aid Distribution Tally</h3>
        <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Tap to record items physically handed out to families. Works offline and aggregates to coordinator ledger.
        </p>

        <div className="grid-3">
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'center'
          }}>
            <div style={{ color: 'var(--color-warning)', marginBottom: '0.25rem' }}>
              <IconPackage size={24} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Food Packs Distributed</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.25rem 0' }}>{tallies.foodPackets}</div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={() => incrementTally('foodPackets', 'Food Pack')}
            >
              +1 Handout Logged
            </button>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'center'
          }}>
            <div style={{ color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
              <IconDroplet size={24} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Water Cans Provided</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.25rem 0' }}>{tallies.waterBottles}</div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={() => incrementTally('waterBottles', 'Water Can')}
            >
              +1 Handout Logged
            </button>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'center'
          }}>
            <div style={{ color: 'var(--color-info)', marginBottom: '0.25rem' }}>
              <IconCheckCircle2 size={24} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Thermal Blankets Given</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.25rem 0' }}>{tallies.blankets}</div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={() => incrementTally('blankets', 'Thermal Blanket')}
            >
              +1 Handout Logged
            </button>
          </div>
        </div>
      </div>

      {/* Volunteer Action Checklist */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0' }}>Shift Action Checklist</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Assigned duties by site coordinator {assignedShelter.manager}
            </p>
          </div>
          <span className="badge badge-info">
            {completedCount} of {tasks.length} Completed
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.15rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: task.completed ? 0.7 : 1
              }}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => {}} // handled by parent div
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{
                fontSize: '0.9rem',
                textDecoration: task.completed ? 'line-through' : 'none',
                color: task.completed ? 'var(--text-muted)' : 'var(--text-main)',
                flex: 1
              }}>
                {task.title}
              </span>
              {task.completed && (
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Done</span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
