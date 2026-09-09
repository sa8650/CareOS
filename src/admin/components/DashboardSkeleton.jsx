import { BentoGrid } from '@/components/ui/bento-grid';
import { cn } from '@/lib/utils';

const Bar = ({ className }) => <div className={cn('animate-pulse rounded-md bg-neutral-200/80', className)} />;

function SkeletonCard({ className, rows = 0 }) {
  return (
    <div className={cn('flex flex-col overflow-hidden rounded-xl bg-background p-4 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]', className)} aria-hidden="true">
      <Bar className="h-9 w-9 rounded-lg" />
      <Bar className="mt-4 h-4 w-2/5" />
      {rows === 0 ? (
        <Bar className="mt-6 h-10 w-1/3" />
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {Array.from({ length: rows }).map((_, i) => <Bar key={i} className="h-4 w-full" />)}
        </div>
      )}
    </div>
  );
}

/** Same grid shape as the real dashboard so nothing jumps when data arrives. */
export default function DashboardSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading dashboard">
      <BentoGrid className="grid-cols-1 md:grid-cols-2 xl:grid-cols-3 md:grid-flow-dense auto-rows-[minmax(12rem,auto)]">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard className="md:col-span-2 xl:row-span-2" rows={4} />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard className="md:col-span-2 xl:row-span-2" rows={5} />
        <SkeletonCard className="xl:row-span-2" rows={5} />
      </BentoGrid>
    </div>
  );
}
