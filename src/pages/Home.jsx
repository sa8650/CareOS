import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Users, Star, Shield, Phone, MapPin, Clock, Mail, ChevronRight } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
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

  const stats = [
    { icon: <Users />, value: '10,000+', label: 'Happy Patients' },
    { icon: <Award />, value: '15+', label: 'Years Experience' },
    { icon: <Star />, value: '4.9', label: 'Patient Rating' },
    { icon: <Shield />, value: '25+', label: 'Certifications' },
  ];

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-content fade-in">
            <span className="hero-badge">Board-Certified Dermatologist</span>
            <h1>Your Skin Deserves Expert Care</h1>
            <p>Dr. Sarah Mitchell provides personalized dermatology treatments combining medical expertise with the latest technology to help you achieve healthy, radiant skin.</p>
            <div className="hero-actions">
              <Link to="/appointment" className="btn btn-primary btn-lg">
                Book Appointment <ArrowRight size={18} />
              </Link>
              <Link to="/services" className="btn btn-outline btn-lg">
                Our Services
              </Link>
            </div>
          </div>
          <div className="hero-image fade-in">
            <div className="hero-img-wrapper">
              {doctor?.profile_image ? (
                <img src={doctor.profile_image} alt={doctor.name} className="hero-doctor-photo" />
              ) : (
                <div className="hero-img-placeholder">
                  <div className="hero-img-circle" />
                  <span className="hero-img-text">Dr. Sarah Mitchell</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-bar">
        <div className="container stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="stat-item">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About Preview */}
      <section className="section">
        <div className="container about-preview">
          <div className="about-preview-img">
            {doctor?.profile_image ? (
              <img src={doctor.profile_image} alt={doctor.name} className="about-doctor-photo" />
            ) : (
              <div className="about-img-placeholder">
                <div className="about-img-inner" />
              </div>
            )}
          </div>
          <div className="about-preview-content">
            <span className="section-label">About Dr. Mitchell</span>
            <h2 className="section-title">Dedicated to Your Skin Health</h2>
            <p>With over 15 years of experience in dermatology, Dr. Sarah Mitchell combines medical expertise with a compassionate approach to deliver exceptional patient care.</p>
            <p>Specializing in medical, surgical, and cosmetic dermatology, she stays at the forefront of dermatological advances to provide the best possible outcomes for her patients.</p>
            <div className="about-highlights">
              <div className="about-highlight">
                <Shield size={20} />
                <span>Harvard Medical School Graduate</span>
              </div>
              <div className="about-highlight">
                <Award size={20} />
                <span>Board Certified Dermatologist</span>
              </div>
              <div className="about-highlight">
                <Star size={20} />
                <span>AADA Fellow</span>
              </div>
            </div>
            <Link to="/about" className="btn btn-primary">
              Learn More <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Rest of the page remains same */}
      {/* Specializations */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Specializations</span>
            <h2 className="section-title">Areas of Expertise</h2>
            <p className="section-subtitle">Comprehensive dermatological care for all your skin needs</p>
          </div>
          <div className="grid-3">
            {[
              { title: 'Medical Dermatology', desc: 'Diagnosis and treatment of skin conditions including acne, eczema, psoriasis, and skin cancer screening.', icon: '🩺' },
              { title: 'Cosmetic Dermatology', desc: 'Advanced treatments including Botox, fillers, chemical peels, and laser treatments for rejuvenation.', icon: '✨' },
              { title: 'PRP & Regenerative', desc: 'Platelet-rich plasma therapy for hair restoration, skin rejuvenation, and healing acceleration.', icon: '🧬' },
              { title: 'Laser Treatments', desc: 'State-of-the-art laser technology for tattoo removal, scar treatment, and skin resurfacing.', icon: '💡' },
              { title: 'Pediatric Dermatology', desc: 'Gentle and effective skin care treatments specifically designed for children and adolescents.', icon: '👶' },
              { title: 'Surgical Dermatology', desc: 'Mohs surgery, mole removal, and other minor surgical procedures performed with precision.', icon: '🔬' },
            ].map((spec, i) => (
              <div key={i} className="spec-card card">
                <div className="card-body">
                  <div className="spec-icon">{spec.icon}</div>
                  <h3>{spec.title}</h3>
                  <p>{spec.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Our Services</span>
            <h2 className="section-title">Treatments We Offer</h2>
            <p className="section-subtitle">Professional dermatological services tailored to your needs</p>
          </div>
          <div className="grid-3">
            {services.filter(s => s.is_active).slice(0, 6).map(s => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
          {services.length > 6 && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/services" className="btn btn-outline">View All Services <ArrowRight size={16} /></Link>
            </div>
          )}
        </div>
      </section>

      {/* PRP Section */}
      <section className="section section-alt">
        <div className="container prp-section">
          <div className="prp-content">
            <span className="section-label">Featured Treatment</span>
            <h2 className="section-title">PRP Hair Restoration</h2>
            <p>Platelet-Rich Plasma (PRP) therapy is a revolutionary, natural treatment that uses your body's own healing power to stimulate hair growth and restore thinning hair.</p>
            <div className="prp-benefits">
              {['Natural & safe procedure', 'No surgery required', 'Minimal downtime', 'Visible results in 3-6 months', 'Stimulates natural hair growth'].map((b, i) => (
                <div key={i} className="prp-benefit">
                  <ChevronRight size={16} />
                  <span>{b}</span>
                </div>
              ))}
            </div>
            <Link to="/appointment" className="btn btn-primary btn-lg">
              Book PRP Consultation <ArrowRight size={18} />
            </Link>
          </div>
          <div className="prp-visual">
            <div className="prp-img-placeholder">
              <span>PRP Treatment</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <span className="section-label">Testimonials</span>
              <h2 className="section-title">What Our Patients Say</h2>
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

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-header">
              <span className="section-label">Gallery</span>
              <h2 className="section-title">Our Clinic</h2>
            </div>
            <div className="gallery-grid">
              {gallery.slice(0, 6).map(g => (
                <div key={g.id} className="gallery-item">
                  <img src={g.image_url} alt={g.caption || 'Clinic'} loading="lazy" />
                  {g.caption && <div className="gallery-caption">{g.caption}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="cta-section">
        <div className="container cta-inner">
          <h2>Ready to Transform Your Skin?</h2>
          <p>Book your consultation today and take the first step towards healthier, more radiant skin.</p>
          <Link to="/appointment" className="btn btn-primary btn-lg">
            Book Your Appointment <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Contact Info */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Contact Us</span>
            <h2 className="section-title">Visit Our Clinic</h2>
          </div>
          <div className="grid-3 contact-cards">
            <div className="contact-card card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <Phone size={32} className="contact-icon" />
                <h3>Phone</h3>
                <p>+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="contact-card card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <MapPin size={32} className="contact-icon" />
                <h3>Address</h3>
                <p>123 Medical Plaza, Suite 200<br />New York, NY 10001</p>
              </div>
            </div>
            <div className="contact-card card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <Clock size={32} className="contact-icon" />
                <h3>Hours</h3>
                <p>Mon–Fri: 9AM–5PM<br />Sat: 9AM–1PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        /* Hero */
        .hero { padding: 8rem 0 4rem; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%); }
        .hero-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
        .hero-badge {
          display: inline-block; padding: 0.375rem 1rem; background: white; color: var(--color-primary);
          border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem;
          box-shadow: var(--shadow-sm);
        }
        .hero h1 { font-size: 3.5rem; line-height: 1.1; margin-bottom: 1.25rem; color: var(--color-text); }
        .hero p { font-size: 1.15rem; color: var(--color-text-light); margin-bottom: 2rem; max-width: 540px; }
        .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
        .hero-img-wrapper { position: relative; border-radius: 2rem; overflow: hidden; }
        .hero-doctor-photo {
          width: 100%; aspect-ratio: 4/5; object-fit: cover;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.1));
          mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
        }
        .hero-img-placeholder {
          width: 100%; aspect-ratio: 4/5; background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          border-radius: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center;
          overflow: hidden; position: relative;
        }
        .hero-img-circle {
          width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,0.2);
          border: 3px solid rgba(255,255,255,0.4);
        }
        .hero-img-text { color: white; font-size: 1.25rem; font-weight: 700; margin-top: 1rem; }

        /* About Preview */
        .about-preview { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
        .about-preview-img { position: relative; border-radius: 2rem; overflow: hidden; }
        .about-doctor-photo {
          width: 100%; aspect-ratio: 3/4; object-fit: cover;
          border-radius: 2rem;
          mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
        }
        .about-img-placeholder {
          width: 100%; aspect-ratio: 3/4; background: linear-gradient(135deg, #dbeafe, #e0f2fe);
          border-radius: 2rem; display: flex; align-items: center; justify-content: center;
        }
        .about-img-inner { width: 80%; height: 80%; border-radius: 1.5rem; background: linear-gradient(135deg, var(--color-primary-light), #bfdbfe); }
        .about-preview-content { }
        .section-label {
          display: inline-block; color: var(--color-primary); font-weight: 600; font-size: 0.85rem;
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;
        }
        .about-preview-content p { color: var(--color-text-light); margin-bottom: 1rem; font-size: 1.05rem; }
        .about-highlights { margin: 1.5rem 0; }
        .about-highlight { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; font-weight: 500; }
        .about-highlight svg { color: var(--color-primary); }

        @media (max-width: 768px) {
          .hero { padding: 6rem 0 3rem; }
          .hero-inner { grid-template-columns: 1fr; text-align: center; }
          .hero h1 { font-size: 2.25rem; }
          .hero p { max-width: 100%; }
          .hero-actions { justify-content: center; }
          .hero-image { order: -1; max-width: 300px; margin: 0 auto; }
          .about-preview { grid-template-columns: 1fr; gap: 2rem; }
        }

        /* Stats */
        .stats-bar { background: var(--color-primary); padding: 2rem 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; text-align: center; }
        .stat-item { color: white; }
        .stat-icon { display: flex; justify-content: center; margin-bottom: 0.5rem; }
        .stat-value { font-size: 2rem; font-weight: 800; }
        .stat-label { font-size: 0.9rem; opacity: 0.9; }
        @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; } }

        /* Section Alt */
        .section-alt { background: var(--color-bg-alt); }
        .section-header { text-align: center; margin-bottom: 3rem; }

        /* Specializations */
        .spec-card { text-align: center; }
        .spec-card:hover { transform: translateY(-4px); }
        .spec-icon { font-size: 2.5rem; margin-bottom: 1rem; }
        .spec-card h3 { font-size: 1.1rem; margin-bottom: 0.75rem; }
        .spec-card p { color: var(--color-text-light); font-size: 0.9rem; }

        /* PRP */
        .prp-section { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
        .prp-content p { color: var(--color-text-light); font-size: 1.05rem; margin-bottom: 1.5rem; }
        .prp-benefits { margin-bottom: 2rem; }
        .prp-benefit { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 500; }
        .prp-benefit svg { color: var(--color-success); }
        .prp-visual { }
        .prp-img-placeholder {
          width: 100%; aspect-ratio: 4/3; background: linear-gradient(135deg, #ecfdf5, #d1fae5);
          border-radius: 2rem; display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; font-weight: 700; color: #065f46;
        }
        @media (max-width: 768px) { .prp-section { grid-template-columns: 1fr; gap: 2rem; } }

        /* Testimonials */
        .testimonial-card { text-align: center; }
        .testimonial-stars { color: #f59e0b; font-size: 1.25rem; margin-bottom: 1rem; }
        .testimonial-text { color: var(--color-text-light); font-style: italic; margin-bottom: 1.25rem; font-size: 0.95rem; line-height: 1.6; }
        .testimonial-author { display: flex; align-items: center; gap: 0.75rem; justify-content: center; }
        .testimonial-avatar {
          width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary);
          color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;
        }

        /* Gallery */
        .gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .gallery-item { position: relative; border-radius: var(--radius-lg); overflow: hidden; aspect-ratio: 4/3; }
        .gallery-item img { width: 100%; height: 100%; object-fit: cover; }
        .gallery-caption {
          position: absolute; bottom: 0; left: 0; right: 0; padding: 1rem;
          background: linear-gradient(transparent, rgba(0,0,0,0.7)); color: white; font-size: 0.85rem;
        }
        @media (max-width: 768px) { .gallery-grid { grid-template-columns: repeat(2, 1fr); } }

        /* CTA */
        .cta-section { background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); padding: 5rem 0; }
        .cta-inner { text-align: center; color: white; }
        .cta-inner h2 { font-size: 2.5rem; margin-bottom: 1rem; }
        .cta-inner p { font-size: 1.15rem; opacity: 0.9; margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto; }
        .cta-inner .btn { background: white; color: var(--color-primary); }
        .cta-inner .btn:hover { background: #f0f9ff; }

        /* Contact Cards */
        .contact-icon { color: var(--color-primary); margin-bottom: 0.75rem; }
        .contact-card h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }
        .contact-card p { color: var(--color-text-light); font-size: 0.95rem; }
      `}</style>
    </>
  );
}
