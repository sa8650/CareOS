import { useEffect, useMemo, useState } from 'react';
import { Save, RotateCcw, Globe, Search, Loader2, ExternalLink, CheckCircle2, AlertTriangle, Upload, Code2, Eye } from 'lucide-react';
import { adminGet, adminPut, uploadFile } from '../api/api';
import { getAdminOverview, updateSEO, deleteSEO, invalidateSeo } from '../seo/seoService';
import { invalidateSiteInfo } from '../hooks/useSiteInfo';
import { SEO_FIELDS, ROBOTS_OPTIONS, SCHEMA_TYPES, LIMITS } from '../../shared/seo/schema.js';
import { imageUrl } from '../utils/helpers';

const SITE_KEYS = ['seo_site_url', 'seo_site_name', 'seo_location', 'seo_default_image', 'seo_twitter', 'seo_locale', 'seo_currency', 'seo_block_indexing'];
const emptyForm = () => Object.fromEntries(SEO_FIELDS.map(f => [f, '']));

export default function SeoSettings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('home');
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [site, setSite] = useState({});
  const [siteSaving, setSiteSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [filter, setFilter] = useState('');

  const load = async (keepSelection = true) => {
    setLoading(true); setError('');
    try {
      const d = await getAdminOverview();
      setData(d);
      setSite(Object.fromEntries(SITE_KEYS.map(k => [k, d?.site?.settings?.[k] || ''])));
      if (!keepSelection || !d.pages.find(p => p.key === selected)) setSelected(d.pages[0]?.key || 'home');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(false); }, []);

  const page = useMemo(() => data?.pages.find(p => p.key === selected) || null, [data, selected]);
  // Reset the form when the admin picks another page (not on every data refresh, so
  // success messages and unsaved typing survive a background reload).
  useEffect(() => {
    if (!page) return;
    const rec = page.record || {};
    setForm(Object.fromEntries(SEO_FIELDS.map(f => [f, rec[f] || ''])));
    setShowJson(Boolean(rec.schema_json));
    setMsg('');
  }, [selected, data?.ready]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(''), msg.startsWith('Error') ? 6000 : 3500);
    return () => clearTimeout(t);
  }, [msg]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const effective = (field) => (form[field] || '').trim() || page?.resolved?.[field] || '';
  const overridden = SEO_FIELDS.filter(f => (form[f] || '').trim()).length;

  const save = async (e) => {
    e?.preventDefault();
    if (!page) return;
    setSaving(true); setMsg('');
    try {
      await updateSEO(page.key, form);
      invalidateSeo();
      await load();
      setMsg('SEO saved for ' + page.label);
    } catch (err) { setMsg('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!page?.record) { setForm(emptyForm()); return; }
    if (!window.confirm(`Remove all custom SEO for "${page.label}" and use the automatic defaults?`)) return;
    setSaving(true);
    try {
      await deleteSEO(page.key); invalidateSeo(); await load();
      setForm(Object.fromEntries(SEO_FIELDS.map(f => [f, '']))); setShowJson(false);
      setMsg('Reset to defaults');
    }
    catch (err) { setMsg('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const saveSite = async () => {
    setSiteSaving(true); setMsg('');
    try {
      const clean = { ...site, seo_site_url: (site.seo_site_url || '').trim().replace(/\/+$/, '') };
      await adminPut('/settings', clean);
      invalidateSiteInfo(); invalidateSeo();
      await load();
      setMsg('Site SEO settings saved');
    } catch (err) { setMsg('Error: ' + err.message); }
    finally { setSiteSaving(false); }
  };

  const uploadImage = async (e, target) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file, 'seo');
      if (target === 'site') setSite(s => ({ ...s, seo_default_image: res.url }));
      else setForm(f => ({ ...f, og_image: res.url }));
    } catch (err) { setMsg('Error: ' + err.message); }
    finally { setUploading(false); }
  };

  const pages = (data?.pages || []).filter(p => !filter || p.label.toLowerCase().includes(filter.toLowerCase()) || p.path.includes(filter.toLowerCase()));
  const siteUrl = data?.site_url || '';
  const counter = (field) => {
    const len = effective(field).length; const max = LIMITS[field];
    if (!max) return null;
    return <span className={`seo-count ${len > max ? 'seo-count--over' : ''}`}>{len}/{max}</span>;
  };

  if (loading && !data) return <div className="loading-page"><div className="spinner" /></div>;
  if (error && !data) return <div className="card"><div className="card-body"><strong>Could not load SEO data.</strong><p style={{ color: 'var(--color-danger)' }}>{error}</p><button className="btn btn-secondary btn-sm" onClick={() => load(false)}>Retry</button></div></div>;

  return (
    <div className="seo-admin">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">SEO Settings</h1>
          <p className="seo-sub">Every public page gets automatic SEO from the doctor profile. Override anything here — no code changes needed.</p>
        </div>
        <div className="seo-links">
          <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><ExternalLink size={14} /> sitemap.xml</a>
          <a href="/robots.txt" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><ExternalLink size={14} /> robots.txt</a>
        </div>
      </div>

      {data?.warning && <div className="seo-alert seo-alert--warn"><AlertTriangle size={16} /> {data.warning}</div>}
      {msg && <div className={`seo-alert ${msg.startsWith('Error') ? 'seo-alert--error' : 'seo-alert--ok'}`}>{msg.startsWith('Error') ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />} {msg}</div>}

      {/* ---- Site-wide ---- */}
      <div className="card seo-card">
        <div className="card-body">
          <h2><Globe size={18} /> Site-wide settings</h2>
          <p className="form-help" style={{ marginBottom: '1rem' }}>Used by every page: canonical URLs, sitemap, Open Graph defaults and structured data. Doctor name, specialty, chambers and services are taken from their own admin pages automatically.</p>
          <div className="seo-grid-2">
            <div className="form-group">
              <label className="form-label">Site URL</label>
              <input className="form-input" value={site.seo_site_url} onChange={e => setSite(s => ({ ...s, seo_site_url: e.target.value }))} placeholder={siteUrl || 'https://www.example.com'} />
              <span className="form-help">Leave empty to use the current domain automatically ({siteUrl || 'detected at runtime'}). Set it when the site has a custom domain.</span>
            </div>
            <div className="form-group">
              <label className="form-label">Location (city)</label>
              <input className="form-input" value={site.seo_location} onChange={e => setSite(s => ({ ...s, seo_location: e.target.value }))} placeholder="e.g. Dhaka" />
              <span className="form-help">Used in titles like “{data?.site?.doctor_name || 'Doctor'} | {data?.site?.specialty || 'Specialist'} in {site.seo_location || 'City'}”. Guessed from the address when empty.</span>
            </div>
            <div className="form-group">
              <label className="form-label">Site name (Open Graph)</label>
              <input className="form-input" value={site.seo_site_name} onChange={e => setSite(s => ({ ...s, seo_site_name: e.target.value }))} placeholder={`${data?.site?.doctor_name || 'Doctor'} – ${data?.site?.settings?.clinic_name || 'Clinic'}`} />
            </div>
            <div className="form-group">
              <label className="form-label">Twitter / X handle</label>
              <input className="form-input" value={site.seo_twitter} onChange={e => setSite(s => ({ ...s, seo_twitter: e.target.value }))} placeholder="@clinic" />
            </div>
            <div className="form-group">
              <label className="form-label">Default share image (OG image)</label>
              <div className="seo-img-row">
                {site.seo_default_image ? <img src={imageUrl(site.seo_default_image)} alt="" className="seo-img-thumb" /> : <div className="seo-img-thumb seo-img-thumb--empty">1200×630</div>}
                <div style={{ flex: 1 }}>
                  <input className="form-input" value={site.seo_default_image} onChange={e => setSite(s => ({ ...s, seo_default_image: e.target.value }))} placeholder="Upload or paste an image URL" />
                  <label className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
                    {uploading ? <Loader2 size={14} className="seo-spin" /> : <Upload size={14} />} Upload
                    <input type="file" accept="image/*" hidden onChange={e => uploadImage(e, 'site')} />
                  </label>
                </div>
              </div>
              <span className="form-help">Falls back to the doctor’s profile photo. Recommended 1200×630 px.</span>
            </div>
            <div className="form-group">
              <div className="seo-grid-2" style={{ gap: '0 0.75rem' }}>
                <div>
                  <label className="form-label">Locale</label>
                  <input className="form-input" value={site.seo_locale} onChange={e => setSite(s => ({ ...s, seo_locale: e.target.value }))} placeholder="en_US" />
                </div>
                <div>
                  <label className="form-label">Currency (schema prices)</label>
                  <input className="form-input" value={site.seo_currency} onChange={e => setSite(s => ({ ...s, seo_currency: e.target.value }))} placeholder="USD / BDT" />
                </div>
              </div>
              <label className="seo-switch-row" style={{ marginTop: '1rem' }}>
                <span className="switch">
                  <input type="checkbox" checked={['1', 'true', 'yes'].includes(String(site.seo_block_indexing).toLowerCase())} onChange={e => setSite(s => ({ ...s, seo_block_indexing: e.target.checked ? '1' : '' }))} />
                  <span className="slider" />
                </span>
                <span><strong>Block search engines</strong> <span className="form-help" style={{ display: 'inline' }}>— robots.txt “Disallow: /” (use while the site is not launched yet)</span></span>
              </label>
            </div>
          </div>
          <button className="btn btn-primary" onClick={saveSite} disabled={siteSaving}>{siteSaving ? <Loader2 size={16} className="seo-spin" /> : <Save size={16} />} Save site settings</button>
        </div>
      </div>

      {/* ---- Per page ---- */}
      <div className="seo-layout">
        <aside className="card seo-pages">
          <div className="seo-pages-head">
            <Search size={14} />
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter pages…" />
          </div>
          <ul>
            {pages.map(p => {
              const custom = p.record ? SEO_FIELDS.filter(f => (p.record[f] || '').trim()).length : 0;
              return (
                <li key={p.key}>
                  <button className={`seo-page-btn ${p.key === selected ? 'is-active' : ''}`} onClick={() => setSelected(p.key)}>
                    <span className="seo-page-label">{p.label}{p.orphan && <em title="This page no longer exists (service deleted?)"> · orphan</em>}</span>
                    <span className="seo-page-path">{p.path}</span>
                    <span className={`seo-badge ${custom ? 'seo-badge--custom' : ''}`}>{custom ? `${custom} custom` : 'auto'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {page && (
          <form className="card seo-editor" onSubmit={save}>
            <div className="card-body">
              <div className="seo-editor-head">
                <div>
                  <h2>{page.label}</h2>
                  <a href={page.path} target="_blank" rel="noreferrer" className="seo-page-link">{siteUrl}{page.path} <ExternalLink size={12} /></a>
                </div>
                <div className="seo-editor-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={reset} disabled={saving}><RotateCcw size={14} /> Use defaults</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? <Loader2 size={14} className="seo-spin" /> : <Save size={14} />} Save</button>
                </div>
              </div>
              <p className="form-help" style={{ marginBottom: '1.25rem' }}>
                Empty fields use the automatic value (shown as placeholder). {overridden ? <strong>{overridden} field{overridden > 1 ? 's' : ''} customised.</strong> : 'All fields are automatic.'}
                {page.record?.updated_at && <> Last saved: {page.record.updated_at}</>}
              </p>

              <div className="form-group">
                <label className="form-label">SEO title {counter('title')}</label>
                <input className="form-input" value={form.title} onChange={set('title')} placeholder={page.resolved.title} />
              </div>
              <div className="form-group">
                <label className="form-label">Meta description {counter('description')}</label>
                <textarea className="form-textarea" rows={3} value={form.description} onChange={set('description')} placeholder={page.resolved.description} />
              </div>
              <div className="form-group">
                <label className="form-label">Target keywords <span className="seo-muted">(comma separated — planning note only)</span></label>
                <input className="form-input" value={form.keywords} onChange={set('keywords')} placeholder={page.resolved.keywords} />
                <span className="form-help">Not published as a meta tag (search engines ignore meta keywords). Use it to note the phrases this page should rank for, and make sure they appear naturally in the title, description and page text.</span>
              </div>
              <div className="seo-grid-2">
                <div className="form-group">
                  <label className="form-label">Canonical URL</label>
                  <input className="form-input" value={form.canonical} onChange={set('canonical')} placeholder={page.resolved.canonical} />
                </div>
                <div className="form-group">
                  <label className="form-label">Robots</label>
                  <select className="form-select" value={form.robots} onChange={set('robots')}>
                    {ROBOTS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.value === '' ? `Default (${page.resolved.robots})` : o.label}</option>)}
                  </select>
                </div>
              </div>

              <h3 className="seo-h3">Social sharing (Open Graph / Twitter)</h3>
              <div className="form-group">
                <label className="form-label">OG title {counter('og_title')}</label>
                <input className="form-input" value={form.og_title} onChange={set('og_title')} placeholder={page.resolved.og_title} />
              </div>
              <div className="form-group">
                <label className="form-label">OG description {counter('og_description')}</label>
                <textarea className="form-textarea" rows={2} value={form.og_description} onChange={set('og_description')} placeholder={page.resolved.og_description} />
              </div>
              <div className="form-group">
                <label className="form-label">OG image</label>
                <div className="seo-img-row">
                  {effective('og_image') ? <img src={imageUrl(effective('og_image'))} alt="" className="seo-img-thumb" /> : <div className="seo-img-thumb seo-img-thumb--empty">none</div>}
                  <div style={{ flex: 1 }}>
                    <input className="form-input" value={form.og_image} onChange={set('og_image')} placeholder={page.resolved.og_image || 'Upload or paste an image URL'} />
                    <label className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
                      {uploading ? <Loader2 size={14} className="seo-spin" /> : <Upload size={14} />} Upload
                      <input type="file" accept="image/*" hidden onChange={e => uploadImage(e, 'page')} />
                    </label>
                  </div>
                </div>
              </div>

              <h3 className="seo-h3">Structured data (JSON-LD)</h3>
              <div className="seo-grid-2">
                <div className="form-group">
                  <label className="form-label">Schema type</label>
                  <select className="form-select" value={form.schema_type} onChange={set('schema_type')}>
                    {SCHEMA_TYPES.map(o => <option key={o.value} value={o.value}>{o.value === '' ? `Auto (${page.resolved.schema_type})` : o.label}</option>)}
                  </select>
                  <span className="form-help">Generated from the doctor profile, chambers and services. Choose “None” to disable.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Custom schema JSON <span className="seo-muted">(advanced, replaces the generated one)</span></label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowJson(v => !v)}><Code2 size={14} /> {showJson || form.schema_json ? 'Hide' : 'Edit JSON'}</button>
                </div>
              </div>
              {(showJson || form.schema_json) && (
                <div className="form-group">
                  <textarea className="form-textarea seo-json" rows={8} value={form.schema_json} onChange={set('schema_json')} placeholder='{"@context":"https://schema.org","@type":"Physician","name":"…"}' spellCheck={false} />
                </div>
              )}

              {/* ---- Previews ---- */}
              <h3 className="seo-h3"><Eye size={16} /> Preview</h3>
              <div className="seo-previews">
                <div className="seo-serp">
                  <div className="seo-serp-url">{(effective('canonical') || siteUrl + page.path).replace(/^https?:\/\//, '')}</div>
                  <div className="seo-serp-title">{effective('title')}</div>
                  <div className="seo-serp-desc">{effective('description')}</div>
                </div>
                <div className="seo-og">
                  {effective('og_image') ? <img src={imageUrl(effective('og_image'))} alt="" /> : <div className="seo-og-noimg">No share image</div>}
                  <div className="seo-og-body">
                    <div className="seo-og-site">{(effective('canonical') || siteUrl).replace(/^https?:\/\//, '').split('/')[0]}</div>
                    <div className="seo-og-title">{effective('og_title')}</div>
                    <div className="seo-og-desc">{effective('og_description')}</div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .seo-sub { color: var(--color-text-light); font-size: 0.9rem; margin-top: 0.25rem; max-width: 720px; }
        .seo-links { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .seo-alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 0.9rem; border-radius: 10px; margin-bottom: 1rem; font-size: 0.9rem; }
        .seo-alert--ok, .seo-alert--error { position: fixed; top: calc(1rem + env(safe-area-inset-top)); right: 1rem; z-index: 2000; box-shadow: var(--shadow-xl); max-width: min(420px, calc(100vw - 2rem)); animation: toastIn 0.3s ease; }
        @media (max-width: 640px) { .seo-alert--ok, .seo-alert--error { left: 0.75rem; right: 0.75rem; max-width: none; justify-content: center; } }
        .seo-alert--warn { background: #fef3c7; color: #92400e; }
        .seo-alert--ok { background: #d1fae5; color: #065f46; }
        .seo-alert--error { background: #fee2e2; color: #991b1b; }
        .seo-card { margin-bottom: 1.5rem; }
        .seo-card h2, .seo-editor h2 { font-size: 1.15rem; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
        .seo-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1.25rem; }
        .seo-img-row { display: flex; gap: 0.9rem; align-items: flex-start; }
        .seo-img-thumb { width: 120px; height: 63px; object-fit: cover; border-radius: 8px; border: 1px solid var(--color-border); flex-shrink: 0; background: var(--color-bg-alt); }
        .seo-img-thumb--empty { display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: var(--color-text-light); }
        .seo-switch-row { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; }
        .switch { position: relative; display: inline-block; width: 42px; height: 24px; flex-shrink: 0; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .switch .slider { position: absolute; inset: 0; background: #cbd5e1; border-radius: 999px; transition: 0.2s; }
        .switch .slider::before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.25); }
        .switch input:checked + .slider { background: var(--color-danger); }
        .switch input:checked + .slider::before { transform: translateX(18px); }
        .seo-layout { display: grid; grid-template-columns: 300px 1fr; gap: 1.25rem; align-items: start; }
        .seo-pages { position: sticky; top: 1rem; max-height: calc(100vh - 2rem); overflow: auto; }
        .seo-pages-head { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 0.9rem; border-bottom: 1px solid var(--color-border); color: var(--color-text-light); }
        .seo-pages-head input { border: none; outline: none; flex: 1; font-size: 0.9rem; background: transparent; }
        .seo-pages ul { list-style: none; margin: 0; padding: 0.4rem; }
        .seo-page-btn { width: 100%; text-align: left; display: grid; grid-template-columns: 1fr auto; gap: 0 0.5rem; padding: 0.6rem 0.7rem; border-radius: 10px; border: 1px solid transparent; background: transparent; cursor: pointer; transition: background 0.15s; }
        .seo-page-btn:hover { background: var(--color-bg-alt); }
        .seo-page-btn.is-active { background: #f0f9ff; border-color: rgba(14,165,233,0.35); }
        .seo-page-label { font-weight: 600; font-size: 0.9rem; color: var(--color-text); }
        .seo-page-label em { font-style: normal; color: var(--color-danger); font-size: 0.75rem; }
        .seo-page-path { grid-column: 1; font-size: 0.75rem; color: var(--color-text-light); }
        .seo-badge { grid-column: 2; grid-row: 1 / span 2; align-self: center; font-size: 0.68rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px; background: var(--color-bg-alt); color: var(--color-text-light); border: 1px solid var(--color-border); white-space: nowrap; }
        .seo-badge--custom { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
        .seo-editor-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
        .seo-editor-actions { display: flex; gap: 0.5rem; }
        .seo-page-link { font-size: 0.8rem; color: var(--color-primary); display: inline-flex; align-items: center; gap: 0.25rem; }
        .seo-count { float: right; font-size: 0.75rem; font-weight: 500; color: var(--color-text-light); }
        .seo-count--over { color: var(--color-danger); font-weight: 700; }
        .seo-muted { font-weight: 400; color: var(--color-text-light); font-size: 0.85em; }
        .seo-h3 { font-size: 0.95rem; margin: 1.5rem 0 0.9rem; padding-top: 1rem; border-top: 1px dashed var(--color-border); display: flex; align-items: center; gap: 0.4rem; }
        .seo-json { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.8rem; }
        .seo-previews { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem; }
        .seo-serp { padding: 1rem 1.1rem; border: 1px solid var(--color-border); border-radius: 12px; background: #fff; font-family: arial, sans-serif; }
        .seo-serp-url { font-size: 0.8rem; color: #202124; margin-bottom: 0.2rem; }
        .seo-serp-title { font-size: 1.15rem; color: #1a0dab; line-height: 1.3; margin-bottom: 0.2rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .seo-serp-desc { font-size: 0.85rem; color: #4d5156; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .seo-og { border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; background: #fff; }
        .seo-og img, .seo-og-noimg { width: 100%; aspect-ratio: 1.91; object-fit: cover; display: flex; align-items: center; justify-content: center; background: var(--color-bg-alt); color: var(--color-text-light); font-size: 0.85rem; }
        .seo-og-body { padding: 0.7rem 0.9rem; background: #f0f2f5; }
        .seo-og-site { font-size: 0.72rem; text-transform: uppercase; color: #65676b; }
        .seo-og-title { font-weight: 700; font-size: 0.95rem; color: #050505; margin: 0.15rem 0; }
        .seo-og-desc { font-size: 0.8rem; color: #65676b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .seo-spin { animation: seo-spin 0.9s linear infinite; }
        @keyframes seo-spin { to { transform: rotate(360deg); } }
        @media (max-width: 960px) { .seo-layout { grid-template-columns: 1fr; } .seo-pages { position: static; max-height: 320px; } .seo-grid-2, .seo-previews { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
