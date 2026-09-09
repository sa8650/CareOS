import { Link } from 'react-router-dom';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { imageUrl } from '../utils/helpers';

/**
 * One admin-managed "featured" section on the Home page
 * (e.g. "Hair PRP", "Cosmetic and Laser Treatments").
 *
 * props.section = { id, title, subtitle, description, benefits[], images[] (max 3), button_text, button_link }
 * props.index   = position (alternates image side left/right)
 */
export default function FeaturedSection({ section, index = 0 }) {
  if (!section) return null;
  const images = (section.images || []).filter(Boolean).slice(0, 3);
  const benefits = (section.benefits || []).filter(Boolean);
  const paragraphs = String(section.description || '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const flip = index % 2 === 1;
  const hue = (200 + index * 47) % 360;

  const link = section.button_link || '';
  const label = section.button_text || (link ? 'Learn More' : '');
  const isExternal = /^https?:\/\//i.test(link);
  const Button = label
    ? isExternal
      ? <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-primary fs-btn">{label} <ArrowRight size={16} /></a>
      : <Link to={link || '/appointment'} className="btn btn-primary fs-btn">{label} <ArrowRight size={16} /></Link>
    : null;

  return (
    <section className={`section fs-section ${flip ? 'fs-flip' : ''} ${index % 2 === 0 ? 'section-alt' : ''}`} style={{ '--hue': hue }}>
      <div className="container">
        <div className={`fs-grid ${images.length ? '' : 'fs-grid--noimg'}`}>
          {images.length > 0 && (
            <div className={`fs-media fs-media--${images.length}`}>
              <div className="fs-media-glow" />
              {images.map((img, i) => (
                <figure key={i} className={`fs-img fs-img-${i + 1}`}>
                  <img src={imageUrl(img)} alt={`${section.title} ${i + 1}`} loading="lazy" />
                </figure>
              ))}
              <span className="fs-badge"><Sparkles size={14} /> {section.subtitle || 'Featured'}</span>
            </div>
          )}

          <div className="fs-content">
            <span className="section-tag">{section.subtitle || 'Featured Treatment'}</span>
            <h2 className="section-title fs-title">{section.title}</h2>
            <div className="fs-underline" />
            {paragraphs.length > 0 && (
              <div className="fs-desc">
                {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
            {benefits.length > 0 && (
              <ul className="fs-benefits">
                {benefits.map((b, i) => (
                  <li key={i}><span className="fs-check"><Check size={13} strokeWidth={3} /></span><span>{b}</span></li>
                ))}
              </ul>
            )}
            {Button && <div className="fs-actions">{Button}</div>}
          </div>
        </div>
      </div>

      <style>{`
        .fs-section { position: relative; overflow: hidden; }
        .fs-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 3.5rem; align-items: center; }
        .fs-grid--noimg { grid-template-columns: 1fr; max-width: 820px; margin: 0 auto; text-align: center; }
        .fs-grid--noimg .fs-underline { margin-left: auto; margin-right: auto; }
        .fs-grid--noimg .fs-benefits { justify-items: start; max-width: 620px; margin-left: auto; margin-right: auto; }
        .fs-flip .fs-media { order: 2; }
        .fs-flip .fs-content { order: 1; }

        /* --- image collage --- */
        .fs-media { position: relative; display: grid; gap: 1rem; min-height: 320px; }
        .fs-media--1 { grid-template-columns: 1fr; }
        .fs-media--2 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; }
        .fs-media--3 { grid-template-columns: 1.35fr 1fr; grid-template-rows: 1fr 1fr; }
        .fs-media--3 .fs-img-1 { grid-row: 1 / span 2; }
        .fs-media--2 .fs-img-2 { margin-top: 2.5rem; }
        .fs-media--2 .fs-img-1 { margin-bottom: 2.5rem; }
        .fs-img {
          position: relative; margin: 0; overflow: hidden; border-radius: 22px; background: #e2e8f0;
          box-shadow: 0 1px 2px rgba(15,23,42,0.06), 0 24px 48px -24px rgba(15,23,42,0.35);
          border: 4px solid #fff; transition: transform 0.5s cubic-bezier(.2,.8,.2,1), box-shadow 0.5s;
        }
        .fs-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.8s cubic-bezier(.2,.8,.2,1); }
        .fs-media--1 .fs-img { aspect-ratio: 4 / 3; }
        .fs-media--2 .fs-img { aspect-ratio: 3 / 4; }
        .fs-media--3 .fs-img-1 { min-height: 360px; }
        .fs-media--3 .fs-img-2, .fs-media--3 .fs-img-3 { aspect-ratio: 4 / 3; }
        .fs-img:hover { transform: translateY(-4px); box-shadow: 0 2px 4px rgba(15,23,42,0.06), 0 32px 56px -24px hsla(var(--hue), 80%, 40%, 0.45); }
        .fs-img:hover img { transform: scale(1.06); }
        .fs-media-glow {
          position: absolute; inset: -10% -6%; z-index: -1; border-radius: 40px; pointer-events: none;
          background: radial-gradient(60% 60% at 30% 30%, hsla(var(--hue), 90%, 85%, 0.55), transparent 70%),
                      radial-gradient(50% 50% at 80% 80%, rgba(139,92,246,0.18), transparent 70%);
          filter: blur(10px);
        }
        .fs-badge {
          position: absolute; left: 1rem; bottom: 1rem; z-index: 2; display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.45rem 0.9rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; color: #0f172a;
          background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); box-shadow: 0 8px 20px -10px rgba(15,23,42,0.4);
          max-width: calc(100% - 2rem); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .fs-badge svg { color: var(--color-primary); flex-shrink: 0; }
        .fs-media--3 .fs-badge { left: auto; right: 1rem; bottom: 1rem; }

        /* --- text --- */
        .fs-content .section-tag { display: inline-block; }
        .fs-title { font-size: clamp(1.7rem, 3vw, 2.35rem); line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 0.9rem; }
        .fs-underline { width: 64px; height: 4px; border-radius: 999px; margin-bottom: 1.35rem; background: linear-gradient(90deg, var(--color-primary), var(--color-secondary)); }
        .fs-desc p { color: var(--color-text-light); font-size: 1.05rem; line-height: 1.75; margin-bottom: 0.9rem; }
        .fs-benefits { list-style: none; margin: 1.35rem 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 0.7rem 1.25rem; }
        .fs-benefits li { display: flex; align-items: flex-start; gap: 0.7rem; font-size: 0.97rem; color: #1e293b; font-weight: 500; line-height: 1.5; }
        .fs-check {
          flex-shrink: 0; width: 24px; height: 24px; margin-top: 1px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
          color: #fff; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          box-shadow: 0 6px 14px -6px rgba(14,165,233,0.7);
        }
        .fs-actions { margin-top: 1.85rem; }
        .fs-btn { padding: 0.9rem 1.75rem; border-radius: 999px; box-shadow: 0 12px 24px -12px rgba(14,165,233,0.7); }

        @media (max-width: 900px) {
          .fs-grid { grid-template-columns: 1fr; gap: 2.25rem; }
          .fs-flip .fs-media, .fs-flip .fs-content { order: initial; }
          .fs-media { min-height: 0; }
          .fs-media--3 .fs-img-1 { min-height: 260px; }
          .fs-media--2 .fs-img-1, .fs-media--2 .fs-img-2 { margin: 0; }
          .fs-benefits { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .fs-media { gap: 0.6rem; }
          .fs-img { border-radius: 16px; border-width: 3px; }
          .fs-media--3 .fs-img-1 { min-height: 200px; }
        }
      `}</style>
    </section>
  );
}
