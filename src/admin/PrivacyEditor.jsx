import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Save, Eye, EyeOff, RotateCcw, ExternalLink, Info } from 'lucide-react';
import { adminGet, adminPut } from '../api/api';
import { invalidateSiteInfo } from '../hooks/useSiteInfo';
import { DEFAULT_PRIVACY_POLICY, renderSimpleMarkdown } from '../utils/privacy';

export default function PrivacyEditor() {
  const [content, setContent] = useState('');
  const [updatedLabel, setUpdatedLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [preview, setPreview] = useState(true);

  useEffect(() => {
    adminGet('/settings')
      .then(s => {
        setContent(s?.privacy_policy || DEFAULT_PRIVACY_POLICY);
        setUpdatedLabel(s?.privacy_updated || '');
      })
      .catch(() => setContent(DEFAULT_PRIVACY_POLICY))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const label = updatedLabel.trim() || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      await adminPut('/settings', { privacy_policy: content, privacy_updated: label });
      setUpdatedLabel(label);
      invalidateSiteInfo();
      setMsg('Privacy policy saved!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    if (window.confirm('Replace the current text with the default template? You can still edit before saving.')) {
      setContent(DEFAULT_PRIVACY_POLICY);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="pp-page">
      <div className="pp-head">
        <div>
          <h1 className="admin-page-title">Privacy Policy</h1>
          <p className="pp-sub">This text is shown publicly at <Link to="/privacy" target="_blank">/privacy <ExternalLink size={12} /></Link></p>
        </div>
        <div className="pp-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setPreview(p => !p)}>
            {preview ? <><EyeOff size={16} /> Hide preview</> : <><Eye size={16} /> Show preview</>}
          </button>
          <button type="button" className="btn btn-secondary" onClick={resetToDefault}><RotateCcw size={16} /> Default text</button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>

      {msg && <div className={`toast ${msg.includes('saved') ? 'toast-success' : 'toast-error'}`}>{msg}</div>}

      <div className="pp-meta card">
        <div className="card-body pp-meta-body">
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">"Last updated" label</label>
            <input type="text" className="form-input" value={updatedLabel} onChange={e => setUpdatedLabel(e.target.value)} placeholder="e.g. September 2026 (auto-filled on save if empty)" />
          </div>
          <div className="pp-help">
            <Info size={16} />
            <div>
              <strong>Formatting:</strong> start a line with <code>## </code> for a heading, <code>- </code> for a bullet, use <code>**bold**</code>,
              and leave an empty line between paragraphs.
            </div>
          </div>
        </div>
      </div>

      <div className={`pp-editor ${preview ? 'pp-editor--split' : ''}`}>
        <div className="card">
          <div className="card-body">
            <label className="form-label">Policy text</label>
            <textarea className="form-textarea pp-textarea" value={content} onChange={e => setContent(e.target.value)} spellCheck />
            <small className="form-help">{content.length.toLocaleString()} characters</small>
          </div>
        </div>
        {preview && (
          <div className="card">
            <div className="card-body">
              <label className="form-label">Preview</label>
              <div className="pp-preview privacy-content" dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(content) }} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .admin-page-title { font-size: 1.75rem; margin-bottom: 0.25rem; }
        .pp-sub { color: var(--color-text-light); font-size: 0.9rem; }
        .pp-sub a { color: var(--color-primary); font-weight: 600; display: inline-flex; align-items: center; gap: 0.2rem; }
        .pp-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
        .pp-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .pp-meta { margin-bottom: 1.25rem; }
        .pp-meta-body { display: flex; gap: 1.5rem; align-items: flex-end; flex-wrap: wrap; }
        .pp-help { display: flex; gap: 0.6rem; align-items: flex-start; font-size: 0.85rem; color: var(--color-text-light); flex: 1.2; min-width: 260px; padding: 0.75rem 0.9rem; background: var(--color-bg-alt); border-radius: var(--radius-md); }
        .pp-help svg { color: var(--color-primary); flex-shrink: 0; margin-top: 2px; }
        .pp-help code { background: white; border: 1px solid var(--color-border); border-radius: 4px; padding: 0 0.3rem; font-size: 0.8rem; }
        .pp-editor { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
        .pp-editor--split { grid-template-columns: 1fr 1fr; }
        .pp-textarea { min-height: 560px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.88rem; line-height: 1.6; resize: vertical; }
        .pp-preview { max-height: 640px; overflow: auto; padding-right: 0.5rem; }
        .privacy-content h2 { font-size: 1.25rem; margin: 1.5rem 0 0.5rem; }
        .privacy-content h2:first-child { margin-top: 0; }
        .privacy-content h3 { font-size: 1.05rem; margin: 1.25rem 0 0.5rem; }
        .privacy-content p { color: var(--color-text-light); line-height: 1.7; margin-bottom: 0.9rem; }
        .privacy-content ul { margin: 0.25rem 0 1.25rem 1.25rem; list-style: disc; }
        .privacy-content ul li { color: var(--color-text-light); margin-bottom: 0.35rem; }
        .privacy-content a { color: var(--color-primary); text-decoration: underline; }
        @media (max-width: 1000px) { .pp-editor--split { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
