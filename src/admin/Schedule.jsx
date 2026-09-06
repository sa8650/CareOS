import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import { adminGet, adminPut } from '../api/api';
import { DAYS } from '../utils/helpers';

export default function Schedule() {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    adminGet('/availability')
      .then(setAvailability)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateAvail = (i, k, v) => {
    const copy = [...availability];
    copy[i] = { ...copy[i], [k]: v };
    setAvailability(copy);
  };

  const addSlot = () => {
    setAvailability(a => [...a, { 
      day_of_week: 1, 
      start_time: '09:00', 
      end_time: '17:00', 
      slot_duration: 30, 
      max_appointments: 10, 
      is_active: 1 
    }]);
  };

  const removeSlot = (i) => {
    setAvailability(a => a.filter((_, idx) => idx !== i));
  };

  const saveSchedule = async () => {
    setSaving(true);
    setMsg('');
    try {
      await adminPut('/availability', availability);
      setMsg('Schedule saved successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="schedule-header">
        <div>
          <h1 className="admin-page-title">
            <Calendar size={24} style={{ marginRight: '0.5rem' }} />
            Appointment Schedule
          </h1>
          <p className="schedule-subtitle">Configure your weekly availability and appointment limits</p>
        </div>
        <div className="schedule-actions">
          <button className="btn btn-secondary" onClick={addSlot}>
            <Plus size={16} /> Add Time Slot
          </button>
          <button className="btn btn-primary" onClick={saveSchedule} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`toast ${msg.includes('success') ? 'toast-success' : 'toast-error'}`}>
          {msg}
        </div>
      )}

      <div className="schedule-info-card card">
        <div className="card-body">
          <h3><Clock size={18} /> How It Works</h3>
          <ul>
            <li>Set your working hours for each day of the week</li>
            <li>Patients can book appointments for the next 30 days</li>
            <li>Green days in the calendar = available for booking</li>
            <li>"Max Patients" limits daily appointments to prevent overbooking</li>
            <li>Toggle "Active/Off" to temporarily disable a day</li>
          </ul>
        </div>
      </div>

      {availability.length === 0 ? (
        <div className="schedule-empty card">
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <Calendar size={48} style={{ color: 'var(--color-text-light)', marginBottom: '1rem' }} />
            <h3>No Schedule Configured</h3>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>
              Add your working hours so patients can book appointments.
            </p>
            <button className="btn btn-primary" onClick={addSlot}>
              <Plus size={16} /> Add Your First Time Slot
            </button>
          </div>
        </div>
      ) : (
        <div className="schedule-grid">
          {/* Group by day */}
          {DAYS.map((dayName, dayIndex) => {
            const daySlots = availability.filter(a => a.day_of_week === dayIndex);
            const globalIndex = availability.findIndex(a => a.day_of_week === dayIndex);
            
            return (
              <div key={dayIndex} className={`schedule-day-card card ${daySlots.length > 0 && daySlots[0]?.is_active ? 'schedule-day-active' : 'schedule-day-inactive'}`}>
                <div className="card-body">
                  <div className="schedule-day-header">
                    <h3 className={`schedule-day-name ${daySlots.length > 0 && daySlots[0]?.is_active ? '' : 'text-muted'}`}>
                      {dayName}
                    </h3>
                    {daySlots.length > 0 && (
                      <button 
                        className={`btn btn-sm ${daySlots[0]?.is_active ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => updateAvail(globalIndex, 'is_active', daySlots[0]?.is_active ? 0 : 1)}
                      >
                        {daySlots[0]?.is_active ? 'Active' : 'Off'}
                      </button>
                    )}
                  </div>

                  {daySlots.length === 0 ? (
                    <div className="schedule-no-slot">
                      <span>Closed</span>
                      <button className="btn btn-sm btn-outline" onClick={() => {
                        setAvailability(a => [...a, { 
                          day_of_week: dayIndex, 
                          start_time: '09:00', 
                          end_time: '17:00', 
                          slot_duration: 30, 
                          max_appointments: 10, 
                          is_active: 1 
                        }]);
                      }}>
                        <Plus size={14} /> Add
                      </button>
                    </div>
                  ) : (
                    <div className="schedule-slot-details">
                      <div className="schedule-time-row">
                        <label>Hours:</label>
                        <input type="time" className="form-input" value={daySlots[0].start_time}
                          onChange={e => updateAvail(globalIndex, 'start_time', e.target.value)} />
                        <span>to</span>
                        <input type="time" className="form-input" value={daySlots[0].end_time}
                          onChange={e => updateAvail(globalIndex, 'end_time', e.target.value)} />
                      </div>
                      <div className="schedule-meta-row">
                        <div className="schedule-meta-item">
                          <label>Slot Duration:</label>
                          <select className="form-select" value={daySlots[0].slot_duration}
                            onChange={e => updateAvail(globalIndex, 'slot_duration', Number(e.target.value))}>
                            <option value={15}>15 min</option>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>60 min</option>
                          </select>
                        </div>
                        <div className="schedule-meta-item">
                          <label>Max Patients:</label>
                          <input type="number" className="form-input" value={daySlots[0].max_appointments || 10}
                            onChange={e => updateAvail(globalIndex, 'max_appointments', Number(e.target.value))}
                            min={1} max={100} />
                        </div>
                      </div>
                      <button className="btn btn-sm btn-danger schedule-remove-btn" onClick={() => removeSlot(globalIndex)}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .admin-page-title { font-size: 1.75rem; display: flex; align-items: center; }
        .schedule-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .schedule-subtitle { color: var(--color-text-light); margin-top: 0.25rem; }
        .schedule-actions { display: flex; gap: 0.75rem; }

        .schedule-info-card { margin-bottom: 2rem; background: #f0f9ff; border-color: #bae6fd; }
        .schedule-info-card h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; margin-bottom: 0.75rem; color: var(--color-primary); }
        .schedule-info-card ul { margin-left: 1.25rem; }
        .schedule-info-card li { color: var(--color-text-light); font-size: 0.9rem; margin-bottom: 0.375rem; list-style: disc; }

        .schedule-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
        .schedule-day-card { transition: all 0.2s; }
        .schedule-day-active { border-left: 4px solid var(--color-success); }
        .schedule-day-inactive { border-left: 4px solid var(--color-border); opacity: 0.7; }

        .schedule-day-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .schedule-day-name { font-size: 1.15rem; font-weight: 700; }
        .text-muted { color: var(--color-text-light); }

        .schedule-no-slot {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem; background: var(--color-bg-alt); border-radius: var(--radius-md);
          color: var(--color-text-light); font-style: italic;
        }

        .schedule-slot-details { display: flex; flex-direction: column; gap: 0.75rem; }
        .schedule-time-row { display: flex; align-items: center; gap: 0.5rem; }
        .schedule-time-row label { font-size: 0.85rem; font-weight: 600; color: var(--color-text-light); min-width: 50px; }
        .schedule-time-row .form-input { width: auto; }
        .schedule-time-row span { color: var(--color-text-light); }

        .schedule-meta-row { display: flex; gap: 1rem; }
        .schedule-meta-item { flex: 1; }
        .schedule-meta-item label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--color-text-light); margin-bottom: 0.25rem; }
        .schedule-meta-item .form-select, .schedule-meta-item .form-input { width: 100%; }

        .schedule-remove-btn { margin-top: 0.5rem; width: 100%; }

        @media (max-width: 640px) {
          .schedule-grid { grid-template-columns: 1fr; }
          .schedule-meta-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}

