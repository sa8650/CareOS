import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { fetchDoctor } from '../api/api';

export default function Footer() {
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    fetchDoctor().then(setDoctor).catch(() => {});
  }, []);

  const doctorName = doctor?.name || 'Doctor';
  const firstLetter = doctorName.charAt(0);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="footer-logo-icon">{firstLetter}</span>
              <span>{doctorName}</span>
            </div>
            <p>{doctor?.title || 'Dermatologist & Skin Specialist'}</p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <Link to="/about">About</Link>
            <Link to="/services">Services</Link>
            <Link to="/appointment">Book Appointment</Link>
            <Link to="/contact">Contact</Link>
          </div>

          <div>
            <h4>Contact Info</h4>
            {doctor?.phone && (
              <div className="footer-contact">
                <Phone size={16} /> <span>{doctor.phone}</span>
              </div>
            )}
            {doctor?.email && (
              <div className="footer-contact">
                <Mail size={16} /> <span>{doctor.email}</span>
              </div>
            )}
            {doctor?.address && (
              <div className="footer-contact">
                <MapPin size={16} /> <span>{doctor.address}</span>
              </div>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {doctorName}. All rights reserved.</p>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
      </div>

      <style>{`
        .footer { background: #0f172a; color: #94a3b8; padding: 3rem 0 0; margin-top: 4rem; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1.5fr; gap: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #1e293b; }
        .footer-brand p { margin-top: 0.5rem; font-size: 0.9rem; }
        .footer h4 { color: white; font-size: 1rem; margin-bottom: 1rem; }
        .footer a { display: block; font-size: 0.9rem; margin-bottom: 0.5rem; transition: color 0.2s; }
        .footer a:hover { color: var(--color-primary); }
        .footer-contact { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.75rem; font-size: 0.9rem; }
        .footer-bottom { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 0; font-size: 0.85rem; flex-wrap: wrap; gap: 1rem; }
        .footer-logo { display: flex; align-items: center; gap: 0.5rem; color: white; font-weight: 700; font-size: 1.1rem; }
        .footer-logo-icon {
          width: 36px; height: 36px; background: var(--color-primary); color: white;
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          font-size: 1rem; font-weight: 800;
        }
        @media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr; } }
      `}</style>
    </footer>
  );
}
