import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { adminGet } from '../api/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ today: 0, pending: 0, confirmed: 0, completed: 0, total: 0 });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminGet('/stats'),
      adminGet('/appointments?limit=5'),
    ]).then(([s, a]) => {
      setStats(s);
      setRecentAppointments(a);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const statCards = [
    { icon: <Calendar />, value: stats.today, label: "Today's Appointments", color: '#0ea5e9' },
    { icon: <Clock />, value: stats.pending, label: 'Pending', color: '#f59e0b' },
    { icon: <CheckCircle />, value: stats.confirmed, label: 'Confirmed', color: '#10b981' },
    { icon: <BarChart3 />, value: stats.completed, label: 'Completed', color: '#8b5cf6' },
    { icon: <XCircle />, value: stats.total, label: 'Total', color: '#64748b' },
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

      <div className="dashboard-recent">
        <h2>Recent Appointments</h2>
        {recentAppointments.length === 0 ? (
          <p style={{ color: 'var(--color-text-light)' }}>No appointments yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Patient</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.reference}</strong></td>
                    <td>{a.patient_name}</td>
                    <td>{a.service_name}</td>
                    <td>{a.appointment_date}</td>
                    <td>{a.start_time}</td>
                    <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .admin-page-title { font-size: 1.75rem; margin-bottom: 2rem; }
        .dashboard-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 2.5rem; }
        .stat-card .card-body { text-align: center; padding: 1.25rem; }
        .stat-card-icon {
          width: 48px; height: 48px; border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem;
        }
        .stat-card-value { font-size: 2rem; font-weight: 800; }
        .stat-card-label { font-size: 0.85rem; color: var(--color-text-light); }
        .dashboard-recent h2 { font-size: 1.25rem; margin-bottom: 1rem; }
        @media (max-width: 1024px) { .dashboard-stats { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px) { .dashboard-stats { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}
