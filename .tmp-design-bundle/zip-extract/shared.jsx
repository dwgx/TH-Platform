/* global React, UI */
// Shared shell + helpers for Room / Group / DM / Profile / Settings.
// Reuses tokens.css + ui.jsx. NO gradients on list rows.

const { useState: useStateS } = React;
const { Avatar: AvatarS, Badge: BadgeS, Icon: IconS } = UI;

// ---------- ServerRail (Col 1 — 72px) ----------
// Same shape as lobby's Col1Rail but parameterised: which entry is active,
// and an "home"-style topmost icon for DM page.
function ServerRail({ active = 'th08', onPick, homeMode = false }) {
  const games = [
    { id: 'th06', label: 'TH06', solid: '#B85A8E' },
    { id: 'th07', label: 'TH07', solid: '#5BB69F' },
    { id: 'th08', label: 'TH08', solid: '#7C5CFF' },
    { id: 'th09', label: 'TH09', solid: '#E0934A' },
  ];
  const [hover, setHover] = useStateS(null);
  const Tile = ({ id, children, title, color, isHome }) => {
    const isActive = active === id;
    const isHovered = hover === id;
    return (
      <div className="relative flex justify-center">
        <span style={{
          position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
          width: 4, height: isActive ? 28 : isHovered ? 12 : 0,
          background: 'var(--fg-0)', borderRadius: 999,
          transition: 'height .18s ease',
        }} />
        <button
          title={title}
          onClick={() => onPick && onPick(id)}
          onMouseEnter={() => setHover(id)}
          onMouseLeave={() => setHover(null)}
          style={{
            width: 48, height: 48,
            borderRadius: isActive || isHovered ? 14 : 24,
            background: isHome ? 'linear-gradient(135deg, var(--brand) 0%, #4FD1C5 100%)' : color,
            color: '#fff', fontWeight: 800, fontSize: 13,
            fontFamily: 'var(--font-display)', letterSpacing: '0.02em',
            border: 'none', padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-radius .18s ease',
          }}
        >{children}</button>
      </div>
    );
  };

  return (
    <div style={{
      width: 72, background: 'var(--bg-0)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '14px 0', gap: 10, flexShrink: 0,
    }}>
      <Tile id="home" title="TH-Home · Friends & DMs" isHome>
        <span style={{ fontSize: 17, letterSpacing: '-0.02em' }}>TH</span>
      </Tile>
      <div style={{ width: 32, height: 1, background: 'var(--border)', margin: '4px 0' }} />
      {games.map(g => (
        <Tile key={g.id} id={g.id} title={g.label} color={g.solid}>{g.label}</Tile>
      ))}
      <button
        title="Add server"
        style={{
          width: 48, height: 48, borderRadius: 24,
          background: 'var(--bg-2)', color: 'var(--success)',
          border: '1px solid var(--border)', cursor: 'pointer',
          fontSize: 22, fontWeight: 300, padding: 0,
          transition: 'border-radius .18s ease, color .18s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderRadius = '14px'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderRadius = '24px'; }}
      >+</button>
      <div style={{ flex: 1 }} />
      <RailIconBtn title="Discover">{IconS.compass}</RailIconBtn>
      <RailIconBtn title="Settings">{IconS.cog}</RailIconBtn>
    </div>
  );
}

function RailIconBtn({ children, title }) {
  return (
    <button title={title} style={{
      width: 48, height: 48, borderRadius: 24,
      background: 'var(--bg-2)', color: 'var(--fg-1)',
      border: '1px solid var(--border)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'border-radius .18s ease, color .18s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderRadius = '14px'; e.currentTarget.style.color = 'var(--brand)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderRadius = '24px'; e.currentTarget.style.color = 'var(--fg-1)'; }}
    >{children}</button>
  );
}

// ---------- Row (flat, hover-only list item — used everywhere) ----------
function Row({ children, active, onClick, leading, trailing, dense, style = {}, padded = true }) {
  const [hov, setHov] = useStateS(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: dense ? '5px 8px' : padded ? '7px 10px' : 0,
        borderRadius: 8,
        background: active ? 'var(--active)' : hov ? 'var(--hover)' : 'transparent',
        color: active ? 'var(--fg-0)' : 'var(--fg-1)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background .12s, color .12s',
        ...style,
      }}
    >
      {leading}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {trailing}
    </div>
  );
}

// ---------- SectionLabel ----------
function SectionLabel({ children, right, style = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', ...style }}>
      <span style={{
        fontSize: 10.5, fontWeight: 700, color: 'var(--fg-2)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>{children}</span>
      {right}
    </div>
  );
}

// ---------- Divider ----------
function Divider({ label, style = {} }) {
  if (!label) return <div style={{ height: 1, background: 'var(--border)', ...style }} />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...style }}>
      <span style={{ height: 1, background: 'var(--border)', flex: 1 }} />
      <span style={{ fontSize: 11, color: 'var(--fg-2)', fontWeight: 600 }}>{label}</span>
      <span style={{ height: 1, background: 'var(--border)', flex: 1 }} />
    </div>
  );
}

// ---------- Tab strip (underline-style) ----------
function Tabs({ tabs, active, onChange, dense, style = {} }) {
  return (
    <div style={{
      display: 'flex', gap: dense ? 4 : 14,
      borderBottom: '1px solid var(--border)',
      ...style,
    }}>
      {tabs.map(t => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange && onChange(t.id)}
            style={{
              position: 'relative', padding: dense ? '6px 10px' : '10px 6px',
              border: 'none', background: 'transparent',
              fontSize: dense ? 12.5 : 13, fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              color: on ? 'var(--fg-0)' : 'var(--fg-2)',
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            {t.label}
            {t.count != null ? (
              <span style={{
                fontSize: 10.5, fontFamily: 'var(--font-mono)',
                color: 'var(--fg-2)', padding: '1px 5px',
                background: 'var(--bg-3)', borderRadius: 5,
              }}>{t.count}</span>
            ) : null}
            {t.dot ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }} /> : null}
            <span style={{
              position: 'absolute', bottom: -1, left: 0, right: 0,
              height: 2, background: on ? 'var(--brand)' : 'transparent',
              borderRadius: 2,
            }} />
          </button>
        );
      })}
    </div>
  );
}

// ---------- IdentityCard (bottom of any sidebar) ----------
function IdentityCard({ name = '东方霖之助', handle = '@rinnosuke', uid = '100029481' }) {
  return (
    <div style={{
      padding: 10, margin: 10, marginTop: 4,
      borderRadius: 'var(--r-md)',
      background: 'var(--bg-2)',
      display: 'flex', alignItems: 'center', gap: 10,
      border: '1px solid var(--border)',
    }}>
      <AvatarS size={34} name={name} status="online" ring={2} ringColor="var(--brand-ring)" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="cjk" style={{
          fontSize: 13, fontWeight: 700, color: 'var(--fg-0)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</div>
        <div style={{ fontSize: 10.5, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>
          {handle} · UID {uid}
        </div>
      </div>
      <button title="Settings" style={{
        width: 28, height: 28, borderRadius: 8, border: 'none',
        background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{IconS.cog}</button>
    </div>
  );
}

// ---------- ServerCardFlat (room-share embed used in chat & activity) ----------
function ServerCardFlat({ title, host, region, ping, diff, mode, taken = 3, total = 6, vis = 'public', compact }) {
  const dotColor = ping < 40 ? 'var(--success)' : ping < 70 ? 'var(--warning)' : 'var(--danger)';
  const pingColor = dotColor;
  const visMap = {
    public:  { label: '立即加入', variant: 'primary',   disabled: false, icon: null },
    ask:     { label: '请求加入', variant: 'secondary', disabled: false, icon: null },
    private: { label: '私密',     variant: 'secondary', disabled: true,  icon: IconS.lock },
  };
  const v = visMap[vis];
  const palette = ['#7C5CFF', '#4FD1C5', '#F5B544', '#4ADE80'];
  return (
    <div style={{
      width: compact ? 320 : 380,
      background: 'var(--bg-1)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--r-md)',
      padding: 12,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BadgeS tone="brand" dot>TH08</BadgeS>
        <span className="cjk" style={{
          flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--fg-0)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{title}</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--fg-2)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span><span className="cjk" style={{ color: 'var(--fg-1)', fontWeight: 600 }}>房主</span> {host}</span>
        <span style={{ color: 'var(--fg-3)' }}>·</span>
        <span style={{ color: pingColor, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{ping}ms</span>
        <span style={{ color: 'var(--fg-3)' }}>·</span>
        <span>{region}</span>
        <span style={{ color: 'var(--fg-3)' }}>·</span>
        <span>{diff}</span>
        {mode ? <><span style={{ color: 'var(--fg-3)' }}>·</span><span>{mode}</span></> : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex' }}>
          {Array.from({ length: Math.min(taken, 4) }).map((_, i) => (
            <span key={i} style={{
              width: 22, height: 22, borderRadius: '50%',
              background: palette[i % palette.length],
              border: '2px solid var(--bg-1)',
              marginLeft: i === 0 ? 0 : -6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 9, fontWeight: 700,
            }} />
          ))}
          <span style={{
            marginLeft: 6, fontSize: 11, color: 'var(--fg-2)',
            fontFamily: 'var(--font-mono)', alignSelf: 'center',
          }}>{taken}/{total}</span>
        </div>
        <button
          disabled={v.disabled}
          style={{
            height: 30, paddingInline: 14,
            borderRadius: 'var(--r-md)',
            background: v.variant === 'primary' ? 'var(--brand)' : 'var(--bg-2)',
            color: v.variant === 'primary' ? '#fff' : 'var(--fg-1)',
            border: v.variant === 'primary' ? 'none' : '1px solid var(--border-strong)',
            fontSize: 12.5, fontWeight: 600,
            cursor: v.disabled ? 'not-allowed' : 'pointer',
            opacity: v.disabled ? 0.6 : 1,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}
        >
          {v.icon}{v.label}
        </button>
      </div>
    </div>
  );
}

// ---------- Status dot ----------
function StatusDot({ status, size = 8 }) {
  const c = status === 'online' ? 'var(--success)' : status === 'away' || status === 'idle' ? 'var(--warning)' : status === 'dnd' ? 'var(--danger)' : 'var(--fg-3)';
  return <span style={{ width: size, height: size, borderRadius: '50%', background: c, display: 'inline-block' }} />;
}

// ---------- ChannelRow (#name, mute/unread states) ----------
function ChannelRow({ name, active, unread, mention, muted, onClick }) {
  return (
    <Row
      onClick={onClick}
      active={active}
      leading={<span style={{ color: muted ? 'var(--fg-3)' : 'var(--fg-2)', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16, lineHeight: 1, width: 14, textAlign: 'center' }}>#</span>}
      trailing={
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          {mention ? (
            <span style={{ minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: 'var(--danger)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{mention}</span>
          ) : null}
          {unread && !mention ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--fg-0)' }} /> : null}
          {muted ? <span style={{ color: 'var(--fg-3)', fontSize: 11 }}>🔕</span> : null}
        </span>
      }
    >
      <span className="cjk" style={{
        fontSize: 13, fontWeight: unread ? 600 : 500,
        color: active ? 'var(--fg-0)' : muted ? 'var(--fg-3)' : unread ? 'var(--fg-0)' : 'var(--fg-1)',
      }}>{name}</span>
    </Row>
  );
}

// ---------- ChatMessage (shared message renderer) ----------
function ChatMessage({ msg, prevSender, samegroup }) {
  // samegroup = consecutive from same sender within 7m → no avatar repeat
  if (samegroup) {
    return (
      <div style={{ display: 'flex', gap: 10, paddingLeft: 38 }}>
        <div className="cjk" style={{ fontSize: 13.5, color: 'var(--fg-1)', lineHeight: 1.55, flex: 1 }}>
          {renderMsgBody(msg)}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <AvatarS size={28} name={msg.who} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="cjk" style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-0)' }}>{msg.who}</span>
          <span style={{ fontSize: 10.5, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{msg.t}</span>
        </div>
        <div className="cjk" style={{ fontSize: 13.5, color: 'var(--fg-1)', lineHeight: 1.55, marginTop: 1, wordBreak: 'break-word' }}>
          {renderMsgBody(msg)}
        </div>
        {msg.reactions ? (
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {msg.reactions.map((r, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                height: 22, padding: '0 7px', borderRadius: 999,
                background: r.mine ? 'var(--brand-soft)' : 'var(--bg-2)',
                border: `1px solid ${r.mine ? 'var(--brand-ring)' : 'var(--border)'}`,
                color: r.mine ? 'var(--brand)' : 'var(--fg-1)',
                fontSize: 11.5, fontWeight: 600,
                cursor: 'pointer',
              }}>
                <span>{r.emoji}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{r.count}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function renderMsgBody(m) {
  if (m.mention) {
    const pre = m.msg.split(`@${m.mention}`)[0];
    const post = m.msg.split(`@${m.mention}`)[1] || '';
    return (
      <>
        {pre}
        <span style={{ background: 'var(--brand-soft)', color: 'var(--brand)', padding: '1px 6px', borderRadius: 6, fontWeight: 600 }}>@{m.mention}</span>
        {post}
      </>
    );
  }
  return m.msg;
}

// Expose
window.SHARED = {
  ServerRail, Row, SectionLabel, Divider, Tabs, IdentityCard,
  ServerCardFlat, StatusDot, ChannelRow, ChatMessage,
};
