import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, Hash, Phone, MapPin } from 'lucide-react';
import { fetchAppointment } from '../api/api';
import { formatDate, formatTime, statusColor } from '../utils/helpers';

export default function AppointmentSuccess() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <section className="page-hero" style={{ paddingBottom: '2rem' }}>
        <div className="container">
          <CheckCircle size={48} style={{ color: 'var(--color-success)', marginBottom: '1rem' }} />
          <h1>Appointment Confirmed!</h1>
          <p>Your appointment has been successfully booked</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 600 }}>
          <div className="success-card card">
            <div className="card-body">
              <div className="success-ref">
                <Hash size={18} />
                <span>Reference: <strong>{appointment.reference}</strong></span>
              </div>

              <div className="success-details">
                <div className="success-item">
                  <Calendar size={18} />
                  <div>
                    <span className="success-label">Date</span>
                    <strong>{formatDate(appointment.appointment_date)}</strong>
                  </div>
                </div>
                <div className="success-item">
                  <Clock size={18} />
                  <div>
                    <span className="success-label">Time</span>
                    <strong>{formatTime(appointment.start_time)} – {formatTime(appointment.end_time)}</strong>
                  </div>
                </div>
                <div className="success-item">
                  <div style={{ width: 18, height: 18 }} />
                  <div>
                    <span className="success-label">Service</span>
                    <strong>{appointment.service_name}</strong>
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
                <h3>Clinic Information</h3>
                <p><MapPin size={14} /> 123 Medical Plaza, Suite 200, New York, NY 10001</p>
                <p><Phone size={14} /> +1 (555) 123-4567</p>
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
        .page-hero { padding: 8rem 0 2rem; background: linear-gradient(135deg, #f0fdf4, #d1fae5); text-align: center; }
        .page-hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .page-hero p { color: var(--color-text-light); font-size: 1.1rem; }
        .success-ref {
          display: flex; align-items: center; gap: 0.5rem; padding: 1rem;
          background: var(--color-primary-light); border-radius: var(--radius-md);
          margin-bottom: 2rem; font-size: 1.1rem;
        }
        .success-details { display: grid; gap: 1.25rem; margin-bottom: 2rem; }
        .success-item { display: flex; align-items: flex-start; gap: 0.75rem; }
        .success-item svg { color: var(--color-primary); margin-top: 0.125rem; }
        .success-label { display: block; font-size: 0.85rem; color: var(--color-text-light); margin-bottom: 0.125rem; }
        .success-clinic {
          padding: 1.25rem; background: var(--color-bg-alt); border-radius: var(--radius-md);
          margin-bottom: 2rem;
        }
        .success-clinic h3 { font-size: 1rem; margin-bottom: 0.75rem; }
        .success-clinic p { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: var(--color-text-light); margin-bottom: 0.375rem; }
        .success-actions { display: flex; gap: 1rem; }
      `}</style>
    </div>
  );
}
