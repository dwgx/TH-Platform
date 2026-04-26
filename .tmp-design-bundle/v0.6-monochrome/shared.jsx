/* global React, UI, Lu */
// Shared shell + helpers — monochrome v0.6.

const { useState: useStateS } = React;
const { Avatar: AvatarS, Badge: BadgeS, Icon: IconS, icons: IconMap } = UI;

// ---------- ServerRail (Col 1 — 72px) ----------
function ServerRail({ active = 'th08', onPick }) {
  const games = [
    { id: 'th06', label: 'TH06' },
    { id: 'th07', label: 'TH07' },
    { id: 'th08', label: 'TH08' },
    { id: 'th09', label: 'TH09' },
  ];
  const [hover, setHover] = useStateS(null);

  const Tile = ({ id, children, title, isHome }) => {
    const isActive = active === id;
    const isHovered = hover === id;
    return (
      <div className="relative" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <span style={{
          position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: isActive ? 22 : isHovered ? 10 : 0,
          background: 'var(--accent)', borderRadius: 999,
          transition: 'height .18s ease',
        }} />
        <button
          title={title}
          onClick={() => onPick && onPick(id)}
          onMouseEnter={() => setHover(id)}
          onMouseLeave={() => setHover(null)}
          style={{
            width: 44, height: 44,
            borderRadius: isActive || isHovered ? 12 : 22,
            background: isActive ? 'var(--bg-3)' : 'var(--bg-2)',
            color: isActive ? 'var(--fg-0)' : 'var(--fg-1)',
            fontWeight: 600, fontSize: 11,
            fontFamily: 'var(--font-mono)', letterSpacing: '0.02em',
            border: `1px solid ${isActive ? 'var(--border-strong)' : 'var(--border)'}`,
            padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-radius .18s ease, background .15s, color .15s',
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
      {/* Wireframe T brand glyph */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <span style={{
          position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: active === 'home' ? 22 : 0,
          background: 'var(--accent)', borderRadius: 999,
        }} />
        <button title="TH-Home" onClick={() => onPick && onPick('home')} style={{
          width: 44, height: 44, borderRadius: active === 'home' ? 12 : 22,
          background: 'var(--bg-1)', color: 'var(--accent)',
          border: '1px solid var(--border-strong)',
          padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-radius .18s ease',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 6h14" />
            <path d="M12 6v13" />
          </svg>
        </button>
      </div>
      <div style={{ width: 26, height: 1, background: 'var(--border)', margin: '4px 0' }} />
      {games.map(g => (
        <Tile key={g.id} id={g.id} title={g.label}>{g.label.replace('TH','')}</Tile>
      ))}
      <button
        title="Add server"
        style={{
          width: 44, height: 44, borderRadius: 22,
          background: 'transparent', color: 'var(--fg-2)',
          border: '1px dashed var(--border-strong)', cursor: 'pointer',
          padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-radius .18s ease, color .18s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderRadius = '12px'; e.currentTarget.style.color = 'var(--fg-0)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderRadius = '22px'; e.currentTarget.style.color = 'var(--fg-2)'; }}
      ><Lu name="plus" size={16} /></button>
      <div style={{ flex: 1 }} />
      <RailIconBtn title="Discover"><Lu name="compass" size={18} /></RailIconBtn>
      <RailIconBtn title="Settings"><Lu name="settings" size={18} /></RailIconBtn>
    </div>
  );
}

function RailIconBtn({ children, title }) {
  return (
    <button title={title} style={{
      width: 44, height: 44, borderRadius: 22,
      background: 'transparent', color: 'var(--fg-2)',
      border: '1px solid var(--border)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'border-radius .18s ease, color .18s, background .15s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderRadius = '12px'; e.currentTarget.style.color = 'var(--fg-0)'; e.currentTarget.style.background = 'var(--hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderRadius = '22px'; e.currentTarget.style.color = 'var(--fg-2)'; e.currentTarget.style.background = 'transparent'; }}
    >{children}</button>
  );
}

// ---------- Row (flat list item) ----------
function Row({ children, active, onClick, leading, trailing, dense, style = {}, padded = true }) {
  const [hov, setHov] = useStateS(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: dense ? '4px 8px' : padded ? '6px 10px' : 0,
        borderRadius: 6,
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
      <span className="uppercase-tag" style={{ color: 'var(--fg-2)' }}>{children}</span>
      {right}
    </div>
  );
}

function Divider({ label, style = {} }) {
  if (!label) return <div style={{ height: 1, background: 'var(--border)', ...style }} />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...style }}>
      <span style={{ height: 1, background: 'var(--border)', flex: 1 }} />
      <span className="uppercase-tag" style={{ color: 'var(--fg-2)' }}>{label}</span>
      <span style={{ height: 1, background: 'var(--border)', flex: 1 }} />
    </div>
  );
}

// ---------- Tabs ----------
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
              fontSize: dense ? 12 : 12.5, fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              color: on ? 'var(--fg-0)' : 'var(--fg-2)',
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            {t.label}
            {t.count != null ? (
              <span className="mono" style={{
                fontSize: 10, color: 'var(--fg-2)',
                padding: '1px 5px',
                background: 'var(--bg-3)', borderRadius: 4,
              }}>{t.count}</span>
            ) : null}
            {t.dot ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-error)' }} /> : null}
            <span style={{
              position: 'absolute', bottom: -1, left: 0, right: 0,
              height: 2, background: on ? 'var(--accent)' : 'transparent',
              borderRadius: 2,
            }} />
          </button>
        );
      })}
    </div>
  );
}

// ---------- IdentityCard ----------
function IdentityCard({ name = '东方霖之助', handle = '@rinnosuke', uid = '100029481' }) {
  return (
    <div style={{
      padding: 10, margin: 10, marginTop: 4,
      borderRadius: 'var(--r-md)',
      background: 'var(--bg-2)',
      display: 'flex', alignItems: 'center', gap: 10,
      border: '1px solid var(--border)',
    }}>
      <AvatarS size={32} name={name} status="online" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="cjk" style={{
          fontSize: 12.5, fontWeight: 600, color: 'var(--fg-0)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>
          {handle} · UID {uid}
        </div>
      </div>
      <button title="Settings" style={{
        width: 26, height: 26, borderRadius: 6, border: 'none',
        background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Lu name="settings" size={14} /></button>
    </div>
  );
}

// ---------- ServerCardFlat (room-share embed) ----------
function ServerCardFlat({ title, host, region, ping, diff, mode, taken = 3, total = 6, vis = 'public', compact }) {
  const visMap = {
    public:  { label: '立即加入', variant: 'primary',   disabled: false, icon: null },
    ask:     { label: '请求加入', variant: 'secondary', disabled: false, icon: null },
    private: { label: '私密',     variant: 'secondary', disabled: true,  icon: <Lu name="lock" size={12} /> },
  };
  const v = visMap[vis];
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
        <span className="uppercase-tag" style={{ color: 'var(--accent)', padding: '2px 6px', border: '1px solid var(--border-strong)', borderRadius: 4 }}>TH08</span>
        <span className="cjk" style={{
          flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--fg-0)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{title}</span>
      </div>
      <div className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-2)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span><span style={{ color: 'var(--fg-1)' }}>房主</span> {host}</span>
        <span style={{ color: 'var(--fg-3)' }}>·</span>
        <span className="mono" style={{ color: 'var(--fg-1)' }}>{ping}ms</span>
        <span style={{ color: 'var(--fg-3)' }}>·</span>
        <span>{region}</span>
        <span style={{ color: 'var(--fg-3)' }}>·</span>
        <span>{diff}</span>
        {mode ? <><span style={{ color: 'var(--fg-3)' }}>·</span><span>{mode}</span></> : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {Array.from({ length: Math.min(taken, 4) }).map((_, i) => (
            <span key={i} style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--bg-2)',
              border: '2px solid var(--bg-1)',
              marginLeft: i === 0 ? 0 : -6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--fg-1)', fontSize: 9, fontWeight: 600,
            }}>{['幽','妖','咲','魔'][i]}</span>
          ))}
          <span className="mono" style={{ marginLeft: 6, fontSize: 11, color: 'var(--fg-2)', alignSelf: 'center' }}>{taken}/{total}</span>
        </div>
        <button
          disabled={v.disabled}
          style={{
            height: 28, paddingInline: 12,
            borderRadius: 'var(--r-md)',
            background: v.variant === 'primary' ? 'var(--accent)' : 'var(--bg-2)',
            color: v.variant === 'primary' ? 'var(--bg-0)' : 'var(--fg-1)',
            border: v.variant === 'primary' ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
            fontSize: 12, fontWeight: 600,
            cursor: v.disabled ? 'not-allowed' : 'pointer',
            opacity: v.disabled ? 0.6 : 1,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {v.icon}<span className="cjk">{v.label}</span>
        </button>
      </div>
    </div>
  );
}

// ---------- StatusDot ----------
function StatusDot({ status, size = 8 }) {
  const c = status === 'online' ? 'var(--status-online)'
    : status === 'away' || status === 'idle' ? 'var(--status-warn)'
    : status === 'dnd' ? 'var(--status-error)'
    : 'var(--fg-3)';
  return <span style={{ width: size, height: size, borderRadius: '50%', background: c, display: 'inline-block' }} />;
}

// ---------- ChannelRow ----------
function ChannelRow({ name, active, unread, mention, muted, onClick }) {
  return (
    <Row
      onClick={onClick}
      active={active}
      leading={<span style={{ color: muted ? 'var(--fg-3)' : 'var(--fg-2)', fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14, lineHeight: 1, width: 14, textAlign: 'center' }}>#</span>}
      trailing={
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          {mention ? (
            <span className="mono" style={{ minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: 'var(--status-error)', color: '#fff', fontSize: 10, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{mention}</span>
          ) : null}
          {unread && !mention ? <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--fg-0)' }} /> : null}
          {muted ? <Lu name="bell-off" size={12} color="var(--fg-3)" /> : null}
        </span>
      }
    >
      <span className="cjk" style={{
        fontSize: 12.5, fontWeight: unread ? 600 : 500,
        color: active ? 'var(--fg-0)' : muted ? 'var(--fg-3)' : unread ? 'var(--fg-0)' : 'var(--fg-1)',
      }}>{name}</span>
    </Row>
  );
}

// ---------- ChatMessage ----------
function ChatMessage({ msg, samegroup }) {
  if (samegroup) {
    return (
      <div style={{ display: 'flex', gap: 10, paddingLeft: 38 }}>
        <div className="cjk" style={{ fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.55, flex: 1 }}>
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
          <span className="cjk" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-0)' }}>{msg.who}</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{msg.t}</span>
        </div>
        <div className="cjk" style={{ fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.55, marginTop: 1, wordBreak: 'break-word' }}>
          {renderMsgBody(msg)}
        </div>
        {msg.reactions ? (
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {msg.reactions.map((r, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 22, padding: '0 8px', borderRadius: 999,
                background: r.mine ? 'var(--accent-soft)' : 'var(--bg-2)',
                border: `1px solid ${r.mine ? 'var(--accent-ring)' : 'var(--border)'}`,
                color: 'var(--fg-1)',
                fontSize: 11, fontWeight: 600,
                cursor: 'pointer',
              }}>
                <Lu name={r.icon || 'thumbs-up'} size={12} />
                <span className="mono">{r.count}</span>
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
        <span style={{ background: 'var(--accent-soft)', color: 'var(--fg-0)', padding: '1px 6px', borderRadius: 4, fontWeight: 600, border: '1px solid var(--border-strong)' }}>@{m.mention}</span>
        {post}
      </>
    );
  }
  return m.msg;
}

window.SHARED = {
  ServerRail, Row, SectionLabel, Divider, Tabs, IdentityCard,
  ServerCardFlat, StatusDot, ChannelRow, ChatMessage,
};
