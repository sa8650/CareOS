import { Link } from 'react-router-dom';
import { Building2, CalendarDays, Plus, Stethoscope, UserRound, Zap, ChevronRight } from 'lucide-react';

import { BentoCard } from '@/components/ui/bento-grid';
import { cn } from '@/lib/utils';

// Every action targets an existing CareOS route. `?new=1` asks the Chambers / Services pages
// to open their existing "Add" modal on arrival (see those pages) — no new functionality.
const ACTIONS = [
  { to: '/appointment', label: 'New Appointment', hint: 'Public booking form', Icon: Plus, external: true },
  { to: '/admin/schedule', label: 'Manage Schedule', hint: '30-day calendar & overrides', Icon: CalendarDays },
  { to: '/admin/chambers?new=1', label: 'Add Chamber', hint: 'Days, hours, daily limit', Icon: Building2 },
  { to: '/admin/services?new=1', label: 'Add Service', hint: 'Portfolio service page', Icon: Stethoscope },
  { to: '/admin/profile', label: 'Edit Doctor Profile', hint: 'Bio, photo, qualifications', Icon: UserRound },
];

export default function QuickActions({ className }) {
  return (
    <BentoCard
      name="Quick Actions"
      className={cn('col-span-1', className)}
      background={
        <div className="px-4 pt-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
            <Zap size={18} strokeWidth={2} />
          </span>
        </div>
      }
    >
      <ul className="mt-2 -mx-1 flex flex-col">
        {ACTIONS.map(({ to, label, hint, Icon, external }) => {
          const inner = (
            <>
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-white text-neutral-600 transition-colors group-hover/item:border-brand/40 group-hover/item:text-brand">
                <Icon size={15} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-neutral-800">{label}</span>
                <span className="block truncate text-xs text-neutral-400">{hint}</span>
              </span>
              <ChevronRight size={14} className="text-neutral-300 transition-transform group-hover/item:translate-x-0.5 group-hover/item:text-brand" />
            </>
          );
          const cls = 'group/item flex items-center gap-3 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';
          return (
            <li key={to}>
              {external
                ? <a href={to} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
                : <Link to={to} className={cls}>{inner}</Link>}
            </li>
          );
        })}
      </ul>
    </BentoCard>
  );
}
