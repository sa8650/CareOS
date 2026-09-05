import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location]);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/services', label: 'Services' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-icon">Dr</span>
          <span>Dr. Sarah Mitchell</span>
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
          background: rgba(255,255,255,0.95); backdrop-filter: blur(10px);
          border-bottom: 1px solid transparent; transition: all 0.3s ease;
        }
        .nav--scrolled { border-bottom-color: var(--color-border); box-shadow: var(--shadow-sm); }
        .nav-inner { display: flex; align-items: center; justify-content: space-between; height: 70px; }
        .nav-logo { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 1.1rem; }
        .nav-logo-icon {
          width: 36px; height: 36px; background: var(--color-primary); color: white;
          border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; font-weight: 800;
        }
        .nav-links { display: flex; align-items: center; gap: 2rem; }
        .nav-link { font-weight: 500; font-size: 0.95rem; color: var(--color-text-light); transition: color 0.2s; }
        .nav-link:hover, .nav-link--active { color: var(--color-primary); }
        .nav-toggle { display: none; }

        @media (max-width: 768px) {
          .nav-toggle { display: flex; }
          .nav-links {
            position: fixed; top: 70px; left: 0; right: 0; background: white;
            flex-direction: column; padding: 2rem; gap: 1.5rem;
            transform: translateY(-100%); opacity: 0; pointer-events: none;
            transition: all 0.3s ease; border-bottom: 1px solid var(--color-border);
          }
          .nav-links--open { transform: translateY(0); opacity: 1; pointer-events: auto; }
        }
      `}</style>
    </header>
  );
}
