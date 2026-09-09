import { Link } from 'react-router-dom';
import { CalendarClock, Plus } from 'lucide-react';

import { BentoCard } from '@/components/ui/bento-grid';
import { cn } from '@/lib/utils';
import { formatDate, formatTimeRange } from '../../utils/helpers';

const STATE = {
  available: { label: 'Available', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  full: { label: 'Full', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  off: { label: 'Off', dot: 'bg-neutral-400', text: 'text-neutral-600', bg: 'bg-neutral-100' },
  closed: { label: 'Closed', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
};

const shortDate = (d) => {
  if (!d) return '';
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
};

/**
 * "Today's Schedule" — one row per active chamber, resolved by the central schedule engine
 * (default schedule + date overrides + live booked counts). No scheduling logic lives here.
 */
export default function DashboardScheduleCard({ date, chambers = [], className }) {
  return (
    <BentoCard
      name="Today's Schedule"
      description={date ? formatDate(date) : undefined}
      href="/admin/schedule"
      cta="Open schedule"
      className={cn('col-span-1', className)}
      background={
        <div className="px-4 pt-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
            <CalendarClock size={18} strokeWidth={2} />
          </span>
        </div>
      }
    >
      <div className="mt-3 pb-8">
        {chambers.length === 0 ? (
          <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-line p-4 text-sm text-neutral-500">
            No chambers configured
            <Link to="/admin/chambers" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
              <Plus size={14} /> Add Chamber
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-neutral-400">
                  <th className="pb-2 pr-3 font-medium">Chamber</th>
                  <th className="hidden pb-2 pr-3 font-medium lg:table-cell">Visiting hours</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="hidden pb-2 pr-3 font-medium text-right lg:table-cell">Booked</th>
                  <th className="pb-2 font-medium text-right">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {chambers.map((c) => {
                  const st = STATE[c.status] || STATE.off;
                  const open = c.status === 'available' || c.status === 'full';
                  return (
                    <tr key={c.id} className="border-t border-line/70">
                      <td className="py-2.5 pr-3">
                        <Link to={`/admin/schedule?chamber=${c.id}`} className="font-medium text-neutral-800 hover:text-brand">
                          {c.name}
                        </Link>
                        {open && (
                          <div className="text-xs text-neutral-400 lg:hidden">{formatTimeRange(c.start_time, c.end_time)} · {c.booked} / {c.limit} booked</div>
                        )}
                        {!open && c.next_date && (
                          <div className="text-xs text-neutral-400">Next sitting {shortDate(c.next_date)}</div>
                        )}
                        {c.is_override && <div className="text-xs text-amber-600">Override set for today</div>}
                      </td>
                      <td className="hidden py-2.5 pr-3 text-neutral-600 whitespace-nowrap lg:table-cell">
                        {open ? formatTimeRange(c.start_time, c.end_time) : '—'}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', st.bg, st.text)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                          {open && c.ended ? 'Ended' : st.label}
                        </span>
                      </td>
                      <td className="hidden py-2.5 pr-3 text-right tabular-nums text-neutral-700 lg:table-cell">
                        {open ? `${c.booked} / ${c.limit}` : '—'}
                      </td>
                      <td className="py-2.5 text-right tabular-nums font-medium text-neutral-800">
                        {open ? c.remaining : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </BentoCard>
  );
}
