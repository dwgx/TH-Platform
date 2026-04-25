import { ChevronRight, Clock, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Cinematic featured strip — asymmetric 60/40 hero on the left,
 * "live now" telemetry plate on the right. Mesh art + grain + animated
 * sweep highlight.
 */
export function FeaturedBanner() {
  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-[1.7fr_1fr]">
      {/* ── Hero ── */}
      <div
        className={cn(
          'group relative overflow-hidden rounded-md min-h-[220px]',
          'bevel-edge border border-border',
          'bg-mesh-1',
        )}
      >
        {/* Animated mesh drift */}
        <div className="absolute -inset-[10%] bg-mesh-1 opacity-70 [filter:blur(50px)] animate-mesh-drift motion-reduce:hidden" />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px]" />
        {/* Diagonal sweep on hover */}
        <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -translate-x-full bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.10)_50%,transparent_70%)] transition-transform duration-[1400ms] ease-out group-hover:translate-x-[400%]" />
        {/* Bottom dark scrim */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(0,0,0,0.55)_100%)]" />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-end gap-3 p-6">
          {/* Eyebrow with live arc indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-arc opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-arc shadow-[0_0_8px_hsl(var(--arc)/0.9)]" />
            </span>
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-arc">
              Live · Featured Tonight
            </span>
          </div>

          <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]">
            深夜大乱斗 — 永夜抄
            <br />
            <span className="text-plasma">Lunatic Showdown</span>
          </h2>

          <p className="max-w-md text-[13px] leading-relaxed text-white/75">
            每周五 23:00 · 6 桌开放 · 前 3 名进周榜 · 直播解说 in #lobby-th08
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              className={cn(
                'group/cta relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-md px-5',
                'font-display text-[12px] font-bold uppercase tracking-[0.18em] text-white',
                'bg-gradient-to-b from-plasma to-plasma/80',
                'bevel-edge ring-1 ring-plasma/40',
                'transition-all duration-150 hover:from-plasma hover:to-plasma/95',
                'active:scale-[0.98]',
              )}
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/cta:translate-x-full" />
              <span className="relative">Join the table</span>
              <ChevronRight className="relative h-4 w-4" />
            </button>
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm transition-colors hover:bg-white/10">
              Details
            </button>
          </div>
        </div>

        {/* Decorative corner cut on the top-right */}
        <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-white/45">
          <span>EVT—2026.04.26</span>
          <span className="block h-px w-6 bg-white/30" />
          <span>S/N 4912</span>
        </div>
      </div>

      {/* ── Telemetry plate ── */}
      <div className="grid grid-rows-3 gap-3">
        <Telemetry
          icon={<Users className="h-4 w-4 text-arc" />}
          label="Players online"
          value="47"
          delta="+12 / 5m"
          tone="arc"
        />
        <Telemetry
          icon={<Trophy className="h-4 w-4 text-ember" />}
          label="Top host tonight"
          value="youmu"
          delta="14 wins"
          tone="ember"
        />
        <Telemetry
          icon={<Clock className="h-4 w-4 text-plasma" />}
          label="Next event"
          value="23:00 CST"
          delta="in 2h 14m"
          tone="plasma"
        />
      </div>
    </section>
  );
}

function Telemetry({
  icon,
  label,
  value,
  delta,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  tone: 'arc' | 'ember' | 'plasma';
}) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 overflow-hidden rounded-md p-3.5',
        'bg-plate bevel-edge border border-border',
        'transition-colors',
        tone === 'arc' && 'hover:border-arc/40',
        tone === 'ember' && 'hover:border-ember/40',
        tone === 'plasma' && 'hover:border-plasma/40',
      )}
    >
      {/* Side accent bar */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-[2px]',
          tone === 'arc' && 'bg-arc/60 shadow-[0_0_10px_hsl(var(--arc)/0.7)]',
          tone === 'ember' &&
            'bg-ember/60 shadow-[0_0_10px_hsl(var(--ember)/0.7)]',
          tone === 'plasma' &&
            'bg-plasma/60 shadow-[0_0_10px_hsl(var(--plasma)/0.7)]',
        )}
      />
      <div
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded',
          'bg-card-elev border border-border',
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </div>
        <div className="flex items-baseline gap-2">
          <div className="font-display text-[18px] font-bold leading-none">
            {value}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">
            {delta}
          </div>
        </div>
      </div>
    </div>
  );
}
