import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="nav-logo-icon">Dr</span>
              <span>Dr. Sarah Mitchell</span>
            </div>
            <p>Board-certified dermatologist providing expert skin care with compassion and precision.</p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <Link to="/about">About</Link>
            <Link to="/services">Services</Link>
            <Link to="/appointment">Book Appointment</Link>
            <Link to="/contact">Contact</Link>
          </div>

          <div>
            <h4>Services</h4>
            <Link to="/services">Acne Treatment</Link>
            <Link to="/services">Anti-Aging</Link>
            <Link to="/services">PRP Therapy</Link>
            <Link to="/services">Laser Treatment</Link>
          </div>

          <div>
            <h4>Contact Info</h4>
            <div className="footer-contact">
              <Phone size={16} /> <span>+1 (555) 123-4567</span>
            </div>
            <div className="footer-contact">
              <Mail size={16} /> <span>info@drsarahmitchell.com</span>
            </div>
            <div className="footer-contact">
              <MapPin size={16} /> <span>123 Medical Plaza, Suite 200, New York, NY 10001</span>
            </div>
            <div className="footer-contact">
              <Clock size={16} /> <span>Mon–Fri: 9AM–5PM</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Dr. Sarah Mitchell. All rights reserved.</p>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
      </div>

      <style>{`
        .footer { background: #0f172a; color: #94a3b8; padding: 4rem 0 0; margin-top: 4rem; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 2rem; padding-bottom: 3rem; border-bottom: 1px solid #1e293b; }
        .footer-brand p { margin-top: 0.75rem; font-size: 0.9rem; line-height: 1.6; }
        .footer h4 { color: white; font-size: 1rem; margin-bottom: 1rem; }
        .footer a { display: block; font-size: 0.9rem; margin-bottom: 0.5rem; transition: color 0.2s; }
        .footer a:hover { color: var(--color-primary); }
        .footer-contact { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.75rem; font-size: 0.9rem; }
        .footer-bottom {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.5rem 0; font-size: 0.85rem; flex-wrap: wrap; gap: 1rem;
        }
        .footer-logo { display: flex; align-items: center; gap: 0.5rem; color: white; font-weight: 700; font-size: 1.1rem; }

        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </footer>
  );
}
