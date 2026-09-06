import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { adminGet, adminPut } from '../api/api';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    adminGet('/settings')
      .then(data => setSettings(data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
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

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <h1 className="admin-page-title">General Settings</h1>

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
            <div className="form-group">
              <label className="form-label">Opening Hours</label>
              <input type="text" className="form-input" value={settings.opening_hours || ''} onChange={e => updateSetting('opening_hours', e.target.value)} placeholder="Mon–Fri: 9AM–5PM" />
            </div>
            <button className="btn btn-primary" onClick={saveSettings} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
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
        .settings-section h2 { font-size: 1.25rem; margin-bottom: 1.25rem; }
      `}</style>
    </div>
  );
}
