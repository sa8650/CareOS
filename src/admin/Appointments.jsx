import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Eye, CheckCircle, XCircle, Check, Building2, CalendarDays, Trash2 } from 'lucide-react';
import { adminGet, adminPut, adminDelete, adminChambers } from '../api/api';
import { formatDate, formatTimeRange, statusColor } from '../utils/helpers';

export default function Appointments() {
  const [params, setParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [chambers, setChambers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(params.get('status') || '');
  const [dateFilter, setDateFilter] = useState(params.get('date') || '');
  const [chamberFilter, setChamberFilter] = useState(params.get('chamber_id') || '');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [reschedule, setReschedule] = useState({ chamber_id: '', date: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => { adminChambers().then(setChambers).catch(() => {}); }, []);

  const load = () => {
    const q = new URLSearchParams();
    if (statusFilter) q.set('status', statusFilter);
    if (dateFilter) q.set('date', dateFilter);
    if (chamberFilter) q.set('chamber_id', chamberFilter);
    if (search) q.set('search', search);
    setParams(q, { replace: true });
    adminGet(`/appointments?${q}`)
      .then(setAppointments)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [statusFilter, dateFilter, chamberFilter]);

  const handleSearch = (e) => { e.preventDefault(); load(); };

  const openDetail = (a) => {
    setSelected(a);
    setNote(a.admin_note || '');
    setReschedule({ chamber_id: String(a.chamber_id || ''), date: a.appointment_date });
  };

  const updateStatus = async (id, status) => {
    setBusy(true);
    try {
      await adminPut(`/appointments/${id}`, { status, admin_note: note });
      setSelected(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async () => {
    setBusy(true);
    try { await adminPut(`/appointments/${selected.id}`, { admin_note: note }); load(); }
    catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  const doReschedule = async () => {
    if (!reschedule.chamber_id || !reschedule.date) return;
    if (!confirm(`Move this appointment to ${reschedule.date}? A new serial number will be assigned.`)) return;
    setBusy(true);
    try {
      const res = await adminPut(`/appointments/${selected.id}`, {
        chamber_id: Number(reschedule.chamber_id), appointment_date: reschedule.date,
      });
      setSelected(res.appointment);
      load();
      alert(`Moved. New serial: #${res.appointment.serial_number}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a) => {
    if (!confirm(`Permanently delete appointment ${a.reference}?`)) return;
    try { await adminDelete(`/appointments/${a.id}`); setSelected(null); load(); }
    catch (err) { alert(err.message); }
  };

  const statusActions = {
    pending: [
      { status: 'confirmed', label: 'Confirm', icon: <CheckCircle size={14} />, variant: 'btn-success' },
      { status: 'rejected', label: 'Reject', icon: <XCircle size={14} />, variant: 'btn-danger' },
    ],
    confirmed: [
      { status: 'completed', label: 'Complete', icon: <Check size={14} />, variant: 'btn-primary' },
      { status: 'cancelled', label: 'Cancel', icon: <XCircle size={14} />, variant: 'btn-danger' },
    ],
  };

  const moved = selected && (String(selected.chamber_id || '') !== reschedule.chamber_id || selected.appointment_date !== reschedule.date);

  return (
    <div>
      <h1 className="admin-page-title">Appointments</h1>

      <div className="admin-toolbar">
        <form onSubmit={handleSearch} className="admin-search">
          <Search size={16} />
          <input type="text" placeholder="Search by name, phone, reference..." value={search}
            onChange={e => setSearch(e.target.value)} className="form-input" />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
        <div className="admin-filters">
          <select className="form-select" value={chamberFilter} onChange={e => setChamberFilter(e.target.value)}>
            <option value="">All Chambers</option>
            {chambers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
          <input type="date" className="form-input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
          {(dateFilter || statusFilter || chamberFilter || search) && (
            <button className="btn btn-sm btn-secondary" onClick={() => { setSearch(''); setStatusFilter(''); setDateFilter(''); setChamberFilter(''); }}>Clear</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : appointments.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: '3rem' }}>No appointments found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="appts-table">
            <thead>
              <tr>
                <th>Serial</th>
                <th>Patient</th>
                <th>Phone</th>
                <th>Chamber</th>
                <th>Date</th>
                <th>Visiting Hours</th>
                <th>Status</th>
                <th>Reference</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td><span className="serial-chip">#{a.serial_number ?? '–'}</span></td>
                  <td><strong>{a.patient_name}</strong></td>
                  <td>{a.patient_phone}</td>
                  <td>{a.chamber_name || <span style={{ color: 'var(--color-text-light)' }}>—</span>}</td>
                  <td>{formatDate(a.appointment_date)}</td>
                  <td>{formatTimeRange(a.start_time, a.end_time) || '—'}</td>
                  <td><span className={`badge ${statusColor(a.status)}`}>{a.status}</span></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{a.reference}</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => openDetail(a)}><Eye size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>Serial #{selected.serial_number ?? '–'} · {selected.patient_name}</h3>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="appt-detail-grid">
                <div><strong>Reference:</strong> {selected.reference}</div>
                <div><strong>Status:</strong> <span className={`badge ${statusColor(selected.status)}`}>{selected.status}</span></div>
                <div><strong>Phone:</strong> {selected.patient_phone}</div>
                <div><strong>Email:</strong> {selected.patient_email || 'N/A'}</div>
                <div><strong>Chamber:</strong> {selected.chamber_name || '—'}</div>
                <div><strong>Date:</strong> {formatDate(selected.appointment_date)}</div>
                <div><strong>Visiting hours:</strong> {formatTimeRange(selected.start_time, selected.end_time) || '—'}</div>
                <div><strong>Booked:</strong> {selected.created_at?.slice(0, 16)}</div>
                {selected.message && <div style={{ gridColumn: '1 / -1' }}><strong>Message:</strong> {selected.message}</div>}
              </div>

              {selected.chamber_id && (
                <Link to={`/admin/schedule?chamber=${selected.chamber_id}`} className="appt-link">
                  <CalendarDays size={14} /> View {selected.chamber_name} schedule
                </Link>
              )}

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Admin Note</label>
                <textarea className="form-textarea" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Add a note..." rows={2} style={{ minHeight: 60 }} />
                <button className="btn btn-sm btn-secondary" style={{ marginTop: '0.5rem' }} onClick={saveNote} disabled={busy}>Save note</button>
              </div>

              {!['completed', 'cancelled', 'rejected'].includes(selected.status) && (
                <div className="reschedule-box">
                  <label className="form-label"><Building2 size={14} /> Move to another chamber / date</label>
                  <div className="reschedule-row">
                    <select className="form-select" value={reschedule.chamber_id} onChange={e => setReschedule(r => ({ ...r, chamber_id: e.target.value }))}>
                      <option value="">Chamber…</option>
                      {chambers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="date" className="form-input" value={reschedule.date} onChange={e => setReschedule(r => ({ ...r, date: e.target.value }))} />
                    <button className="btn btn-sm btn-primary" disabled={!moved || busy} onClick={doReschedule}>Move</button>
                  </div>
                  <small style={{ color: 'var(--color-text-light)', fontSize: '0.78rem' }}>Capacity and the chamber's schedule are checked; a new serial is issued for the new date.</small>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-sm btn-secondary" onClick={() => remove(selected)} title="Delete permanently"><Trash2 size={14} /></button>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(statusActions[selected.status] || []).map(action => (
                  <button key={action.status} className={`btn btn-sm ${action.variant}`} disabled={busy}
                    onClick={() => updateStatus(selected.id, action.status)}>
                    {action.icon} {action.label}
                  </button>
                ))}
                {selected.status === 'pending' && (
                  <button className="btn btn-sm btn-secondary" disabled={busy} onClick={() => updateStatus(selected.id, 'cancelled')}>
                    <XCircle size={14} /> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-page-title { font-size: 1.75rem; margin-bottom: 1.5rem; }
        .admin-toolbar { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .admin-search { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 200px; }
        .admin-search svg { color: var(--color-text-light); flex-shrink: 0; }
        .admin-search .form-input { max-width: 300px; }
        .admin-filters { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
        .admin-filters .form-select, .admin-filters .form-input { width: auto; min-width: 140px; }
        .appts-table td, .appts-table th { white-space: nowrap; }
        .serial-chip { display: inline-block; min-width: 40px; text-align: center; padding: 0.2rem 0.5rem; border-radius: 6px; background: var(--color-primary-light); color: var(--color-primary-dark); font-weight: 800; font-size: 0.85rem; }
        .appt-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem 1rem; font-size: 0.9rem; }
        .appt-link { display: inline-flex; align-items: center; gap: 0.35rem; margin-top: 0.75rem; font-size: 0.85rem; color: var(--color-primary); font-weight: 600; }
        .reschedule-box { border-top: 1px solid var(--color-border); padding-top: 1rem; margin-top: 0.5rem; }
        .reschedule-box .form-label { display: flex; align-items: center; gap: 0.35rem; }
        .reschedule-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.5rem; margin-bottom: 0.4rem; }
        @media (max-width: 640px) { .appt-detail-grid { grid-template-columns: 1fr; } .reschedule-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
