import { useState, useEffect } from 'react';
import { Award, BookOpen, Briefcase, GraduationCap, Star, Users } from 'lucide-react';
import { fetchDoctor } from '../api/api';

export default function About() {
  const [doctor, setDoctor] = useState(null);
  useEffect(() => { fetchDoctor().then(setDoctor).catch(() => {}); }, []);

  const qualifications = [
    'MD - Harvard Medical School',
    'Residency - Johns Hopkins Dermatology',
    'Fellowship - Mohs Surgery, NYU',
    'Board Certified - American Board of Dermatology',
    'Fellow - American Academy of Dermatology',
  ];

  const experience = [
    { year: '2011–Present', role: 'Private Practice', org: 'Mitchell Dermatology Clinic', desc: 'Founder and lead dermatologist serving 10,000+ patients.' },
    { year: '2009–2011', role: 'Attending Dermatologist', org: 'NYU Langone Health', desc: 'Specialized in complex medical dermatology cases.' },
    { year: '2007–2009', role: 'Clinical Fellow', org: 'Mayo Clinic', desc: 'Advanced training in cosmetic and surgical dermatology.' },
  ];

  const specializations = [
    'Medical Dermatology', 'Cosmetic Dermatology', 'PRP Therapy',
    'Laser Treatments', 'Mohs Surgery', 'Pediatric Dermatology',
    'Skin Cancer Screening', 'Acne Treatment', 'Anti-Aging Treatments',
  ];

  return (
    <div className="about-page">
      <section className="page-hero">
        <div className="container">
          <h1>About Dr. Mitchell</h1>
          <p>Dedicated to providing exceptional dermatological care</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-grid">
            <div className="about-photo">
              <div className="about-photo-placeholder">
                <div className="about-photo-inner" />
              </div>
            </div>
            <div className="about-bio">
              <h2>Dr. Sarah Mitchell, MD, FAAD</h2>
              <span className="about-title">Board-Certified Dermatologist</span>
              <p>Dr. Sarah Mitchell is a board-certified dermatologist with over 15 years of experience in medical, surgical, and cosmetic dermatology. She founded Mitchell Dermatology Clinic with a vision to provide personalized, evidence-based skin care to patients of all ages.</p>
              <p>Known for her meticulous approach and warm bedside manner, Dr. Mitchell takes the time to listen to each patient's concerns and develop customized treatment plans. She believes in combining the latest dermatological advances with proven therapies to achieve optimal results.</p>
              <p>Dr. Mitchell is actively involved in dermatological research and has published numerous papers in peer-reviewed journals. She is a frequent speaker at national and international dermatology conferences.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Education & Qualifications</h2>
          <div className="qual-list">
            {qualifications.map((q, i) => (
              <div key={i} className="qual-item fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <GraduationCap size={20} className="qual-icon" />
                <span>{q}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Experience</h2>
          <div className="timeline">
            {experience.map((e, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <span className="timeline-year">{e.year}</span>
                  <h3>{e.role}</h3>
                  <h4>{e.org}</h4>
                  <p>{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Specializations</h2>
          <div className="spec-tags">
            {specializations.map((s, i) => (
              <span key={i} className="spec-tag">{s}</span>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .page-hero {
          padding: 8rem 0 3rem; background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          text-align: center;
        }
        .page-hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .page-hero p { color: var(--color-text-light); font-size: 1.1rem; }

        .about-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 4rem; align-items: start; }
        .about-photo-placeholder {
          width: 100%; aspect-ratio: 3/4; background: linear-gradient(135deg, #dbeafe, #e0f2fe);
          border-radius: 2rem; display: flex; align-items: center; justify-content: center;
        }
        .about-photo-inner { width: 80%; height: 80%; border-radius: 1.5rem; background: linear-gradient(135deg, var(--color-primary-light), #bfdbfe); }
        .about-bio h2 { font-size: 2rem; margin-bottom: 0.25rem; }
        .about-title { color: var(--color-primary); font-weight: 600; font-size: 1rem; display: block; margin-bottom: 1.5rem; }
        .about-bio p { color: var(--color-text-light); margin-bottom: 1rem; font-size: 1.05rem; line-height: 1.7; }

        .qual-list { max-width: 600px; margin: 2rem auto 0; }
        .qual-item {
          display: flex; align-items: center; gap: 1rem; padding: 1rem;
          background: white; border-radius: var(--radius-md); margin-bottom: 0.75rem;
          border: 1px solid var(--color-border); font-weight: 500;
        }
        .qual-icon { color: var(--color-primary); flex-shrink: 0; }

        .timeline { max-width: 700px; margin: 2rem auto 0; position: relative; padding-left: 2rem; }
        .timeline::before {
          content: ''; position: absolute; left: 8px; top: 0; bottom: 0;
          width: 2px; background: var(--color-border);
        }
        .timeline-item { position: relative; margin-bottom: 2rem; padding-left: 2rem; }
        .timeline-marker {
          position: absolute; left: -2rem; top: 0.25rem; width: 18px; height: 18px;
          background: var(--color-primary); border-radius: 50%; border: 3px solid white;
          box-shadow: var(--shadow-sm);
        }
        .timeline-year { color: var(--color-primary); font-weight: 600; font-size: 0.85rem; }
        .timeline-content h3 { font-size: 1.15rem; margin: 0.25rem 0; }
        .timeline-content h4 { color: var(--color-text-light); font-weight: 500; font-size: 0.95rem; margin-bottom: 0.5rem; }
        .timeline-content p { color: var(--color-text-light); font-size: 0.9rem; }

        .spec-tags { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; max-width: 700px; margin: 2rem auto 0; }
        .spec-tag {
          padding: 0.625rem 1.25rem; background: white; border: 1px solid var(--color-border);
          border-radius: var(--radius-full); font-weight: 500; font-size: 0.9rem;
          transition: all 0.2s;
        }
        .spec-tag:hover { border-color: var(--color-primary); color: var(--color-primary); }

        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr; gap: 2rem; }
          .about-photo { max-width: 300px; }
        }
      `}</style>
    </div>
  );
}
