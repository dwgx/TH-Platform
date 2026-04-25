export function StatusBar() {
  return (
    <footer className="relative flex h-7 items-center gap-3 border-t bg-sidebar/95 px-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/8 to-transparent" />
      <span className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-success opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
        </span>
        Online · CN-East · 24ms
      </span>
      <Divider />
      <span>DLL v0.0.1</span>
      <Divider />
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-arc shadow-[0_0_4px_hsl(var(--arc)/0.7)]" />
        TH08.exe Detected
      </span>
      <span className="flex-1" />
      <span className="text-muted-foreground/70">
        Build alpha · 2026.04.26
      </span>
    </footer>
  );
}

function Divider() {
  return <span aria-hidden className="h-3 w-px bg-border" />;
}
