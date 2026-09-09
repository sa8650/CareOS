import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CalendarCheck, CalendarDays, Clock, RefreshCw, Stethoscope } from 'lucide-react';

import { BentoGrid } from '@/components/ui/bento-grid';
import { adminGet } from '../api/api';
import { formatDate } from '../utils/helpers';
import DashboardStatCard from './components/DashboardStatCard';
import DashboardScheduleCard from './components/DashboardScheduleCard';
import UpcomingAppointments from './components/UpcomingAppointments';
import QuickActions from './components/QuickActions';
import DashboardSkeleton from './components/DashboardSkeleton';

/*
  Admin dashboard — Magic UI Bento Grid over real CareOS data.
  One request (GET /api/admin/stats) feeds every card; no polling, no duplicate calls.

  Desktop (3 columns):
    Total | Today | Upcoming
    Today's Schedule (2 wide, 2 tall) | Chambers
                                      | Services
    Upcoming Appointments (2 wide, 2 tall) | Quick Actions (2 tall)
  Tablet: 2 columns (wide cards stay wide). Phone: single column, natural stacking.
*/

// 1 column on phones, 2 on tablets / narrow laptops (the fixed sidebar eats 260px), 3 from xl.
// Rows are minmax(12rem, auto) so a wide card grows with its table instead of clipping; on xl
// the wide cards span two rows so they sit beside a pair of stat cards. Dense flow only matters
// in the 2-column layout: it lets single cards fill the slot before a wide card (no empty holes).
const GRID = 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 md:grid-flow-dense auto-rows-[minmax(12rem,auto)]';
const WIDE = 'md:col-span-2 xl:row-span-2';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return adminGet('/stats')
      .then(setStats)
      .catch((e) => setError(e.message || 'Unable to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = stats?.date;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          {today && <p className="text-sm text-neutral-500 mt-1">{formatDate(today)}</p>}
        </div>
        <div className="flex gap-2">
          <Link to="/admin/appointments?status=pending" className="btn btn-secondary btn-sm">
            <Clock size={15} /> Pending{stats?.pending ? ` (${stats.pending})` : ''}
          </Link>
          <Link to="/admin/schedule" className="btn btn-primary btn-sm"><CalendarDays size={15} /> Schedule</Link>
        </div>
      </div>

      {loading && <DashboardSkeleton />}

      {!loading && error && (
        <div role="alert" className="rounded-xl border border-line bg-white p-8 text-center [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05)]">
          <p className="font-medium text-neutral-800">Unable to load dashboard data.</p>
          <p className="mt-1 text-sm text-neutral-500">{error}</p>
          <button type="button" onClick={load} className="btn btn-primary btn-sm mt-4"><RefreshCw size={14} /> Retry</button>
        </div>
      )}

      {!loading && !error && stats && (
        <BentoGrid className={GRID}>
          <DashboardStatCard name="Total Appointments" Icon={CalendarDays} value={stats.total} unit="appointments"
            hint={`${stats.completed} completed · ${stats.pending} pending`} to="/admin/appointments" />
          <DashboardStatCard name="Today's Appointments" Icon={CalendarCheck} value={stats.today} unit="today"
            hint={today ? formatDate(today) : undefined} to={today ? `/admin/appointments?date=${today}` : '/admin/appointments'} />
          <DashboardStatCard name="Upcoming Appointments" Icon={Clock} value={stats.upcoming} unit="upcoming"
            hint="From today onwards" to="/admin/appointments" />

          <DashboardScheduleCard date={today} chambers={stats.schedule_today || []} className={WIDE} />
          <DashboardStatCard name="Chambers" Icon={Building2} value={stats.chambers} unit="active"
            hint={stats.chambers === 0 ? 'No chambers configured' : `${stats.chambers_total} configured`} to="/admin/chambers" />
          <DashboardStatCard name="Services" Icon={Stethoscope} value={stats.services} unit="active"
            hint={stats.services_total === 0 ? 'No services configured' : `${stats.services_total} in total`} to="/admin/services" />

          <UpcomingAppointments today={today} items={stats.upcoming_list || []} total={stats.upcoming} className={WIDE} />
          <QuickActions className="xl:row-span-2" />
        </BentoGrid>
      )}
    </div>
  );
}
