import type { CoverId } from '@/types';
import { cn } from '@/lib/utils';

const meshClass: Record<CoverId, string> = {
  aurora: 'bg-mesh-1',
  midnight: 'bg-mesh-2',
  twilight: 'bg-mesh-4',
  dawn: 'bg-mesh-3',
  glacier: 'bg-mesh-5',
  amber: 'bg-mesh-6',
};

/**
 * Cinematic cover plate. Meant to read as game key art rather than
 * abstract gradient — multiple radial blobs + grain + dark scrim at bottom
 * for caption legibility, plus an animated mesh drift.
 */
export function RoomCover({
  id,
  className,
  showVignette = true,
  animated = true,
}: {
  id: CoverId;
  className?: string;
  showVignette?: boolean;
  animated?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        meshClass[id],
        className,
      )}
      aria-hidden="true"
    >
      {/* Living mesh — subtle drift, off by default in reduced-motion */}
      {animated && (
        <div
          className={cn(
            'absolute -inset-[10%]',
            meshClass[id],
            'animate-mesh-drift opacity-60 [filter:blur(40px)] motion-reduce:hidden',
          )}
        />
      )}
      {/* Grid lines — broadcast HUD detail */}
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:32px_32px]" />
      {/* Faint scanline */}
      <div className="absolute inset-0 opacity-[0.10] [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.4)_0px,transparent_2px,transparent_3px)]" />
      {/* Sweep highlight on hover (handled by parent group) */}
      <div className="pointer-events-none absolute inset-y-0 -inset-x-1/2 -translate-x-full bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.10)_50%,transparent_70%)] transition-transform duration-[1200ms] ease-out group-hover:translate-x-full" />
      {showVignette && (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(0,0,0,0.55)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_120%,rgba(0,0,0,0.4),transparent_60%)]" />
        </>
      )}
      {/* Top chrome edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    </div>
  );
}
