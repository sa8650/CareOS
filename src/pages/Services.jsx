import { useState, useEffect } from 'react';
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

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <h1>Our Services</h1>
          <p>Comprehensive dermatological treatments tailored to your needs</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading ? (
            <div className="loading-page"><div className="spinner" /></div>
          ) : services.filter(s => s.is_active).length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>No services available at this time.</p>
          ) : (
            <div className="grid-3">
              {services.filter(s => s.is_active).map(s => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          )}
        </div>
      </section>

      <style>{`
        .page-hero {
          padding: 8rem 0 3rem; background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          text-align: center;
        }
        .page-hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .page-hero p { color: var(--color-text-light); font-size: 1.1rem; }
      `}</style>
    </div>
  );
}
