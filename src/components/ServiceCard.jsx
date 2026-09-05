import { Link } from 'react-router-dom';
import { Clock, DollarSign, ArrowRight } from 'lucide-react';
import { formatPrice } from '../utils/helpers';

export default function ServiceCard({ service }) {
  return (
    <Link to={`/services/${service.slug}`} className="service-card card">
      {service.image_url && (
        <div className="service-card-img">
          <img src={service.image_url} alt={service.name} loading="lazy" />
        </div>
      )}
      <div className="card-body">
        <h3>{service.name}</h3>
        <p>{service.description?.slice(0, 120)}{service.description?.length > 120 ? '...' : ''}</p>
        <div className="service-card-meta">
          <span><Clock size={14} /> {service.duration_minutes} min</span>
          {service.price ? <span><DollarSign size={14} /> {formatPrice(service.price)}</span> : null}
        </div>
        <span className="service-card-link">Learn More <ArrowRight size={16} /></span>
      </div>

      <style>{`
        .service-card { text-decoration: none; color: inherit; display: block; }
        .service-card-img { height: 200px; overflow: hidden; }
        .service-card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .service-card:hover .service-card-img img { transform: scale(1.05); }
        .service-card h3 { font-size: 1.15rem; margin-bottom: 0.5rem; }
        .service-card p { color: var(--color-text-light); font-size: 0.9rem; line-height: 1.5; margin-bottom: 1rem; }
        .service-card-meta { display: flex; gap: 1rem; font-size: 0.85rem; color: var(--color-text-light); margin-bottom: 1rem; }
        .service-card-meta span { display: flex; align-items: center; gap: 0.25rem; }
        .service-card-link {
          display: inline-flex; align-items: center; gap: 0.25rem;
          color: var(--color-primary); font-weight: 600; font-size: 0.9rem;
        }
      `}</style>
    </Link>
  );
}
