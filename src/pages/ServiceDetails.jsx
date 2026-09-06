import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, DollarSign, CheckCircle, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { fetchService } from '../api/api';
import { formatPrice } from '../utils/helpers';

export default function ServiceDetails() {
  const { slug } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    fetchService(slug)
      .then(setService)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `/api/image?key=${encodeURIComponent(url)}`;
  };

  // Parse description into list items
  const getDescriptionItems = (desc) => {
    if (!desc) return [];
    return desc.split('\n').filter(item => item.trim()).map(item => item.replace(/^[-•*]\s*/, '').trim());
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!service) return <div className="loading-page"><p>Service not found.</p></div>;

  const benefits = service.benefits ? (typeof service.benefits === 'string' ? JSON.parse(service.benefits) : service.benefits) : [];
  const faq = service.faq ? (typeof service.faq === 'string' ? JSON.parse(service.faq) : service.faq) : [];
  const descriptionItems = getDescriptionItems(service.description);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <h1>{service.name}</h1>
          <p>Professional treatment with proven results</p>
        </div>
      </section>

      <section className="section">
        <div className="container sd-layout">
          <div className="sd-content">
            {service.image_url && (
              <div className="sd-image">
                <img src={getImageUrl(service.image_url)} alt={service.name} />
              </div>
            )}

            <div className="sd-description">
              <h2>About This Treatment</h2>
              {descriptionItems.length > 0 ? (
                <ul className="sd-description-list">
                  {descriptionItems.map((item, i) => (
                    <li key={i}><CheckCircle size={16} /> {item}</li>
                  ))}
                </ul>
              ) : (
                <p>{service.description}</p>
              )}
            </div>

            {benefits.length > 0 && (
              <div className="sd-benefits">
                <h2>Benefits</h2>
                <div className="sd-benefit-list">
                  {benefits.map((b, i) => (
                    <div key={i} className="sd-benefit">
                      <CheckCircle size={18} />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {faq.length > 0 && (
              <div className="sd-faq">
                <h2>Frequently Asked Questions</h2>
                {faq.map((f, i) => (
                  <div key={i} className="sd-faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <div className="sd-faq-question">
                      <span>{f.question}</span>
                      {openFaq === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                    {openFaq === i && <div className="sd-faq-answer">{f.answer}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sd-sidebar">
            <div className="sd-cta card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <h3>Book This Treatment</h3>
                <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', margin: '0.75rem 0 1.25rem' }}>
                  Schedule your {service.name} appointment today.
                </p>
                <Link to="/appointment" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  Book Appointment <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .page-hero { padding: 8rem 0 3rem; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); text-align: center; }
        .page-hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .page-hero p { color: var(--color-text-light); font-size: 1.1rem; }
        .sd-layout { display: grid; grid-template-columns: 1fr 350px; gap: 3rem; align-items: start; }
        .sd-image { border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 2rem; }
        .sd-image img { width: 100%; height: auto; }
        .sd-description h2, .sd-benefits h2, .sd-faq h2 { font-size: 1.5rem; margin-bottom: 1rem; }
        .sd-description p { color: var(--color-text-light); line-height: 1.8; font-size: 1.05rem; margin-bottom: 2rem; }
        .sd-description-list { list-style: none; margin-bottom: 2rem; }
        .sd-description-list li { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid var(--color-border); color: var(--color-text); font-size: 0.95rem; }
        .sd-description-list li:last-child { border-bottom: none; }
        .sd-description-list li svg { color: var(--color-success); flex-shrink: 0; margin-top: 0.125rem; }
        .sd-benefit-list { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 2rem; }
        .sd-benefit { display: flex; align-items: center; gap: 0.5rem; font-weight: 500; }
        .sd-benefit svg { color: var(--color-success); flex-shrink: 0; }
        .sd-faq-item { border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: 0.5rem; overflow: hidden; cursor: pointer; }
        .sd-faq-question { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; font-weight: 600; }
        .sd-faq-answer { padding: 0 1.25rem 1rem; color: var(--color-text-light); font-size: 0.95rem; line-height: 1.6; }
        .sd-cta { position: sticky; top: 90px; }
        @media (max-width: 768px) {
          .sd-layout { grid-template-columns: 1fr; }
          .sd-benefit-list { grid-template-columns: 1fr; }
          .sd-cta { position: static; }
        }
      `}</style>
    </div>
  );
}
