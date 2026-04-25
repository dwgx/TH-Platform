export function StatusBar() {
  return (
    <footer className="flex h-6 items-center gap-3 border-t bg-sidebar px-3.5 font-mono text-[10.5px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Connected · CN-East · 24ms
      </span>
      <Divider />
      <span>DLL v0.0.1</span>
      <Divider />
      <span>TH08.exe detected</span>
      <span className="flex-1" />
      <span>Build alpha · 2026-04-26</span>
    </footer>
  );
}

function Divider() {
  return <span aria-hidden className="h-3 w-px bg-border" />;
}
