import { useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useSiteInfo } from '../hooks/useSiteInfo';
import { DEFAULT_PRIVACY_POLICY, renderSimpleMarkdown } from '../utils/privacy';

export default function Privacy() {
  const { settings, loading } = useSiteInfo();

  const text = settings?.privacy_policy?.trim() ? settings.privacy_policy : DEFAULT_PRIVACY_POLICY;
  const html = useMemo(() => renderSimpleMarkdown(text), [text]);
  const updated = settings?.privacy_updated?.trim();

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <span className="page-hero-tag"><ShieldCheck size={15} /> Your data, protected</span>
          <h1>Privacy Policy</h1>
          <p>{updated ? `Last updated: ${updated}` : 'How we handle your personal information'}</p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container privacy-wrap">
          <div className="privacy-content">
            {loading && !settings?.privacy_policy
              ? <div className="loading-page" style={{ minHeight: 200 }}><div className="spinner" /></div>
              : <div dangerouslySetInnerHTML={{ __html: html }} />}
          </div>
        </div>
      </section>

      <style>{`
        .privacy-wrap { max-width: 860px; }
        .privacy-content { background: #fff; border: 1px solid var(--color-border); border-radius: 24px; padding: 2.5rem 2.75rem; box-shadow: var(--shadow-card); }
        @media (max-width: 768px) { .privacy-content { padding: 1.5rem 1.15rem; border-radius: 20px; } }
        .privacy-content h2 { font-size: 1.5rem; margin: 2rem 0 0.75rem; }
        .privacy-content h2:first-child { margin-top: 0; }
        .privacy-content h3 { font-size: 1.15rem; margin: 1.5rem 0 0.5rem; }
        .privacy-content p { color: var(--color-text-light); line-height: 1.7; margin-bottom: 1rem; }
        .privacy-content ul { margin: 0.5rem 0 1.5rem 1.5rem; list-style: disc; }
        .privacy-content ul li { color: var(--color-text-light); margin-bottom: 0.5rem; }
        .privacy-content a { color: var(--color-primary); text-decoration: underline; }
        .privacy-content strong { color: var(--color-text); }
      `}</style>
    </div>
  );
}
