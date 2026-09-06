import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { adminGet, adminPut } from '../api/api';
import { DAYS } from '../utils/helpers';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      adminGet('/settings'),
      adminGet('/availability'),
    ]).then(([s, a]) => {
      setSettings(s || {});
      setAvailability(a || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateSetting = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  const saveSettings = async () => {
    setSaving(true);
    setMsg('');
    try {
      await adminPut('/settings', settings);
      setMsg('Settings saved!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateAvail = (i, k, v) => {
    const copy = [...availability];
    copy[i] = { ...copy[i], [k]: v };
    setAvailability(copy);
  };

  const addAvail = () => {
    setAvailability(a => [...a, { day_of_week: 1, start_time: '09:00', end_time: '17:00', slot_duration: 30, max_appointments: 10, is_active: 1 }]);
  };

  const removeAvail = (i) => {
    setAvailability(a => a.filter((_, idx) => idx !== i));
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      await adminPut('/availability', availability);
      setMsg('Availability saved!');
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
      <h1 className="admin-page-title">Settings</h1>

      {msg && <div className={`toast ${msg.includes('saved') ? 'toast-success' : 'toast-error'}`} style={{ marginBottom: '1rem', display: 'inline-block' }}>{msg}</div>}

      <div className="settings-sections">
        <div className="settings-section card">
          <div className="card-body">
            <h2>Clinic Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Clinic Name</label>
                <input type="text" className="form-input" value={settings.clinic_name || ''} onChange={e => updateSetting('clinic_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="tel" className="form-input" value={settings.phone || ''} onChange={e => updateSetting('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={settings.email || ''} onChange={e => updateSetting('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Default Slot Duration (min)</label>
                <input type="number" className="form-input" value={settings.slot_duration || 30} onChange={e => updateSetting('slot_duration', e.target.value)} min={5} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-textarea" value={settings.address || ''} onChange={e => updateSetting('address', e.target.value)} rows={2} />
            </div>
            <button className="btn btn-primary" onClick={saveSettings} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="settings-section card">
          <div className="card-body">
            <div className="settings-header">
              <h2>Availability Schedule</h2>
              <button className="btn btn-sm btn-secondary" onClick={addAvail}><Plus size={14} /> Add Slot</button>
            </div>
            <p className="settings-hint">Set working hours. Patients can book up to 30 days ahead.</p>

            {availability.length === 0 ? (
              <p style={{ color: 'var(--color-text-light)' }}>No availability configured.</p>
            ) : (
              <div className="avail-list">
                {availability.map((a, i) => (
                  <div key={i} className="avail-item">
                    <select className="form-select" value={a.day_of_week} onChange={e => updateAvail(i, 'day_of_week', Number(e.target.value))}>
                      {DAYS.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
                    </select>
                    <input type="time" className="form-input" value={a.start_time} onChange={e => updateAvail(i, 'start_time', e.target.value)} />
                    <span>to</span>
                    <input type="time" className="form-input" value={a.end_time} onChange={e => updateAvail(i, 'end_time', e.target.value)} />
                    <div className="avail-limit">
                      <label>Max:</label>
                      <input type="number" className="form-input" value={a.max_appointments || 10}
                        onChange={e => updateAvail(i, 'max_appointments', Number(e.target.value))} min={1} />
                    </div>
                    <button className="btn btn-sm btn-secondary" onClick={() => updateAvail(i, 'is_active', a.is_active ? 0 : 1)}>
                      {a.is_active ? 'On' : 'Off'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => removeAvail(i)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            {availability.length > 0 && (
              <button className="btn btn-primary" onClick={saveAvailability} disabled={saving} style={{ marginTop: '1rem' }}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Availability'}
              </button>
            )}
          </div>
        </div>

        <div className="settings-section card">
          <div className="card-body">
            <h2>Social Media</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {['facebook', 'instagram', 'twitter', 'linkedin'].map(platform => (
                <div className="form-group" key={platform}>
                  <label className="form-label" style={{ textTransform: 'capitalize' }}>{platform}</label>
                  <input type="url" className="form-input" value={settings[`social_${platform}`] || ''}
                    onChange={e => updateSetting(`social_${platform}`, e.target.value)}
                    placeholder={`https://${platform}.com/...`} />
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={saveSettings} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Social Links'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .admin-page-title { font-size: 1.75rem; margin-bottom: 1.5rem; }
        .settings-sections { display: flex; flex-direction: column; gap: 1.5rem; max-width: 800px; }
        .settings-section h2 { font-size: 1.25rem; margin-bottom: 1rem; }
        .settings-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .settings-hint { color: var(--color-text-light); font-size: 0.9rem; margin-bottom: 1rem; }
        .avail-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .avail-item { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .avail-item .form-select, .avail-item .form-input { width: auto; }
        .avail-item span { color: var(--color-text-light); font-size: 0.85rem; }
        .avail-limit { display: flex; align-items: center; gap: 0.375rem; background: var(--color-bg-alt); padding: 0.375rem 0.75rem; border-radius: var(--radius-md); }
        .avail-limit label { font-size: 0.8rem; font-weight: 600; }
        .avail-limit .form-input { width: 60px; padding: 0.375rem; text-align: center; }
      `}</style>
    </div>
  );
}
