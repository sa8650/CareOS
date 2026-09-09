import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import { formatPrice, imageUrl } from '../utils/helpers';

const ICONS = ['🧴', '💉', '✨', '🔬', '💊', '🩺', '🧬', '💡'];

export default function ServiceCard({ service, index = 0 }) {
  const hue = (index * 47) % 360;
  const desc = (service.description || '').replace(/^[-•*]\s*/gm, '').replace(/\s*\n+\s*/g, ' · ').trim();
  const short = desc.length > 130 ? desc.slice(0, 130).trimEnd() + '…' : desc;
  const benefits = (() => {
    try { const b = typeof service.benefits === 'string' ? JSON.parse(service.benefits) : service.benefits; return Array.isArray(b) ? b.slice(0, 3) : []; }
    catch { return []; }
  })();

  return (
    <Link to={`/services/${service.slug}`} className="svc-card" style={{ '--hue': hue }}>
      <div className="svc-media">
        {service.image_url ? (
          <img src={imageUrl(service.image_url)} alt={service.name} loading="lazy" />
        ) : (
          <div className="svc-media-placeholder"><span>{ICONS[index % ICONS.length]}</span></div>
        )}
        <div className="svc-media-shade" />
        <span className="svc-num">{String(index + 1).padStart(2, '0')}</span>
        {service.price ? <span className="svc-price">{formatPrice(service.price)}</span> : null}
      </div>

      <div className="svc-body">
        <h3>{service.name}</h3>
        {short && <p className="svc-desc">{short}</p>}
        {benefits.length > 0 && (
          <ul className="svc-benefits">
            {benefits.map((b, i) => <li key={i}><Sparkles size={13} /> {b}</li>)}
          </ul>
        )}
        <div className="svc-foot">
          <span className="svc-link">View details <ArrowRight size={15} /></span>
          {service.duration_minutes ? <span className="svc-meta"><Clock size={13} /> {service.duration_minutes} min</span> : null}
        </div>
      </div>

      <style>{`
        .svc-card {
          --accent: hsl(var(--hue), 80%, 55%);
          --accent-soft: hsl(var(--hue), 90%, 95%);
          display: flex; flex-direction: column; overflow: hidden; color: inherit; position: relative;
          background: #fff; border-radius: 22px; border: 1px solid rgba(15,23,42,0.06);
          box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 14px 34px -20px rgba(15,23,42,0.22);
          transition: transform 0.35s cubic-bezier(.2,.8,.2,1), box-shadow 0.35s, border-color 0.35s;
        }
        .svc-card:hover { transform: translateY(-6px); border-color: rgba(14,165,233,0.25); box-shadow: 0 2px 4px rgba(15,23,42,0.04), 0 30px 50px -24px rgba(14,165,233,0.4); }
        .svc-media { position: relative; height: 190px; overflow: hidden; background: linear-gradient(135deg, var(--accent-soft), #e0f2fe); }
        .svc-media img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(.2,.8,.2,1); }
        .svc-card:hover .svc-media img { transform: scale(1.06); }
        .svc-media-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .svc-media-placeholder span { font-size: 3.2rem; filter: drop-shadow(0 8px 16px hsla(var(--hue), 80%, 40%, 0.35)); transition: transform 0.5s; }
        .svc-card:hover .svc-media-placeholder span { transform: scale(1.12) rotate(-6deg); }
        .svc-media-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,23,42,0) 55%, rgba(15,23,42,0.35) 100%); pointer-events: none; }
        .svc-num { position: absolute; top: 0.9rem; left: 1rem; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.14em; color: #fff; background: rgba(15,23,42,0.45); backdrop-filter: blur(6px); padding: 0.25rem 0.55rem; border-radius: 999px; }
        .svc-price { position: absolute; top: 0.9rem; right: 1rem; font-size: 0.8rem; font-weight: 800; color: #0f172a; background: rgba(255,255,255,0.92); backdrop-filter: blur(6px); padding: 0.3rem 0.7rem; border-radius: 999px; box-shadow: 0 4px 12px -4px rgba(15,23,42,0.3); }
        .svc-body { display: flex; flex-direction: column; flex: 1; padding: 1.35rem 1.4rem 1.2rem; }
        .svc-card h3 { font-size: 1.12rem; font-weight: 800; letter-spacing: -0.01em; color: #0f172a; margin-bottom: 0.5rem; }
        .svc-desc { color: var(--color-text-light); font-size: 0.88rem; line-height: 1.6; margin-bottom: 0.9rem; }
        .svc-benefits { list-style: none; display: grid; gap: 0.3rem; margin: 0 0 1rem; }
        .svc-benefits li { display: flex; align-items: center; gap: 0.45rem; font-size: 0.83rem; color: #334155; font-weight: 500; }
        .svc-benefits svg { color: var(--accent); flex-shrink: 0; }
        .svc-foot { margin-top: auto; padding-top: 0.85rem; border-top: 1px dashed rgba(15,23,42,0.1); display: flex; align-items: center; justify-content: space-between; }
        .svc-link { display: inline-flex; align-items: center; gap: 0.35rem; color: var(--color-primary); font-weight: 700; font-size: 0.88rem; transition: gap 0.25s; }
        .svc-card:hover .svc-link { gap: 0.6rem; }
        .svc-meta { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; font-weight: 600; color: var(--color-text-light); background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 999px; padding: 0.15rem 0.6rem; }
      `}</style>
    </Link>
  );
}
