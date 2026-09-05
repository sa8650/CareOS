import { Phone, Mail, MapPin, Clock, MessageSquare } from 'lucide-react';

export default function Contact() {
  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <h1>Contact Us</h1>
          <p>We're here to help. Reach out to us anytime.</p>
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">
          <div className="contact-info-cards">
            {[
              { icon: <Phone size={28} />, title: 'Phone', content: '+1 (555) 123-4567', sub: 'Mon–Fri, 9AM–5PM' },
              { icon: <Mail size={28} />, title: 'Email', content: 'info@drsarahmitchell.com', sub: 'We respond within 24 hours' },
              { icon: <MapPin size={28} />, title: 'Address', content: '123 Medical Plaza, Suite 200', sub: 'New York, NY 10001' },
              { icon: <Clock size={28} />, title: 'Hours', content: 'Mon–Fri: 9AM–5PM', sub: 'Sat: 9AM–1PM | Sun: Closed' },
            ].map((c, i) => (
              <div key={i} className="contact-info-card card">
                <div className="card-body">
                  <div className="cic-icon">{c.icon}</div>
                  <h3>{c.title}</h3>
                  <p className="cic-main">{c.content}</p>
                  <p className="cic-sub">{c.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="contact-map">
            <div className="map-placeholder">
              <MapPin size={48} />
              <p>123 Medical Plaza, Suite 200, New York, NY 10001</p>
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
          <MessageSquare size={40} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
          <h2 className="section-title">Have a Question?</h2>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>
            If you have any questions about our services or would like to schedule an appointment, please don't hesitate to call or email us.
          </p>
          <a href="tel:+15551234567" className="btn btn-primary btn-lg">
            <Phone size={18} /> Call Us Now
          </a>
        </div>
      </section>

      <style>{`
        .page-hero { padding: 8rem 0 3rem; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); text-align: center; }
        .page-hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .page-hero p { color: var(--color-text-light); font-size: 1.1rem; }

        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; }
        .contact-info-cards { display: grid; gap: 1rem; }
        .contact-info-card .card-body { display: flex; align-items: flex-start; gap: 1rem; }
        .cic-icon { color: var(--color-primary); flex-shrink: 0; }
        .contact-info-card h3 { font-size: 1rem; margin-bottom: 0.25rem; }
        .cic-main { font-weight: 600; font-size: 0.95rem; }
        .cic-sub { color: var(--color-text-light); font-size: 0.85rem; }
        .map-placeholder {
          width: 100%; height: 400px; background: var(--color-bg-alt); border: 1px solid var(--color-border);
          border-radius: var(--radius-lg); display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 1rem; color: var(--color-text-light);
        }
        @media (max-width: 768px) { .contact-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
