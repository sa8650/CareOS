import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, Hash, Phone, MapPin, Building2 } from 'lucide-react';
import { fetchAppointment } from '../api/api';
import { formatDateLong, formatTimeRange, statusColor } from '../utils/helpers';

export default function AppointmentSuccess() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetchAppointment(id)
      .then(setAppointment)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (error) return (
    <div className="loading-page">
      <div style={{ textAlign: 'center' }}>
        <p style={{ marginBottom: '1rem' }}>Appointment not found.</p>
        <Link to="/appointment" className="btn btn-primary">Book an Appointment</Link>
      </div>
    </div>
  );

  return (
    <div>
      {showToast && (
        <div className="toast toast-success" role="status">
          Appointment booked — your serial is #{appointment.serial_number ?? '—'}
        </div>
      )}
      <section className="page-hero success-hero">
        <div className="container">
          <span className="success-hero-icon"><CheckCircle size={30} /></span>
          <h1>Appointment Booked!</h1>
          <p>Please save your serial number and reference</p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container" style={{ maxWidth: 600 }}>
          <div className="success-card card">
            <div className="card-body">
              <div className="success-serial">
                <span className="success-serial-label">Your Serial Number</span>
                <span className="success-serial-num">#{appointment.serial_number ?? '—'}</span>
                <span className="success-serial-sub">{appointment.chamber_name || 'Chamber'} · {formatDateLong(appointment.appointment_date)}</span>
              </div>

              <div className="success-ref">
                <Hash size={18} />
                <span>Reference: <strong>{appointment.reference}</strong></span>
              </div>

              <div className="success-details">
                <div className="success-item">
                  <Building2 size={18} />
                  <div>
                    <span className="success-label">Chamber</span>
                    <strong>{appointment.chamber_name || '—'}</strong>
                    {appointment.chamber_address && <p className="success-addr"><MapPin size={12} /> {appointment.chamber_address}</p>}
                  </div>
                </div>
                <div className="success-item">
                  <Calendar size={18} />
                  <div>
                    <span className="success-label">Date</span>
                    <strong>{formatDateLong(appointment.appointment_date)}</strong>
                  </div>
                </div>
                <div className="success-item">
                  <Clock size={18} />
                  <div>
                    <span className="success-label">Visiting Hours</span>
                    <strong>{formatTimeRange(appointment.start_time, appointment.end_time) || '—'}</strong>
                  </div>
                </div>
                <div className="success-item">
                  <div style={{ width: 18, height: 18 }} />
                  <div>
                    <span className="success-label">Status</span>
                    <span className={`badge ${statusColor(appointment.status)}`}>{appointment.status}</span>
                  </div>
                </div>
              </div>

              <div className="success-clinic">
                <h3>Before you visit</h3>
                <p>Patients are seen in serial order during the visiting hours. Please arrive on time with your previous reports.</p>
                {appointment.chamber_phone && <p><Phone size={14} /> {appointment.chamber_phone}</p>}
              </div>

              <div className="success-actions">
                <Link to="/" className="btn btn-secondary">Back to Home</Link>
                <Link to="/contact" className="btn btn-primary">Contact Clinic</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .success-hero { padding-bottom: 2.5rem; }
        .success-hero-icon { width: 64px; height: 64px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; background: #fff; color: var(--color-success); box-shadow: var(--shadow-md); margin-bottom: 1rem; }
        .success-card { box-shadow: var(--shadow-lg); }
        .success-serial { text-align: center; padding: 1.5rem; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: white; border-radius: var(--radius-lg); margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.2rem; }
        .success-serial-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.9; font-weight: 600; }
        .success-serial-num { font-size: 3.25rem; font-weight: 800; line-height: 1.1; }
        .success-serial-sub { font-size: 0.9rem; opacity: 0.9; }
        .success-ref {
          display: flex; align-items: center; gap: 0.5rem; padding: 1rem;
          background: var(--color-primary-light); border-radius: var(--radius-md);
          margin-bottom: 2rem; font-size: 1.05rem;
        }
        .success-details { display: grid; gap: 1.25rem; margin-bottom: 2rem; }
        .success-item { display: flex; align-items: flex-start; gap: 0.75rem; }
        .success-item svg { color: var(--color-primary); margin-top: 0.125rem; flex-shrink: 0; }
        .success-label { display: block; font-size: 0.85rem; color: var(--color-text-light); margin-bottom: 0.125rem; }
        .success-addr { display: flex; align-items: center; gap: 0.3rem; font-size: 0.85rem; color: var(--color-text-light); margin-top: 0.2rem; }
        .success-clinic { padding: 1.25rem; background: var(--color-bg-alt); border-radius: var(--radius-md); margin-bottom: 2rem; }
        .success-clinic h3 { font-size: 1rem; margin-bottom: 0.75rem; }
        .success-clinic p { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: var(--color-text-light); margin-bottom: 0.375rem; line-height: 1.5; }
        .success-actions { display: flex; gap: 1rem; }
        @media (max-width: 640px) {
          .success-hero { padding-bottom: 1.75rem; }
          .success-hero-icon { width: 54px; height: 54px; }
          .success-serial-num { font-size: 2.75rem; }
          .success-ref { font-size: 0.95rem; word-break: break-all; }
          .success-actions { flex-direction: column; }
          .success-actions .btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}
