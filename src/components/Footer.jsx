import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle, Code2 } from 'lucide-react';
import { useSiteInfo } from '../hooks/useSiteInfo';
import { telHref } from '../utils/helpers';

const SOCIAL_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  whatsapp: MessageCircle,
};

export default function Footer() {
  const { doctor, contact, socials } = useSiteInfo();

  const doctorName = doctor?.name || 'Doctor';
  const firstLetter = doctorName.charAt(0);
  const hasContact = contact.phone || contact.email || contact.address;

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
            {contact.clinic_name && <p className="footer-clinic">{contact.clinic_name}</p>}

            {socials.length > 0 && (
              <div className="footer-social" aria-label="Social media">
                {socials.map(s => {
                  const Icon = SOCIAL_ICONS[s.key] || MessageCircle;
                  return (
                    <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label} aria-label={s.label} className="footer-social-btn">
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
            )}
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
            {contact.phone && (
              <a href={telHref(contact.phone)} className="footer-contact">
                <Phone size={16} /> <span>{contact.phone}</span>
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="footer-contact">
                <Mail size={16} /> <span>{contact.email}</span>
              </a>
            )}
            {contact.address && (
              <div className="footer-contact">
                <MapPin size={16} /> <span>{contact.address}</span>
              </div>
            )}
            {!hasContact && <p className="footer-muted">Contact details coming soon.</p>}
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {doctorName}. All rights reserved.</p>
          <div className="footer-bottom-right">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="footer-dev">
              <Code2 size={14} /> Developed by <strong>Dexter Studio</strong>
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .footer {
          position: relative; overflow: hidden; color: #94a3b8; padding: 4rem 0 0; margin-top: 0;
          background:
            radial-gradient(640px 320px at 100% 0%, rgba(14,165,233,0.16), transparent 65%),
            radial-gradient(520px 320px at 0% 100%, rgba(139,92,246,0.12), transparent 65%),
            var(--color-navy);
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .footer::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 3px; background: var(--gradient-brand); opacity: 0.9; }
        .footer .container { position: relative; z-index: 1; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1.5fr; gap: 2.5rem; padding-bottom: 2.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .footer-brand p { margin-top: 0.5rem; font-size: 0.9rem; }
        .footer-clinic { color: #cbd5e1; font-weight: 500; }
        .footer h4 { color: white; font-size: 0.8rem; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 1.1rem; }
        .footer a { display: block; font-size: 0.92rem; margin-bottom: 0.6rem; transition: color 0.2s, transform 0.2s; color: inherit; }
        .footer a:hover { color: #7dd3fc; }
        .footer-contact { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.75rem; font-size: 0.9rem; }
        .footer-contact svg { flex-shrink: 0; margin-top: 2px; }
        .footer-muted { font-size: 0.85rem; opacity: 0.7; }
        .footer-social { display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; }
        .footer a.footer-social-btn { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 12px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; margin: 0; transition: all 0.2s; }
        .footer a.footer-social-btn:hover { background: var(--color-primary); border-color: var(--color-primary); color: white; transform: translateY(-2px); }
        .footer-bottom { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 0; font-size: 0.85rem; flex-wrap: wrap; gap: 1rem; }
        .footer-bottom-right { display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap; }
        .footer-bottom-right a { margin: 0; }
        .footer-dev { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: #64748b; }
        .footer-dev strong { color: #94a3b8; font-weight: 600; }
        .footer-logo { display: flex; align-items: center; gap: 0.5rem; color: white; font-weight: 700; font-size: 1.1rem; }
        .footer-logo-icon {
          width: 38px; height: 38px; background: var(--gradient-brand); color: white;
          border-radius: 11px; display: flex; align-items: center; justify-content: center;
          font-size: 1rem; font-weight: 800; box-shadow: 0 8px 16px -8px rgba(14,165,233,0.8);
        }
        @media (max-width: 768px) {
          .footer { padding-top: 3rem; }
          .footer-grid { grid-template-columns: 1fr; gap: 2rem; }
          .footer-bottom { flex-direction: column; text-align: center; }
          .footer-bottom-right { justify-content: center; }
        }
      `}</style>
    </footer>
  );
}
