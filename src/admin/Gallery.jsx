import { useState, useEffect } from 'react';
import { Upload, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { adminGet, adminPost, adminDelete, adminPut, uploadFile } from '../api/api';

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');

  const load = () => adminGet('/gallery').then(setImages).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file, 'gallery');
      await adminPost('/gallery', { image_url: res.url, caption, display_order: images.length });
      setCaption('');
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this image?')) return;
    try { await adminDelete(`/gallery/${id}`); load(); } catch (err) { alert(err.message); }
  };

  const togglePublish = async (img) => {
    try { await adminPut(`/gallery/${img.id}`, { is_published: img.is_published ? 0 : 1 }); load(); } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Gallery</h1>
        <div className="gallery-upload">
          <input type="text" className="form-input" placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)} style={{ width: 200 }} />
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Image'}
            <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : images.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: '3rem' }}>No images uploaded yet.</p>
      ) : (
        <div className="gallery-admin-grid">
          {images.map(img => (
            <div key={img.id} className="gallery-admin-item">
              <img src={img.image_url} alt={img.caption || ''} />
              <div className="gallery-admin-actions">
                {img.caption && <span className="gallery-caption-text">{img.caption}</span>}
                <div className="gallery-action-btns">
                  <button className="btn btn-sm btn-secondary" onClick={() => togglePublish(img)}>
                    {img.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(img.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .admin-page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .admin-page-title { font-size: 1.75rem; }
        .gallery-upload { display: flex; align-items: center; gap: 0.75rem; }
        .gallery-admin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
        .gallery-admin-item {
          border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--color-border);
          background: white;
        }
        .gallery-admin-item img { width: 100%; height: 180px; object-fit: cover; }
        .gallery-admin-actions { padding: 0.75rem; }
        .gallery-caption-text { display: block; font-size: 0.85rem; color: var(--color-text-light); margin-bottom: 0.5rem; }
        .gallery-action-btns { display: flex; gap: 0.5rem; }
      `}</style>
    </div>
  );
}
