import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Save } from 'lucide-react';
import { adminGet, adminPost, adminPut, adminDelete, uploadFile } from '../api/api';
import { slugify } from '../utils/helpers';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', is_active: 1 });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => adminGet('/services').then(setServices).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ name: '', slug: '', description: '', is_active: 1 }); setModal('new'); setImageFile(null); };
  const openEdit = (s) => { setForm({ ...s, description: Array.isArray(s.description) ? s.description.join('\n') : (s.description || '') }); setModal('edit'); setImageFile(null); };

  const update = (k, v) => {
    setForm(f => {
      const newForm = { ...f, [k]: v };
      if (k === 'name' && modal === 'new') newForm.slug = slugify(v);
      return newForm;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let image_url = form.image_url;
      if (imageFile) {
        const res = await uploadFile(imageFile, 'services');
        image_url = res.url;
      }
      const data = { ...form, image_url, description: form.description };
      if (modal === 'new') {
        await adminPost('/services', data);
      } else {
        await adminPut(`/services/${form.id}`, data);
      }
      setModal(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this service?')) return;
    try { await adminDelete(`/services/${id}`); load(); } catch (err) { alert(err.message); }
  };

  const toggleActive = async (s) => {
    try { await adminPut(`/services/${s.id}`, { is_active: s.is_active ? 0 : 1 }); load(); } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Services</h1>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Add Service</button>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : services.length === 0 ? (
        <div className="empty-state card">
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>No Services Yet</h3>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '1rem' }}>Add your first service to get started.</p>
            <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Add Service</button>
          </div>
        </div>
      ) : (
        <div className="services-admin-grid">
          {services.map(s => (
            <div key={s.id} className="service-admin-card card">
              <div className="card-body">
                <div className="service-admin-header">
                  <div className="service-admin-info">
                    {s.image_url ? (
                      <img src={s.image_url} alt="" className="service-admin-thumb" />
                    ) : (
                      <div className="service-admin-thumb-placeholder">📋</div>
                    )}
                    <div>
                      <h3>{s.name}</h3>
                      <span className="service-admin-slug">/{s.slug}</span>
                    </div>
                  </div>
                  <div className="service-admin-actions">
                    <button className="btn btn-sm btn-secondary" onClick={() => toggleActive(s)}>
                      {s.is_active ? <><Eye size={14} /> On</> : <><EyeOff size={14} /> Off</>}
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}><Edit size={14} /></button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                {s.description && <p className="service-admin-desc">{s.description?.slice(0, 150)}{s.description?.length > 150 ? '...' : ''}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>{modal === 'new' ? 'Add Service' : 'Edit Service'}</h3>
              <button onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Service Name *</label>
                  <input type="text" className="form-input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g., Acne Treatment" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug *</label>
                  <input type="text" className="form-input" value={form.slug} onChange={e => update('slug', e.target.value)} placeholder="acne-treatment" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (one item per line)</label>
                  <textarea className="form-textarea" value={form.description || ''} onChange={e => update('description', e.target.value)} rows={6}
                    placeholder="Treatment for acne and pimples&#10;Reduces scars and dark spots&#10;Customized skin care plan&#10;Visible results in 4-6 weeks" />
                </div>
                <div className="form-group">
                  <label className="form-label">Image</label>
                  {form.image_url && <img src={form.image_url} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', marginBottom: '0.5rem' }} />}
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .admin-page-title { font-size: 1.75rem; }
        .services-admin-grid { display: flex; flex-direction: column; gap: 1rem; }
        .service-admin-card { }
        .service-admin-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .service-admin-info { display: flex; align-items: center; gap: 1rem; }
        .service-admin-thumb { width: 48px; height: 48px; border-radius: 10px; object-fit: cover; }
        .service-admin-thumb-placeholder { width: 48px; height: 48px; border-radius: 10px; background: var(--color-bg-alt); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
        .service-admin-info h3 { font-size: 1rem; margin-bottom: 0.125rem; }
        .service-admin-slug { font-size: 0.8rem; color: var(--color-text-light); }
        .service-admin-actions { display: flex; gap: 0.5rem; }
        .service-admin-desc { color: var(--color-text-light); font-size: 0.85rem; margin-top: 0.75rem; line-height: 1.5; }
      `}</style>
    </div>
  );
}
