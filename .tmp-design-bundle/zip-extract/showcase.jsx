/* global React, UI */
const { Button, Avatar, Badge, Card, Input, Icon } = UI;

function Swatch({ name, value, fg }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 96 }}>
      <div style={{
        height: 56, borderRadius: 12, background: value,
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
      }} />
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fg-0)' }}>{name}</div>
        <div style={{ fontSize: 10.5, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>{fg}</div>
      </div>
    </div>
  );
}

function Group({ title, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

function Showcase({ theme = 'dark' }) {
  return (
    <div className={`thp theme-${theme}`} style={{
      width: '100%', height: '100%',
      background: 'var(--bg-0)', color: 'var(--fg-0)',
      padding: 28, borderRadius: 'var(--r-lg)',
      display: 'flex', flexDirection: 'column', gap: 22,
      overflow: 'auto',
    }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TH-Platform · Base</div>
        <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800, marginTop: 4, letterSpacing: '-0.015em' }}>Component primitives</div>
        <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 4 }}>Manrope · soft, rounded, no metallic — {theme} theme</div>
      </div>

      <Group title="Button">
        <Button variant="primary" icon={Icon.plus}>New room</Button>
        <Button variant="secondary">Filter</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="soft">Join room</Button>
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" size="lg">Large</Button>
      </Group>

      <Group title="Avatar">
        <Avatar size={40} name="幽" status="online" />
        <Avatar size={40} name="魔" status="away" />
        <Avatar size={40} name="灵" status="dnd" />
        <Avatar size={40} name="咲" />
        <Avatar size={40} name="霖" status="online" ring={2} ringColor="var(--brand-ring)" />
      </Group>

      <Group title="Badge">
        <Badge tone="brand" dot>Official</Badge>
        <Badge tone="warning" dot>Personal</Badge>
        <Badge tone="success">Online</Badge>
        <Badge tone="danger">Full</Badge>
        <Badge tone="neutral">Lunatic</Badge>
      </Group>

      <Group title="Input">
        <div style={{ width: 280 }}>
          <Input leading={Icon.search} placeholder="Search rooms…" kbd="⌘K" />
        </div>
        <div style={{ width: 220 }}>
          <Input placeholder="Room name…" />
        </div>
      </Group>

      <Group title="Card">
        <Card style={{ width: 260 }} hover>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar size={36} name="幽" status="online" />
            <div>
              <div className="cjk" style={{ fontSize: 14, fontWeight: 700 }}>永夜抄 PvP</div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>TH08 · 24ms</div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--fg-1)', lineHeight: 1.55 }} className="cjk">
            房主 幽幽子 · 三人在场，欢迎随时入桌。
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
            <Badge tone="brand">Lunatic</Badge>
            <Badge tone="neutral">3 lives</Badge>
          </div>
        </Card>
      </Group>

      <Group title="Color">
        <Swatch name="bg-0" value="var(--bg-0)" fg={theme === 'dark' ? '#15161B' : '#FBFAFC'} />
        <Swatch name="bg-1" value="var(--bg-1)" fg={theme === 'dark' ? '#1B1D24' : '#FFFFFF'} />
        <Swatch name="bg-2" value="var(--bg-2)" fg={theme === 'dark' ? '#21232C' : '#F4F5F9'} />
        <Swatch name="brand" value="var(--brand)" fg={theme === 'dark' ? '#7C5CFF' : '#6E51E0'} />
        <Swatch name="success" value="var(--success)" fg="#4ADE80" />
        <Swatch name="warning" value="var(--warning)" fg="#F5B544" />
      </Group>
    </div>
  );
}

window.Showcase = Showcase;
