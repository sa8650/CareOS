import { useState, useEffect } from 'react';
import { Save, Upload } from 'lucide-react';
import { adminGet, adminPut, uploadFile } from '../api/api';

export default function Profile() {
  const [form, setForm] = useState({
    name: '', title: '', bio: '', profile_image: '',
    qualifications: '', specializations: '', experience: '',
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
      setTimeout(() => setMsg(''), 3000);
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
        <div className="profile-section card">
          <div className="card-body">
            <h2>Personal Information</h2>
            <div className="profile-photo-section">
              {form.profile_image && <img src={form.profile_image} alt="Profile" className="profile-photo-preview" />}
              <div>
                <label className="form-label">Profile Photo</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={form.name || ''} onChange={e => update('name', e.target.value)} placeholder="Dr. John Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input type="text" className="form-input" value={form.title || ''} onChange={e => update('title', e.target.value)} placeholder="Dermatologist & Skin Specialist" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-textarea" value={form.bio || ''} onChange={e => update('bio', e.target.value)} rows={5}
                placeholder="Write about yourself, your experience, and approach to patient care..." />
            </div>
          </div>
        </div>

        <div className="profile-section card">
          <div className="card-body">
            <h2>Professional Details</h2>
            <div className="form-group">
              <label className="form-label">Qualifications (one per line)</label>
              <textarea className="form-textarea" value={form.qualifications || ''} onChange={e => update('qualifications', e.target.value)} rows={4}
                placeholder="MBBS (Dhaka)&#10;BCS (Health)&#10;DDV (BSMMU)&#10;Board Certified Dermatologist" />
            </div>
            <div className="form-group">
              <label className="form-label">Specializations (comma-separated)</label>
              <input type="text" className="form-input" value={form.specializations || ''} onChange={e => update('specializations', e.target.value)}
                placeholder="Medical Dermatology, Cosmetic Dermatology, PRP Therapy" />
            </div>
            <div className="form-group">
              <label className="form-label">Experience</label>
              <input type="text" className="form-input" value={form.experience || ''} onChange={e => update('experience', e.target.value)}
                placeholder="e.g., 15+ years of experience" />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      <style>{`
        .admin-page-title { font-size: 1.75rem; margin-bottom: 1.5rem; }
        .profile-form { max-width: 800px; }
        .profile-section { margin-bottom: 1.5rem; }
        .profile-section h2 { font-size: 1.15rem; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border); }
        .profile-photo-section { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem; }
        .profile-photo-preview { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--color-border); }
      `}</style>
    </div>
  );
}
