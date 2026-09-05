import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Upload } from 'lucide-react';
import { adminGet, adminPost, adminPut, adminDelete, uploadFile } from '../api/api';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', price: '', duration_minutes: 30, benefits: '', faq: '', is_active: 1 });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => adminGet('/services').then(setServices).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ name: '', slug: '', description: '', price: '', duration_minutes: 30, benefits: '', faq: '', is_active: 1 }); setModal('new'); setImageFile(null); };
  const openEdit = (s) => {
    setForm({
      ...s,
      price: s.price || '',
      benefits: Array.isArray(s.benefits) ? s.benefits.join('\n') : (s.benefits || ''),
      faq: typeof s.faq === 'string' ? s.faq : JSON.stringify(s.faq || []),
    });
    setModal('edit');
    setImageFile(null);
  };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let image_url = form.image_url;
      if (imageFile) {
        const res = await uploadFile(imageFile, 'services');
        image_url = res.url;
      }
      const benefits = form.benefits ? form.benefits.split('\n').filter(Boolean) : [];
      const data = { ...form, image_url, benefits, price: form.price ? Number(form.price) : null, duration_minutes: Number(form.duration_minutes) };
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
        <p style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: '3rem' }}>No services yet. Add your first service.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {s.image_url ? <img src={s.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} /> : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-bg-alt)' }} />}
                      <div><strong>{s.name}</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>/{s.slug}</span></div>
                    </div>
                  </td>
                  <td>{s.duration_minutes} min</td>
                  <td>{s.price ? `$${s.price}` : '—'}</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => toggleActive(s)}>
                      {s.is_active ? <><Eye size={14} /> Active</> : <><EyeOff size={14} /> Inactive</>}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}><Edit size={14} /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>{modal === 'new' ? 'Add Service' : 'Edit Service'}</h3>
              <button onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input type="text" className="form-input" value={form.name} onChange={e => update('name', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug *</label>
                  <input type="text" className="form-input" value={form.slug} onChange={e => update('slug', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description || ''} onChange={e => update('description', e.target.value)} rows={3} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Duration (min)</label>
                    <input type="number" className="form-input" value={form.duration_minutes} onChange={e => update('duration_minutes', e.target.value)} min={5} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price ($)</label>
                    <input type="number" className="form-input" value={form.price} onChange={e => update('price', e.target.value)} min={0} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Benefits (one per line)</label>
                  <textarea className="form-textarea" value={form.benefits || ''} onChange={e => update('benefits', e.target.value)} rows={3} />
                </div>
                <div className="form-group">
                  <label className="form-label">Image</label>
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .admin-page-title { font-size: 1.75rem; }
      `}</style>
    </div>
  );
}
