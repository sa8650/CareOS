import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Shield, Star, ChevronRight, Calendar, Building2, MapPin, Phone, Clock } from 'lucide-react';
import { fetchDoctor, fetchServices, fetchTestimonials, fetchSettings } from '../api/api';

export default function Home() {
  const [doctor, setDoctor] = useState(null);
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetchDoctor().then(setDoctor).catch(() => {});
    fetchServices().then(setServices).catch(() => {});
    fetchTestimonials().then(setTestimonials).catch(() => {});
    fetchSettings().then(setSettings).catch(() => {});
  }, []);

  const serviceIcons = ['🧴', '💉', '✨', '🔬', '💊', '🩺', '🧬', '💡'];
  const chambers = settings.chambers ? JSON.parse(settings.chambers || '[]') : [];

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `/api/image?key=${encodeURIComponent(url)}`;
  };

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
            <div className="hero-stats animate-fade-up delay-3">
              <div className="hero-stat">
                <span className="hero-stat-num">10K+</span>
                <span className="hero-stat-label">Patients</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="hero-stat-num">15+</span>
                <span className="hero-stat-label">Years</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="hero-stat-num">4.9</span>
                <span className="hero-stat-label">Rating</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-img-wrapper">
              <div className="hero-img-bg"></div>
              {doctor?.profile_image ? (
                <img src={getImageUrl(doctor.profile_image)} alt={doctor.name} className="hero-doctor-photo" />
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

      {/* About Preview */}
      <section className="section">
        <div className="container about-preview">
          <div className="about-preview-img">
            {doctor?.profile_image ? (
              <img src={getImageUrl(doctor.profile_image)} alt={doctor.name} className="about-doctor-photo" />
            ) : (
              <div className="about-img-placeholder">
                <div className="about-img-inner" />
              </div>
            )}
          </div>
          <div className="about-preview-content">
            <span className="section-tag">About Me</span>
            <h2 className="section-title">{doctor?.name || 'Doctor'}</h2>
            <p className="about-title-text">{doctor?.title || 'Specialist'}</p>
            <p>{doctor?.bio || 'Experienced doctor providing quality care.'}</p>
            {doctor?.qualifications && doctor.qualifications.length > 0 && (
              <div className="about-highlights">
                {doctor.qualifications.slice(0, 3).map((q, i) => (
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

      {/* Conditions We Treat */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Conditions We Treat</span>
            <h2 className="section-title">Comprehensive Dermatological Care</h2>
            <p className="section-subtitle">Expert treatment for all skin, hair, and related conditions.</p>
          </div>
          <div className="conditions-grid">
            {services.filter(s => s.is_active).map((s, i) => (
              <div key={s.id} className="condition-card">
                <div className="condition-icon" style={{ background: `hsl(${i * 45}, 70%, 95%)` }}>
                  {serviceIcons[i % serviceIcons.length]}
                </div>
                <h3>{s.name}</h3>
                <ul className="condition-list">
                  {getDescriptionItems(s.description).slice(0, 6).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <Link to={`/services/${s.slug}`} className="condition-link">
                  Learn More <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chamber Details */}
      {chambers.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <span className="section-tag"><Building2 size={16} /> Chambers</span>
              <h2 className="section-title">Chamber Details</h2>
              <p className="section-subtitle">Visit me at any of my chambers</p>
            </div>
            <div className="chambers-grid">
              {chambers.map((c, i) => (
                <div key={i} className="chamber-card card">
                  <div className="card-body">
                    <h3>{c.name}</h3>
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
                      {c.hours && (
                        <div className="chamber-item">
                          <Clock size={16} />
                          <span>{c.hours}</span>
                        </div>
                      )}
                    </div>
                    {c.days && <div className="chamber-days">{c.days}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Testimonials</span>
              <h2 className="section-title">What My Patients Say</h2>
            </div>
            <div className="grid-3">
              {testimonials.slice(0, 3).map(t => (
                <div key={t.id} className="testimonial-card card">
                  <div className="card-body">
                    <div className="testimonial-stars">
                      {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                    </div>
                    <p className="testimonial-text">"{t.review}"</p>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar">{t.name[0]}</div>
                      <span>{t.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="cta-section">
        <div className="container cta-inner">
          <h2>Ready to Get Expert Treatment?</h2>
          <p>Book your consultation today for accurate diagnosis and effective treatment.</p>
          <Link to="/appointment" className="btn btn-primary btn-lg cta-btn">
            <Calendar size={18} /> Book Appointment
          </Link>
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
        }

        .about-preview { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
        .about-preview-img { border-radius: 2rem; overflow: hidden; }
        .about-doctor-photo { width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 2rem; }
        .about-img-placeholder { width: 100%; aspect-ratio: 3/4; background: linear-gradient(135deg, #dbeafe, #e0f2fe); border-radius: 2rem; display: flex; align-items: center; justify-content: center; }
        .about-img-inner { width: 80%; height: 80%; border-radius: 1.5rem; background: linear-gradient(135deg, var(--color-primary-light), #bfdbfe); }
        .section-tag { display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.8rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--color-primary); margin-bottom: 0.75rem; }
        .about-title-text { color: var(--color-primary); font-weight: 600; margin-bottom: 1rem; }
        .about-preview-content p { color: var(--color-text-light); margin-bottom: 1rem; font-size: 1.05rem; }
        .about-highlights { margin: 1.5rem 0; }
        .about-highlight { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; font-weight: 500; }
        .about-highlight svg { color: var(--color-primary); }
        .section-alt { background: var(--color-bg-alt); }
        .section-header { text-align: center; margin-bottom: 3rem; }
        @media (max-width: 768px) { .about-preview { grid-template-columns: 1fr; gap: 2rem; } }

        .conditions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
        .condition-card { background: rgba(255,255,255,0.5); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.6); border-radius: 18px; padding: 1.5rem; transition: all 0.3s; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
        .condition-card:hover { transform: translateY(-4px); background: rgba(255,255,255,0.7); }
        .condition-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1rem; }
        .condition-card h3 { font-size: 1.05rem; font-weight: 700; margin-bottom: 0.75rem; }
        .condition-list { list-style: none; margin-bottom: 1rem; }
        .condition-list li { font-size: 0.85rem; color: var(--color-text); padding: 0.375rem 0; border-bottom: 1px solid rgba(0,0,0,0.04); display: flex; align-items: center; gap: 0.5rem; }
        .condition-list li:last-child { border-bottom: none; }
        .condition-list li::before { content: ''; width: 5px; height: 5px; background: var(--color-primary); border-radius: 50%; flex-shrink: 0; opacity: 0.5; }
        .condition-link { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; font-weight: 600; color: var(--color-primary); }
        @media (max-width: 1024px) { .conditions-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .conditions-grid { grid-template-columns: 1fr; } }

        .chambers-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.25rem; }
        .chamber-card h3 { font-size: 1.1rem; margin-bottom: 1rem; color: var(--color-primary); }
        .chamber-info { display: flex; flex-direction: column; gap: 0.75rem; }
        .chamber-item { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.9rem; color: var(--color-text-light); }
        .chamber-item svg { color: var(--color-primary); flex-shrink: 0; margin-top: 0.125rem; }
        .chamber-days { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border); font-size: 0.85rem; color: var(--color-text-light); }

        .testimonial-card { text-align: center; }
        .testimonial-stars { color: #f59e0b; font-size: 1.25rem; margin-bottom: 1rem; }
        .testimonial-text { color: var(--color-text-light); font-style: italic; margin-bottom: 1.25rem; }
        .testimonial-author { display: flex; align-items: center; gap: 0.75rem; justify-content: center; }
        .testimonial-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }

        .cta-section { background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); padding: 5rem 0; }
        .cta-inner { text-align: center; color: white; }
        .cta-inner h2 { font-size: 2.5rem; margin-bottom: 1rem; }
        .cta-inner p { font-size: 1.15rem; opacity: 0.9; margin-bottom: 2rem; }
        .cta-btn { background: white; color: var(--color-primary); }
      `}</style>
    </>
  );
}
