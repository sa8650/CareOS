import { useState, useEffect } from 'react';
import { Building2, Calendar, Clock, User, CheckCircle, MapPin, Users, Info } from 'lucide-react';
import { fetchChambers, fetchAvailability, bookAppointment } from '../api/api';
import { formatDate, formatTimeRange, formatVisitingDays, DAYS_SHORT } from '../utils/helpers';

// Patient booking flow: Chamber -> Date -> Details.
// Dates come from the same schedule engine the admin uses (/api/availability),
// so this page always reflects chamber days, per-date overrides and live capacity.
export default function AppointmentForm({ onSuccess }) {
  const [chambers, setChambers] = useState([]);
  const [chamber, setChamber] = useState(null);
  const [availability, setAvailability] = useState(null); // { days, today, ... }
  const [loadingDays, setLoadingDays] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  useEffect(() => {
    fetchChambers().then(list => {
      setChambers(list);
      if (list.length === 1) setChamber(list[0]);
    }).catch(() => {});
  }, []);

  // Load the resolved 30-day schedule whenever the chamber changes
  useEffect(() => {
    if (!chamber) { setAvailability(null); return; }
    let cancelled = false;
    setLoadingDays(true);
    setSelectedDate(null);
    fetchAvailability(chamber.id)
      .then(d => { if (!cancelled) setAvailability(d); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoadingDays(false); });
    return () => { cancelled = true; };
  }, [chamber]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const days = availability?.days || [];
  const selectedDay = days.find(d => d.date === selectedDate);

  const refreshDays = async () => {
    if (!chamber) return;
    try { setAvailability(await fetchAvailability(chamber.id)); } catch { /* ignore */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await bookAppointment({
        chamber_id: chamber.id,
        date: selectedDate,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });
      onSuccess?.(res);
    } catch (err) {
      setError(err.message);
      // Capacity/status changed since the calendar loaded (server returns the
      // resolved day) -> refresh and go back to the date picker. Other 409s
      // (e.g. duplicate booking for the same phone) stay on the form.
      if (err.status === 409 && err.data?.day) {
        await refreshDays();
        setSelectedDate(null);
        setStep(2);
      }
    } finally {
      setLoading(false);
    }
  };

  // Week-aligned cells for the calendar grid
  const leading = days.length ? days[0].day_of_week : 0;
  const cells = [...Array(leading).fill(null), ...days];

  return (
    <form onSubmit={handleSubmit} className="appt-form">
      <ol className="appt-steps">
        {['Chamber', 'Date', 'Your details'].map((label, i) => (
          <li key={label} className={`${step === i + 1 ? 'current' : ''} ${step > i + 1 ? 'done' : ''}`}>
            <span className="appt-step-num">{step > i + 1 ? '✓' : i + 1}</span> {label}
          </li>
        ))}
      </ol>

      {error && <div className="appt-error">{error}</div>}

      {/* Step 1: Chamber */}
      {step === 1 && (
        <div className="appt-step fade-in">
          <h3><Building2 size={20} /> Select Chamber</h3>
          {chambers.length === 0 ? (
            <p className="appt-hint">Online booking is not available right now. Please contact the clinic directly.</p>
          ) : (
            <div className="chamber-select-grid">
              {chambers.map(c => (
                <button type="button" key={c.id}
                  className={`chamber-select-card ${chamber?.id === c.id ? 'chamber-select-card--active' : ''}`}
                  onClick={() => setChamber(c)}>
                  <h4>{c.name}</h4>
                  {c.address && <p className="chamber-select-addr"><MapPin size={13} /> {c.address}</p>}
                  <div className="chamber-select-days">
                    {DAYS_SHORT.map((d, i) => (
                      <span key={d} className={c.visiting_days.includes(i) ? 'on' : ''}>{d[0]}</span>
                    ))}
                  </div>
                  <p className="chamber-select-meta">
                    <Clock size={13} /> {formatTimeRange(c.start_time, c.end_time)}
                    <span className="dot">·</span>{formatVisitingDays(c.visiting_days)}
                  </p>
                </button>
              ))}
            </div>
          )}
          <button type="button" className="btn btn-primary btn-lg" disabled={!chamber} onClick={() => setStep(2)}>
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Date */}
      {step === 2 && chamber && (
        <div className="appt-step fade-in">
          <h3><Calendar size={20} /> Select Date <span className="appt-h3-sub">— {chamber.name}</span></h3>
          <p className="appt-hint">
            Visiting days: <strong>{formatVisitingDays(chamber.visiting_days)}</strong> · Hours: <strong>{formatTimeRange(chamber.start_time, chamber.end_time)}</strong>.
            You can book up to 30 days in advance. Your serial number is assigned in order of booking.
          </p>

          {loadingDays ? (
            <div className="loading-page" style={{ minHeight: 200 }}><div className="spinner" /></div>
          ) : (
            <>
              <div className="calendar-grid">
                {DAYS_SHORT.map(d => <div key={d} className="calendar-label">{d}</div>)}
                {cells.map((d, i) => d ? (
                  <button type="button" key={d.date}
                    className={`calendar-day calendar-day--${d.status} ${d.bookable ? 'calendar-day--bookable' : 'calendar-day--disabled'} ${selectedDate === d.date ? 'calendar-day--selected' : ''} ${d.is_today ? 'calendar-day--today' : ''}`}
                    onClick={() => d.bookable && setSelectedDate(d.date)}
                    disabled={!d.bookable}
                    title={d.bookable ? `${d.remaining} slot${d.remaining === 1 ? '' : 's'} remaining` : statusText(d)}>
                    <span className="calendar-day-num">{Number(d.date.slice(8, 10))}</span>
                    <span className="calendar-day-status">{statusText(d)}</span>
                  </button>
                ) : <div key={`e${i}`} className="calendar-day calendar-day--empty" />)}
              </div>
              <div className="calendar-legend">
                <span><i className="lg lg-available" /> Available</span>
                <span><i className="lg lg-full" /> Full</span>
                <span><i className="lg lg-closed" /> Closed</span>
                <span><i className="lg lg-off" /> Off</span>
              </div>
            </>
          )}

          {selectedDay && (
            <div className="date-summary fade-in">
              <div><CheckCircle size={16} /> <strong>{formatDate(selectedDay.date)}</strong></div>
              <div><Clock size={16} /> Visiting hours {formatTimeRange(selectedDay.start_time, selectedDay.end_time)}</div>
              <div><Users size={16} /> {selectedDay.remaining} of {selectedDay.limit} slots remaining · you will be serial <strong>#{selectedDay.booked + 1}</strong></div>
            </div>
          )}

          <div className="appt-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button type="button" className="btn btn-primary btn-lg" disabled={!selectedDate} onClick={() => setStep(3)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Patient info */}
      {step === 3 && chamber && selectedDay && (
        <div className="appt-step fade-in">
          <h3><User size={20} /> Your Information</h3>

          <div className="appt-summary">
            <div className="appt-summary-item"><CheckCircle size={16} /><span><strong>Chamber:</strong> {chamber.name}</span></div>
            <div className="appt-summary-item"><CheckCircle size={16} /><span><strong>Date:</strong> {formatDate(selectedDate)}</span></div>
            <div className="appt-summary-item"><CheckCircle size={16} /><span><strong>Visiting hours:</strong> {formatTimeRange(selectedDay.start_time, selectedDay.end_time)}</span></div>
            <div className="appt-summary-item"><CheckCircle size={16} /><span><strong>Expected serial:</strong> #{selectedDay.booked + 1}</span></div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input type="text" className="form-input" value={form.name} onChange={e => update('name', e.target.value)}
              placeholder="Your full name" required maxLength={100} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input type="tel" className="form-input" value={form.phone} onChange={e => update('phone', e.target.value)}
              placeholder="01XXXXXXXXX" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email} onChange={e => update('email', e.target.value)}
              placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Reason for visit (optional)</label>
            <textarea className="form-textarea" value={form.message} onChange={e => update('message', e.target.value)}
              placeholder="Briefly describe your concern..." rows={3} />
          </div>

          <p className="appt-hint" style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
            <Info size={14} style={{ marginTop: 3, flexShrink: 0 }} />
            Your serial number is confirmed when the booking is saved. Please arrive during the visiting hours; patients are seen in serial order.
          </p>

          <div className="appt-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !form.name.trim() || !form.phone.trim()}>
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .appt-form { max-width: 720px; }
        .appt-steps { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .appt-steps li { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; font-weight: 600; color: var(--color-text-light); padding: 0.35rem 0.75rem 0.35rem 0.35rem; border-radius: 999px; background: var(--color-bg-alt); }
        .appt-steps li.current { background: var(--color-primary-light); color: var(--color-primary-dark); }
        .appt-steps li.done { color: #15803d; background: #f0fdf4; }
        .appt-step-num { width: 22px; height: 22px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; box-shadow: var(--shadow-sm); }
        .appt-step h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
        .appt-h3-sub { font-weight: 500; color: var(--color-text-light); font-size: 1rem; }
        .appt-hint { color: var(--color-text-light); font-size: 0.9rem; margin-bottom: 1.25rem; line-height: 1.6; }
        .appt-error { background: #fee2e2; color: #991b1b; padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-bottom: 1rem; font-size: 0.9rem; }

        /* Chamber selection */
        .chamber-select-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
        .chamber-select-card { text-align: left; padding: 1rem; border: 2px solid var(--color-border); border-radius: var(--radius-lg); background: white; cursor: pointer; transition: all 0.2s; }
        .chamber-select-card:hover { border-color: var(--color-primary); }
        .chamber-select-card--active { border-color: var(--color-primary); background: var(--color-primary-light); }
        .chamber-select-card h4 { font-size: 1rem; margin-bottom: 0.35rem; }
        .chamber-select-addr { font-size: 0.8rem; color: var(--color-text-light); display: flex; gap: 0.3rem; align-items: flex-start; margin-bottom: 0.6rem; line-height: 1.4; }
        .chamber-select-addr svg { flex-shrink: 0; margin-top: 2px; }
        .chamber-select-days { display: flex; gap: 0.25rem; margin-bottom: 0.5rem; }
        .chamber-select-days span { width: 22px; height: 22px; border-radius: 50%; font-size: 0.65rem; font-weight: 700; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: #94a3b8; }
        .chamber-select-days span.on { background: #22c55e; color: white; }
        .chamber-select-meta { font-size: 0.8rem; color: var(--color-text); display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; }
        .chamber-select-meta .dot { color: var(--color-text-light); }

        /* Calendar */
        .calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 0.4rem; margin-bottom: 0.75rem; }
        .calendar-label { text-align: center; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--color-text-light); padding-bottom: 0.25rem; }
        .calendar-day { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.15rem; min-height: 62px; padding: 0.4rem 0.25rem; border: 2px solid var(--color-border); border-radius: var(--radius-md); background: white; cursor: pointer; transition: all 0.15s; min-width: 0; overflow: hidden; }
        .calendar-day--empty { border-color: transparent; background: transparent; cursor: default; }
        .calendar-day--bookable:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .calendar-day--available { border-color: #86efac; background: #f0fdf4; }
        .calendar-day--full { border-color: #fcd34d; background: #fffbeb; }
        .calendar-day--closed { border-color: #fca5a5; background: #fef2f2; }
        .calendar-day--off { background: #f8fafc; }
        .calendar-day--disabled { cursor: not-allowed; opacity: 0.7; }
        .calendar-day--off.calendar-day--disabled { opacity: 0.45; }
        .calendar-day--selected { border-color: var(--color-primary) !important; background: var(--color-primary) !important; color: white; opacity: 1; }
        .calendar-day--selected .calendar-day-status { color: rgba(255,255,255,0.9) !important; }
        .calendar-day--today { box-shadow: inset 0 0 0 2px var(--color-primary); }
        .calendar-day-num { font-size: 1.05rem; font-weight: 700; line-height: 1; }
        .calendar-day-status { font-size: 0.62rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
        .calendar-day--available .calendar-day-status { color: #15803d; }
        .calendar-day--full .calendar-day-status { color: #b45309; }
        .calendar-day--closed .calendar-day-status { color: #b91c1c; }
        .calendar-day--off .calendar-day-status { color: #94a3b8; }
        .calendar-legend { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.78rem; color: var(--color-text-light); margin-bottom: 1.25rem; }
        .calendar-legend span { display: flex; align-items: center; gap: 0.35rem; }
        .lg { width: 12px; height: 12px; border-radius: 3px; border: 2px solid; display: inline-block; }
        .lg-available { border-color: #86efac; background: #f0fdf4; } .lg-full { border-color: #fcd34d; background: #fffbeb; }
        .lg-closed { border-color: #fca5a5; background: #fef2f2; } .lg-off { border-color: var(--color-border); background: #f8fafc; }

        .date-summary { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: 0.9rem 1rem; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.9rem; margin-bottom: 1.25rem; }
        .date-summary > div { display: flex; align-items: center; gap: 0.5rem; }
        .date-summary svg { color: #15803d; flex-shrink: 0; }

        .appt-summary { background: var(--color-bg-alt); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; }
        .appt-summary-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; }
        .appt-summary-item svg { color: var(--color-success); flex-shrink: 0; }
        .appt-actions { display: flex; gap: 1rem; margin-top: 1rem; }

        @media (max-width: 640px) {
          .calendar-grid { gap: 0.25rem; }
          .calendar-day { min-height: 54px; padding: 0.3rem 0.1rem; }
          .calendar-day-num { font-size: 0.9rem; }
          .calendar-day-status { font-size: 0.5rem; }
        }
      `}</style>
    </form>
  );
}

function statusText(d) {
  if (d.is_past) return 'Past';
  if (d.status === 'available') {
    if (d.ended) return 'Ended';
    return `${d.remaining} left`;
  }
  if (d.status === 'full') return 'Full';
  if (d.status === 'closed') return 'Closed';
  return 'Off';
}
