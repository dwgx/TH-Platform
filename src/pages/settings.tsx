import { useState } from 'react';
import {
  Bell,
  Languages,
  Link2,
  Lock,
  Monitor,
  Moon,
  Network,
  Palette,
  Shield,
  Sun,
  User,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useTheme, type Theme } from '@/lib/theme';
import { cn } from '@/lib/utils';

const sections = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'language', label: 'Language', icon: Languages },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'injector', label: 'Injector', icon: Wrench },
  { id: 'links', label: 'Linked accounts', icon: Link2 },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'privacy', label: 'Privacy', icon: Lock },
] as const;
type SectionId = (typeof sections)[number]['id'];

export function SettingsPage() {
  const [section, setSection] = useState<SectionId>('appearance');

  return (
    <div className="flex flex-1 bg-background">
      {/* Section nav */}
      <aside className="w-[200px] shrink-0 border-r bg-sidebar/40 p-3">
        <h2 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Settings
        </h2>
        <ul className="flex flex-col gap-px">
          {sections.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <li key={s.id}>
                <button
                  onClick={() => setSection(s.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-colors',
                    active
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[640px] px-8 py-8">
          {section === 'appearance' && <AppearanceSection />}
          {section === 'account' && <AccountSection />}
          {section === 'notifications' && (
            <Placeholder title="Notifications" />
          )}
          {section === 'language' && <LanguageSection />}
          {section === 'network' && <Placeholder title="Network" />}
          {section === 'injector' && <InjectorSection />}
          {section === 'links' && <Placeholder title="Linked accounts" />}
          {section === 'security' && <Placeholder title="Security" />}
          {section === 'privacy' && <Placeholder title="Privacy" />}
        </div>
      </main>
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const opts: { id: Theme; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];
  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-[20px] font-bold tracking-tight">Appearance</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Customise how TH-Platform looks. Theme preference syncs to local
          storage and respects the system setting on first launch.
        </p>
      </header>

      <Block title="Theme" hint="Pick a baseline. Custom palette landing soon.">
        <div className="grid grid-cols-3 gap-3">
          {opts.map((o) => {
            const Icon = o.icon;
            const active = theme === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setTheme(o.id)}
                className={cn(
                  'flex flex-col items-stretch gap-2 rounded-lg border bg-card p-2 text-left transition-all',
                  active
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'hover:border-primary/40',
                )}
              >
                <ThemePreview kind={o.id} />
                <div className="flex items-center gap-1.5 px-1 text-[12.5px] font-medium">
                  <Icon className="h-3.5 w-3.5" />
                  {o.label}
                </div>
              </button>
            );
          })}
        </div>
      </Block>

      <Separator />

      <Block title="Wallpaper" hint="Custom background image for the lobby. Coming soon.">
        <div className="grid h-32 place-items-center rounded-lg border border-dashed bg-card/30 text-[12px] text-muted-foreground">
          Wallpaper picker — coming in v0.2
        </div>
      </Block>

      <Separator />

      <Block title="Density" hint="Compact mode reduces row height and padding.">
        <Row label="Compact mode" hint="Reduces card padding and chat spacing">
          <Switch />
        </Row>
        <Row label="Reduce motion" hint="Disable animations and pulse effects">
          <Switch />
        </Row>
      </Block>
    </section>
  );
}

function ThemePreview({ kind }: { kind: Theme }) {
  const isDark =
    kind === 'dark' ||
    (kind === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  return (
    <div
      className={cn(
        'h-20 overflow-hidden rounded-md border',
        isDark ? 'bg-zinc-950' : 'bg-zinc-50',
      )}
    >
      <div
        className={cn(
          'flex h-3.5 items-center gap-1 px-1',
          isDark ? 'bg-zinc-900' : 'bg-zinc-100',
        )}
      >
        <span className="h-1 w-1 rounded-full bg-rose-400/70" />
        <span className="h-1 w-1 rounded-full bg-amber-400/70" />
        <span className="h-1 w-1 rounded-full bg-emerald-400/70" />
      </div>
      <div className="flex h-[calc(100%-14px)]">
        <div
          className={cn(
            'w-[28%] border-r',
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200',
          )}
        >
          <div className="m-1.5 h-1.5 w-3/4 rounded bg-primary/60" />
          <div className={cn('m-1.5 h-1.5 w-1/2 rounded', isDark ? 'bg-zinc-700' : 'bg-zinc-300')} />
          <div className={cn('m-1.5 h-1.5 w-2/3 rounded', isDark ? 'bg-zinc-700' : 'bg-zinc-300')} />
        </div>
        <div className="flex-1 p-1.5">
          <div className={cn('h-3 w-full rounded', isDark ? 'bg-zinc-800' : 'bg-zinc-200')} />
          <div className={cn('mt-1 h-2 w-2/3 rounded', isDark ? 'bg-zinc-800' : 'bg-zinc-200')} />
          <div className="mt-1.5 grid grid-cols-2 gap-1">
            <div className={cn('h-4 rounded', isDark ? 'bg-zinc-800' : 'bg-zinc-200')} />
            <div className={cn('h-4 rounded', isDark ? 'bg-zinc-800' : 'bg-zinc-200')} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountSection() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-[20px] font-bold tracking-tight">Account</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Public profile and identity.
        </p>
      </header>
      <Block title="Profile">
        <Row label="Display name">
          <Input defaultValue="dwgx" className="max-w-[260px]" />
        </Row>
        <Row label="Handle">
          <Input defaultValue="dwgx" className="max-w-[260px] font-mono" />
        </Row>
        <Row label="UID" hint="Permanent. Never changes.">
          <Input defaultValue="100029481" className="max-w-[260px] font-mono" readOnly />
        </Row>
      </Block>
    </section>
  );
}

function LanguageSection() {
  const langs = [
    { id: 'zh-CN', label: '简体中文', note: 'Default' },
    { id: 'zh-TW', label: '繁體中文', note: 'Coming soon' },
    { id: 'en', label: 'English', note: 'Coming soon' },
    { id: 'ja', label: '日本語', note: 'Coming soon' },
  ];
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-[20px] font-bold tracking-tight">Language</h1>
      </header>
      <Block>
        {langs.map((l, i) => (
          <Row
            key={l.id}
            label={l.label}
            hint={l.note}
            divider={i < langs.length - 1}
          >
            <Switch defaultChecked={l.id === 'zh-CN'} disabled={l.id !== 'zh-CN'} />
          </Row>
        ))}
      </Block>
    </section>
  );
}

function InjectorSection() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-[20px] font-bold tracking-tight">Injector</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Loader integration with the local TH08.exe.
        </p>
      </header>
      <Block>
        <Row label="TH08.exe path">
          <Input
            defaultValue="D:\\Steam\\steamapps\\common\\th08\\th08.exe"
            className="max-w-[360px] font-mono text-[11px]"
          />
        </Row>
        <Row label="DLL version">
          <span className="font-mono text-[12px]">v0.0.1 (alpha)</span>
        </Row>
        <Row label="Last injection">
          <span className="font-mono text-[11px] text-muted-foreground">
            2026-04-25 21:14:33
          </span>
        </Row>
        <div className="mt-3">
          <Button size="sm">Test injection</Button>
        </div>
      </Block>
    </section>
  );
}

function Block({
  title,
  hint,
  children,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {title && (
        <div>
          <h3 className="text-[14px] font-semibold">{title}</h3>
          {hint && (
            <p className="mt-0.5 text-[12px] text-muted-foreground">{hint}</p>
          )}
        </div>
      )}
      <div className="rounded-lg border bg-card p-4">{children}</div>
    </div>
  );
}

function Row({
  label,
  hint,
  divider = true,
  children,
}: {
  label: string;
  hint?: string;
  divider?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 py-2',
        divider && 'border-b last:border-b-0',
      )}
    >
      <div>
        <div className="text-[12.5px] font-medium">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-[20px] font-bold tracking-tight">{title}</h1>
      </header>
      <div className="rounded-lg border border-dashed bg-card/30 p-12 text-center text-[13px] text-muted-foreground">
        Coming in a later iteration.
      </div>
    </section>
  );
}
