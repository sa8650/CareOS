import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, MessageSquare, Building2, Calendar, Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle, ExternalLink } from 'lucide-react';
import { useSiteInfo } from '../hooks/useSiteInfo';
import { formatTimeRange, formatVisitingDays, telHref } from '../utils/helpers';

const SOCIAL_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  whatsapp: MessageCircle,
};

export default function Contact() {
  const { contact, socials, chambers, loading } = useSiteInfo();

  const activeChambers = chambers.filter(c => (c.visiting_days || []).length > 0);
  const mapQuery = contact.address || chambers[0]?.address || '';
  const mapsHref = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : null;

  const cards = [
    contact.phone && { icon: <Phone size={26} />, title: 'Phone', content: contact.phone, sub: 'Call during visiting hours', href: telHref(contact.phone) },
    contact.email && { icon: <Mail size={26} />, title: 'Email', content: contact.email, sub: 'We respond within 24 hours', href: `mailto:${contact.email}` },
    contact.address && { icon: <MapPin size={26} />, title: 'Address', content: contact.address, sub: contact.clinic_name || 'Main location', href: mapsHref },
    chambers.length > 0 && {
      icon: <Clock size={26} />, title: 'Visiting Hours',
      content: `${chambers.length} chamber${chambers.length > 1 ? 's' : ''}`,
      sub: 'See chamber schedule below',
    },
  ].filter(Boolean);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <span className="page-hero-tag"><MessageSquare size={15} /> Get in touch</span>
          <h1>Contact Us</h1>
          <p>We're here to help. Reach out to us anytime.</p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container contact-grid">
          <div className="contact-info-cards">
            {loading && cards.length === 0 && <div className="loading-page" style={{ minHeight: 200 }}><div className="spinner" /></div>}
            {!loading && cards.length === 0 && (
              <div className="card"><div className="card-body" style={{ color: 'var(--color-text-light)' }}>Contact details will be published soon.</div></div>
            )}
            {cards.map((c, i) => {
              const inner = (
                <div className="card-body">
                  <div className="cic-icon">{c.icon}</div>
                  <div>
                    <h3>{c.title}</h3>
                    <p className="cic-main">{c.content}</p>
                    <p className="cic-sub">{c.sub}</p>
                  </div>
                </div>
              );
              return c.href
                ? <a key={i} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="contact-info-card card contact-info-card--link">{inner}</a>
                : <div key={i} className="contact-info-card card">{inner}</div>;
            })}

            {socials.length > 0 && (
              <div className="card contact-social-card">
                <div className="card-body">
                  <h3>Follow Us</h3>
                  <div className="contact-social">
                    {socials.map(s => {
                      const Icon = SOCIAL_ICONS[s.key] || MessageCircle;
                      return (
                        <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" className="contact-social-btn" title={s.label}>
                          <Icon size={18} /> <span>{s.label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="contact-right">
            <div className="contact-map">
              <div className="map-placeholder">
                <MapPin size={44} />
                <p>{mapQuery || 'Address not published yet'}</p>
                {mapsHref && (
                  <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    <ExternalLink size={16} /> Open in Google Maps
                  </a>
                )}
              </div>
            </div>

            {activeChambers.length > 0 && (
              <div className="contact-chambers card">
                <div className="card-body">
                  <h3><Building2 size={18} /> Chambers &amp; Visiting Hours</h3>
                  {activeChambers.map(ch => (
                    <div key={ch.id} className="contact-chamber">
                      <div className="contact-chamber-name">{ch.name}</div>
                      {ch.address && <div className="contact-chamber-row"><MapPin size={14} /> {ch.address}</div>}
                      <div className="contact-chamber-row"><Calendar size={14} /> {formatVisitingDays(ch.visiting_days)}</div>
                      <div className="contact-chamber-row"><Clock size={14} /> {formatTimeRange(ch.start_time, ch.end_time)}</div>
                      {ch.phone && <div className="contact-chamber-row"><Phone size={14} /> <a href={telHref(ch.phone)}>{ch.phone}</a></div>}
                    </div>
                  ))}
                  <Link to="/appointment" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Book an Appointment</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section section--dark contact-ask">
        <div className="container" style={{ maxWidth: 640, textAlign: 'center' }}>
          <span className="contact-ask-icon"><MessageSquare size={26} /></span>
          <h2 className="section-title">Have a Question?</h2>
          <p className="section-subtitle" style={{ marginBottom: '1.75rem' }}>
            If you have any questions about our services or would like to schedule an appointment, please don't hesitate to call or email us.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {contact.phone && (
              <a href={telHref(contact.phone)} className="btn btn-primary btn-lg">
                <Phone size={18} /> Call {contact.phone}
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="btn btn-lg contact-ask-alt">
                <Mail size={18} /> Email Us
              </a>
            )}
            {!contact.phone && !contact.email && (
              <Link to="/appointment" className="btn btn-primary btn-lg"><Calendar size={18} /> Book Appointment</Link>
            )}
          </div>
        </div>
      </section>

      <style>{`
        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start; }
        .contact-info-cards { display: grid; gap: 1rem; align-content: start; }
        .contact-info-card { display: block; color: inherit; }
        .contact-info-card .card-body { display: flex; align-items: flex-start; gap: 1rem; }
        .contact-info-card--link { transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
        .contact-info-card--link:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: rgba(14,165,233,0.3); }
        .cic-icon { color: var(--color-primary-dark); flex-shrink: 0; width: 48px; height: 48px; border-radius: 14px; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; }
        .contact-info-card h3 { font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-text-light); margin-bottom: 0.3rem; }
        .cic-main { font-weight: 700; font-size: 1.02rem; word-break: break-word; }
        .cic-sub { color: var(--color-text-light); font-size: 0.85rem; margin-top: 0.15rem; }

        .contact-social-card h3 { font-size: 1rem; margin-bottom: 0.75rem; }
        .contact-social { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .contact-social-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.95rem; border-radius: 999px; border: 1px solid var(--color-border); background: #fff; font-size: 0.85rem; font-weight: 600; color: var(--color-text); transition: all 0.2s; }
        .contact-social-btn:hover { border-color: var(--color-primary); color: var(--color-primary-dark); background: var(--color-primary-light); }

        .contact-right { display: grid; gap: 1.25rem; }
        .map-placeholder {
          position: relative; overflow: hidden;
          width: 100%; min-height: 260px; padding: 2rem; border: 1px solid var(--color-border);
          background: #fff radial-gradient(rgba(14,165,233,0.12) 1px, transparent 1px); background-size: 18px 18px;
          border-radius: var(--radius-xl); display: flex; flex-direction: column; text-align: center;
          align-items: center; justify-content: center; gap: 0.9rem; color: var(--color-text-light); box-shadow: var(--shadow-card);
        }
        .map-placeholder > svg { color: var(--color-primary); filter: drop-shadow(0 8px 12px rgba(14,165,233,0.35)); }
        .map-placeholder p { font-weight: 600; color: var(--color-text); max-width: 360px; line-height: 1.5; }
        .contact-chambers h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.05rem; margin-bottom: 0.5rem; }
        .contact-chambers h3 svg { color: var(--color-primary); }
        .contact-chamber { padding: 1rem 0; border-top: 1px solid var(--color-border); }
        .contact-chamber-name { font-weight: 700; color: var(--color-primary-dark); margin-bottom: 0.4rem; }
        .contact-chamber-row { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.9rem; color: var(--color-text-light); margin-bottom: 0.3rem; line-height: 1.5; }
        .contact-chamber-row svg { color: var(--color-primary); flex-shrink: 0; margin-top: 0.2rem; }

        .contact-ask-icon { width: 56px; height: 56px; border-radius: 18px; display: inline-flex; align-items: center; justify-content: center; background: rgba(14,165,233,0.2); color: #7dd3fc; border: 1px solid rgba(125,211,252,0.3); margin-bottom: 1.1rem; }
        .contact-ask-alt { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.25); }
        .contact-ask-alt:hover { background: rgba(255,255,255,0.18); }
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr; gap: 1.25rem; }
          .contact-ask .btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}
