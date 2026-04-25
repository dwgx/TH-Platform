import type { CoverId } from '@/types';
import { cn } from '@/lib/utils';

const baseGradient: Record<CoverId, string> = {
  aurora: 'bg-[linear-gradient(135deg,#1A1F38_0%,#2C2B5A_50%,#181938_100%)]',
  midnight: 'bg-[linear-gradient(135deg,#0E1730_0%,#1A1F38_50%,#0F1424_100%)]',
  twilight: 'bg-[linear-gradient(135deg,#1F1A2C_0%,#3A2440_50%,#1A1424_100%)]',
  dawn: 'bg-[linear-gradient(135deg,#3A2E22_0%,#5A453A_50%,#382C20_100%)]',
  glacier: 'bg-[linear-gradient(135deg,#142533_0%,#1F394D_50%,#142028_100%)]',
  amber: 'bg-[linear-gradient(135deg,#2E2618_0%,#4A3D1F_50%,#2A2218_100%)]',
};

const glowGradient: Record<CoverId, string> = {
  aurora:
    'bg-[radial-gradient(ellipse_60%_70%_at_75%_25%,rgba(133,151,247,0.42),transparent_60%)]',
  midnight:
    'bg-[radial-gradient(ellipse_50%_60%_at_50%_55%,rgba(74,107,255,0.36),transparent_55%)]',
  twilight:
    'bg-[radial-gradient(ellipse_60%_70%_at_80%_30%,rgba(177,127,255,0.34),transparent_60%)]',
  dawn: 'bg-[radial-gradient(ellipse_60%_70%_at_75%_25%,rgba(255,184,124,0.32),transparent_60%)]',
  glacier:
    'bg-[radial-gradient(ellipse_60%_70%_at_80%_35%,rgba(91,207,234,0.32),transparent_60%)]',
  amber:
    'bg-[radial-gradient(ellipse_60%_70%_at_80%_20%,rgba(245,194,110,0.30),transparent_60%)]',
};

const accentDots: Record<CoverId, string> = {
  aurora:
    'bg-[radial-gradient(circle_at_18%_75%,rgba(255,255,255,0.10)_0px,transparent_2px),radial-gradient(circle_at_45%_60%,rgba(255,255,255,0.06)_0px,transparent_1.5px)]',
  midnight:
    'bg-[radial-gradient(circle_at_22%_28%,rgba(255,255,255,0.18)_0px,transparent_1.5px),radial-gradient(circle_at_38%_75%,rgba(255,255,255,0.10)_0px,transparent_1.5px),radial-gradient(circle_at_72%_82%,rgba(255,255,255,0.07)_0px,transparent_1px)]',
  twilight:
    'bg-[radial-gradient(circle_at_24%_70%,rgba(255,255,255,0.07)_0px,transparent_2px)]',
  dawn: 'bg-[radial-gradient(circle_at_30%_65%,rgba(255,210,160,0.20)_0px,transparent_2.5px)]',
  glacier:
    'bg-[radial-gradient(circle_at_25%_72%,rgba(180,224,236,0.12)_0px,transparent_1.5px),radial-gradient(circle_at_55%_55%,rgba(180,224,236,0.07)_0px,transparent_1.5px)]',
  amber:
    'bg-[radial-gradient(circle_at_28%_70%,rgba(245,200,120,0.14)_0px,transparent_2px)]',
};

export function RoomCover({
  id,
  className,
  showVignette = true,
}: {
  id: CoverId;
  className?: string;
  showVignette?: boolean;
}) {
  return (
    <div
      className={cn('relative overflow-hidden', baseGradient[id], className)}
      aria-hidden="true"
    >
      <div className={cn('absolute inset-0', glowGradient[id])} />
      <div className={cn('absolute inset-0', accentDots[id])} />
      {showVignette && (
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(0,0,0,0.40)_100%)]" />
      )}
    </div>
  );
}
