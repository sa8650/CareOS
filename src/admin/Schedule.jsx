import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, Building2, RefreshCw, Clock, Users, RotateCcw, Save, Phone, CheckCircle, XCircle, Check, Trash2, Info } from 'lucide-react';
import {
  adminChambers, adminSchedule, adminScheduleDay, adminSaveOverride, adminResetOverride, adminPut, adminDelete,
} from '../api/api';
import { DAYS_SHORT, TIME_OPTIONS, formatTime, formatTimeRange, formatDate, formatDateLong, formatVisitingDays, statusColor, SCHEDULE_STATUS_LABEL } from '../utils/helpers';

const CAL_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Schedule() {
  const [params, setParams] = useSearchParams();
  const [chambers, setChambers] = useState([]);
  const [chamberId, setChamberId] = useState(params.get('chamber') || '');
  const [data, setData] = useState(null);       // { chamber, today, days, summary }
  const [loading, setLoading] = useState(true);
  const [calLoading, setCalLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalDate, setModalDate] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Load chamber list once
  useEffect(() => {
    adminChambers()
      .then(list => {
        setChambers(list);
        if (!chamberId && list.length > 0) setChamberId(String(list[0].id));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the dynamically generated 30-day calendar for the selected chamber
  const loadCalendar = useCallback(async (silent = false) => {
    if (!chamberId) { setData(null); return; }
    if (!silent) setCalLoading(true);
    setError('');
    try {
      setData(await adminSchedule(chamberId));
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setCalLoading(false);
    }
  }, [chamberId]);

  useEffect(() => {
    loadCalendar();
    if (chamberId) setParams({ chamber: chamberId }, { replace: true });
  }, [chamberId, loadCalendar, setParams]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const chamber = data?.chamber;
  const days = data?.days || [];
  const summary = data?.summary;

  // Align grid to the week (Sunday first) like schedule.html
  const leading = days.length ? days[0].day_of_week : 0;
  const cells = [...Array(leading).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="sch-header">
        <div>
          <h1 className="admin-page-title"><CalendarDays size={24} style={{ marginRight: '0.5rem' }} /> Schedule</h1>
          <p className="sch-subtitle">Next 30 days are generated automatically from the chamber's default schedule. Click a date to override just that day.</p>
        </div>
        <div className="sch-controls">
          <label className="sch-chamber-select">
            <Building2 size={16} />
            <select className="form-select" value={chamberId} onChange={e => setChamberId(e.target.value)}>
              {chambers.length === 0 && <option value="">No chambers configured</option>}
              {chambers.map(c => <option key={c.id} value={c.id}>{c.name}{c.is_active ? '' : ' (inactive)'}</option>)}
            </select>
          </label>
          <button className="btn btn-secondary" onClick={() => loadCalendar()} disabled={!chamberId || calLoading} title="Refresh">
            <RefreshCw size={16} className={calLoading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`} style={{ marginBottom: '1rem', display: 'inline-block' }}>{toast.message}</div>}
      {error && <div className="sch-error">{error}</div>}

      {chambers.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <Building2 size={48} style={{ color: 'var(--color-text-light)', marginBottom: '1rem' }} />
            <h3>No Chambers Yet</h3>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>
              Schedules are chamber-specific. Add a chamber with its visiting days first.
            </p>
            <Link to="/admin/chambers" className="btn btn-primary">Go to Chambers</Link>
          </div>
        </div>
      ) : chamber && (
        <>
          {/* Chamber default schedule strip */}
          <div className="sch-default card">
            <div className="card-body">
              <div className="sch-default-main">
                <div>
                  <div className="sch-default-label">Default schedule · {chamber.name}</div>
                  <div className="sch-default-days">
                    {DAYS_SHORT.map((d, i) => (
                      <span key={d} className={`day-pill ${chamber.visiting_days.includes(i) ? 'day-pill--on' : ''}`}>{d}</span>
                    ))}
                  </div>
                </div>
                <div className="sch-default-meta">
                  <span><Clock size={14} /> {formatTimeRange(chamber.start_time, chamber.end_time)}</span>
                  <span><Users size={14} /> {chamber.daily_limit} patients / day</span>
                  <Link to="/admin/chambers" className="sch-edit-link">Edit defaults</Link>
                </div>
              </div>
              {chamber.visiting_days.length === 0 && (
                <div className="sch-warn"><Info size={14} /> This chamber has no visiting days, so every date resolves to <strong>Off</strong>. Set visiting days in Chambers, or open individual dates below.</div>
              )}
              {!chamber.is_active && (
                <div className="sch-warn"><Info size={14} /> This chamber is inactive: patients cannot see or book it.</div>
              )}
            </div>
          </div>

          {/* Stats */}
          {summary && (
            <div className="sch-stats">
              <Stat dot="#22c55e" num={summary.available} label="Available days" />
              <Stat dot="#f59e0b" num={summary.full} label="Full days" />
              <Stat dot="#94a3b8" num={summary.off} label="Off days" />
              <Stat dot="#ef4444" num={summary.closed} label="Closed days" />
              <Stat icon={<Users size={18} />} num={`${summary.booked} / ${summary.capacity}`} label="Booked / capacity" />
              <Stat icon={<RotateCcw size={18} />} num={summary.overrides} label="Date overrides" />
            </div>
          )}

          {/* Calendar */}
          <div className={`cal-wrapper ${calLoading ? 'cal-wrapper--loading' : ''}`}>
            <div className="cal-header">
              <div className="cal-title"><CalendarDays size={18} /> <strong>Next 30 Days</strong> <span>{formatDate(days[0]?.date)} → {formatDate(days[days.length - 1]?.date)}</span></div>
              <div className="cal-tz">Today: {data.today}</div>
            </div>
            <div className="cal-grid">
              {CAL_LABELS.map(l => <div key={l} className="cal-label">{l}</div>)}
              {cells.map((d, i) => d ? (
                <button type="button" key={d.date}
                  className={`cal-cell cal-cell--${d.status} ${d.is_today ? 'cal-cell--today' : ''} ${d.is_override ? 'cal-cell--override' : ''}`}
                  onClick={() => setModalDate(d.date)}>
                  <div className="cal-cell-head">
                    <span className="cal-num">{Number(d.date.slice(8, 10))}</span>
                    {d.is_override && <span className="cal-override-dot" title="Date-specific override" />}
                  </div>
                  <span className="cal-weekday">{monthShort(d.date)}</span>
                  <span className={`cal-badge cal-badge--${d.status}`}>
                    <span className="cal-badge-long">{SCHEDULE_STATUS_LABEL[d.status]}</span>
                    <span className="cal-badge-short">{d.status === 'available' ? 'Open' : SCHEDULE_STATUS_LABEL[d.status]}</span>
                  </span>
                  <div className="cal-count">
                    {d.status === 'off' ? <span className="cal-muted">—</span> : (
                      <>
                        <span><strong>{d.booked}</strong> / {d.limit}</span>
                        {d.status === 'available' && <span className="cal-remaining">{d.remaining} left</span>}
                      </>
                    )}
                  </div>
                </button>
              ) : <div key={`e${i}`} className="cal-cell cal-cell--empty" />)}
            </div>
            <div className="cal-legend">
              <span><i style={{ background: '#22c55e' }} /> Available</span>
              <span><i style={{ background: '#f59e0b' }} /> Full</span>
              <span><i style={{ background: '#94a3b8' }} /> Off</span>
              <span><i style={{ background: '#ef4444' }} /> Closed</span>
              <span><i className="legend-ring" /> Override</span>
              <span className="cal-legend-hint">Click a day to manage</span>
            </div>
          </div>
        </>
      )}

      {modalDate && chamber && (
        <DayModal
          chamber={chamber}
          date={modalDate}
          onClose={() => setModalDate(null)}
          onChanged={() => loadCalendar(true)}
          notify={notify}
        />
      )}

      <style>{`
        .admin-page-title { font-size: 1.75rem; display: flex; align-items: center; }
        .sch-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
        .sch-subtitle { color: var(--color-text-light); margin-top: 0.25rem; font-size: 0.9rem; max-width: 640px; }
        .sch-controls { display: flex; gap: 0.5rem; align-items: center; }
        .sch-chamber-select { display: flex; align-items: center; gap: 0.5rem; background: white; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0 0 0 0.75rem; }
        .sch-chamber-select svg { color: var(--color-primary); }
        .sch-chamber-select .form-select { border: none; min-width: 240px; font-weight: 600; }
        .sch-chamber-select .form-select:focus { box-shadow: none; }
        .sch-error { background: #fee2e2; color: #991b1b; padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-bottom: 1rem; }
        .spin { animation: spin 0.8s linear infinite; }

        .sch-default { margin-bottom: 1rem; }
        .sch-default .card-body { padding: 1rem 1.25rem; }
        .sch-default-main { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .sch-default-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; color: var(--color-text-light); margin-bottom: 0.5rem; }
        .sch-default-days { display: flex; gap: 0.3rem; }
        .day-pill { min-width: 40px; text-align: center; font-size: 0.65rem; font-weight: 700; padding: 0.3rem 0.4rem; border-radius: 6px; background: var(--color-bg-alt); color: #94a3b8; text-transform: uppercase; }
        .day-pill--on { background: #dcfce7; color: #15803d; }
        .sch-default-meta { display: flex; gap: 1.25rem; align-items: center; font-size: 0.9rem; color: var(--color-text); flex-wrap: wrap; }
        .sch-default-meta span { display: flex; align-items: center; gap: 0.4rem; }
        .sch-default-meta svg { color: var(--color-primary); }
        .sch-edit-link { font-size: 0.85rem; font-weight: 600; color: var(--color-primary); }
        .sch-warn { margin-top: 0.75rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; background: #fffbeb; color: #92400e; border: 1px solid #fde68a; padding: 0.5rem 0.75rem; border-radius: var(--radius-md); }

        .sch-stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.75rem; margin-bottom: 1rem; }
        @media (max-width: 1100px) { .sch-stats { grid-template-columns: repeat(3, 1fr); } }
        .stat { background: white; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 0.85rem 1rem; display: flex; align-items: center; gap: 0.75rem; }
        .stat-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
        .stat-icon { color: var(--color-primary); display: flex; }
        .stat-num { font-size: 1.4rem; font-weight: 800; line-height: 1.1; }
        .stat-label { font-size: 0.75rem; color: var(--color-text-light); font-weight: 500; }

        .cal-wrapper { background: white; border: 1px solid var(--color-border); border-radius: var(--radius-xl); overflow: hidden; transition: opacity 0.2s; }
        .cal-wrapper--loading { opacity: 0.5; pointer-events: none; }
        .cal-header { display: flex; justify-content: space-between; align-items: center; padding: 0.9rem 1.25rem; background: var(--color-bg-alt); border-bottom: 1px solid var(--color-border); flex-wrap: wrap; gap: 0.5rem; }
        .cal-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; flex-wrap: wrap; }
        .cal-title strong { white-space: nowrap; }
        .cal-title span { color: var(--color-text-light); font-weight: 400; font-size: 0.85rem; }
        .cal-tz { font-size: 0.8rem; color: var(--color-text-light); }
        .cal-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 1px; background: var(--color-border); padding: 1px; }
        .cal-label { background: var(--color-bg-alt); text-align: center; padding: 0.5rem 0.25rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-light); }
        .cal-cell { background: white; min-height: 104px; padding: 0.6rem 0.55rem; text-align: left; display: flex; flex-direction: column; transition: background 0.15s; position: relative; min-width: 0; overflow: hidden; }
        .cal-cell:hover { background: #f5f8fc; }
        .cal-cell--empty { background: #fafbfc; cursor: default; }
        .cal-cell--today { box-shadow: inset 0 0 0 2px var(--color-primary); background: #f0f7fe; }
        .cal-cell-head { display: flex; justify-content: space-between; align-items: flex-start; }
        .cal-num { font-size: 1.15rem; font-weight: 800; line-height: 1.1; }
        .cal-weekday { font-size: 0.65rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; height: 0.9rem; }
        .cal-override-dot { width: 8px; height: 8px; border-radius: 50%; border: 2px solid var(--color-secondary); background: white; margin-top: 3px; }
        .cal-badge { margin-top: 0.35rem; font-size: 0.66rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px; align-self: flex-start; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cal-badge-short { display: none; }
        .cal-badge--available { background: #dcfce7; color: #15803d; }
        .cal-badge--full { background: #fef3c7; color: #b45309; }
        .cal-badge--off { background: #f1f5f9; color: #64748b; }
        .cal-badge--closed { background: #fee2e2; color: #b91c1c; }
        .cal-cell--off { background: #fcfcfd; }
        .cal-cell--off .cal-num { color: #94a3b8; }
        .cal-count { margin-top: auto; padding-top: 0.4rem; border-top: 1px solid #f1f5f9; font-size: 0.72rem; color: var(--color-text-light); display: flex; justify-content: space-between; align-items: center; }
        .cal-count strong { color: var(--color-text); }
        .cal-remaining { color: #15803d; font-weight: 600; }
        .cal-muted { color: #cbd5e1; }
        .cal-legend { display: flex; flex-wrap: wrap; gap: 1rem; padding: 0.75rem 1.25rem; background: var(--color-bg-alt); border-top: 1px solid var(--color-border); font-size: 0.8rem; color: var(--color-text-light); }
        .cal-legend span { display: flex; align-items: center; gap: 0.4rem; }
        .cal-legend i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
        .cal-legend .legend-ring { border: 2px solid var(--color-secondary); background: white; border-radius: 50%; }
        .cal-legend-hint { margin-left: auto; }

        @media (max-width: 768px) {
          .cal-cell { min-height: 78px; padding: 0.35rem 0.3rem; }
          .cal-num { font-size: 0.95rem; }
          .cal-badge { font-size: 0.52rem; padding: 0.1rem 0.2rem; letter-spacing: 0; }
          .cal-cell { padding: 0.35rem 0.2rem; }
          .cal-cell--override .cal-override-dot { position: absolute; top: 4px; right: 4px; }
          .cal-badge-long { display: none; } .cal-badge-short { display: inline; }
          .cal-count { font-size: 0.6rem; }
          .cal-remaining { display: none; }
          .cal-weekday { display: none; }
          .sch-chamber-select .form-select { min-width: 180px; }
          .stat { padding: 0.6rem 0.7rem; gap: 0.5rem; }
          .stat-num { font-size: 1.05rem; white-space: nowrap; }
          .stat-label { font-size: 0.65rem; }
        }
      `}</style>
    </div>
  );
}

function monthShort(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' });
}

function Stat({ dot, icon, num, label }) {
  return (
    <div className="stat">
      {dot ? <span className="stat-dot" style={{ background: dot }} /> : <span className="stat-icon">{icon}</span>}
      <div>
        <div className="stat-num">{num}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day Schedule Management Modal
// ---------------------------------------------------------------------------
function DayModal({ chamber, date, onClose, onChanged, notify }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ status: '', start_time: '', end_time: '', appointment_limit: '', note: '' });
  const [tab, setTab] = useState('schedule'); // schedule | appointments

  const load = useCallback(async () => {
    try {
      const d = await adminScheduleDay(chamber.id, date);
      setDetail(d);
      setForm({
        status: d.override?.status || '',
        start_time: d.override?.start_time || '',
        end_time: d.override?.end_time || '',
        appointment_limit: d.override?.appointment_limit ?? '',
        note: d.override?.note || '',
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [chamber.id, date]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const day = detail?.day;
  const isPast = day?.is_past;
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Effective (preview) values = override field or chamber default
  const effStart = form.start_time || chamber.start_time;
  const effEnd = form.end_time || chamber.end_time;
  const effLimit = form.appointment_limit === '' ? chamber.daily_limit : Number(form.appointment_limit);

  const save = async () => {
    setError('');
    if (effStart >= effEnd) return setError('End time must be after start time');
    setSaving(true);
    try {
      const res = await adminSaveOverride({
        chamber_id: chamber.id, date,
        status: form.status || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        appointment_limit: form.appointment_limit === '' ? null : Number(form.appointment_limit),
        note: form.note || null,
      });
      setDetail(res);
      setForm({
        status: res.override?.status || '',
        start_time: res.override?.start_time || '',
        end_time: res.override?.end_time || '',
        appointment_limit: res.override?.appointment_limit ?? '',
        note: res.override?.note || '',
      });
      notify(res.warnings?.length ? res.warnings[0] : `Saved · ${date} only`, res.warnings?.length ? 'warning' : 'success');
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!detail?.override) return;
    if (!confirm('Remove the override for this date and return to the chamber default schedule?')) return;
    setSaving(true);
    try {
      const res = await adminResetOverride(chamber.id, date);
      setDetail(res);
      setForm({ status: '', start_time: '', end_time: '', appointment_limit: '', note: '' });
      notify('Override removed – using chamber default');
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const quickStatus = (s) => update('status', form.status === s ? '' : s);

  const setApptStatus = async (a, status) => {
    if (['cancelled', 'rejected'].includes(status) && !confirm(`${status === 'cancelled' ? 'Cancel' : 'Reject'} appointment #${a.serial_number} (${a.patient_name})?`)) return;
    try {
      await adminPut(`/appointments/${a.id}`, { status });
      await load();
      onChanged();
    } catch (e) { alert(e.message); }
  };

  const deleteAppt = async (a) => {
    if (!confirm(`Permanently delete appointment #${a.serial_number} (${a.patient_name})? This frees the slot.`)) return;
    try {
      await adminDelete(`/appointments/${a.id}`);
      await load();
      onChanged();
    } catch (e) { alert(e.message); }
  };

  const active = (detail?.appointments || []).filter(a => !['cancelled', 'rejected'].includes(a.status));
  const inactive = (detail?.appointments || []).filter(a => ['cancelled', 'rejected'].includes(a.status));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal day-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header day-modal-header">
          <div>
            <h3>{formatDateLong(date)}</h3>
            <div className="day-modal-sub">{chamber.name} · Default: {formatVisitingDays(chamber.visiting_days)}, {formatTimeRange(chamber.start_time, chamber.end_time)}, {chamber.daily_limit}/day</div>
          </div>
          <button onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <>
            <div className="modal-body" style={{ paddingTop: '1rem' }}>
              {/* current resolved state */}
              <div className="day-state">
                <span className={`cal-badge cal-badge--${day.status}`} style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>{SCHEDULE_STATUS_LABEL[day.status]}</span>
                <span className="day-state-meta"><Users size={14} /> {day.booked} / {day.limit} booked{day.status !== 'off' && day.status !== 'closed' ? ` · ${day.remaining} remaining` : ''}</span>
                <span className="day-state-meta"><Clock size={14} /> {formatTimeRange(day.start_time, day.end_time)}</span>
                {day.is_override ? <span className="tag tag-override">Override</span> : <span className="tag">Chamber default</span>}
                {isPast && <span className="tag">Past</span>}
              </div>

              <div className="day-tabs">
                <button className={tab === 'schedule' ? 'active' : ''} onClick={() => setTab('schedule')}>Day schedule</button>
                <button className={tab === 'appointments' ? 'active' : ''} onClick={() => setTab('appointments')}>Appointments ({active.length})</button>
              </div>

              {error && <div className="form-alert">{error}</div>}

              {tab === 'schedule' && (
                <div className={isPast ? 'day-form day-form--disabled' : 'day-form'}>
                  <div className="form-group">
                    <label className="form-label">Status for this date</label>
                    <div className="status-btns">
                      <button type="button" className={`status-btn status-btn--default ${form.status === '' ? 'active' : ''}`} onClick={() => update('status', '')}>
                        Default <small>({SCHEDULE_STATUS_LABEL[day.base_status]})</small>
                      </button>
                      <button type="button" className={`status-btn status-btn--available ${form.status === 'available' ? 'active' : ''}`} onClick={() => quickStatus('available')}>Available</button>
                      <button type="button" className={`status-btn status-btn--closed ${form.status === 'closed' ? 'active' : ''}`} onClick={() => quickStatus('closed')}>Closed</button>
                      <button type="button" className={`status-btn status-btn--off ${form.status === 'off' ? 'active' : ''}`} onClick={() => quickStatus('off')}>Off</button>
                    </div>
                    <small className="form-help">
                      <strong>Closed</strong> = normally a visiting day but booking is temporarily disabled. <strong>Off</strong> = not a visiting day. <strong>Full</strong> is calculated automatically from bookings.
                    </small>
                  </div>

                  <div className="form-row-3">
                    <div className="form-group">
                      <label className="form-label">Start time</label>
                      <select className="form-select" value={form.start_time} onChange={e => update('start_time', e.target.value)}>
                        <option value="">Default ({formatTime(chamber.start_time)})</option>
                        {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">End time</label>
                      <select className="form-select" value={form.end_time} onChange={e => update('end_time', e.target.value)}>
                        <option value="">Default ({formatTime(chamber.end_time)})</option>
                        {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Appointment limit</label>
                      <input type="number" className="form-input" min={0} max={500} value={form.appointment_limit}
                        placeholder={`Default (${chamber.daily_limit})`}
                        onChange={e => update('appointment_limit', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Note (optional, admin only)</label>
                    <input type="text" className="form-input" value={form.note} onChange={e => update('note', e.target.value)} placeholder="e.g., Doctor attending conference" />
                  </div>

                  <div className="day-preview">
                    <Info size={14} />
                    <span>
                      After saving, <strong>{date}</strong> will be <strong>{form.status ? SCHEDULE_STATUS_LABEL[form.status] : `${SCHEDULE_STATUS_LABEL[day.base_status]} (default)`}</strong>
                      {' '}· {formatTimeRange(effStart, effEnd)} · limit {effLimit}. Other dates are not affected.
                    </span>
                  </div>
                </div>
              )}

              {tab === 'appointments' && (
                <div className="day-appts">
                  {active.length === 0 && inactive.length === 0 ? (
                    <p className="day-empty">No appointments booked for this date.</p>
                  ) : (
                    <>
                      {active.map(a => <ApptRow key={a.id} a={a} onStatus={setApptStatus} onDelete={deleteAppt} />)}
                      {inactive.length > 0 && (
                        <details className="day-inactive">
                          <summary>{inactive.length} cancelled / rejected</summary>
                          {inactive.map(a => <ApptRow key={a.id} a={a} onStatus={setApptStatus} onDelete={deleteAppt} muted />)}
                        </details>
                      )}
                    </>
                  )}
                  <Link to={`/admin/appointments?chamber_id=${chamber.id}&date=${date}`} className="sch-edit-link" style={{ display: 'inline-block', marginTop: '0.75rem' }}>
                    Open in Appointments →
                  </Link>
                </div>
              )}
            </div>

            {tab === 'schedule' && (
              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <div>
                  {detail?.override && !isPast && (
                    <button className="btn btn-sm btn-secondary" onClick={reset} disabled={saving}><RotateCcw size={14} /> Reset to default</button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={onClose}>Close</button>
                  {!isPast && (
                    <button className="btn btn-primary" onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save for this date'}</button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <style>{`
          .day-modal { max-width: 640px; }
          .day-modal-header { align-items: flex-start; }
          .day-modal-header h3 { font-size: 1.15rem; }
          .day-modal-sub { font-size: 0.8rem; color: var(--color-text-light); margin-top: 0.2rem; }
          .day-state { display: flex; flex-wrap: wrap; gap: 0.6rem 1rem; align-items: center; margin-bottom: 1rem; font-size: 0.85rem; color: var(--color-text-light); }
          .day-state-meta { display: flex; align-items: center; gap: 0.35rem; }
          .tag { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.15rem 0.5rem; border-radius: 4px; background: var(--color-bg-alt); color: var(--color-text-light); }
          .tag-override { background: #ede9fe; color: #6d28d9; }
          .day-tabs { display: flex; gap: 0.25rem; border-bottom: 1px solid var(--color-border); margin-bottom: 1rem; }
          .day-tabs button { padding: 0.5rem 0.9rem; font-size: 0.875rem; font-weight: 600; color: var(--color-text-light); border-bottom: 2px solid transparent; margin-bottom: -1px; }
          .day-tabs button.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
          .form-alert { background: #fee2e2; color: #991b1b; padding: 0.6rem 0.9rem; border-radius: var(--radius-md); margin-bottom: 1rem; font-size: 0.875rem; }
          .form-help { display: block; margin-top: 0.4rem; font-size: 0.78rem; color: var(--color-text-light); line-height: 1.5; }
          .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }
          .day-form--disabled { opacity: 0.6; pointer-events: none; }
          .status-btns { display: flex; gap: 0.4rem; flex-wrap: wrap; }
          .status-btn { padding: 0.45rem 0.9rem; border-radius: 999px; font-size: 0.82rem; font-weight: 600; border: 2px solid var(--color-border); background: white; color: var(--color-text-light); transition: all 0.15s; }
          .status-btn small { font-weight: 500; opacity: 0.8; }
          .status-btn--default.active { border-color: var(--color-primary); background: var(--color-primary-light); color: var(--color-primary-dark); }
          .status-btn--available.active { border-color: #22c55e; background: #dcfce7; color: #15803d; }
          .status-btn--closed.active { border-color: #ef4444; background: #fee2e2; color: #b91c1c; }
          .status-btn--off.active { border-color: #94a3b8; background: #f1f5f9; color: #475569; }
          .day-preview { display: flex; gap: 0.5rem; align-items: flex-start; font-size: 0.82rem; color: #1e40af; background: #eff6ff; border: 1px solid #bfdbfe; padding: 0.6rem 0.8rem; border-radius: var(--radius-md); line-height: 1.5; }
          .day-preview svg { flex-shrink: 0; margin-top: 3px; }
          .day-empty { color: var(--color-text-light); font-style: italic; font-size: 0.9rem; text-align: center; padding: 1.5rem 0; }
          .appt-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem; background: var(--color-bg-alt); border-radius: var(--radius-md); margin-bottom: 0.4rem; font-size: 0.85rem; }
          .appt-row--muted { opacity: 0.6; }
          .appt-serial { width: 34px; height: 34px; border-radius: 8px; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; flex-shrink: 0; }
          .appt-row--muted .appt-serial { background: #94a3b8; }
          .appt-info { flex: 1; min-width: 0; }
          .appt-name { font-weight: 600; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
          .appt-detail { font-size: 0.75rem; color: var(--color-text-light); display: flex; gap: 0.75rem; flex-wrap: wrap; }
          .appt-detail span { display: flex; align-items: center; gap: 0.25rem; }
          .appt-actions { display: flex; gap: 0.25rem; flex-shrink: 0; }
          .appt-actions button { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid var(--color-border); color: var(--color-text-light); }
          .appt-actions button:hover { border-color: currentColor; }
          .appt-actions .ok:hover { color: #15803d; } .appt-actions .no:hover { color: #b91c1c; } .appt-actions .done:hover { color: var(--color-primary); }
          .day-inactive { margin-top: 0.75rem; }
          .day-inactive summary { font-size: 0.8rem; color: var(--color-text-light); cursor: pointer; margin-bottom: 0.4rem; }
          @media (max-width: 640px) { .form-row-3 { grid-template-columns: 1fr; } }
        `}</style>
      </div>
    </div>
  );
}

function ApptRow({ a, onStatus, onDelete, muted }) {
  return (
    <div className={`appt-row ${muted ? 'appt-row--muted' : ''}`}>
      <div className="appt-serial">{a.serial_number ?? '–'}</div>
      <div className="appt-info">
        <div className="appt-name">{a.patient_name} <span className={`badge ${statusColor(a.status)}`}>{a.status}</span></div>
        <div className="appt-detail">
          <span><Phone size={11} /> {a.patient_phone}</span>
          <span>{a.reference}</span>
          {a.message && <span title={a.message}>“{a.message.slice(0, 40)}{a.message.length > 40 ? '…' : ''}”</span>}
        </div>
      </div>
      <div className="appt-actions">
        {a.status === 'pending' && <button className="ok" title="Confirm" onClick={() => onStatus(a, 'confirmed')}><CheckCircle size={14} /></button>}
        {a.status === 'confirmed' && <button className="done" title="Mark completed" onClick={() => onStatus(a, 'completed')}><Check size={14} /></button>}
        {(a.status === 'pending' || a.status === 'confirmed') && <button className="no" title="Cancel" onClick={() => onStatus(a, 'cancelled')}><XCircle size={14} /></button>}
        <button className="no" title="Delete" onClick={() => onDelete(a)}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}
