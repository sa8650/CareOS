import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Building2, MapPin, Phone, Clock } from 'lucide-react';
import { adminGet, adminPut } from '../api/api';

export default function Chambers() {
  const [chambers, setChambers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    adminGet('/settings')
      .then(data => {
        const parsed = data?.chambers ? JSON.parse(data.chambers) : [];
        setChambers(parsed);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateChamber = (i, k, v) => {
    const copy = [...chambers];
    copy[i] = { ...copy[i], [k]: v };
    setChambers(copy);
  };

  const addChamber = () => {
    setChambers(c => [...c, { 
      name: '', 
      address: '', 
      phone: '', 
      hours: '', 
      days: '' 
    }]);
  };

  const removeChamber = (i) => {
    if (!confirm('Delete this chamber?')) return;
    setChambers(c => c.filter((_, idx) => idx !== i));
  };

  const saveChambers = async () => {
    setSaving(true);
    setMsg('');
    try {
      await adminPut('/settings', { chambers: JSON.stringify(chambers) });
      setMsg('Chambers saved successfully!');
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
      <div className="chambers-header">
        <div>
          <h1 className="admin-page-title">
            <Building2 size={24} style={{ marginRight: '0.5rem' }} />
            Chamber Management
          </h1>
          <p className="chambers-subtitle">Add multiple chambers where you practice</p>
        </div>
        <div className="chambers-actions">
          <button className="btn btn-secondary" onClick={addChamber}>
            <Plus size={16} /> Add Chamber
          </button>
          <button className="btn btn-primary" onClick={saveChambers} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`toast ${msg.includes('success') ? 'toast-success' : 'toast-error'}`}>
          {msg}
        </div>
      )}

      {chambers.length === 0 ? (
        <div className="chambers-empty card">
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <Building2 size={48} style={{ color: 'var(--color-text-light)', marginBottom: '1rem' }} />
            <h3>No Chambers Added</h3>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>
              Add your practice chambers/clinics so patients know where to visit.
            </p>
            <button className="btn btn-primary" onClick={addChamber}>
              <Plus size={16} /> Add First Chamber
            </button>
          </div>
        </div>
      ) : (
        <div className="chambers-list">
          {chambers.map((c, i) => (
            <div key={i} className="chamber-edit-card card">
              <div className="card-body">
                <div className="chamber-edit-header">
                  <h3>Chamber {i + 1}</h3>
                  <button className="btn btn-sm btn-danger" onClick={() => removeChamber(i)}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Building2 size={14} /> Chamber Name *
                  </label>
                  <input type="text" className="form-input" value={c.name}
                    onChange={e => updateChamber(i, 'name', e.target.value)}
                    placeholder="e.g., City Medical Center" />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={14} /> Address *
                  </label>
                  <textarea className="form-textarea" value={c.address}
                    onChange={e => updateChamber(i, 'address', e.target.value)}
                    placeholder="Full address with city and zip code" rows={2} />
                </div>

                <div className="chamber-edit-row">
                  <div className="form-group">
                    <label className="form-label">
                      <Phone size={14} /> Phone
                    </label>
                    <input type="tel" className="form-input" value={c.phone || ''}
                      onChange={e => updateChamber(i, 'phone', e.target.value)}
                      placeholder="+1 (555) 123-4567" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <Clock size={14} /> Visiting Hours
                    </label>
                    <input type="text" className="form-input" value={c.hours || ''}
                      onChange={e => updateChamber(i, 'hours', e.target.value)}
                      placeholder="e.g., 10:00 AM - 2:00 PM" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Days</label>
                  <input type="text" className="form-input" value={c.days || ''}
                    onChange={e => updateChamber(i, 'days', e.target.value)}
                    placeholder="e.g., Mon, Wed, Fri" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .admin-page-title { font-size: 1.75rem; display: flex; align-items: center; }
        .chambers-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .chambers-subtitle { color: var(--color-text-light); margin-top: 0.25rem; }
        .chambers-actions { display: flex; gap: 0.75rem; }

        .chambers-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .chamber-edit-card { border-left: 4px solid var(--color-primary); }
        .chamber-edit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border); }
        .chamber-edit-header h3 { font-size: 1.1rem; }

        .chamber-edit-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-label { display: flex; align-items: center; gap: 0.375rem; }

        @media (max-width: 640px) {
          .chamber-edit-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
