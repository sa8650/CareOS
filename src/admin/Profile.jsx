import { useState, useEffect } from 'react';
import { Save, Plus, X, BarChart3 } from 'lucide-react';
import { adminGet, adminPut, uploadFile } from '../api/api';
import { imageUrl } from '../utils/helpers';
import { invalidateSiteInfo } from '../hooks/useSiteInfo';

export default function Profile() {
  const [form, setForm] = useState({
    name: '', title: '', bio: '', profile_image: '',
    qualifications: '', specializations: '', experience: '',
    stats: [],
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
            stats: Array.isArray(data.stats) ? data.stats : [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const MAX_STATS = 4;
  const stats = Array.isArray(form.stats) ? form.stats : [];
  const updateStat = (i, k, v) => setForm(f => ({ ...f, stats: (f.stats || []).map((st, idx) => idx === i ? { ...st, [k]: v } : st) }));
  const addStat = () => setForm(f => ({ ...f, stats: [...(f.stats || []), { value: '', label: '' }].slice(0, MAX_STATS) }));
  const removeStat = (i) => setForm(f => ({ ...f, stats: (f.stats || []).filter((_, idx) => idx !== i) }));
  const resetStats = () => setForm(f => ({ ...f, stats: [{ value: '10K+', label: 'Patients' }, { value: '15+', label: 'Years' }, { value: '4.9', label: 'Rating' }] }));

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
      const stats = (form.stats || [])
        .map(st => ({ value: (st.value || '').trim(), label: (st.label || '').trim() }))
        .filter(st => st.value || st.label);
      const res = await adminPut('/doctor', { ...form, profile_image, stats });
      if (res?.doctor) {
        setForm({
          ...res.doctor,
          qualifications: (res.doctor.qualifications || []).join('\n'),
          specializations: (res.doctor.specializations || []).join(', '),
          stats: Array.isArray(res.doctor.stats) ? res.doctor.stats : stats,
        });
      } else {
        update('profile_image', profile_image);
      }
      invalidateSiteInfo();
      setMsg(res?.warning ? `Saved, but: ${res.warning}` : 'Profile updated successfully!');
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

      {msg && <div className={`toast ${msg.includes('success') ? 'toast-success' : 'toast-error'}`}>{msg}</div>}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-section card">
          <div className="card-body">
            <h2>Personal Information</h2>
            <div className="profile-photo-section">
              {form.profile_image && <img src={imageUrl(form.profile_image)} alt="Profile" className="profile-photo-preview" />}
              <div>
                <label className="form-label">Profile Photo</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
              </div>
            </div>
            <div className="profile-2col">
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
                placeholder={"MBBS (Dhaka)\nBCS (Health)\nDDV (BSMMU)\nBoard Certified Dermatologist"} />
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

        <div className="profile-section card">
          <div className="card-body">
            <h2><BarChart3 size={18} style={{ verticalAlign: '-3px', marginRight: '0.4rem' }} />Hero Statistics</h2>
            <p className="form-help" style={{ marginTop: '-0.75rem', marginBottom: '1rem' }}>
              The numbers shown in the Home page banner (e.g. <strong>10K+ Patients</strong>, <strong>15+ Years</strong>, <strong>4.9 Rating</strong>). Up to {MAX_STATS}. Remove all rows to hide the box.
            </p>

            {stats.length === 0 && (
              <div className="stats-empty">No statistics — the box is hidden on the Home page.</div>
            )}
            <div className="stats-rows">
              {stats.map((st, i) => (
                <div key={i} className="stats-row">
                  <span className="stats-row-num">{i + 1}</span>
                  <div className="form-group">
                    {i === 0 && <label className="form-label">Number</label>}
                    <input type="text" className="form-input" value={st.value || ''} maxLength={12}
                      onChange={e => updateStat(i, 'value', e.target.value)} placeholder="e.g. 10K+" />
                  </div>
                  <div className="form-group">
                    {i === 0 && <label className="form-label">Label</label>}
                    <input type="text" className="form-input" value={st.label || ''} maxLength={24}
                      onChange={e => updateStat(i, 'label', e.target.value)} placeholder="e.g. Patients" />
                  </div>
                  <button type="button" className="icon-btn icon-btn--danger" title="Remove" onClick={() => removeStat(i)} style={{ marginTop: i === 0 ? '1.7rem' : 0 }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="stats-actions">
              {stats.length < MAX_STATS && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={addStat}><Plus size={14} /> Add statistic</button>
              )}
              <button type="button" className="btn btn-secondary btn-sm" onClick={resetStats}>Reset to default</button>
            </div>

            <div className="stats-preview">
              <span className="stats-preview-label">Preview</span>
              <div className="stats-preview-box">
                {stats.filter(st => (st.value || '').trim() || (st.label || '').trim()).map((st, i, arr) => (
                  <div key={i} style={{ display: 'contents' }}>
                    <div className="stats-preview-item">
                      <span className="stats-preview-num">{st.value || '—'}</span>
                      <span className="stats-preview-lbl">{st.label || ' '}</span>
                    </div>
                    {i < arr.length - 1 && <div className="stats-preview-divider" />}
                  </div>
                ))}
                {stats.filter(st => (st.value || '').trim() || (st.label || '').trim()).length === 0 && <span className="form-help">Hidden</span>}
              </div>
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
        .stats-rows { display: grid; gap: 0.25rem; }
        .stats-row { display: grid; grid-template-columns: 24px 1fr 1.4fr 30px; gap: 0.75rem; align-items: end; }
        .stats-row .form-group { margin-bottom: 0.6rem; }
        .stats-row-num { font-size: 0.75rem; font-weight: 800; color: var(--color-text-light); background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 999px; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1.1rem; }
        .stats-empty { padding: 0.9rem 1rem; border: 1px dashed var(--color-border); border-radius: var(--radius-md); color: var(--color-text-light); font-size: 0.9rem; margin-bottom: 0.75rem; }
        .stats-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.25rem; }
        .icon-btn { width: 30px; height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; background: var(--color-bg-alt); color: var(--color-text-light); border: 1px solid var(--color-border); cursor: pointer; transition: all 0.15s; margin-bottom: 0.6rem; }
        .icon-btn--danger:hover { background: var(--color-danger); border-color: var(--color-danger); color: #fff; }
        .stats-preview { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px dashed var(--color-border); }
        .stats-preview-label { display: block; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-text-light); margin-bottom: 0.6rem; }
        .stats-preview-box { display: inline-flex; align-items: center; gap: 1.25rem; padding: 0.9rem 1.25rem; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); min-height: 56px; }
        .stats-preview-item { text-align: center; min-width: 56px; }
        .stats-preview-num { display: block; font-size: 1.25rem; font-weight: 800; color: var(--color-primary); }
        .stats-preview-lbl { font-size: 0.75rem; color: var(--color-text-light); }
        .stats-preview-divider { width: 1px; height: 34px; background: var(--color-border); }
        .profile-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 640px) {
          .profile-2col { grid-template-columns: 1fr; gap: 0; }
          .profile-photo-section { align-items: flex-start; gap: 1rem; }
          .profile-photo-section input[type="file"] { max-width: 100%; font-size: 0.85rem; }
          .stats-row { grid-template-columns: 20px minmax(0, 1fr) minmax(0, 1.2fr) 30px; gap: 0.4rem; }
          .stats-row .form-input { padding-left: 0.6rem; padding-right: 0.6rem; }
          .stats-preview-box { display: flex; flex-wrap: wrap; gap: 0.75rem 1rem; padding: 0.75rem 1rem; }
          .stats-preview-divider { display: none; }
        }
      `}</style>
    </div>
  );
}
