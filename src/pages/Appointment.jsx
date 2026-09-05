import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Phone, Clock } from 'lucide-react';
import AppointmentForm from '../components/AppointmentForm';
import { fetchDoctor } from '../api/api';

export default function Appointment() {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    fetchDoctor().then(setDoctor).catch(() => {});
  }, []);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <h1><Calendar size={28} /> Book an Appointment</h1>
          <p>Select your service, choose a time, and we'll take care of the rest</p>
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
                  <h3>Clinic Information</h3>
                  <div className="appt-info-item">
                    <MapPin size={16} />
                    <div>
                      <strong>Address</strong>
                      <p>{doctor?.address || '123 Medical Plaza, Suite 200, New York, NY 10001'}</p>
                    </div>
                  </div>
                  <div className="appt-info-item">
                    <Phone size={16} />
                    <div>
                      <strong>Phone</strong>
                      <p>{doctor?.phone || '+1 (555) 123-4567'}</p>
                    </div>
                  </div>
                  <div className="appt-info-item">
                    <Clock size={16} />
                    <div>
                      <strong>Hours</strong>
                      <p>Monday–Friday: 9:00 AM – 5:00 PM</p>
                      <p>Saturday: 9:00 AM – 1:00 PM</p>
                      <p>Sunday: Closed</p>
                    </div>
                  </div>
                  <div className="appt-info-note">
                    <strong>What to Bring</strong>
                    <p>Photo ID, insurance card, list of current medications, and any relevant medical records.</p>
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
        .appt-page-grid { display: grid; grid-template-columns: 1fr 380px; gap: 3rem; align-items: start; }
        .appt-info-item { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1.25rem; }
        .appt-info-item svg { color: var(--color-primary); flex-shrink: 0; margin-top: 0.25rem; }
        .appt-info-item strong { display: block; margin-bottom: 0.25rem; font-size: 0.9rem; }
        .appt-info-item p { color: var(--color-text-light); font-size: 0.9rem; line-height: 1.5; }
        .appt-info-note { background: var(--color-bg-alt); padding: 1rem; border-radius: var(--radius-md); margin-top: 1rem; }
        .appt-info-note strong { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; }
        .appt-info-note p { color: var(--color-text-light); font-size: 0.85rem; line-height: 1.5; }
        .appt-info .card { position: sticky; top: 90px; }
        @media (max-width: 768px) {
          .appt-page-grid { grid-template-columns: 1fr; }
          .appt-info .card { position: static; }
        }
      `}</style>
    </div>
  );
}
