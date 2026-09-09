import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X, ArrowUp, ArrowDown, ImagePlus, Loader2, LayoutTemplate, ExternalLink } from 'lucide-react';
import { adminSections, adminCreateSection, adminUpdateSection, adminDeleteSection, uploadFile } from '../api/api';
import { imageUrl } from '../utils/helpers';

const MAX_IMAGES = 3;
const EMPTY = { title: '', subtitle: '', description: '', benefits: '', images: [], button_text: '', button_link: '', is_active: 1 };

export default function HomeSections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | 'edit'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);

  const load = async () => {
    setLoading(true); setLoadError('');
    try { setSections(await adminSections()); }
    catch (e) { setLoadError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing(null); setError(''); setModal('new'); };
  const openEdit = (s) => {
    setForm({
      title: s.title || '', subtitle: s.subtitle || '', description: s.description || '',
      benefits: (s.benefits || []).join('\n'), images: s.images || [],
      button_text: s.button_text || '', button_link: s.button_link || '', is_active: s.is_active ? 1 : 0,
    });
    setEditing(s); setError(''); setModal('edit');
  };
  const close = () => { if (!saving && !uploading) setModal(null); };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const room = MAX_IMAGES - form.images.length;
    if (room <= 0) { setError(`Maximum ${MAX_IMAGES} images per section. Remove one first.`); return; }
    setUploading(true); setError('');
    try {
      const picked = files.slice(0, room);
      const uploaded = [];
      for (const f of picked) {
        const res = await uploadFile(f, 'sections');
        uploaded.push(res.url || res.key);
      }
      setForm(f => ({ ...f, images: [...f.images, ...uploaded].slice(0, MAX_IMAGES) }));
      if (files.length > picked.length) setError(`Only ${picked.length} image(s) added — maximum is ${MAX_IMAGES}.`);
    } catch (err) { setError(err.message || 'Upload failed'); }
    finally { setUploading(false); }
  };
  const removeImage = (i) => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  const moveImage = (i, dir) => setForm(f => {
    const imgs = [...f.images]; const j = i + dir;
    if (j < 0 || j >= imgs.length) return f;
    [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    return { ...f, images: imgs };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError('');
    try {
      const data = {
        title: form.title.trim(), subtitle: form.subtitle.trim(), description: form.description.trim(),
        benefits: form.benefits.split(/\r?\n/).map(b => b.trim()).filter(Boolean),
        images: form.images.slice(0, MAX_IMAGES),
        button_text: form.button_text.trim(), button_link: form.button_link.trim(), is_active: form.is_active ? 1 : 0,
      };
      if (modal === 'edit' && editing) await adminUpdateSection(editing.id, data);
      else await adminCreateSection(data);
      setModal(null); await load();
    } catch (err) { setError(err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete the section "${s.title}"? This cannot be undone.`)) return;
    try { await adminDeleteSection(s.id); await load(); } catch (err) { alert(err.message); }
  };
  const toggleActive = async (s) => {
    try { await adminUpdateSection(s.id, { is_active: s.is_active ? 0 : 1 }); await load(); } catch (err) { alert(err.message); }
  };
  const move = async (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= sections.length) return;
    const a = sections[idx], b = sections[j];
    // swap display_order values (fall back to positions if they are equal)
    const oa = a.display_order === b.display_order ? j + 1 : b.display_order;
    const ob = a.display_order === b.display_order ? idx + 1 : a.display_order;
    try {
      await Promise.all([adminUpdateSection(a.id, { display_order: oa }), adminUpdateSection(b.id, { display_order: ob })]);
      await load();
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Home Sections</h1>
          <p className="hs-sub">Custom sections shown on the Home page right after “About Me” — e.g. <em>Hair PRP</em>, <em>Cosmetic and Laser Treatments</em>.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Add Section</button>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : loadError ? (
        <div className="card"><div className="card-body hs-error-box">
          <strong>Could not load sections.</strong>
          <p>{loadError}</p>
          <button className="btn btn-secondary btn-sm" onClick={load}>Retry</button>
        </div></div>
      ) : sections.length === 0 ? (
        <div className="empty-state card">
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <LayoutTemplate size={40} style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }} />
            <h3>No custom sections yet</h3>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '1rem' }}>Add a section with a title, description, benefits and up to 3 images. It appears on the Home page immediately.</p>
            <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Add Section</button>
          </div>
        </div>
      ) : (
        <div className="hs-list">
          {sections.map((s, idx) => (
            <div key={s.id} className={`card hs-card ${s.is_active ? '' : 'hs-card--off'}`}>
              <div className="hs-card-body">
                <div className="hs-thumbs">
                  {s.images.length ? s.images.map((img, i) => (
                    <img key={i} src={imageUrl(img)} alt="" className={`hs-thumb ${i === 0 ? 'hs-thumb--main' : ''}`} />
                  )) : <div className="hs-thumb hs-thumb--empty"><ImagePlus size={18} /></div>}
                </div>
                <div className="hs-info">
                  <div className="hs-title-row">
                    <span className="hs-order">#{idx + 1}</span>
                    <h3>{s.title}</h3>
                    <span className={`badge ${s.is_active ? 'badge-confirmed' : 'badge-cancelled'}`}>{s.is_active ? 'Visible' : 'Hidden'}</span>
                  </div>
                  {s.subtitle && <div className="hs-subtitle">{s.subtitle}</div>}
                  {s.description && <p className="hs-desc">{s.description.slice(0, 160)}{s.description.length > 160 ? '…' : ''}</p>}
                  <div className="hs-meta">
                    <span>{s.benefits.length} benefit{s.benefits.length === 1 ? '' : 's'}</span>
                    <span>·</span>
                    <span>{s.images.length}/{MAX_IMAGES} image{s.images.length === 1 ? '' : 's'}</span>
                    {s.button_link && <><span>·</span><span className="hs-link"><ExternalLink size={12} /> {s.button_text || 'Learn More'} → {s.button_link}</span></>}
                  </div>
                </div>
                <div className="hs-actions">
                  <div className="hs-move">
                    <button className="icon-btn" title="Move up" disabled={idx === 0} onClick={() => move(idx, -1)}><ArrowUp size={14} /></button>
                    <button className="icon-btn" title="Move down" disabled={idx === sections.length - 1} onClick={() => move(idx, 1)}><ArrowDown size={14} /></button>
                  </div>
                  <button className="btn btn-sm btn-secondary" onClick={() => toggleActive(s)} title={s.is_active ? 'Hide from Home page' : 'Show on Home page'}>
                    {s.is_active ? <><Eye size={14} /> Shown</> : <><EyeOff size={14} /> Hidden</>}
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}><Edit size={14} /> Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s)}><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal hs-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal === 'new' ? 'Add Home Section' : 'Edit Home Section'}</h3>
              <button type="button" onClick={close} aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="hs-alert">{error}</div>}

                <div className="hs-form-grid">
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input className="form-input" value={form.title} onChange={set('title')} placeholder="e.g. Hair PRP" maxLength={120} required autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Small label (optional)</label>
                    <input className="form-input" value={form.subtitle} onChange={set('subtitle')} placeholder="e.g. Advanced Treatment" maxLength={60} />
                    <span className="form-help">Shown above the title and on the image badge.</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows={4} value={form.description} onChange={set('description')} placeholder="Describe the treatment or section. Leave an empty line to start a new paragraph." />
                </div>

                <div className="form-group">
                  <label className="form-label">Benefits <span className="hs-muted">(one per line)</span></label>
                  <textarea className="form-textarea" rows={5} value={form.benefits} onChange={set('benefits')} placeholder={'Stimulates natural hair growth\nNo surgery, minimal downtime\nUses your own platelets'} />
                  <span className="form-help">Each line becomes a check-mark item. Up to 12.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Images <span className="hs-muted">({form.images.length}/{MAX_IMAGES})</span></label>
                  <div className="hs-images">
                    {form.images.map((img, i) => (
                      <div key={`${img}-${i}`} className="hs-image">
                        <img src={imageUrl(img)} alt="" />
                        {i === 0 && <span className="hs-image-main">Main</span>}
                        <div className="hs-image-tools">
                          <button type="button" className="icon-btn" title="Move left" disabled={i === 0} onClick={() => moveImage(i, -1)}>‹</button>
                          <button type="button" className="icon-btn" title="Move right" disabled={i === form.images.length - 1} onClick={() => moveImage(i, 1)}>›</button>
                          <button type="button" className="icon-btn icon-btn--danger" title="Remove" onClick={() => removeImage(i)}><X size={14} /></button>
                        </div>
                      </div>
                    ))}
                    {form.images.length < MAX_IMAGES && (
                      <button type="button" className="hs-image hs-image-add" onClick={() => fileInput.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 size={22} className="hs-spin" /> : <ImagePlus size={22} />}
                        <span>{uploading ? 'Uploading…' : 'Add image'}</span>
                      </button>
                    )}
                  </div>
                  <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={handleFiles} />
                  <span className="form-help">JPG, PNG, WebP or GIF, max 5 MB each. The first image is the large one.</span>
                </div>

                <div className="hs-form-grid">
                  <div className="form-group">
                    <label className="form-label">Button text (optional)</label>
                    <input className="form-input" value={form.button_text} onChange={set('button_text')} placeholder="e.g. Book Appointment" maxLength={40} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Button link</label>
                    <input className="form-input" value={form.button_link} onChange={set('button_link')} placeholder="/appointment  or  /services/hair-prp  or  https://…" />
                  </div>
                </div>

                <label className="hs-switch-row">
                  <span className="switch">
                    <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked ? 1 : 0 }))} />
                    <span className="slider" />
                  </span>
                  <span>Show on Home page</span>
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={close} disabled={saving || uploading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                  {saving ? <><Loader2 size={16} className="hs-spin" /> Saving…</> : <><Save size={16} /> {modal === 'new' ? 'Create Section' : 'Save Changes'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .hs-sub { color: var(--color-text-light); font-size: 0.9rem; margin-top: 0.25rem; }
        .hs-list { display: grid; gap: 1rem; }
        .hs-card { transition: box-shadow 0.2s; }
        .hs-card:hover { box-shadow: var(--shadow-md); }
        .hs-card--off { opacity: 0.7; }
        .hs-card-body { display: grid; grid-template-columns: 150px 1fr auto; gap: 1.25rem; padding: 1.1rem 1.25rem; align-items: center; }
        .hs-thumbs { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 44px; gap: 4px; }
        .hs-thumb { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; background: var(--color-bg-alt); }
        .hs-thumb--main { grid-column: 1 / -1; height: 70px; }
        .hs-thumb--empty { grid-column: 1 / -1; height: 118px; display: flex; align-items: center; justify-content: center; color: var(--color-text-light); border: 1px dashed var(--color-border); }
        .hs-title-row { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
        .hs-title-row h3 { font-size: 1.05rem; margin: 0; }
        .hs-order { font-size: 0.72rem; font-weight: 800; color: var(--color-text-light); background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 999px; padding: 0.1rem 0.5rem; }
        .hs-subtitle { font-size: 0.8rem; font-weight: 600; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 0.2rem; }
        .hs-desc { color: var(--color-text-light); font-size: 0.88rem; margin: 0.4rem 0 0; line-height: 1.5; }
        .hs-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; font-size: 0.78rem; color: var(--color-text-light); }
        .hs-link { display: inline-flex; align-items: center; gap: 0.25rem; }
        .hs-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end; }
        .hs-move { display: flex; gap: 0.25rem; margin-right: 0.25rem; }
        .icon-btn { width: 30px; height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; background: var(--color-bg-alt); color: var(--color-text-light); border: 1px solid var(--color-border); cursor: pointer; transition: all 0.15s; font-size: 1rem; line-height: 1; }
        .icon-btn:hover:not(:disabled) { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
        .icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .icon-btn--danger:hover:not(:disabled) { background: var(--color-danger); border-color: var(--color-danger); }
        .hs-error-box p { color: var(--color-danger); margin: 0.35rem 0 0.75rem; font-size: 0.9rem; }
        .hs-modal { max-width: 720px; width: 100%; max-height: 92vh; overflow-y: auto; }
        .hs-alert { background: #fee2e2; color: #991b1b; padding: 0.7rem 0.9rem; border-radius: 10px; margin-bottom: 1rem; font-size: 0.9rem; }
        .hs-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
        .hs-muted { color: var(--color-text-light); font-weight: 400; font-size: 0.85em; }
        .hs-images { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
        .hs-image { position: relative; aspect-ratio: 4 / 3; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-border); background: var(--color-bg-alt); }
        .hs-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hs-image-main { position: absolute; top: 0.4rem; left: 0.4rem; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #fff; background: var(--color-primary); padding: 0.15rem 0.45rem; border-radius: 999px; }
        .hs-image-tools { position: absolute; right: 0.35rem; bottom: 0.35rem; display: flex; gap: 0.25rem; }
        .hs-image-tools .icon-btn { width: 26px; height: 26px; background: rgba(255,255,255,0.95); }
        .hs-image-add { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem; border: 2px dashed var(--color-border); color: var(--color-text-light); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .hs-image-add:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); background: #f0f9ff; }
        .hs-switch-row { display: flex; align-items: center; gap: 0.75rem; font-weight: 500; cursor: pointer; margin-top: 0.25rem; }
        .switch { position: relative; display: inline-block; width: 42px; height: 24px; flex-shrink: 0; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .switch .slider { position: absolute; inset: 0; background: #cbd5e1; border-radius: 999px; transition: 0.2s; }
        .switch .slider::before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.25); }
        .switch input:checked + .slider { background: var(--color-primary); }
        .switch input:checked + .slider::before { transform: translateX(18px); }
        .hs-spin { animation: hs-spin 0.9s linear infinite; }
        @keyframes hs-spin { to { transform: rotate(360deg); } }
        @media (max-width: 820px) {
          .hs-card-body { grid-template-columns: 1fr; }
          .hs-thumbs { grid-template-columns: repeat(3, 1fr); grid-auto-rows: 70px; }
          .hs-thumb--main { grid-column: auto; height: 70px; }
          .hs-thumb--empty { grid-column: 1 / -1; height: 70px; }
          .hs-actions { justify-content: flex-start; }
          .hs-form-grid { grid-template-columns: 1fr; }
          .hs-images { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
