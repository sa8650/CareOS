import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Users, Star, Shield, Phone, MapPin, Clock, ChevronRight, Calendar } from 'lucide-react';
import { fetchDoctor, fetchServices, fetchTestimonials, fetchGallery } from '../api/api';

export default function Home() {
  const [doctor, setDoctor] = useState(null);
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    fetchDoctor().then(setDoctor).catch(() => {});
    fetchServices().then(setServices).catch(() => {});
    fetchTestimonials().then(setTestimonials).catch(() => {});
    fetchGallery().then(setGallery).catch(() => {});
  }, []);

  const serviceIcons = ['🧴', '💉', '✨', '🔬', '💊', '🩺'];

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg-shapes">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
        </div>
        <div className="container hero-inner">
          <div className="hero-content">
            <div className="hero-badge animate-slide-down">
              <span className="hero-badge-dot"></span>
              {doctor?.title || 'Board-Certified Dermatologist'}
            </div>
            <h1 className="animate-fade-up">
              Dr. <span className="hero-name">{doctor?.name?.split(' ').slice(1).join(' ') || 'Doctor'}</span>
            </h1>
            <p className="hero-subtitle animate-fade-up delay-1">{doctor?.title || 'Dermatologist & Skin Specialist'}</p>
            <p className="hero-desc animate-fade-up delay-1">
              {doctor?.bio?.slice(0, 180) || 'Providing personalized dermatology treatments combining medical expertise with the latest technology.'}
              {doctor?.bio?.length > 180 ? '...' : ''}
            </p>
            
            {doctor?.qualifications && doctor.qualifications.length > 0 && (
              <div className="hero-quals animate-fade-up delay-2">
                {doctor.qualifications.slice(0, 3).map((q, i) => (
                  <span key={i} className="hero-qual-tag">
                    <Shield size={14} />
                    {q}
                  </span>
                ))}
              </div>
            )}

            <div className="hero-stats animate-fade-up delay-2">
              <div className="hero-stat">
                <span className="hero-stat-num">10K+</span>
                <span className="hero-stat-label">Patients</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="hero-stat-num">15+</span>
                <span className="hero-stat-label">Years Exp</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="hero-stat-num">4.9</span>
                <span className="hero-stat-label">Rating</span>
              </div>
            </div>

            <div className="hero-actions animate-fade-up delay-3">
              <Link to="/appointment" className="btn btn-primary btn-lg">
                <Calendar size={18} /> Book Appointment
              </Link>
              <Link to="/services" className="btn btn-outline btn-lg">
                View All Treatments
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-img-wrapper">
              {doctor?.profile_image ? (
                <img src={doctor.profile_image} alt={doctor.name} className="hero-doctor-photo" />
              ) : (
                <div className="hero-img-placeholder">
                  <div className="hero-img-initials">{doctor?.name?.[0] || 'D'}</div>
                  <span className="hero-img-name">{doctor?.name || 'Doctor'}</span>
                </div>
              )}
              <div className="hero-float-card hero-float-1">
                <Shield size={20} />
                <div>Board Certified<br /><small>Specialist</small></div>
              </div>
              <div className="hero-float-card hero-float-2">
                <Star size={20} />
                <div>Top Rated<br /><small>Doctor</small></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services - Conditions We Treat */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Conditions We Treat</span>
            <h2 className="section-title">Comprehensive Dermatological Care</h2>
            <p className="section-subtitle">Expert treatment for all skin, hair, and related conditions with modern and effective approaches.</p>
          </div>
          <div className="services-grid">
            {services.filter(s => s.is_active).map((s, i) => (
              <Link to={`/services/${s.slug}`} key={s.id} className="service-condition-card">
                <div className="service-card-icon" style={{ background: `hsl(${i * 60}, 70%, 95%)` }}>
                  {serviceIcons[i % serviceIcons.length]}
                </div>
                <h3>{s.name}</h3>
                <p>{s.description?.slice(0, 120)}{s.description?.length > 120 ? '...' : ''}</p>
                <span className="service-card-link">Learn More <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
          <p>Book your consultation today for accurate diagnosis and modern, effective treatment.</p>
          <Link to="/appointment" className="btn btn-primary btn-lg cta-btn">
            <Calendar size={18} /> Book Your Appointment
          </Link>
        </div>
      </section>

      <style>{`
        /* Hero */
        .hero { padding: 7rem 0 5rem; background: linear-gradient(145deg, #ffffff, #f8f5f0, #efe9e2); position: relative; overflow: hidden; }
        .hero-bg-shapes { position: absolute; inset: 0; pointer-events: none; }
        .hero-shape { position: absolute; border-radius: 50%; }
        .hero-shape-1 { width: 500px; height: 500px; background: radial-gradient(ellipse, rgba(37,99,235,0.06), transparent 70%); top: -20%; right: -10%; }
        .hero-shape-2 { width: 400px; height: 400px; background: radial-gradient(ellipse, rgba(13,148,136,0.04), transparent 70%); bottom: -20%; left: -10%; }
        .hero-inner { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 3rem; align-items: center; position: relative; z-index: 1; }
        .animate-slide-down { animation: slideDown 0.8s ease forwards; }
        .animate-fade-up { opacity: 0; animation: fadeUp 0.8s ease forwards; }
        .delay-1 { animation-delay: 0.2s; }
        .delay-2 { animation-delay: 0.4s; }
        .delay-3 { animation-delay: 0.6s; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .hero-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1.25rem; background: rgba(255,255,255,0.5); backdrop-filter: blur(10px); color: var(--color-primary); border-radius: 50px; font-size: 0.85rem; font-weight: 600; border: 1px solid rgba(255,255,255,0.6); margin-bottom: 1.25rem; }
        .hero-badge-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); } 50% { box-shadow: 0 0 0 8px rgba(34,197,94,0); } }
        .hero h1 { font-size: 3rem; line-height: 1.1; margin-bottom: 0.5rem; }
        .hero-name { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-subtitle { font-size: 1.1rem; color: var(--color-primary); font-weight: 600; margin-bottom: 0.75rem; }
        .hero-desc { font-size: 0.95rem; color: var(--color-text-light); margin-bottom: 1.25rem; line-height: 1.7; max-width: 520px; }
        .hero-quals { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
        .hero-qual-tag { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; background: rgba(255,255,255,0.5); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.6); border-radius: 8px; font-size: 0.75rem; font-weight: 600; color: var(--color-text); }
        .hero-qual-tag svg { color: var(--color-primary); }
        .hero-stats { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem; }
        .hero-stat-num { display: block; font-size: 1.5rem; font-weight: 800; color: var(--color-primary); }
        .hero-stat-label { font-size: 0.75rem; color: var(--color-text-light); text-transform: uppercase; letter-spacing: 0.5px; }
        .hero-stat-divider { width: 1px; height: 36px; background: var(--color-border); }
        .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
        .hero-image { display: flex; justify-content: center; }
        .hero-img-wrapper { position: relative; max-width: 380px; }
        .hero-doctor-photo { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 50%; border: 4px solid rgba(255,255,255,0.7); box-shadow: 0 20px 60px rgba(0,0,0,0.08); }
        .hero-img-placeholder { width: 100%; aspect-ratio: 1; background: linear-gradient(135deg, rgba(37,99,235,0.1), rgba(37,99,235,0.02)); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 4px solid rgba(255,255,255,0.7); }
        .hero-img-initials { font-size: 4rem; color: var(--color-primary); font-weight: 800; }
        .hero-img-name { font-size: 1rem; color: var(--color-text); font-weight: 600; margin-top: 0.5rem; }
        .hero-float-card { position: absolute; display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem; background: rgba(255,255,255,0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.8); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); font-size: 0.8rem; font-weight: 600; animation: floatCard 3s ease-in-out infinite; }
        .hero-float-card svg { color: var(--color-primary); flex-shrink: 0; }
        .hero-float-card small { font-weight: 400; color: var(--color-text-light); }
        .hero-float-1 { bottom: 15%; left: -10%; }
        .hero-float-2 { top: 10%; right: -5%; animation-delay: -1.5s; }
        @keyframes floatCard { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

        /* Section */
        .section-alt { background: var(--color-bg-alt); }
        .section-header { text-align: center; margin-bottom: 3rem; }
        .section-tag { display: inline-block; font-size: 0.8rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--color-primary); margin-bottom: 0.75rem; }

        /* Services Grid - Conditions We Treat Style */
        .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
        .service-condition-card {
          background: rgba(255,255,255,0.5); backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.6); border-radius: 18px;
          padding: 1.5rem; transition: all 0.3s; display: block; color: inherit;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        }
        .service-condition-card:hover { transform: translateY(-4px); background: rgba(255,255,255,0.7); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
        .service-card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1rem; }
        .service-condition-card h3 { font-size: 1.05rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--color-text); }
        .service-condition-card p { font-size: 0.85rem; color: var(--color-text-light); line-height: 1.6; margin-bottom: 0.75rem; }
        .service-card-link { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; font-weight: 600; color: var(--color-primary); }

        /* Testimonials */
        .testimonial-card { text-align: center; }
        .testimonial-stars { color: #f59e0b; font-size: 1.25rem; margin-bottom: 1rem; }
        .testimonial-text { color: var(--color-text-light); font-style: italic; margin-bottom: 1.25rem; }
        .testimonial-author { display: flex; align-items: center; gap: 0.75rem; justify-content: center; }
        .testimonial-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }

        /* CTA */
        .cta-section { background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); padding: 5rem 0; }
        .cta-inner { text-align: center; color: white; }
        .cta-inner h2 { font-size: 2.25rem; margin-bottom: 1rem; }
        .cta-inner p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto; }
        .cta-btn { background: white; color: var(--color-primary); }

        @media (max-width: 1024px) { .services-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .hero { padding: 5rem 0 3rem; }
          .hero-inner { grid-template-columns: 1fr; text-align: center; }
          .hero h1 { font-size: 2.25rem; }
          .hero-desc { max-width: 100%; }
          .hero-quals { justify-content: center; }
          .hero-stats { justify-content: center; }
          .hero-actions { justify-content: center; }
          .hero-image { order: -1; }
          .hero-img-wrapper { max-width: 250px; }
          .hero-float-card { display: none; }
          .services-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
