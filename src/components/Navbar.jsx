import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';
import { fetchDoctor } from '../api/api';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    fetchDoctor().then(setDoctor).catch(() => {});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location]);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/services', label: 'Services' },
    { to: '/contact', label: 'Contact' },
  ];

  const doctorName = doctor?.name || 'Doctor';
  const doctorTitle = doctor?.title || 'Specialist';
  const firstLetter = doctorName.charAt(0);

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-icon">{firstLetter}</span>
          <div className="nav-logo-text">
            <span className="nav-logo-name">{doctorName}</span>
            <span className="nav-logo-title">{doctorTitle}</span>
          </div>
        </Link>

        <nav className={`nav-links ${open ? 'nav-links--open' : ''}`}>
          {links.map(l => (
            <Link key={l.to} to={l.to} className={`nav-link ${location.pathname === l.to ? 'nav-link--active' : ''}`}>
              {l.label}
            </Link>
          ))}
          <Link to="/appointment" className="btn btn-primary btn-sm nav-cta">
            <Phone size={16} /> Book Appointment
          </Link>
        </nav>

        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <style>{`
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(255,255,255,0.72); backdrop-filter: blur(14px) saturate(160%); -webkit-backdrop-filter: blur(14px) saturate(160%);
          border-bottom: 1px solid rgba(255,255,255,0.5); transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .nav--scrolled { background: rgba(255,255,255,0.92); border-bottom-color: var(--color-border); box-shadow: 0 8px 24px -18px rgba(15,23,42,0.35); }
        .nav-inner { display: flex; align-items: center; justify-content: space-between; height: 70px; }
        .nav-logo { display: flex; align-items: center; gap: 0.75rem; }
        .nav-logo-icon {
          width: 40px; height: 40px; background: var(--gradient-brand); color: white;
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; font-weight: 800; flex-shrink: 0; box-shadow: 0 8px 16px -8px rgba(14,165,233,0.7);
        }
        .nav-logo-text { display: flex; flex-direction: column; line-height: 1.2; }
        .nav-logo-name { font-weight: 700; font-size: 1rem; color: var(--color-text); }
        .nav-logo-title { font-size: 0.7rem; color: var(--color-text-light); font-weight: 500; }
        .nav-links { display: flex; align-items: center; gap: 0.35rem; }
        .nav-link { position: relative; font-weight: 500; font-size: 0.93rem; color: var(--color-text-light); padding: 0.5rem 0.85rem; border-radius: var(--radius-full); transition: color 0.2s, background 0.2s; }
        .nav-link:hover { color: var(--color-text); background: rgba(15,23,42,0.05); }
        .nav-link--active { color: var(--color-primary-dark); background: var(--color-primary-light); font-weight: 600; }
        .nav-cta { margin-left: 0.75rem; border-radius: var(--radius-full); box-shadow: 0 8px 18px -10px rgba(14,165,233,0.8); }
        .nav-toggle { display: none; width: 42px; height: 42px; align-items: center; justify-content: center; border-radius: 12px; color: var(--color-text); }
        .nav-toggle:hover { background: rgba(15,23,42,0.05); }

        @media (max-width: 768px) {
          .nav-toggle { display: flex; }
          .nav-links {
            position: fixed; top: 70px; left: 0; right: 0; background: rgba(255,255,255,0.98); backdrop-filter: blur(14px);
            flex-direction: column; align-items: stretch; padding: 1rem 1rem 1.25rem; gap: 0.25rem;
            transform: translateY(-8px); opacity: 0; pointer-events: none;
            transition: all 0.25s ease; border-bottom: 1px solid var(--color-border); box-shadow: 0 24px 40px -24px rgba(15,23,42,0.35);
          }
          .nav-links--open { transform: translateY(0); opacity: 1; pointer-events: auto; }
          .nav-link { padding: 0.8rem 1rem; font-size: 1rem; border-radius: var(--radius-lg); }
          .nav-cta { margin: 0.6rem 0 0; justify-content: center; padding: 0.85rem 1rem; font-size: 0.95rem; }
        }
      `}</style>
    </header>
  );
}
