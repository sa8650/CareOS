import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import { fetchServices } from '../api/api';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices()
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeCount = services.filter(s => s.is_active).length;

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <span className="page-hero-tag"><Sparkles size={15} /> {activeCount ? `${activeCount} Treatments` : 'Treatments & Care'}</span>
          <h1>Our Services</h1>
          <p>Comprehensive dermatological treatments tailored to your needs</p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          {loading ? (
            <div className="loading-page"><div className="spinner" /></div>
          ) : services.filter(s => s.is_active).length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>No services available at this time.</p>
          ) : (
            <div className="grid-3">
              {services.filter(s => s.is_active).map((s, i) => (
                <ServiceCard key={s.id} service={s} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section services-cta">
        <div className="container">
          <div className="services-cta-box">
            <div>
              <span className="section-tag">Not sure which treatment you need?</span>
              <h2 className="section-title">Book a consultation and we'll guide you</h2>
              <p className="section-subtitle">Every treatment starts with a proper diagnosis. Reserve a serial online and visit during chamber hours.</p>
            </div>
            <Link to="/appointment" className="btn btn-primary btn-lg"><Calendar size={18} /> Book Appointment <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <style>{`
        .services-cta { padding-top: 4rem; padding-bottom: 4rem; }
        .services-cta-box { display: grid; grid-template-columns: 1fr auto; gap: 2rem; align-items: center; padding: 2.25rem 2.5rem; border-radius: 24px; background: #fff; border: 1px solid var(--color-border); box-shadow: var(--shadow-card); }
        .services-cta-box .section-title { font-size: 1.6rem; }
        .services-cta-box .section-subtitle { margin-bottom: 0; font-size: 0.98rem; }
        @media (max-width: 768px) {
          .services-cta { padding-top: 3rem; padding-bottom: 3rem; }
          .services-cta-box { grid-template-columns: 1fr; padding: 1.5rem 1.25rem; text-align: center; }
          .services-cta-box .btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}
