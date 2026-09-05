import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { fetchServices, fetchAvailability, bookAppointment } from '../api/api';
import { formatDate, formatTime, DAYS } from '../utils/helpers';

export default function AppointmentForm({ onSuccess }) {
  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    service_id: '', date: '', start_time: '', end_time: '',
    name: '', phone: '', email: '', message: '',
  });

  useEffect(() => {
    Promise.all([fetchServices(), fetchAvailability()])
      .then(([s, a]) => { setServices(s); setAvailability(a); });
  }, []);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectedService = services.find(s => s.id === Number(form.service_id));

  const getAvailableSlots = () => {
    if (!form.date || !form.service_id) return [];
    const date = new Date(form.date + 'T00:00:00');
    const day = date.getDay();
    const daySlots = availability.filter(a => a.day_of_week === day && a.is_active);
    if (!daySlots.length) return [];

    const slots = [];
    daySlots.forEach(a => {
      const [sh, sm] = a.start_time.split(':').map(Number);
      const [eh, em] = a.end_time.split(':').map(Number);
      let h = sh, m = sm;
      while (h < eh || (h === eh && m < em)) {
        const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const total = h * 60 + m + (selectedService?.duration_minutes || a.slot_duration);
        const endH = Math.floor(total / 60);
        const endM = total % 60;
        if (endH > eh || (endH === eh && endM > em)) break;
        const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        slots.push({ start, end });
        h = endH;
        m = endM;
      }
    });
    return slots;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await bookAppointment({
        service_id: Number(form.service_id),
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        name: form.name,
        phone: form.phone,
        email: form.email,
        message: form.message,
      });
      onSuccess?.(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const slots = getAvailableSlots();

  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 2);
  const minDateStr = today.toISOString().split('T')[0];
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="appt-form">
      {error && <div className="appt-error">{error}</div>}

      {step === 1 && (
        <div className="appt-step fade-in">
          <h3><Calendar size={20} /> Select Service & Date</h3>
          <div className="form-group">
            <label className="form-label">Service *</label>
            <select className="form-select" value={form.service_id} onChange={e => update('service_id', e.target.value)} required>
              <option value="">Choose a service</option>
              {services.filter(s => s.is_active).map(s => (
                <option key={s.id} value={s.id}>{s.name} — {s.duration_minutes}min{s.price ? ` ($${s.price})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Date *</label>
            <input type="date" className="form-input" value={form.date}
              onChange={e => { update('date', e.target.value); update('start_time', ''); }}
              min={minDateStr} max={maxDateStr} required />
          </div>

          {form.date && form.service_id && (
            <div className="form-group">
              <label className="form-label"><Clock size={16} /> Available Time Slots</label>
              {slots.length === 0 ? (
                <p className="appt-no-slots">No available slots for this date. Please try another day.</p>
              ) : (
                <div className="appt-slots">
                  {slots.map(s => (
                    <button type="button" key={s.start}
                      className={`appt-slot ${form.start_time === s.start ? 'appt-slot--active' : ''}`}
                      onClick={() => { update('start_time', s.start); update('end_time', s.end); }}>
                      {formatTime(s.start)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button type="button" className="btn btn-primary btn-lg"
            disabled={!form.service_id || !form.date || !form.start_time}
            onClick={() => setStep(2)}>
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="appt-step fade-in">
          <h3><User size={20} /> Your Information</h3>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input type="text" className="form-input" value={form.name} onChange={e => update('name', e.target.value)}
              placeholder="John Doe" required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input type="tel" className="form-input" value={form.phone} onChange={e => update('phone', e.target.value)}
              placeholder="+1 (555) 123-4567" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email} onChange={e => update('email', e.target.value)}
              placeholder="john@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Message (optional)</label>
            <textarea className="form-textarea" value={form.message} onChange={e => update('message', e.target.value)}
              placeholder="Describe your concern..." rows={3} />
          </div>

          <div className="appt-summary">
            <p><strong>Service:</strong> {selectedService?.name}</p>
            <p><strong>Date:</strong> {formatDate(form.date)}</p>
            <p><strong>Time:</strong> {formatTime(form.start_time)}</p>
          </div>

          <div className="appt-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !form.name || !form.phone}>
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .appt-form { max-width: 600px; }
        .appt-step h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; margin-bottom: 1.5rem; }
        .appt-error { background: #fee2e2; color: #991b1b; padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-bottom: 1rem; font-size: 0.9rem; }
        .appt-slots { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .appt-slot {
          padding: 0.5rem 1rem; border: 1px solid var(--color-border); border-radius: var(--radius-md);
          font-size: 0.9rem; transition: all 0.2s; background: white;
        }
        .appt-slot:hover { border-color: var(--color-primary); color: var(--color-primary); }
        .appt-slot--active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
        .appt-no-slots { color: var(--color-text-light); font-size: 0.9rem; font-style: italic; }
        .appt-summary { background: var(--color-bg-alt); padding: 1rem 1.25rem; border-radius: var(--radius-md); margin: 1.5rem 0; font-size: 0.95rem; }
        .appt-summary p { margin-bottom: 0.25rem; }
        .appt-actions { display: flex; gap: 1rem; }
      `}</style>
    </form>
  );
}
