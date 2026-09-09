import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Shield, Star, ChevronLeft, ChevronRight, Calendar, Building2, MapPin, Phone, Clock } from 'lucide-react';
import { fetchDoctor, fetchServices, fetchTestimonials, fetchChambers, fetchSections } from '../api/api';
import Marquee from '../components/Marquee';
import FeaturedSection from '../components/FeaturedSection';
import { formatTimeRange, formatVisitingDays, DAYS_SHORT, imageUrl, asLines, asList } from '../utils/helpers';

export default function Home() {
  const [doctor, setDoctor] = useState(null);
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  // Single-row MANUAL testimonial carousel: arrow buttons, dots, touch swipe,
  // mouse drag and keyboard arrows. No auto-scroll.
  const trackRef = useRef(null);
  const dragRef = useRef({ down: false, startX: 0, startScroll: 0 });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [dragging, setDragging] = useState(false);

  const updateNav = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < maxScroll - 8);
    const pages = maxScroll <= 8 ? 1 : Math.max(2, Math.round(el.scrollWidth / el.clientWidth));
    setPageCount(pages);
    setActivePage(maxScroll > 0 ? Math.min(pages - 1, Math.round((el.scrollLeft / maxScroll) * (pages - 1))) : 0);
  }, []);

  useEffect(() => {
    updateNav();
    window.addEventListener('resize', updateNav);
    return () => window.removeEventListener('resize', updateNav);
  }, [testimonials, updateNav]);

  const smoothBehavior = () =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  const scrollByPage = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: smoothBehavior() });
  };

  const scrollToPage = (page) => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: pageCount <= 1 ? 0 : (page / (pageCount - 1)) * maxScroll, behavior: smoothBehavior() });
  };

  // Mouse drag-to-scroll (touch swipe works natively via overflow-x).
  const onDragStart = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    dragRef.current = { down: true, startX: e.clientX, startScroll: el.scrollLeft };
    setDragging(true);
  };
  const onDragMove = (e) => {
    const d = dragRef.current;
    const el = trackRef.current;
    if (!d.down || !el) return;
    el.scrollLeft = d.startScroll - (e.clientX - d.startX);
  };
  const onDragEnd = () => {
    dragRef.current.down = false;
    setDragging(false);
  };
  const [chambers, setChambers] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetchDoctor().then(setDoctor).catch(() => {});
    fetchServices().then(setServices).catch(() => {});
    fetchTestimonials().then(setTestimonials).catch(() => {});
    fetchChambers().then(setChambers).catch(() => {});
    fetchSections().then(d => setSections(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const serviceIcons = ['🧴', '💉', '✨', '🔬', '💊', '🩺', '🧬', '💡'];

  // Hero statistics come from Admin → Profile → Hero Statistics.
  // Before the profile loads (or with an older API without `stats`) show the classic defaults.
  const DEFAULT_STATS = [{ value: '10K+', label: 'Patients' }, { value: '15+', label: 'Years' }, { value: '4.9', label: 'Rating' }];
  const heroStats = (Array.isArray(doctor?.stats) ? doctor.stats : DEFAULT_STATS)
    .filter(st => (st?.value || '').toString().trim() || (st?.label || '').toString().trim())
    .slice(0, 4);

  const marqueeItems = (() => {
    const quals = asLines(doctor?.qualifications);
    const specs = asList(doctor?.specializations);
    const items = [
      doctor?.name && doctor?.title ? `${doctor.name} — ${doctor.title}` : (doctor?.name || null),
      doctor?.experience || null,
      ...quals,
      ...specs.map(sp => `Specialist in ${sp}`),
      chambers.length ? `${chambers.length} chamber${chambers.length > 1 ? 's' : ''} · book online in 1 minute` : null,
      'Serial-number appointments · no waiting in line',
    ].filter(Boolean);
    return items.length ? items : ['Compassionate, evidence-based dermatology care'];
  })();

  const getDescriptionItems = (desc) => {
    if (!desc) return [];
    return desc.split('\n').filter(item => item.trim()).map(item => item.replace(/^[-•*]\s*/, '').trim());
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg-shapes">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
          <div className="hero-shape hero-shape-3"></div>
        </div>
        <div className="container hero-inner">
          <div className="hero-content">
            <div className="hero-badge animate-slide-down">
              <span className="hero-badge-dot"></span>
              {doctor?.title || 'Board-Certified Dermatologist'}
            </div>
            <h1 className="animate-fade-up">
              Hi, I'm <span className="hero-name">{doctor?.name || 'Doctor'}</span>
            </h1>
            <p className="hero-subtitle animate-fade-up delay-1">
              {doctor?.bio?.slice(0, 150) || 'Providing personalized dermatology treatments.'}
              {doctor?.bio?.length > 150 ? '...' : ''}
            </p>
            <div className="hero-actions animate-fade-up delay-2">
              <Link to="/appointment" className="btn btn-primary btn-lg hero-btn">
                <Calendar size={18} /> Book Appointment
              </Link>
              <Link to="/about" className="btn btn-outline btn-lg">
                About Me
              </Link>
            </div>
            {heroStats.length > 0 && (
              <div className="hero-stats animate-fade-up delay-3">
                {heroStats.map((st, i) => (
                  <div key={i} style={{ display: 'contents' }}>
                    <div className="hero-stat">
                      <span className="hero-stat-num">{st.value}</span>
                      <span className="hero-stat-label">{st.label}</span>
                    </div>
                    {i < heroStats.length - 1 && <div className="hero-stat-divider"></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="hero-image">
            <div className="hero-img-wrapper">
              <div className="hero-img-bg"></div>
              {doctor?.profile_image ? (
                <img src={imageUrl(doctor.profile_image)} alt={doctor.name} className="hero-doctor-photo" />
              ) : (
                <div className="hero-img-placeholder">
                  <div className="hero-img-initials">{doctor?.name?.[0] || 'D'}</div>
                </div>
              )}
              <div className="hero-float-card hero-float-1">
                <Shield size={20} />
                <span>Board Certified</span>
              </div>
              <div className="hero-float-card hero-float-2">
                <Star size={20} />
                <span>Top Rated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scrolling "about me" strip */}
      <Marquee speed={55} items={marqueeItems} />

      {/* About Preview */}
      <section className="section about-preview-section">
        <div className="container about-preview">
          <div className="about-preview-content">
            <span className="section-tag">About Me</span>
            <h2 className="section-title">{doctor?.name || 'Doctor'}</h2>
            <p className="about-title-text">{doctor?.title || 'Specialist'}</p>
            <p>{doctor?.bio || 'Experienced doctor providing quality care.'}</p>
            {asLines(doctor?.qualifications).length > 0 && (
              <div className="about-highlights">
                {asLines(doctor.qualifications).slice(0, 4).map((q, i) => (
                  <div key={i} className="about-highlight">
                    <Award size={18} />
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            )}
            <Link to="/about" className="btn btn-primary">
              Read More <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Admin-managed featured sections (Admin → Home Sections) */}
      {sections.map((sec, i) => (
        <FeaturedSection key={sec.id} section={sec} index={i} />
      ))}

      {/* Conditions We Treat */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Conditions We Treat</span>
            <h2 className="section-title">Comprehensive Dermatological Care</h2>
            <p className="section-subtitle">Expert treatment for all skin, hair, and related conditions.</p>
          </div>
          <div className="conditions-grid">
            {services.filter(s => s.is_active).map((s, i) => {
              const hue = (i * 47) % 360;
              const items = getDescriptionItems(s.description);
              return (
                <Link key={s.id} to={`/services/${s.slug}`} className="condition-card" style={{ '--hue': hue }}>
                  <div className="condition-card-glow" />
                  <div className="condition-card-top">
                    <div className="condition-icon">
                      <span>{serviceIcons[i % serviceIcons.length]}</span>
                    </div>
                    <span className="condition-num">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3>{s.name}</h3>
                  {items.length > 1 ? (
                    <ul className="condition-list">
                      {items.slice(0, 5).map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  ) : (
                    <p className="condition-desc">{(s.description || '').slice(0, 140)}{(s.description || '').length > 140 ? '…' : ''}</p>
                  )}
                  <div className="condition-foot">
                    <span className="condition-link">Learn more <ArrowRight size={15} /></span>
                    {s.duration_minutes ? <span className="condition-meta">{s.duration_minutes} min</span> : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Chamber Details */}
      {chambers.length > 0 && (
        <section className="section section--dark chambers-section">
          <div className="container">
            <div className="section-header">
              <span className="section-tag"><Building2 size={16} /> Chambers</span>
              <h2 className="section-title">Chamber Details</h2>
              <p className="section-subtitle">Visit me at any of my chambers</p>
            </div>
            <div className="chambers-grid">
              {chambers.map((c) => (
                <div key={c.id} className="chamber-card">
                  <div className="card-body">
                    <h3><span className="chamber-card-icon"><Building2 size={16} /></span>{c.name}</h3>
                    <div className="chamber-info">
                      {c.address && (
                        <div className="chamber-item">
                          <MapPin size={16} />
                          <span>{c.address}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div className="chamber-item">
                          <Phone size={16} />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      <div className="chamber-item">
                        <Clock size={16} />
                        <span>{formatTimeRange(c.start_time, c.end_time)}</span>
                      </div>
                    </div>
                    <div className="chamber-days">
                      <div className="chamber-days-pills">
                        {DAYS_SHORT.map((d, i) => (
                          <span key={d} className={c.visiting_days.includes(i) ? 'on' : ''}>{d}</span>
                        ))}
                      </div>
                      <span className="chamber-days-text">{formatVisitingDays(c.visiting_days)}</span>
                    </div>
                    <Link to="/appointment" className="btn btn-primary btn-sm chamber-card-btn">
                      <Calendar size={14} /> Book here
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials — single row, manual scroll (arrows / dots / swipe / drag) */}
      {testimonials.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-header testi-header">
              <div className="testi-heading">
                <span className="section-tag">Testimonials</span>
                <h2 className="section-title">What My Patients Say</h2>
              </div>
              {pageCount > 1 && (
                <div className="testi-nav">
                  <button
                    type="button"
                    className="testi-nav-btn"
                    onClick={() => scrollByPage(-1)}
                    disabled={!canPrev}
                    aria-label="Previous testimonials"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    className="testi-nav-btn"
                    onClick={() => scrollByPage(1)}
                    disabled={!canNext}
                    aria-label="Next testimonials"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
            <div
              ref={trackRef}
              className={`testi-track${dragging ? ' dragging' : ''}`}
              role="region"
              aria-roledescription="carousel"
              aria-label="Patient testimonials — scroll horizontally"
              tabIndex={0}
              onScroll={updateNav}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') { e.preventDefault(); scrollByPage(-1); }
                if (e.key === 'ArrowRight') { e.preventDefault(); scrollByPage(1); }
              }}
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
              onPointerLeave={onDragEnd}
            >
              {testimonials.map((t) => {
                const rating = Number.isFinite(+t.rating) ? Math.min(5, Math.max(0, +t.rating)) : 5;
                return (
                  <article key={t.id} className="testimonial-card testi-slide">
                    <div className="card-body">
                      <div className="testimonial-quote" aria-hidden="true">“</div>
                      <div className="testimonial-stars" aria-label={`${rating} out of 5 stars`}>
                        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                      </div>
                      <p className="testimonial-text">"{t.review}"</p>
                      <div className="testimonial-author">
                        <div className="testimonial-avatar">{(t.name || '?')[0]}</div>
                        <span>{t.name}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {pageCount > 1 && (
              <div className="testi-dots" role="tablist" aria-label="Testimonial pages">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === activePage}
                    aria-label={`Go to testimonials page ${i + 1}`}
                    className={`testi-dot${i === activePage ? ' active' : ''}`}
                    onClick={() => scrollToPage(i)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-inner">
            <div className="cta-text">
              <h2>Ready to Get Expert Treatment?</h2>
              <p>Book your consultation today for accurate diagnosis and effective treatment.</p>
            </div>
            <Link to="/appointment" className="btn cta-btn">
              <Calendar size={18} /> Book Appointment
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .hero { padding: 8rem 0 4rem; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%); position: relative; overflow: hidden; }
        .hero-bg-shapes { position: absolute; inset: 0; pointer-events: none; }
        .hero-shape { position: absolute; border-radius: 50%; opacity: 0.1; animation: float 20s infinite ease-in-out; }
        .hero-shape-1 { width: 400px; height: 400px; background: var(--color-primary); top: -100px; right: -100px; }
        .hero-shape-2 { width: 300px; height: 300px; background: var(--color-accent); bottom: -50px; left: -50px; animation-delay: -5s; }
        .hero-shape-3 { width: 200px; height: 200px; background: var(--color-secondary); top: 50%; left: 50%; animation-delay: -10s; }
        @keyframes float { 0%, 100% { transform: translate(0, 0) scale(1); } 25% { transform: translate(30px, -30px) scale(1.05); } 50% { transform: translate(-20px, 20px) scale(0.95); } 75% { transform: translate(20px, 10px) scale(1.02); } }
        .hero-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; position: relative; z-index: 1; }
        .animate-slide-down { animation: slideDown 0.8s ease forwards; }
        .animate-fade-up { opacity: 0; animation: fadeUp 0.8s ease forwards; }
        .delay-1 { animation-delay: 0.2s; }
        .delay-2 { animation-delay: 0.4s; }
        .delay-3 { animation-delay: 0.6s; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .hero-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1.25rem; background: white; color: var(--color-primary); border-radius: var(--radius-full); font-size: 0.9rem; font-weight: 600; box-shadow: var(--shadow-md); margin-bottom: 1.5rem; }
        .hero-badge-dot { width: 8px; height: 8px; background: var(--color-success); border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; transform: scale(1.5); } }
        .hero h1 { font-size: 3.5rem; line-height: 1.1; margin-bottom: 1rem; }
        .hero-name { background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-subtitle { font-size: 1.15rem; color: var(--color-text-light); margin-bottom: 2rem; line-height: 1.7; }
        .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem; }
        .hero-stats { display: flex; align-items: center; gap: 1.5rem; padding: 1.25rem 1.5rem; background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-md); width: fit-content; }
        .hero-stat { text-align: center; }
        .hero-stat-num { display: block; font-size: 1.5rem; font-weight: 800; color: var(--color-primary); }
        .hero-stat-label { font-size: 0.8rem; color: var(--color-text-light); }
        .hero-stat-divider { width: 1px; height: 40px; background: var(--color-border); }
        .hero-image { position: relative; }
        .hero-img-wrapper { position: relative; }
        .hero-img-bg { position: absolute; inset: -10px; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); border-radius: 2rem; opacity: 0.1; transform: rotate(3deg); }
        .hero-doctor-photo { width: 100%; aspect-ratio: 4/5; object-fit: cover; border-radius: 2rem; position: relative; z-index: 1; }
        .hero-img-placeholder { width: 100%; aspect-ratio: 4/5; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); border-radius: 2rem; display: flex; align-items: center; justify-content: center; }
        .hero-img-initials { font-size: 5rem; color: white; font-weight: 800; }
        .hero-float-card { position: absolute; z-index: 2; display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: white; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); font-size: 0.85rem; font-weight: 600; animation: floatCard 3s ease-in-out infinite; }
        .hero-float-card svg { color: var(--color-primary); }
        .hero-float-1 { bottom: 20%; left: -20px; }
        .hero-float-2 { top: 10%; right: -10px; animation-delay: -1.5s; }
        @keyframes floatCard { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @media (max-width: 768px) {
          .hero { padding: 6rem 0 3rem; }
          .hero-inner { grid-template-columns: 1fr; text-align: center; }
          .hero h1 { font-size: 2.25rem; }
          .hero-actions { justify-content: center; }
          .hero-stats { margin: 0 auto; }
          .hero-image { order: -1; max-width: 280px; margin: 0 auto; }
          .hero-float-card { display: none; }
          .hero-stats { gap: 1rem; padding: 0.9rem 1rem; }
          .hero-stat-num { font-size: 1.25rem; }
          .cta-section { padding: 2rem 0; }
          .cta-inner { flex-direction: column; text-align: center; gap: 1rem; padding: 1.5rem 1.25rem; border-radius: 20px; }
          .cta-inner h2 { font-size: 1.3rem; }
          .cta-inner p { font-size: 0.9rem; }
          .cta-btn { width: 100%; justify-content: center; max-width: 320px; }
        }

        .about-preview-section { padding-top: 4.5rem; }
        .about-preview { display: flex; justify-content: center; }
        .about-preview-content { max-width: 780px; text-align: center; }
        .about-preview-content .about-highlights { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.6rem; }
        .about-preview-content .about-highlight { margin-bottom: 0; }
        .about-title-text { color: var(--color-primary); font-weight: 600; margin-bottom: 1rem; }
        .about-preview-content > p { color: var(--color-text-light); margin-bottom: 1rem; font-size: 1.05rem; line-height: 1.75; }
        .about-highlights { margin: 1.5rem 0 1.75rem; }
        .about-highlight {
          display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.9rem; color: var(--color-text);
          padding: 0.55rem 1rem; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-full); box-shadow: var(--shadow-sm);
        }
        .about-highlight svg { color: var(--color-primary); }
        @media (max-width: 768px) { .about-preview-section { padding-top: 3rem; } .about-preview-content .about-highlights { gap: 0.5rem; } }

        .conditions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .condition-card {
          --accent: hsl(var(--hue), 80%, 55%);
          --accent-soft: hsl(var(--hue), 90%, 96%);
          position: relative; display: flex; flex-direction: column; overflow: hidden;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.07); border-radius: 22px; padding: 1.6rem 1.6rem 1.35rem;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -18px rgba(15,23,42,0.18);
          transition: transform 0.35s cubic-bezier(.2,.8,.2,1), box-shadow 0.35s, border-color 0.35s;
          color: inherit; isolation: isolate;
        }
        .condition-card::before {
          content: ''; position: absolute; inset: 0 0 auto 0; height: 4px;
          background: linear-gradient(90deg, var(--accent), var(--color-primary));
          opacity: 0; transition: opacity 0.35s;
        }
        .condition-card-glow {
          position: absolute; width: 220px; height: 220px; right: -80px; top: -80px; border-radius: 50%;
          background: radial-gradient(closest-side, var(--accent-soft), transparent);
          opacity: 0.9; z-index: -1; transition: transform 0.5s ease;
        }
        .condition-card:hover { transform: translateY(-6px); border-color: rgba(14,165,233,0.25); box-shadow: 0 2px 4px rgba(15,23,42,0.04), 0 28px 48px -22px rgba(14,165,233,0.35); }
        .condition-card:hover::before { opacity: 1; }
        .condition-card:hover .condition-card-glow { transform: scale(1.35); }
        .condition-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.1rem; }
        .condition-icon {
          width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem;
          background: var(--accent-soft); border: 1px solid hsla(var(--hue), 70%, 60%, 0.25);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 6px 14px -8px hsla(var(--hue), 80%, 40%, 0.45);
          transition: transform 0.35s;
        }
        .condition-card:hover .condition-icon { transform: rotate(-6deg) scale(1.06); }
        .condition-num { font-size: 0.78rem; font-weight: 800; letter-spacing: 0.12em; color: #cbd5e1; }
        .condition-card h3 { font-size: 1.15rem; font-weight: 800; letter-spacing: -0.01em; margin-bottom: 0.75rem; color: #0f172a; }
        .condition-desc { font-size: 0.9rem; color: var(--color-text-light); line-height: 1.6; margin-bottom: 1rem; }
        .condition-list { list-style: none; margin: 0 0 1rem; display: grid; gap: 0.35rem; }
        .condition-list li { font-size: 0.88rem; color: #334155; display: flex; align-items: flex-start; gap: 0.55rem; line-height: 1.45; }
        .condition-list li::before {
          content: ''; flex-shrink: 0; width: 16px; height: 16px; margin-top: 2px; border-radius: 50%;
          background: var(--accent-soft) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230ea5e9' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E") center/9px no-repeat;
        }
        .condition-foot { margin-top: auto; padding-top: 0.9rem; border-top: 1px dashed rgba(15,23,42,0.1); display: flex; align-items: center; justify-content: space-between; }
        .condition-link { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.88rem; font-weight: 700; color: var(--color-primary); transition: gap 0.25s; }
        .condition-card:hover .condition-link { gap: 0.6rem; }
        .condition-meta { font-size: 0.75rem; font-weight: 600; color: var(--color-text-light); background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 999px; padding: 0.15rem 0.6rem; }
        @media (max-width: 1024px) { .conditions-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .conditions-grid { grid-template-columns: 1fr; } }

        /* Chambers — the one dark band on the page; glass cards on navy */
        .chambers-section { overflow: hidden; }
        .chambers-section .container { position: relative; z-index: 1; }
        .chambers-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 1.25rem; }
        .chamber-card {
          display: flex; flex-direction: column;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px;
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 24px 48px -28px rgba(0,0,0,0.6);
          transition: transform 0.3s, border-color 0.3s, background 0.3s;
        }
        .chamber-card:hover { transform: translateY(-4px); border-color: rgba(125,211,252,0.45); background: rgba(255,255,255,0.09); }
        .chamber-card .card-body { display: flex; flex-direction: column; flex: 1; padding: 1.5rem; }
        .chamber-card h3 { display: flex; align-items: center; gap: 0.6rem; font-size: 1.1rem; margin-bottom: 1rem; color: #fff; }
        .chamber-card-icon { width: 32px; height: 32px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; background: rgba(14,165,233,0.25); color: #7dd3fc; flex-shrink: 0; }
        .chamber-info { display: flex; flex-direction: column; gap: 0.7rem; }
        .chamber-item { display: flex; align-items: flex-start; gap: 0.55rem; font-size: 0.9rem; color: #cbd5e1; line-height: 1.5; }
        .chamber-item svg { color: #7dd3fc; flex-shrink: 0; margin-top: 0.2rem; }
        .chamber-days { margin-top: 1.1rem; padding-top: 1.1rem; border-top: 1px solid rgba(255,255,255,0.12); font-size: 0.85rem; }
        .chamber-days-pills { display: flex; gap: 0.3rem; margin-bottom: 0.5rem; }
        .chamber-days-pills span { flex: 1; text-align: center; font-size: 0.65rem; font-weight: 700; padding: 0.32rem 0; border-radius: 6px; background: rgba(255,255,255,0.07); color: #64748b; text-transform: uppercase; }
        .chamber-days-pills span.on { background: rgba(16,185,129,0.22); color: #6ee7b7; }
        .chamber-days-text { font-weight: 600; color: #e2e8f0; }
        .chamber-card-btn { margin-top: auto; align-self: flex-start; margin-top: 1.25rem; }

        /* Testimonials — single row, manual scroll (arrows / dots / swipe / drag) */
        .testi-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; text-align: left; max-width: none; }
        .testi-header .section-title { margin-bottom: 0; }
        .testi-header .section-tag { margin-bottom: 0.5rem; }
        .testi-nav { display: flex; gap: 0.5rem; flex-shrink: 0; padding-bottom: 0.15rem; }
        .testi-nav-btn {
          width: 44px; height: 44px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          background: #fff; border: 1px solid var(--color-border);
          color: var(--color-primary-dark); cursor: pointer; box-shadow: var(--shadow-sm);
          transition: background 0.25s, color 0.25s, border-color 0.25s, transform 0.25s, opacity 0.25s;
        }
        .testi-nav-btn:hover:not(:disabled) { background: var(--color-primary); border-color: var(--color-primary); color: #fff; transform: translateY(-1px); }
        .testi-nav-btn:disabled { opacity: 0.35; cursor: default; }
        .testi-track {
          display: flex; gap: 1.25rem;
          overflow-x: auto; overscroll-behavior-x: contain;
          scroll-snap-type: x mandatory; scroll-padding: 0.25rem;
          padding: 0.75rem 0.25rem 1rem; margin: 0 -0.25rem;
          scrollbar-width: none; -ms-overflow-style: none;
          cursor: grab;
        }
        .testi-track::-webkit-scrollbar { display: none; }
        .testi-track.dragging { cursor: grabbing; scroll-snap-type: none; scroll-behavior: auto; user-select: none; -webkit-user-select: none; }
        .testi-track.dragging .testimonial-card { pointer-events: none; }
        .testi-track:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 4px; border-radius: 12px; }
        .testi-slide { scroll-snap-align: start; }
        .testi-dots { display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
        .testi-dot { width: 8px; height: 8px; border-radius: 999px; border: none; padding: 0; background: #cbd5e1; cursor: pointer; transition: width 0.25s, background 0.25s; }
        .testi-dot:hover { background: #94a3b8; }
        .testi-dot.active { width: 28px; background: var(--color-primary); }
        @media (prefers-reduced-motion: reduce) {
          .testi-track { scroll-behavior: auto; }
          .testi-nav-btn, .testi-dot { transition: none; }
        }
        @media (max-width: 640px) {
          .testi-header { align-items: center; }
          .testi-nav-btn { width: 40px; height: 40px; }
        }
        .testimonial-card {
          position: relative; text-align: center; background: #fff; border: 1px solid var(--color-border); border-radius: 20px;
          box-shadow: var(--shadow-card); transition: transform 0.3s, box-shadow 0.3s;
          width: min(360px, 82vw); flex-shrink: 0;
        }
        .testimonial-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        .testimonial-card .card-body { padding: 2rem 1.6rem 1.6rem; }
        .testimonial-quote { position: absolute; top: 0.4rem; left: 1.1rem; font-size: 4.5rem; line-height: 1; font-family: Georgia, serif; color: var(--color-primary); opacity: 0.16; pointer-events: none; }
        .testimonial-stars { color: #f59e0b; font-size: 1.1rem; letter-spacing: 0.1em; margin-bottom: 0.9rem; }
        .testimonial-text { color: #334155; font-size: 0.98rem; line-height: 1.7; margin-bottom: 1.4rem; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
        .testimonial-author { display: flex; align-items: center; gap: 0.7rem; justify-content: center; font-weight: 600; font-size: 0.92rem; }
        .testimonial-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--gradient-brand); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; box-shadow: 0 6px 14px -6px rgba(14,165,233,0.7); }

        /* CTA — hero-family sky background with a brand-gradient panel */
        .cta-section { padding: 3rem 0; background: var(--gradient-hero); border-top: 1px solid rgba(14,165,233,0.12); }
        .cta-inner {
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; color: white;
          padding: 1.75rem 2.25rem; border-radius: 24px;
          background: linear-gradient(120deg, var(--color-primary-dark) 0%, var(--color-primary) 55%, var(--color-accent) 100%);
          box-shadow: 0 24px 48px -24px rgba(2,132,199,0.6);
        }
        .cta-inner::before { content: ''; position: absolute; width: 260px; height: 260px; border-radius: 50%; right: -70px; top: -120px; background: rgba(255,255,255,0.12); pointer-events: none; }
        .cta-inner::after { content: ''; position: absolute; width: 180px; height: 180px; border-radius: 50%; left: 30%; bottom: -120px; background: rgba(255,255,255,0.08); pointer-events: none; }
        .cta-text { position: relative; z-index: 1; }
        .cta-inner h2 { font-size: 1.5rem; margin-bottom: 0.25rem; line-height: 1.25; }
        .cta-inner p { font-size: 0.95rem; opacity: 0.92; margin: 0; }
        .cta-btn { position: relative; z-index: 1; background: white; color: var(--color-primary-dark); flex-shrink: 0; white-space: nowrap; border-radius: 999px; padding: 0.85rem 1.6rem; box-shadow: 0 10px 24px -12px rgba(0,0,0,0.45); }
        .cta-btn:hover { background: #f0f9ff; transform: translateY(-1px); }
      `}</style>
    </>
  );
}
