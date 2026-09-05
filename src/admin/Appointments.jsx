import { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, XCircle, Clock, RefreshCw, Check } from 'lucide-react';
import { adminGet, adminPut } from '../api/api';
import { formatDate, formatTime, statusColor } from '../utils/helpers';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');

  const load = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (dateFilter) params.set('date', dateFilter);
    if (search) params.set('search', search);
    adminGet(`/appointments?${params}`)
      .then(setAppointments)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, dateFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const updateStatus = async (id, status) => {
    try {
      await adminPut(`/appointments/${id}`, { status, admin_note: note });
      setSelected(null);
      setNote('');
      load();
    } catch (err) {
      alert(err.message);
    }
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

  return (
    <div>
      <h1 className="admin-page-title">Appointments</h1>

      <div className="admin-toolbar">
        <form onSubmit={handleSearch} className="admin-search">
          <Search size={16} />
          <input type="text" placeholder="Search by name, reference..." value={search}
            onChange={e => setSearch(e.target.value)} className="form-input" />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
        <div className="admin-filters">
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
          <input type="date" className="form-input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : appointments.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: '3rem' }}>No appointments found.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Patient</th>
                <th>Phone</th>
                <th>Service</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.reference}</strong></td>
                  <td>{a.patient_name}</td>
                  <td>{a.patient_phone}</td>
                  <td>{a.service_name}</td>
                  <td>{formatDate(a.appointment_date)}</td>
                  <td>{formatTime(a.start_time)}</td>
                  <td><span className={`badge ${statusColor(a.status)}`}>{a.status}</span></td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => setSelected(a)}>
                      <Eye size={14} />
                    </button>
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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Appointment {selected.reference}</h3>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="appt-detail-grid">
                <div><strong>Patient:</strong> {selected.patient_name}</div>
                <div><strong>Phone:</strong> {selected.patient_phone}</div>
                <div><strong>Email:</strong> {selected.patient_email || 'N/A'}</div>
                <div><strong>Service:</strong> {selected.service_name}</div>
                <div><strong>Date:</strong> {formatDate(selected.appointment_date)}</div>
                <div><strong>Time:</strong> {formatTime(selected.start_time)} – {formatTime(selected.end_time)}</div>
                <div><strong>Status:</strong> <span className={`badge ${statusColor(selected.status)}`}>{selected.status}</span></div>
                {selected.message && <div><strong>Message:</strong> {selected.message}</div>}
                {selected.admin_note && <div><strong>Note:</strong> {selected.admin_note}</div>}
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Admin Note</label>
                <textarea className="form-textarea" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Add a note..." rows={2} />
              </div>
            </div>
            <div className="modal-footer">
              {(statusActions[selected.status] || []).map(action => (
                <button key={action.status} className={`btn btn-sm ${action.variant}`}
                  onClick={() => updateStatus(selected.id, action.status)}>
                  {action.icon} {action.label}
                </button>
              ))}
              {selected.status === 'pending' && (
                <button className="btn btn-sm btn-secondary"
                  onClick={() => updateStatus(selected.id, 'cancelled')}>
                  <XCircle size={14} /> Cancel
                </button>
              )}
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
        .admin-filters { display: flex; gap: 0.5rem; }
        .admin-filters .form-select, .admin-filters .form-input { width: auto; min-width: 140px; }
        .appt-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.9rem; }
        @media (max-width: 640px) { .admin-filters { flex-wrap: wrap; } }
      `}</style>
    </div>
  );
}
