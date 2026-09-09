import { Link } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';

import { BentoCard } from '@/components/ui/bento-grid';
import { cn } from '@/lib/utils';
import { formatTime, statusColor } from '../../utils/helpers';

const shortDate = (d) => {
  if (!d) return '';
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

/**
 * Compact table of the next appointments (today onwards, serial order).
 * CareOS books by serial number, so the "time" column shows the chamber's visiting-hours start
 * plus the serial — not an invented per-patient slot.
 */
export default function UpcomingAppointments({ today, items = [], total = 0, className }) {
  const more = Math.max(0, total - items.length);
  return (
    <BentoCard
      name="Upcoming Appointments"
      description={total ? `${total} booked from today onwards` : undefined}
      href="/admin/appointments"
      cta="View all appointments"
      className={cn('col-span-1', className)}
      background={
        <div className="px-4 pt-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
            <CalendarCheck size={18} strokeWidth={2} />
          </span>
        </div>
      }
    >
      <div className="mt-3 pb-8">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line p-4 text-sm text-neutral-500">No upcoming appointments</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-neutral-400">
                  <th className="pb-2 pr-3 font-medium">Time</th>
                  <th className="pb-2 pr-3 font-medium">Patient</th>
                  <th className="hidden pb-2 pr-3 font-medium lg:table-cell">Chamber</th>
                  <th className="pb-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-t border-line/70">
                    <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums text-neutral-700">
                      <span className="font-medium text-neutral-800">{a.start_time ? formatTime(a.start_time) : '—'}</span>
                      <span className="block text-xs text-neutral-400 lg:ml-1.5 lg:inline">
                        {a.appointment_date === today ? 'Today' : shortDate(a.appointment_date)} · #{a.serial_number ?? '–'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Link to={`/admin/appointments?search=${encodeURIComponent(a.reference || '')}`} className="font-medium text-neutral-800 hover:text-brand">
                        {a.patient_name}
                      </Link>
                      <div className="text-xs text-neutral-400 lg:hidden">{a.chamber_name || '—'}</div>
                    </td>
                    <td className="hidden py-2.5 pr-3 text-neutral-600 lg:table-cell">{a.chamber_name || '—'}</td>
                    <td className="py-2.5 text-right">
                      <span className={`badge ${statusColor(a.status)}`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {more > 0 && <p className="mt-2 text-xs text-neutral-400">+{more} more</p>}
          </div>
        )}
      </div>
    </BentoCard>
  );
}
