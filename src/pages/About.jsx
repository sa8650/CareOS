import { useState, useEffect } from 'react';
import { Award, GraduationCap, Briefcase, Stethoscope, Sparkles, User } from 'lucide-react';
import { fetchDoctor } from '../api/api';
import { imageUrl, asLines, asList } from '../utils/helpers';

export default function About() {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchDoctor()
      .then(setDoctor)
      .catch(() => {})
      .finally(() => setLoading(false)); 
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const qualifications = asLines(doctor?.qualifications);
  const specializations = asList(doctor?.specializations);

  return (
    <div className="about-page">
      <section className="page-hero">
        <div className="container">
          <span className="page-hero-tag"><User size={15} /> {doctor?.title || 'About the doctor'}</span>
          <h1>About Me</h1>
          <p>Learn more about my background and expertise</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-grid">
            <div className="about-photo">
              <div className="about-photo-bg" />
              {doctor?.profile_image ? (
                <img src={imageUrl(doctor.profile_image)} alt={doctor.name} className="about-page-photo" />
              ) : (
                <div className="about-photo-placeholder">
                  <div className="about-photo-initials">{doctor?.name?.[0] || 'D'}</div>
                </div>
              )}
            </div>
            <div className="about-bio">
              <span className="about-label">Who I Am</span>
              <h2>{doctor?.name || 'Doctor Name'}</h2>
              <span className="about-title">{doctor?.title || 'Specialist'}</span>
              <p className="about-bio-text">{doctor?.bio || 'Bio not updated yet.'}</p>
              
              {doctor?.experience && (
                <div className="about-exp">
                  <Briefcase size={18} />
                  <span>{doctor.experience}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {qualifications.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-header">
              <span className="section-tag"><GraduationCap size={15} /> Credentials</span>
              <h2 className="section-title">Education & Qualifications</h2>
            </div>
            <div className="qual-list">
              {qualifications.map((q, i) => (
                <div key={i} className="qual-item">
                  <span className="qual-icon"><GraduationCap size={18} /></span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {specializations.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <span className="section-tag"><Stethoscope size={15} /> Expertise</span>
              <h2 className="section-title">Specializations</h2>
            </div>
            <div className="spec-tags">
              {specializations.map((s, i) => (
                <span key={i} className="spec-tag"><Sparkles size={14} /> {s}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      <style>{`
        .about-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 4rem; align-items: start; }
        .about-photo { position: relative; }
        .about-photo-bg { position: absolute; inset: -12px; background: var(--gradient-brand); border-radius: 2.25rem; opacity: 0.12; transform: rotate(-3deg); }
        .about-page-photo, .about-photo-placeholder { position: relative; width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 2rem; box-shadow: var(--shadow-xl); }
        .about-photo-placeholder { background: var(--gradient-brand); display: flex; align-items: center; justify-content: center; }
        .about-photo-initials { font-size: 5rem; color: white; font-weight: 800; }
        .about-label { color: var(--color-primary); font-weight: 700; font-size: 0.78rem; letter-spacing: 0.14em; text-transform: uppercase; }
        .about-bio h2 { font-size: clamp(1.75rem, 2.2vw + 0.6rem, 2.25rem); letter-spacing: -0.02em; margin: 0.5rem 0 0.25rem; }
        .about-title { color: var(--color-primary); font-weight: 600; display: block; margin-bottom: 1.5rem; }
        .about-bio-text { color: var(--color-text-light); font-size: 1.05rem; line-height: 1.8; margin-bottom: 1.5rem; white-space: pre-line; }
        .about-exp { display: inline-flex; align-items: center; gap: 0.6rem; font-weight: 600; padding: 0.6rem 1.1rem; background: var(--color-primary-light); color: var(--color-primary-dark); border-radius: var(--radius-full); }
        .about-exp svg { color: var(--color-primary); }
        .qual-list { max-width: 640px; margin: 0 auto; display: grid; gap: 0.75rem; }
        .qual-item { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--color-border); font-weight: 600; box-shadow: var(--shadow-card); transition: transform 0.2s, box-shadow 0.2s; }
        .qual-item:hover { transform: translateX(4px); box-shadow: var(--shadow-md); }
        .qual-icon { width: 40px; height: 40px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; background: var(--color-primary-light); color: var(--color-primary-dark); flex-shrink: 0; }
        .spec-tags { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; max-width: 760px; margin: 0 auto; }
        .spec-tag { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.7rem 1.3rem; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-full); font-weight: 600; font-size: 0.95rem; box-shadow: var(--shadow-sm); transition: all 0.2s; }
        .spec-tag svg { color: var(--color-primary); }
        .spec-tag:hover { border-color: var(--color-primary); color: var(--color-primary-dark); background: var(--color-primary-light); transform: translateY(-2px); }
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr; gap: 2.25rem; }
          .about-photo { max-width: 320px; margin: 0 auto; }
          .about-bio { text-align: center; }
          .spec-tag { font-size: 0.88rem; padding: 0.6rem 1rem; }
        }
      `}</style>
    </div>
  );
}
