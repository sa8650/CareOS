import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Phone, Clock, Building2, Users } from 'lucide-react';
import AppointmentForm from '../components/AppointmentForm';
import { fetchDoctor, fetchChambers } from '../api/api';
import { formatTimeRange, formatVisitingDays } from '../utils/helpers';

export default function Appointment() {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [chambers, setChambers] = useState([]);

  useEffect(() => {
    fetchDoctor().then(setDoctor).catch(() => {});
    fetchChambers().then(setChambers).catch(() => {});
  }, []);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <h1><Calendar size={28} /> Book an Appointment</h1>
          <p>Choose a chamber and a date — you'll receive a serial number instantly</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="appt-page-grid">
            <div>
              <AppointmentForm onSuccess={(res) => navigate(`/appointment/success/${res.reference}`)} />
            </div>
            <div className="appt-info">
              <div className="card">
                <div className="card-body">
                  <h3><Building2 size={18} /> Chambers & Visiting Hours</h3>
                  {chambers.length === 0 ? (
                    <p className="appt-info-muted">Chamber information will appear here.</p>
                  ) : chambers.map(c => (
                    <div key={c.id} className="appt-chamber">
                      <strong>{c.name}</strong>
                      {c.address && <p><MapPin size={13} /> {c.address}</p>}
                      <p><Calendar size={13} /> {formatVisitingDays(c.visiting_days)}</p>
                      <p><Clock size={13} /> {formatTimeRange(c.start_time, c.end_time)}</p>
                      <p><Users size={13} /> Up to {c.daily_limit} patients per day</p>
                      {c.phone && <p><Phone size={13} /> {c.phone}</p>}
                    </div>
                  ))}
                  {doctor?.phone && (
                    <div className="appt-info-note">
                      <strong>Need help?</strong>
                      <p>Call {doctor.phone} to book by phone or change an existing appointment.</p>
                    </div>
                  )}
                  <div className="appt-info-note">
                    <strong>What to Bring</strong>
                    <p>Previous prescriptions, test reports, list of current medications, and your serial number.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .page-hero { padding: 8rem 0 3rem; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); text-align: center; }
        .page-hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .page-hero p { color: var(--color-text-light); font-size: 1.1rem; }
        .appt-page-grid { display: grid; grid-template-columns: 1fr 360px; gap: 3rem; align-items: start; }
        .appt-info h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.05rem; margin-bottom: 1rem; }
        .appt-info h3 svg { color: var(--color-primary); }
        .appt-info-muted { color: var(--color-text-light); font-size: 0.9rem; }
        .appt-chamber { padding: 0.9rem 0; border-bottom: 1px solid var(--color-border); }
        .appt-chamber:last-of-type { border-bottom: none; }
        .appt-chamber strong { display: block; margin-bottom: 0.4rem; color: var(--color-primary-dark); }
        .appt-chamber p { display: flex; align-items: flex-start; gap: 0.45rem; color: var(--color-text-light); font-size: 0.85rem; line-height: 1.5; margin-bottom: 0.2rem; }
        .appt-chamber svg { color: var(--color-primary); flex-shrink: 0; margin-top: 4px; }
        .appt-info-note { background: var(--color-bg-alt); padding: 1rem; border-radius: var(--radius-md); margin-top: 1rem; }
        .appt-info-note strong { display: block; margin-bottom: 0.4rem; font-size: 0.9rem; }
        .appt-info-note p { color: var(--color-text-light); font-size: 0.85rem; line-height: 1.5; }
        .appt-info .card { position: sticky; top: 90px; }
        @media (max-width: 900px) {
          .appt-page-grid { grid-template-columns: 1fr; }
          .appt-info .card { position: static; }
        }
      `}</style>
    </div>
  );
}
