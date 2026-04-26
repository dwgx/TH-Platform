/* global React, UI, Lu */
const { Button, Avatar, Badge, Tag } = UI;

function ShowGroup({ title, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="uppercase-tag" style={{ color: 'var(--fg-2)' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

function Swatch({ name, css }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 88 }}>
      <div style={{ height: 48, borderRadius: 6, background: `var(${css})`, border: '1px solid var(--border)' }} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-0)' }}>{name}</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-2)' }}>{css}</div>
      </div>
    </div>
  );
}

function Showcase({ theme = 'dark' }) {
  return (
    <div className={`thp theme-${theme}`} style={{
      width: '100%', height: '100%', background: 'var(--bg-0)', color: 'var(--fg-0)',
      padding: 26, borderRadius: 'var(--r-lg)', display: 'flex', flexDirection: 'column', gap: 22, overflow: 'auto',
    }}>
      <div>
        <div className="uppercase-tag" style={{ color: 'var(--accent)' }}>TH-Platform · Base</div>
        <div className="cjk" style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, marginTop: 4, letterSpacing: '-0.015em' }}>组件原件 — {theme}</div>
        <div className="cjk" style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4 }}>单色系统 · 黑白灰 + 单一 accent · Manrope + 苹方</div>
      </div>

      <ShowGroup title="Button">
        <Button variant="primary" size="md"><Lu name="plus" size={12} /><span className="cjk" style={{ marginLeft: 6 }}>新建房间</span></Button>
        <Button variant="secondary" size="md"><span className="cjk">筛选</span></Button>
        <Button variant="ghost" size="md"><span className="cjk">取消</span></Button>
        <Button variant="primary" size="sm"><span className="cjk">小</span></Button>
        <Button variant="primary" size="lg"><span className="cjk">大</span></Button>
        <Button variant="secondary" size="md" disabled><span className="cjk">禁用</span></Button>
      </ShowGroup>

      <ShowGroup title="Avatar / Status">
        <Avatar size={36} name="幽幽子" status="online" />
        <Avatar size={36} name="魔理沙" status="idle" />
        <Avatar size={36} name="灵梦"   status="dnd" />
        <Avatar size={36} name="咲夜"   status="offline" />
        <Avatar size={28} name="妖梦"   status="online" />
        <Avatar size={22} name="爱丽丝" status="online" />
      </ShowGroup>

      <ShowGroup title="Tag / Badge">
        <Tag><span className="cjk">Lunatic</span></Tag>
        <Tag><span className="cjk">官方</span></Tag>
        <Tag><span className="mono">TH08</span></Tag>
        <Badge count={3} />
        <Badge count={47} />
        <span className="uppercase-tag" style={{ color: 'var(--accent)' }}>OFFICIAL</span>
      </ShowGroup>

      <ShowGroup title="Icon · Lucide line-art">
        {['users','message-square','search','bell','crown','volume-2','hash','cpu','lock','copy','settings','plus'].map(n => (
          <span key={n} style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg-1)', background: 'var(--bg-1)' }}><Lu name={n} size={14} /></span>
        ))}
      </ShowGroup>

      <ShowGroup title="Color · 单色 + 状态">
        <Swatch name="bg-0"    css="--bg-0" />
        <Swatch name="bg-1"    css="--bg-1" />
        <Swatch name="bg-2"    css="--bg-2" />
        <Swatch name="bg-3"    css="--bg-3" />
        <Swatch name="fg-0"    css="--fg-0" />
        <Swatch name="border"  css="--border" />
        <Swatch name="accent"  css="--accent" />
        <Swatch name="online"  css="--status-online" />
      </ShowGroup>
    </div>
  );
}

window.Showcase = Showcase;
