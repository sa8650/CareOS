import { useState, useEffect } from 'react';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { fetchServices, fetchAvailability, bookAppointment } from '../api/api';
import { formatDate, formatTime, DAYS } from '../utils/helpers';

export default function AppointmentForm({ onSuccess }) {
  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [form, setForm] = useState({
    service_id: '', start_time: '', end_time: '',
    name: '', phone: '', email: '', message: '',
  });

  useEffect(() => {
    Promise.all([fetchServices(), fetchAvailability()])
      .then(([s, a]) => { setServices(s); setAvailability(a); });
  }, []);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const selectedService = services.find(s => s.id === Number(form.service_id));

  // Generate calendar days for next 30 days
  const getCalendarDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      const isAvailable = availability.some(a => a.day_of_week === dayOfWeek && a.is_active);
      days.push({
        date: date,
        dateStr: date.toISOString().split('T')[0],
        day: date.getDate(),
        dayName: DAYS[dayOfWeek].slice(0, 3),
        isToday: i === 0,
        isAvailable,
      });
    }
    return days;
  };

  // Get available time slots for selected date
  const getAvailableSlots = () => {
    if (!selectedDate || !form.service_id) return [];
    const date = new Date(selectedDate + 'T00:00:00');
    const day = date.getDay();
    const daySlots = availability.filter(a => a.day_of_week === day && a.is_active);
    if (!daySlots.length) return [];

    const slots = [];
    daySlots.forEach(a => {
      const [sh, sm] = a.start_time.split(':').map(Number);
      const [eh, em] = a.end_time.split(':').map(Number);
      let h = sh, m = sm;
      const duration = selectedService?.duration_minutes || a.slot_duration;

      while (h < eh || (h === eh && m < em)) {
        const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const total = h * 60 + m + duration;
        const endH = Math.floor(total / 60);
        const endM = total % 60;
        if (endH > eh || (endH === eh && endM > em)) break;
        const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        slots.push({ start, end, label: formatTime(start) });
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
        date: selectedDate,
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

  const calendarDays = getCalendarDays();
  const timeSlots = getAvailableSlots();

  return (
    <form onSubmit={handleSubmit} className="appt-form">
      {error && <div className="appt-error">{error}</div>}

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div className="appt-step fade-in">
          <h3><Calendar size={20} /> Select Service</h3>
          <div className="service-select-grid">
            {services.filter(s => s.is_active).map(s => (
              <div key={s.id}
                className={`service-select-card ${form.service_id == s.id ? 'service-select-card--active' : ''}`}
                onClick={() => update('service_id', s.id)}>
                <h4>{s.name}</h4>
                <div className="service-select-meta">
                  <span>{s.duration_minutes} min</span>
                  {s.price && <span>${s.price}</span>}
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-primary btn-lg" disabled={!form.service_id} onClick={() => setStep(2)}>
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <div className="appt-step fade-in">
          <h3><Calendar size={20} /> Select Date</h3>
          <p className="appt-hint">Available dates are shown in green. You can book up to30 days in advance.</p>

          <div className="calendar-grid">
            {calendarDays.map((d, i) => (
              <button type="button" key={i}
                className={`calendar-day ${!d.isAvailable ? 'calendar-day--disabled' : ''} ${d.isAvailable ? 'calendar-day--available' : ''} ${selectedDate === d.dateStr ? 'calendar-day--selected' : ''} ${d.isToday ? 'calendar-day--today' : ''}`}
                onClick={() => { if (d.isAvailable) { setSelectedDate(d.dateStr); update('start_time', ''); } }}
                disabled={!d.isAvailable}>
                <span className="calendar-day-name">{d.dayName}</span>
                <span className="calendar-day-num">{d.day}</span>
                {d.isAvailable && <span className="calendar-day-dot" />}
              </button>
            ))}
          </div>

          {selectedDate && (
            <div className="time-slots-section fade-in">
              <h3><Clock size={20} /> Available Times for {formatDate(selectedDate)}</h3>
              {timeSlots.length === 0 ? (
                <p className="appt-no-slots">No available slots for this date.</p>
              ) : (
                <div className="time-slots-grid">
                  {timeSlots.map(s => (
                    <button type="button" key={s.start}
                      className={`time-slot ${form.start_time === s.start ? 'time-slot--active' : ''}`}
                      onClick={() => { update('start_time', s.start); update('end_time', s.end); }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="appt-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button type="button" className="btn btn-primary btn-lg"
              disabled={!selectedDate || !form.start_time}
              onClick={() => setStep(3)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Patient Info */}
      {step === 3 && (
        <div className="appt-step fade-in">
          <h3><User size={20} /> Your Information</h3>

          <div className="appt-summary">
            <div className="appt-summary-item">
              <CheckCircle size={16} />
              <span><strong>Service:</strong> {selectedService?.name}</span>
            </div>
            <div className="appt-summary-item">
              <CheckCircle size={16} />
              <span><strong>Date:</strong> {formatDate(selectedDate)}</span>
            </div>
            <div className="appt-summary-item">
              <CheckCircle size={16} />
              <span><strong>Time:</strong> {formatTime(form.start_time)}</span>
            </div>
          </div>

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

          <div className="appt-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !form.name || !form.phone}>
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .appt-form { max-width: 700px; }
        .appt-step h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; margin-bottom: 1rem; }
        .appt-hint { color: var(--color-text-light); font-size: 0.9rem; margin-bottom: 1.5rem; }
        .appt-error { background: #fee2e2; color: #991b1b; padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-bottom: 1rem; font-size: 0.9rem; }

        /* Service Selection */
        .service-select-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
        .service-select-card {
          padding: 1rem; border: 2px solid var(--color-border); border-radius: var(--radius-md);
          cursor: pointer; transition: all 0.2s; background: white;
        }
        .service-select-card:hover { border-color: var(--color-primary); }
        .service-select-card--active { border-color: var(--color-primary); background: var(--color-primary-light); }
        .service-select-card h4 { font-size: 0.95rem; margin-bottom: 0.5rem; }
        .service-select-meta { display: flex; gap: 1rem; font-size: 0.8rem; color: var(--color-text-light); }

        /* Calendar Grid */
        .calendar-grid {
          display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem;
          margin-bottom: 2rem;
        }
        .calendar-day {
          display: flex; flex-direction: column; align-items: center; padding: 0.75rem 0.5rem;
          border: 2px solid var(--color-border); border-radius: var(--radius-md);
          background: white; cursor: pointer; transition: all 0.2s; position: relative;
        }
        .calendar-day:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .calendar-day--available { border-color: #10b981; background: #f0fdf4; }
        .calendar-day--available:hover { background: #dcfce7; }
        .calendar-day--selected { border-color: var(--color-primary); background: var(--color-primary); color: white; }
        .calendar-day--selected .calendar-day-name { color: rgba(255,255,255,0.8); }
        .calendar-day--selected .calendar-day-dot { background: white; }
        .calendar-day--disabled { opacity: 0.4; cursor: not-allowed; background: #f9fafb; }
        .calendar-day--today { box-shadow: inset 0 0 0 2px var(--color-primary); }
        .calendar-day-name { font-size: 0.7rem; color: var(--color-text-light); text-transform: uppercase; letter-spacing: 0.05em; }
        .calendar-day-num { font-size: 1.1rem; font-weight: 700; margin-top: 0.25rem; }
        .calendar-day-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #10b981;
          margin-top: 0.375rem;
        }

        /* Time Slots */
        .time-slots-section { margin-bottom: 2rem; }
        .time-slots-section h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; margin-bottom: 1rem; }
        .time-slots-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .time-slot {
          padding: 0.625rem 1.25rem; border: 2px solid #10b981; border-radius: var(--radius-md);
          font-size: 0.9rem; font-weight: 500; background: #f0fdf4; color: #065f46;
          transition: all 0.2s;
        }
        .time-slot:hover { background: #10b981; color: white; }
        .time-slot--active { background: var(--color-primary); color: white; border-color: var(--color-primary); }

        /* Summary */
        .appt-summary {
          background: var(--color-bg-alt); padding: 1.25rem; border-radius: var(--radius-md);
          margin-bottom: 2rem; display: flex; flex-direction: column; gap: 0.75rem;
        }
        .appt-summary-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; }
        .appt-summary-item svg { color: var(--color-success); }

        .appt-actions { display: flex; gap: 1rem; margin-top: 1rem; }
        .appt-no-slots { color: var(--color-text-light); font-style: italic; }

        @media (max-width: 640px) {
          .calendar-grid { grid-template-columns: repeat(7, 1fr); gap: 0.25rem; }
          .calendar-day { padding: 0.5rem 0.25rem; }
          .calendar-day-name { font-size: 0.6rem; }
          .calendar-day-num { font-size: 0.9rem; }
        }
      `}</style>
    </form>
  );
}
