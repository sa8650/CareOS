import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Star } from 'lucide-react';
import { adminGet, adminPost, adminPut, adminDelete } from '../api/api';

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', review: '', rating: 5, is_published: 1 });
  const [saving, setSaving] = useState(false);

  const load = () => adminGet('/testimonials').then(setTestimonials).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ name: '', review: '', rating: 5, is_published: 1 }); setModal('new'); };
  const openEdit = (t) => { setForm(t); setModal('edit'); };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'new') {
        await adminPost('/testimonials', form);
      } else {
        await adminPut(`/testimonials/${form.id}`, form);
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
    if (!confirm('Delete this testimonial?')) return;
    try { await adminDelete(`/testimonials/${id}`); load(); } catch (err) { alert(err.message); }
  };

  const togglePublish = async (t) => {
    try { await adminPut(`/testimonials/${t.id}`, { is_published: t.is_published ? 0 : 1 }); load(); } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Testimonials</h1>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Add Testimonial</button>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : testimonials.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: '3rem' }}>No testimonials yet.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Review</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td style={{ maxWidth: 300 }}>{t.review.slice(0, 100)}{t.review.length > 100 ? '...' : ''}</td>
                  <td>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => togglePublish(t)}>
                      {t.is_published ? <><Eye size={14} /> Published</> : <><EyeOff size={14} /> Draft</>}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(t)}><Edit size={14} /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}><Trash2 size={14} /></button>
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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal === 'new' ? 'Add Testimonial' : 'Edit Testimonial'}</h3>
              <button onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Patient Name *</label>
                  <input type="text" className="form-input" value={form.name} onChange={e => update('name', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Review *</label>
                  <textarea className="form-textarea" value={form.review} onChange={e => update('review', e.target.value)} required rows={4} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <div className="rating-input">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button type="button" key={n} onClick={() => update('rating', n)}
                        className={`rating-star ${n <= form.rating ? 'rating-star--active' : ''}`}>
                        ★
                      </button>
                    ))}
                  </div>
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
        .rating-input { display: flex; gap: 0.25rem; }
        .rating-star { font-size: 1.5rem; color: var(--color-border); background: none; border: none; cursor: pointer; transition: color 0.15s; }
        .rating-star--active { color: #f59e0b; }
      `}</style>
    </div>
  );
}
