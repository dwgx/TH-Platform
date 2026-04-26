/* global React, Lu */
// Base UI primitives — monochrome v0.7.
// v0.7: btn-pressable, online-pulse Avatar, Toast, Dialog, Skeleton, Spinner, EmptyState, Tooltip.

const { useState: useStateU, useEffect: useEffectU, useRef: useRefU, useCallback: useCallbackU } = React;

// ---------- Icon (Lucide passthrough; back-compat .Icon[name] map) ----------
function Icon(props) { return Lu(props); }
const ICONS = {
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
function Button({ variant = 'primary', size = 'md', icon, children, onClick, className = '', style = {}, disabled, ripple = false, ...rest }) {
  const sizes = {
    sm: { h: 26, px: 10, fs: 12, gap: 6 },
    md: { h: 32, px: 12, fs: 12.5, gap: 7 },
    lg: { h: 38, px: 16, fs: 13, gap: 8 },
  };
  const s = sizes[size];
  const variants = {
    primary:   { background: 'var(--accent)',      color: 'var(--bg-0)',  border: '1px solid var(--accent)' },
    secondary: { background: 'var(--bg-2)',        color: 'var(--fg-0)',  border: '1px solid var(--border-strong)' },
    ghost:     { background: 'transparent',        color: 'var(--fg-1)',  border: '1px solid transparent' },
    soft:      { background: 'var(--accent-soft)', color: 'var(--fg-0)',  border: '1px solid var(--border)' },
    danger:    { background: 'transparent',        color: 'var(--status-error)', border: '1px solid var(--border-strong)' },
  };
  const ref = useRefU(null);
  const handleClick = (e) => {
    if (ripple && ref.current) {
      const r = ref.current.getBoundingClientRect();
      const span = document.createElement('span');
      const sz = Math.max(r.width, r.height);
      span.style.cssText = `position:absolute;left:${e.clientX - r.left - sz/2}px;top:${e.clientY - r.top - sz/2}px;width:${sz}px;height:${sz}px;border-radius:50%;background:var(--accent-ring);pointer-events:none;animation:thp-ripple 360ms cubic-bezier(0.16,1,0.3,1) forwards;`;
      ref.current.appendChild(span);
      setTimeout(() => span.remove(), 400);
    }
    onClick && onClick(e);
  };
  return (
    <button
      ref={ref}
      onClick={handleClick}
      disabled={disabled}
      className={`btn-pressable ${className}`}
      style={{
        position: 'relative', overflow: 'hidden',
        height: s.h, paddingInline: s.px, fontSize: s.fs, gap: s.gap,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontFamily: 'var(--font-sans)',
        borderRadius: 'var(--r-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap', opacity: disabled ? 0.55 : 1,
        ...variants[variant], ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

// ---------- Avatar (monogram disc, online-pulse) ----------
function Avatar({ size = 32, name = '', status, ring, ringColor = 'var(--accent-ring)' }) {
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
        background: 'var(--bg-2)', color: 'var(--fg-1)',
        border: '1px solid var(--border)',
        boxShadow: ring ? `0 0 0 ${ring}px ${ringColor}` : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, fontWeight: 600, fontFamily: 'var(--font-sans)',
        letterSpacing: '-0.01em', userSelect: 'none',
      }}>{monogram}</span>
      {status ? (
        <span
          className={status === 'online' ? 'has-online-dot' : ''}
          style={{
            position: 'absolute', right: -1, bottom: -1,
            width: dotSize, height: dotSize, borderRadius: '50%',
            background: statusColor,
            border: '2px solid var(--bg-1)',
            animation: status === 'online' ? 'thp-online-pulse 1.6s ease-out infinite' : 'none',
          }}
        />
      ) : null}
    </span>
  );
}

// ---------- Badge ----------
function Badge({ tone = 'neutral', dot, count, children, style = {} }) {
  const dotColor = tone === 'online' ? 'var(--status-online)'
    : tone === 'warn' ? 'var(--status-warn)'
    : tone === 'error' ? 'var(--status-error)'
    : tone === 'accent' ? 'var(--accent)'
    : 'var(--fg-2)';
  if (typeof count === 'number') {
    return (
      <span className="num" style={{
        minWidth: 18, height: 18, paddingInline: 5, borderRadius: 999,
        background: 'var(--accent)', color: 'var(--bg-0)',
        fontSize: 10.5, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        ...style,
      }}>{count > 99 ? '99+' : count}</span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 20, paddingInline: 8, borderRadius: 999,
      background: 'var(--bg-2)', color: 'var(--fg-1)',
      border: '1px solid var(--border)',
      fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)',
      ...style,
    }}>
      {dot ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor }} /> : null}
      {children}
    </span>
  );
}

// ---------- Tag ----------
function Tag({ children, style = {} }) {
  return (
    <span className="t-tag" style={{ color: 'var(--accent)', ...style }}>{children}</span>
  );
}

// ---------- Input ----------
function Input({ leading, trailing, placeholder, value, onChange, kbd, style = {}, ...rest }) {
  const [focus, setFocus] = useStateU(false);
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8,
      height: 32, paddingInline: 10, borderRadius: 'var(--r-md)',
      background: 'var(--bg-2)',
      border: '1px solid',
      borderColor: focus ? 'var(--accent)' : 'var(--border-strong)',
      boxShadow: focus ? '0 0 0 3px var(--accent-ring)' : 'none',
      transition: 'border-color var(--duration-fast) var(--ease-out-quart), box-shadow var(--duration-fast) var(--ease-out-quart)',
      ...style,
    }}>
      {leading ? <span style={{ color: 'var(--fg-2)', display: 'inline-flex' }}>{leading}</span> : null}
      <input
        placeholder={placeholder} value={value} onChange={onChange}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        className="cjk t-body"
        style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg-0)', fontFamily: 'var(--font-sans)' }}
        {...rest}
      />
      {kbd ? (
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-2)', padding: '1px 5px', borderRadius: 4, background: 'var(--bg-3)', border: '1px solid var(--border)' }}>{kbd}</span>
      ) : null}
      {trailing}
    </label>
  );
}

// ---------- Card ----------
function Card({ children, style = {}, padded = true }) {
  return (
    <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: padded ? 14 : 0, ...style }}>{children}</div>
  );
}

// ---------- Spinner ----------
function Spinner({ size = 14, color = 'currentColor' }) {
  return (
    <span className="spinner" style={{
      width: size, height: size, display: 'inline-block',
      border: `2px solid var(--border-strong)`, borderTopColor: color,
      borderRadius: '50%', flexShrink: 0,
    }} />
  );
}

// ---------- Skeleton ----------
function Skeleton({ variant = 'line', width = '100%', height, style = {} }) {
  const h = height || (variant === 'line' ? 12 : variant === 'circle' ? 32 : 80);
  const w = variant === 'circle' ? h : width;
  return (
    <span className="skeleton" style={{
      display: 'block', width: w, height: h,
      borderRadius: variant === 'circle' ? '50%' : variant === 'card' ? 'var(--r-md)' : 4,
      ...style,
    }} />
  );
}

// ---------- EmptyState ----------
function EmptyState({ icon = 'inbox', title, body, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', gap: 10 }}>
      <span style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--bg-2)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-3)' }}>
        <Lu name={icon} size={20} />
      </span>
      {title ? <div className="h-display-sm cjk" style={{ color: 'var(--fg-1)' }}>{title}</div> : null}
      {body  ? <div className="t-caption cjk" style={{ color: 'var(--fg-2)', maxWidth: 280 }}>{body}</div> : null}
      {action ? <div style={{ marginTop: 6 }}>{action}</div> : null}
    </div>
  );
}

// ---------- Tooltip ----------
function Tooltip({ content, placement = 'top', children }) {
  const [show, setShow] = useStateU(false);
  const tRef = useRefU(null);
  const onEnter = () => { tRef.current = setTimeout(() => setShow(true), 400); };
  const onLeave = () => { clearTimeout(tRef.current); setShow(false); };
  const pos = placement === 'bottom'
    ? { top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' }
    : placement === 'right'
    ? { left: 'calc(100% + 6px)', top: '50%', transform: 'translateY(-50%)' }
    : { bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' };
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {children}
      {show ? (
        <span className="anim-tooltip cjk t-caption" style={{
          position: 'absolute', ...pos, zIndex: 50,
          padding: '5px 9px', borderRadius: 6,
          background: 'var(--bg-3)', color: 'var(--fg-0)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-md)', whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>{content}</span>
      ) : null}
    </span>
  );
}

// ---------- Dialog ----------
function Dialog({ open, onClose, title, children, actions, width = 440 }) {
  useEffectU(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="anim-backdrop" onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div className="anim-modal-in" onClick={(e) => e.stopPropagation()} style={{
        width, maxWidth: 'calc(100% - 32px)',
        background: 'var(--bg-1)', border: '1px solid var(--border-strong)',
        borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <span className="h-display-md cjk">{title}</span>
          <button onClick={onClose} className="btn-pressable" style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--fg-1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="x" size={13} /></button>
        </div>
        <div style={{ padding: 16, overflowY: 'auto' }}>{children}</div>
        {actions ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-1)' }}>{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

// ---------- Toast ----------
function Toast({ tone = 'info', title, body, onClose }) {
  const icon = tone === 'success' ? 'check-circle-2' : tone === 'warn' ? 'alert-triangle' : tone === 'error' ? 'alert-circle' : 'info';
  return (
    <div className="anim-toast-in" style={{
      width: 280, padding: 12, borderRadius: 'var(--r-md)',
      background: 'var(--bg-2)', border: '1px solid var(--border-strong)',
      boxShadow: 'var(--shadow-md)',
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--fg-1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Lu name={icon} size={12} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title ? <div className="t-body-lg cjk" style={{ color: 'var(--fg-0)' }}>{title}</div> : null}
        {body ? <div className="t-caption cjk" style={{ color: 'var(--fg-2)', marginTop: 2 }}>{body}</div> : null}
      </div>
      <button onClick={onClose} className="btn-pressable" style={{ width: 20, height: 20, borderRadius: 4, border: 'none', background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer' }}><Lu name="x" size={11} /></button>
    </div>
  );
}

function ToastHost({ toasts = [], onClose }) {
  return (
    <div style={{ position: 'absolute', right: 20, bottom: 20, display: 'flex', flexDirection: 'column-reverse', gap: 10, zIndex: 200, pointerEvents: 'none' }}>
      {toasts.slice(0, 3).map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <Toast tone={t.tone} title={t.title} body={t.body} onClose={() => onClose(t.id)} />
        </div>
      ))}
    </div>
  );
}

window.UI = { Button, Avatar, Badge, Tag, Input, Card, Icon, icons: ICONS, Spinner, Skeleton, EmptyState, Tooltip, Dialog, Toast, ToastHost };
Object.assign(window, { Lu });
