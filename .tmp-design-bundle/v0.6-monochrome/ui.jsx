/* global React, Lu */
// Base UI primitives — monochrome v0.6.
// Flat surfaces, hairline borders, near-invisible shadows.
// Avatars are monograms (no per-character tinting).

const { useState: useStateU } = React;

// ---------- Icon (Lucide passthrough; back-compat .Icon[name] map) ----------
function Icon(props) { return Lu(props); }
const ICONS = {
  // back-compat keys still referenced by older pages
  search:   <Lu name="search"      size={14} />,
  chevron:  <Lu name="chevron-down" size={14} />,
  plus:     <Lu name="plus"        size={14} />,
  cog:      <Lu name="settings"    size={14} />,
  smile:    <Lu name="smile"       size={14} />,
  send:     <Lu name="send-horizontal" size={14} />,
  lock:     <Lu name="lock"        size={12} />,
  crown:    <Lu name="crown"       size={12} />,
  compass:  <Lu name="compass"     size={18} />,
  bolt:     <Lu name="zap"         size={14} />,
  bell:     <Lu name="bell"        size={14} />,
  bellOff:  <Lu name="bell-off"    size={14} />,
  copy:     <Lu name="copy"        size={12} />,
  pin:      <Lu name="pin"         size={14} />,
  megaphone:<Lu name="megaphone"   size={14} />,
  users:    <Lu name="users"       size={14} />,
  message:  <Lu name="message-square" size={14} />,
  dices:    <Lu name="dices"       size={14} />,
  check:    <Lu name="check"       size={14} />,
  sun:      <Lu name="sun"         size={14} />,
  moon:     <Lu name="moon"        size={14} />,
  monitor:  <Lu name="monitor"     size={14} />,
  more:     <Lu name="more-horizontal" size={16} />,
  expand:   <Lu name="maximize-2"  size={14} />,
  thumbsUp: <Lu name="thumbs-up"   size={14} />,
  heart:    <Lu name="heart"       size={14} />,
  x:        <Lu name="x"           size={14} />,
  arrowLeft:<Lu name="arrow-left"  size={14} />,
};

// ---------- Button ----------
function Button({ variant = 'primary', size = 'md', icon, children, onClick, className = '', style = {}, disabled, ...rest }) {
  const sizes = {
    sm: { h: 26, px: 10, fs: 12, gap: 6 },
    md: { h: 32, px: 12, fs: 12.5, gap: 7 },
    lg: { h: 38, px: 16, fs: 13, gap: 8 },
  };
  const s = sizes[size];
  const variants = {
    primary: {
      background: 'var(--accent)',
      color: 'var(--bg-0)',
      border: '1px solid var(--accent)',
    },
    secondary: {
      background: 'var(--bg-2)',
      color: 'var(--fg-0)',
      border: '1px solid var(--border-strong)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--fg-1)',
      border: '1px solid transparent',
    },
    soft: {
      background: 'var(--accent-soft)',
      color: 'var(--fg-0)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'transparent',
      color: 'var(--status-error)',
      border: '1px solid var(--border-strong)',
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        height: s.h, paddingInline: s.px, fontSize: s.fs, gap: s.gap,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontFamily: 'var(--font-sans)',
        borderRadius: 'var(--r-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap', opacity: disabled ? 0.55 : 1,
        transition: 'background .12s, border-color .12s, opacity .12s',
        ...variants[variant], ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

// ---------- Avatar (monogram disc) ----------
function Avatar({ size = 32, name = '', status, ring, ringColor = 'var(--accent-ring)' }) {
  // Take first CJK char or first 2 latin chars for monogram
  const ch = (name || '').trim();
  const monogram = ch ? (/[\u4e00-\u9fff]/.test(ch[0]) ? ch[0] : ch.slice(0, 2).toUpperCase()) : '?';
  const fontSize = Math.round(size * 0.42);
  const dotSize = Math.max(8, Math.round(size * 0.28));
  const statusColor = status === 'online' ? 'var(--status-online)'
    : status === 'idle' || status === 'away' ? 'var(--status-warn)'
    : status === 'dnd' ? 'var(--status-error)'
    : 'var(--fg-3)';
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size, flexShrink: 0 }}>
      <span style={{
        width: size, height: size, borderRadius: '50%',
        background: 'var(--bg-2)',
        color: 'var(--fg-1)',
        border: '1px solid var(--border)',
        boxShadow: ring ? `0 0 0 ${ring}px ${ringColor}` : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        letterSpacing: '-0.01em',
        userSelect: 'none',
      }}>{monogram}</span>
      {status ? (
        <span style={{
          position: 'absolute', right: -1, bottom: -1,
          width: dotSize, height: dotSize, borderRadius: '50%',
          background: statusColor,
          border: '2px solid var(--bg-1)',
        }} />
      ) : null}
    </span>
  );
}

// ---------- Badge / Pill ----------
function Badge({ tone = 'neutral', dot, children, style = {} }) {
  // tone: neutral | accent | online | warn | error
  // No saturated colors — only fg-1 text + small status dot for tone differentiation.
  const dotColor = tone === 'online' ? 'var(--status-online)'
    : tone === 'warn' ? 'var(--status-warn)'
    : tone === 'error' ? 'var(--status-error)'
    : tone === 'accent' ? 'var(--accent)'
    : 'var(--fg-2)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 20, paddingInline: 8,
      borderRadius: 999,
      background: 'var(--bg-2)',
      color: 'var(--fg-1)',
      border: '1px solid var(--border)',
      fontSize: 11, fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      ...style,
    }}>
      {dot ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, display: 'inline-block' }} /> : null}
      {children}
    </span>
  );
}

// ---------- Tag (uppercase mono, used for FEATURED, CN-EAST, etc) ----------
function Tag({ children, style = {} }) {
  return (
    <span className="uppercase-tag" style={{
      color: 'var(--accent)',
      letterSpacing: '0.08em',
      ...style,
    }}>{children}</span>
  );
}

// ---------- Input ----------
function Input({ leading, trailing, placeholder, value, onChange, kbd, style = {}, ...rest }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8,
      height: 32, paddingInline: 10,
      borderRadius: 'var(--r-md)',
      background: 'var(--bg-2)',
      border: '1px solid var(--border-strong)',
      ...style,
    }}>
      {leading ? <span style={{ color: 'var(--fg-2)', display: 'inline-flex' }}>{leading}</span> : null}
      <input
        placeholder={placeholder} value={value} onChange={onChange}
        className="cjk"
        style={{
          flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
          color: 'var(--fg-0)', fontSize: 12.5, fontFamily: 'var(--font-sans)',
        }}
        {...rest}
      />
      {kbd ? (
        <span className="mono" style={{
          fontSize: 10, color: 'var(--fg-2)',
          padding: '1px 5px', borderRadius: 4,
          background: 'var(--bg-3)', border: '1px solid var(--border)',
        }}>{kbd}</span>
      ) : null}
      {trailing}
    </label>
  );
}

// ---------- Card (flat) ----------
function Card({ children, style = {}, padded = true }) {
  return (
    <div style={{
      background: 'var(--bg-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: padded ? 14 : 0,
      ...style,
    }}>{children}</div>
  );
}

window.UI = { Button, Avatar, Badge, Tag, Input, Card, Icon, icons: ICONS };
// Also expose flat for convenience
Object.assign(window, { Lu });
