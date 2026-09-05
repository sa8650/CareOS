import { useState, useEffect } from 'react';
import { Save, Upload } from 'lucide-react';
import { adminGet, adminPut, uploadFile } from '../api/api';

export default function Profile() {
  const [form, setForm] = useState({
    name: '', title: '', bio: '', profile_image: '',
    qualifications: '', specializations: '', experience: '',
    clinic_name: '', phone: '', email: '', address: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    adminGet('/doctor')
      .then(data => {
        if (data) {
          setForm({
            ...data,
            qualifications: Array.isArray(data.qualifications) ? data.qualifications.join('\n') : (data.qualifications || ''),
            specializations: Array.isArray(data.specializations) ? data.specializations.join(', ') : (data.specializations || ''),
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      let profile_image = form.profile_image;
      if (imageFile) {
        const res = await uploadFile(imageFile, 'profile');
        profile_image = res.url;
      }
      await adminPut('/doctor', { ...form, profile_image });
      setMsg('Profile updated successfully!');
      setImageFile(null);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <h1 className="admin-page-title">Doctor Profile</h1>

      {msg && <div className={`toast ${msg.includes('success') ? 'toast-success' : 'toast-error'}`} style={{ marginBottom: '1rem', display: 'inline-block' }}>{msg}</div>}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-section">
          <h2>Personal Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={form.name || ''} onChange={e => update('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input type="text" className="form-input" value={form.title || ''} onChange={e => update('title', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="form-textarea" value={form.bio || ''} onChange={e => update('bio', e.target.value)} rows={4} />
          </div>
          <div className="form-group">
            <label className="form-label">Profile Photo</label>
            <div className="profile-photo-row">
              {form.profile_image && <img src={form.profile_image} alt="Profile" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />}
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Professional Details</h2>
          <div className="form-group">
            <label className="form-label">Qualifications (one per line)</label>
            <textarea className="form-textarea" value={form.qualifications || ''} onChange={e => update('qualifications', e.target.value)} rows={4} />
          </div>
          <div className="form-group">
            <label className="form-label">Specializations (comma-separated)</label>
            <input type="text" className="form-input" value={form.specializations || ''} onChange={e => update('specializations', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Experience</label>
            <textarea className="form-textarea" value={form.experience || ''} onChange={e => update('experience', e.target.value)} rows={3} />
          </div>
        </div>

        <div className="profile-section">
          <h2>Clinic Information</h2>
          <div className="form-group">
            <label className="form-label">Clinic Name</label>
            <input type="text" className="form-input" value={form.clinic_name || ''} onChange={e => update('clinic_name', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="tel" className="form-input" value={form.phone || ''} onChange={e => update('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email || ''} onChange={e => update('email', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-textarea" value={form.address || ''} onChange={e => update('address', e.target.value)} rows={2} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      <style>{`
        .admin-page-title { font-size: 1.75rem; margin-bottom: 1.5rem; }
        .profile-form { max-width: 800px; }
        .profile-section { background: white; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1.5rem; }
        .profile-section h2 { font-size: 1.25rem; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border); }
        .profile-photo-row { display: flex; align-items: center; gap: 1rem; }
      `}</style>
    </div>
  );
}
