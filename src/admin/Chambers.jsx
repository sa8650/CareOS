import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Building2, MapPin, Phone, Clock, Users, CalendarDays, Save, Power } from 'lucide-react';
import { adminChambers, adminCreateChamber, adminUpdateChamber, adminDeleteChamber } from '../api/api';
import { DAYS, DAYS_SHORT, TIME_OPTIONS, formatTimeRange, formatVisitingDays } from '../utils/helpers';

const EMPTY = {
  name: '', address: '', phone: '',
  visiting_days: [], start_time: '16:00', end_time: '20:00', daily_limit: 10, is_active: 1,
};

export default function Chambers() {
  const [chambers, setChambers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = () => adminChambers().then(setChambers).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const openNew = () => { setForm(EMPTY); setError(''); setModal('new'); };
  const openEdit = (c) => {
    setForm({
      id: c.id, name: c.name || '', address: c.address || '', phone: c.phone || '',
      visiting_days: c.visiting_days || [], start_time: c.start_time, end_time: c.end_time,
      daily_limit: c.daily_limit, is_active: c.is_active,
    });
    setError('');
    setModal('edit');
  };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleDay = (d) => setForm(f => {
    const set = new Set(f.visiting_days);
    set.has(d) ? set.delete(d) : set.add(d);
    return { ...f, visiting_days: [...set].sort((a, b) => a - b) };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Chamber name is required');
    if (form.start_time >= form.end_time) return setError('End time must be after start time');
    if (!form.daily_limit || form.daily_limit < 1) return setError('Daily limit must be at least 1');

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), address: form.address, phone: form.phone,
        visiting_days: form.visiting_days, start_time: form.start_time, end_time: form.end_time,
        daily_limit: Number(form.daily_limit), is_active: form.is_active ? 1 : 0,
      };
      if (modal === 'new') await adminCreateChamber(payload);
      else await adminUpdateChamber(form.id, payload);
      setModal(null);
      notify(modal === 'new' ? 'Chamber added' : 'Chamber updated');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete "${c.name}"?\n\nIts date overrides will be removed. Past appointments are kept for history.`)) return;
    try {
      await adminDeleteChamber(c.id);
      notify('Chamber deleted');
      load();
    } catch (err) {
      if (err.data?.requires_force) {
        if (confirm(`${err.message}\n\nDelete anyway? Those appointments will be unlinked from this chamber.`)) {
          try { await adminDeleteChamber(c.id, true); notify('Chamber deleted'); load(); }
          catch (e2) { alert(e2.message); }
        }
      } else {
        alert(err.message);
      }
    }
  };

  const toggleActive = async (c) => {
    try { await adminUpdateChamber(c.id, { is_active: c.is_active ? 0 : 1 }); load(); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="chambers-header">
        <div>
          <h1 className="admin-page-title"><Building2 size={24} style={{ marginRight: '0.5rem' }} /> Chambers</h1>
          <p className="chambers-subtitle">Each chamber has its own visiting days, hours and daily patient limit.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Add Chamber</button>
      </div>

      {toast && <div className="toast toast-success" style={{ marginBottom: '1rem', display: 'inline-block' }}>{toast}</div>}

      {chambers.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <Building2 size={48} style={{ color: 'var(--color-text-light)', marginBottom: '1rem' }} />
            <h3>No Chambers Added</h3>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>
              Add the chambers where you practice. Patients can only book on a chamber's visiting days.
            </p>
            <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Add First Chamber</button>
          </div>
        </div>
      ) : (
        <div className="chamber-grid">
          {chambers.map(c => (
            <div key={c.id} className={`chamber-card card ${c.is_active ? '' : 'chamber-card--inactive'}`}>
              <div className="card-body">
                <div className="chamber-card-top">
                  <div className="chamber-card-title">
                    <span className="chamber-avatar"><Building2 size={16} /></span>
                    <div>
                      <h3>{c.name}</h3>
                      {!c.is_active && <span className="chamber-inactive-tag">Inactive</span>}
                    </div>
                  </div>
                  <div className="chamber-card-actions">
                    <button className="icon-btn" title={c.is_active ? 'Deactivate' : 'Activate'} onClick={() => toggleActive(c)}>
                      <Power size={14} />
                    </button>
                    <button className="icon-btn" title="Edit" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                    <button className="icon-btn icon-btn--danger" title="Delete" onClick={() => handleDelete(c)}><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="chamber-days-row">
                  {DAYS_SHORT.map((d, i) => (
                    <span key={d} className={`day-pill ${c.visiting_days.includes(i) ? 'day-pill--on' : ''}`}>{d}</span>
                  ))}
                </div>

                <div className="chamber-meta">
                  <div><Clock size={13} /> {formatTimeRange(c.start_time, c.end_time)}</div>
                  <div><Users size={13} /> {c.daily_limit} patients / day</div>
                  {c.address && <div><MapPin size={13} /> <span className="truncate">{c.address}</span></div>}
                  {c.phone && <div><Phone size={13} /> {c.phone}</div>}
                </div>

                <Link to={`/admin/schedule?chamber=${c.id}`} className="chamber-schedule-link">
                  <CalendarDays size={13} /> Manage schedule
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{modal === 'new' ? 'Add Chamber' : 'Edit Chamber'}</h3>
              <button onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="form-alert">{error}</div>}

                <div className="form-group">
                  <label className="form-label">Chamber Name *</label>
                  <input type="text" className="form-input" value={form.name}
                    onChange={e => update('name', e.target.value)} placeholder="e.g., Dhaka Medical College" required autoFocus />
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea className="form-textarea" value={form.address} rows={2} style={{ minHeight: 60 }}
                    onChange={e => update('address', e.target.value)} placeholder="Full address" />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" className="form-input" value={form.phone}
                    onChange={e => update('phone', e.target.value)} placeholder="+880 1XXX-XXXXXX" />
                </div>

                <div className="form-group">
                  <label className="form-label">Visiting Days</label>
                  <div className="day-toggles">
                    {DAYS.map((name, i) => {
                      const on = form.visiting_days.includes(i);
                      return (
                        <label key={name} className={`day-toggle ${on ? 'day-toggle--on' : ''}`}>
                          <span className="day-toggle-name">{DAYS_SHORT[i]}</span>
                          <span className="switch">
                            <input type="checkbox" checked={on} onChange={() => toggleDay(i)} aria-label={name} />
                            <span className="switch-track"><span className="switch-thumb" /></span>
                          </span>
                          <span className="day-toggle-state">{on ? 'On' : 'Off'}</span>
                        </label>
                      );
                    })}
                  </div>
                  <small className="form-help">{formatVisitingDays(form.visiting_days)}</small>
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Visiting Start</label>
                    <select className="form-select" value={form.start_time} onChange={e => update('start_time', e.target.value)}>
                      {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Visiting End</label>
                    <select className="form-select" value={form.end_time} onChange={e => update('end_time', e.target.value)}>
                      {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Daily Limit</label>
                    <input type="number" className="form-input" min={1} max={500} value={form.daily_limit}
                      onChange={e => update('daily_limit', e.target.value === '' ? '' : Number(e.target.value))} required />
                  </div>
                </div>

                <label className="active-toggle">
                  <span className="switch">
                    <input type="checkbox" checked={!!form.is_active} onChange={e => update('is_active', e.target.checked ? 1 : 0)} />
                    <span className="switch-track"><span className="switch-thumb" /></span>
                  </span>
                  <span>Chamber is active (visible to patients)</span>
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : (modal === 'new' ? 'Add Chamber' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-page-title { font-size: 1.75rem; display: flex; align-items: center; }
        .chambers-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .chambers-subtitle { color: var(--color-text-light); margin-top: 0.25rem; font-size: 0.9rem; }

        .chamber-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
        .chamber-card { border-top: 3px solid var(--color-primary); }
        .chamber-card .card-body { padding: 1.1rem 1.15rem; }
        .chamber-card--inactive { border-top-color: var(--color-border); opacity: 0.75; }
        .chamber-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.85rem; }
        .chamber-card-title { display: flex; align-items: center; gap: 0.6rem; min-width: 0; }
        .chamber-card-title h3 { font-size: 1rem; line-height: 1.3; }
        .chamber-avatar { width: 32px; height: 32px; border-radius: 8px; background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .chamber-inactive-tag { font-size: 0.7rem; font-weight: 600; color: var(--color-text-light); text-transform: uppercase; letter-spacing: 0.05em; }
        .chamber-card-actions { display: flex; gap: 0.3rem; flex-shrink: 0; }
        .icon-btn { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--color-bg-alt); color: var(--color-text-light); border: 1px solid var(--color-border); transition: all 0.15s; }
        .icon-btn:hover { background: var(--color-primary-light); color: var(--color-primary); border-color: var(--color-primary); }
        .icon-btn--danger:hover { background: #fee2e2; color: #b91c1c; border-color: #fca5a5; }

        .chamber-days-row { display: flex; gap: 0.3rem; margin-bottom: 0.85rem; }
        .day-pill { flex: 1; text-align: center; font-size: 0.65rem; font-weight: 700; padding: 0.3rem 0; border-radius: 6px; background: var(--color-bg-alt); color: #94a3b8; text-transform: uppercase; letter-spacing: 0.03em; }
        .day-pill--on { background: #dcfce7; color: #15803d; }

        .chamber-meta { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.85rem; color: var(--color-text-light); }
        .chamber-meta > div { display: flex; align-items: center; gap: 0.45rem; min-width: 0; }
        .chamber-meta svg { color: var(--color-primary); flex-shrink: 0; }
        .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chamber-schedule-link { display: inline-flex; align-items: center; gap: 0.35rem; margin-top: 0.9rem; font-size: 0.8rem; font-weight: 600; color: var(--color-primary); }
        .chamber-schedule-link:hover { text-decoration: underline; }

        /* form */
        .form-alert { background: #fee2e2; color: #991b1b; padding: 0.6rem 0.9rem; border-radius: var(--radius-md); margin-bottom: 1rem; font-size: 0.875rem; }
        .form-help { display: block; margin-top: 0.4rem; font-size: 0.8rem; color: var(--color-text-light); }
        .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }
        .day-toggles { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.4rem; }
        .day-toggle { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; padding: 0.55rem 0.25rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg-alt); cursor: pointer; transition: all 0.15s; user-select: none; }
        .day-toggle--on { border-color: #86efac; background: #f0fdf4; }
        .day-toggle-name { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--color-text-light); }
        .day-toggle--on .day-toggle-name { color: #15803d; }
        .day-toggle-state { font-size: 0.65rem; font-weight: 600; color: #94a3b8; }
        .day-toggle--on .day-toggle-state { color: #16a34a; }

        /* slide switch */
        .switch { position: relative; display: inline-block; width: 34px; height: 20px; flex-shrink: 0; }
        .switch input { position: absolute; opacity: 0; width: 0; height: 0; }
        .switch-track { position: absolute; inset: 0; background: #cbd5e1; border-radius: 999px; transition: background 0.2s; }
        .switch-thumb { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,0.25); transition: transform 0.2s; }
        .switch input:checked + .switch-track { background: #22c55e; }
        .switch input:checked + .switch-track .switch-thumb { transform: translateX(14px); }
        .switch input:focus-visible + .switch-track { outline: 2px solid var(--color-primary); outline-offset: 2px; }
        .active-toggle { display: flex; align-items: center; gap: 0.6rem; font-size: 0.9rem; cursor: pointer; margin-top: 0.25rem; }

        @media (max-width: 640px) {
          .form-row-3 { grid-template-columns: 1fr 1fr; }
          .day-toggles { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
    </div>
  );
}
