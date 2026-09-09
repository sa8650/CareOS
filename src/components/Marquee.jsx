import { useMemo } from 'react';

/**
 * Single-row infinite horizontal scroller ("scroll velocity" strip).
 *
 * props:
 *   items     string[]  – text items to scroll
 *   speed     number    – pixels per second (default 60: readable, not hectic)
 *   icon      node      – separator element between items
 *   className string
 */
export default function Marquee({ items = [], speed = 60, icon = '✦', className = '' }) {
  const list = items.filter(Boolean);

  // Repeat the list enough that one copy comfortably exceeds any viewport width,
  // then duplicate the whole track for a seamless -50% loop.
  const copy = useMemo(() => {
    if (!list.length) return [];
    const approxCharsPerScreen = 260;
    const chars = list.join('   ').length || 1;
    const reps = Math.max(2, Math.ceil(approxCharsPerScreen / chars) + 1);
    return Array.from({ length: reps }, () => list).flat();
  }, [list.join('|')]);

  if (!copy.length) return null;

  // Duration derived from content length so perceived speed stays constant.
  // ~9px per character at the strip's font size is a good estimate.
  const estimatedWidth = copy.reduce((w, t) => w + t.length * 9 + 84, 0);
  const duration = Math.max(20, Math.round(estimatedWidth / speed));

  return (
    <div className={`marquee ${className}`} aria-label={list.join(', ')} role="marquee">
      <div className="marquee-track" style={{ animationDuration: `${duration}s` }}>
        {[0, 1].map(dup => (
          <div className="marquee-group" key={dup} aria-hidden={dup === 1}>
            {copy.map((t, i) => (
              <span className="marquee-item" key={`${dup}-${i}`}>
                <span className="marquee-sep">{icon}</span>
                <span className="marquee-text">{t}</span>
              </span>
            ))}
          </div>
        ))}
      </div>

      <style>{`
        .marquee {
          position: relative; overflow: hidden; width: 100%;
          padding: 0.9rem 0;
          background: linear-gradient(90deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
          color: #e2e8f0;
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
                  mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
        }
        .marquee-track {
          display: flex; width: max-content;
          animation-name: marquee-scroll; animation-timing-function: linear; animation-iteration-count: infinite;
          will-change: transform;
        }
        .marquee:hover .marquee-track { animation-play-state: paused; }
        .marquee-group { display: flex; flex-shrink: 0; }
        .marquee-item { display: inline-flex; align-items: center; gap: 0.9rem; padding: 0 1.1rem; white-space: nowrap; font-size: 0.98rem; font-weight: 600; letter-spacing: 0.01em; }
        .marquee-sep { color: var(--color-primary); font-size: 0.8rem; opacity: 0.9; }
        .marquee-text { color: #f1f5f9; }
        @keyframes marquee-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (max-width: 768px) { .marquee { padding: 0.75rem 0; } .marquee-item { font-size: 0.9rem; padding: 0 0.85rem; } }
        @media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } .marquee { mask-image: none; -webkit-mask-image: none; } }
      `}</style>
    </div>
  );
}
