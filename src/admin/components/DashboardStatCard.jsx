import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { BentoCard } from '@/components/ui/bento-grid';
import { cn } from '@/lib/utils';

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Counts from 0 to `value` once on mount (≈600 ms, eased). Skipped under reduced motion. */
function useCountUp(value, duration = 600) {
  const [n, setN] = useState(reducedMotion() ? value : 0);
  const raf = useRef(0);
  useEffect(() => {
    const target = Number(value) || 0;
    if (reducedMotion() || target === 0) { setN(target); return undefined; }
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  return n;
}

/**
 * Small numeric Bento card: label, animated number, unit, optional hint.
 * Whole card is clickable when `to` is given (keyboard accessible).
 */
export default function DashboardStatCard({ name, Icon, value, unit, hint, to, className }) {
  const navigate = useNavigate();
  const shown = useCountUp(value);
  const clickable = Boolean(to);

  return (
    <BentoCard
      name={name}
      className={cn(
        'col-span-1',
        clickable && 'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand/40 transition-shadow',
        className,
      )}
      role={clickable ? 'link' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `${name}: ${value}. Open` : undefined}
      onClick={clickable ? () => navigate(to) : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(to); } } : undefined}
      background={
        <div className="flex items-start justify-between px-4 pt-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
            {Icon && <Icon size={18} strokeWidth={2} />}
          </span>
          {clickable && (
            <ArrowRight className="h-4 w-4 text-neutral-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-brand" />
          )}
        </div>
      }
    >
      <div className="mt-1 flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-neutral-800 tabular-nums">{shown}</span>
          {unit && <span className="text-sm text-neutral-400">{unit}</span>}
        </div>
        {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
      </div>
    </BentoCard>
  );
}
