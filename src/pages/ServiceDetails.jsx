import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, CheckCircle, ChevronDown, ChevronUp, ArrowRight, Sparkles, Calendar, HelpCircle } from 'lucide-react';
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
          <span className="page-hero-tag"><Sparkles size={15} /> Treatment</span>
          <h1>{service.name}</h1>
          <p>Professional treatment with proven results</p>
          {(service.duration_minutes || service.price) ? (
            <div className="sd-hero-meta">
              {service.duration_minutes ? <span><Clock size={15} /> {service.duration_minutes} min session</span> : null}
              {service.price ? <span>{formatPrice(service.price)}</span> : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="section section-alt">
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
                <h2><HelpCircle size={20} /> Frequently Asked Questions</h2>
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
            <div className="sd-cta">
              <span className="sd-cta-icon"><Calendar size={22} /></span>
              <h3>Book This Treatment</h3>
              <p>Schedule your {service.name} appointment today. You'll receive a serial number instantly.</p>
              <Link to="/appointment" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Book Appointment <ArrowRight size={18} />
              </Link>
              <Link to="/services" className="sd-cta-back">← All services</Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .sd-hero-meta { display: flex; justify-content: center; flex-wrap: wrap; gap: 0.6rem; margin-top: 1.1rem; }
        .sd-hero-meta span { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.95rem; background: rgba(255,255,255,0.85); border: 1px solid rgba(14,165,233,0.2); border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
        .sd-hero-meta svg { color: var(--color-primary); }
        .sd-layout { display: grid; grid-template-columns: 1fr 340px; gap: 2.5rem; align-items: start; }
        .sd-content { background: #fff; border: 1px solid var(--color-border); border-radius: 24px; padding: 2.25rem; box-shadow: var(--shadow-card); }
        .sd-image { border-radius: var(--radius-xl); overflow: hidden; margin-bottom: 2rem; box-shadow: var(--shadow-md); }
        .sd-image img { width: 100%; height: auto; max-height: 420px; object-fit: cover; }
        .sd-description h2, .sd-benefits h2, .sd-faq h2 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.4rem; letter-spacing: -0.01em; margin-bottom: 1rem; }
        .sd-faq h2 svg { color: var(--color-primary); }
        .sd-description p { color: var(--color-text-light); line-height: 1.8; font-size: 1.05rem; margin-bottom: 2rem; white-space: pre-line; }
        .sd-description-list { list-style: none; margin-bottom: 2rem; }
        .sd-description-list li { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid var(--color-border); color: var(--color-text); font-size: 0.95rem; line-height: 1.6; }
        .sd-description-list li:last-child { border-bottom: none; }
        .sd-description-list li svg { color: var(--color-success); flex-shrink: 0; margin-top: 0.25rem; }
        .sd-benefit-list { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 2rem; }
        .sd-benefit { display: flex; align-items: center; gap: 0.6rem; font-weight: 500; font-size: 0.95rem; padding: 0.8rem 1rem; background: var(--color-bg-soft); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
        .sd-benefit svg { color: var(--color-success); flex-shrink: 0; }
        .sd-faq-item { border: 1px solid var(--color-border); border-radius: var(--radius-lg); margin-bottom: 0.6rem; overflow: hidden; cursor: pointer; background: #fff; transition: border-color 0.2s, box-shadow 0.2s; }
        .sd-faq-item:hover { border-color: rgba(14,165,233,0.35); }
        .sd-faq-question { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem 1.25rem; font-weight: 600; }
        .sd-faq-question svg { color: var(--color-primary); flex-shrink: 0; }
        .sd-faq-answer { padding: 0 1.25rem 1.1rem; color: var(--color-text-light); font-size: 0.95rem; line-height: 1.7; white-space: pre-line; }
        .sd-cta { position: sticky; top: 90px; text-align: center; padding: 1.75rem 1.5rem; border-radius: 24px; background: #fff; border: 1px solid var(--color-border); box-shadow: var(--shadow-card); }
        .sd-cta-icon { width: 52px; height: 52px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; background: var(--gradient-brand); color: #fff; margin-bottom: 0.9rem; box-shadow: 0 10px 20px -10px rgba(14,165,233,0.8); }
        .sd-cta h3 { font-size: 1.15rem; margin-bottom: 0.5rem; }
        .sd-cta p { color: var(--color-text-light); font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.25rem; }
        .sd-cta-back { display: inline-block; margin-top: 0.9rem; font-size: 0.85rem; font-weight: 600; color: var(--color-text-light); }
        .sd-cta-back:hover { color: var(--color-primary); }
        @media (max-width: 900px) {
          .sd-layout { grid-template-columns: 1fr; gap: 1.5rem; }
          .sd-cta { position: static; }
        }
        @media (max-width: 768px) {
          .sd-content { padding: 1.4rem 1.1rem; border-radius: 20px; }
          .sd-benefit-list { grid-template-columns: 1fr; }
          .sd-description h2, .sd-benefits h2, .sd-faq h2 { font-size: 1.2rem; }
        }
      `}</style>
    </div>
  );
}
