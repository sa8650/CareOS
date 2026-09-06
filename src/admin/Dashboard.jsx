import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, BarChart3, Building2, CalendarDays } from 'lucide-react';
import { adminGet } from '../api/api';
import { formatDate, statusColor } from '../utils/helpers';

export default function Dashboard() {
  const [stats, setStats] = useState({ today: 0, pending: 0, confirmed: 0, completed: 0, total: 0, chambers: 0, today_by_chamber: [] });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminGet('/stats'),
      adminGet('/appointments?limit=8'),
    ]).then(([s, a]) => {
      setStats(s);
      setRecentAppointments(a);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const statCards = [
    { icon: <Calendar />, value: stats.today, label: "Today's Patients", color: '#0ea5e9' },
    { icon: <Clock />, value: stats.pending, label: 'Pending', color: '#f59e0b' },
    { icon: <CheckCircle />, value: stats.confirmed, label: 'Confirmed', color: '#10b981' },
    { icon: <BarChart3 />, value: stats.completed, label: 'Completed', color: '#8b5cf6' },
    { icon: <Building2 />, value: stats.chambers, label: 'Active Chambers', color: '#64748b' },
  ];

  return (
    <div>
      <h1 className="admin-page-title">Dashboard</h1>

      <div className="dashboard-stats">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card card">
            <div className="card-body">
              <div className="stat-card-icon" style={{ color: s.color, background: s.color + '15' }}>{s.icon}</div>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {stats.today_by_chamber?.length > 0 && (
        <div className="dashboard-chambers">
          <h2>Today by Chamber <span>({formatDate(stats.date)})</span></h2>
          <div className="dashboard-chamber-grid">
            {stats.today_by_chamber.map(c => (
              <Link key={c.id} to={`/admin/schedule?chamber=${c.id}`} className="dashboard-chamber card">
                <div className="card-body">
                  <div className="dashboard-chamber-name"><Building2 size={16} /> {c.name}</div>
                  <div className="dashboard-chamber-count">{c.today} <small>patients</small></div>
                  <div className="dashboard-chamber-link"><CalendarDays size={13} /> Open schedule</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-recent">
        <h2>Recent Appointments</h2>
        {recentAppointments.length === 0 ? (
          <p style={{ color: 'var(--color-text-light)' }}>No appointments yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Serial</th>
                  <th>Patient</th>
                  <th>Chamber</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map(a => (
                  <tr key={a.id}>
                    <td><strong>#{a.serial_number ?? '–'}</strong></td>
                    <td>{a.patient_name}</td>
                    <td>{a.chamber_name || '—'}</td>
                    <td>{formatDate(a.appointment_date)}</td>
                    <td><span className={`badge ${statusColor(a.status)}`}>{a.status}</span></td>
                    <td style={{ color: 'var(--color-text-light)', fontSize: '0.8rem' }}>{a.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .admin-page-title { font-size: 1.75rem; margin-bottom: 2rem; }
        .dashboard-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .stat-card .card-body { text-align: center; padding: 1.25rem; }
        .stat-card-icon {
          width: 48px; height: 48px; border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem;
        }
        .stat-card-value { font-size: 2rem; font-weight: 800; }
        .stat-card-label { font-size: 0.85rem; color: var(--color-text-light); }
        .dashboard-chambers { margin-bottom: 2rem; }
        .dashboard-chambers h2, .dashboard-recent h2 { font-size: 1.25rem; margin-bottom: 1rem; }
        .dashboard-chambers h2 span { font-weight: 400; font-size: 0.9rem; color: var(--color-text-light); }
        .dashboard-chamber-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
        .dashboard-chamber .card-body { padding: 1rem 1.25rem; }
        .dashboard-chamber-name { display: flex; align-items: center; gap: 0.4rem; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem; }
        .dashboard-chamber-name svg { color: var(--color-primary); }
        .dashboard-chamber-count { font-size: 1.75rem; font-weight: 800; }
        .dashboard-chamber-count small { font-size: 0.8rem; font-weight: 500; color: var(--color-text-light); }
        .dashboard-chamber-link { display: flex; align-items: center; gap: 0.3rem; font-size: 0.78rem; color: var(--color-primary); font-weight: 600; margin-top: 0.4rem; }
        @media (max-width: 1024px) { .dashboard-stats { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px) { .dashboard-stats { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}
