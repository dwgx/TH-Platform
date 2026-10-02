// The one way this app is allowed to say "not yet".
//
// Roughly forty controls across the six pages have no route behind them: the
// server has GETs for rooms, friends, groups and profiles, and exactly one
// write endpoint (POST /v1/channels/{id}/messages). Creating a room, editing a
// match parameter, accepting a friend request and binding an account are all
// real product features with no server support yet.
//
// The failure mode this exists to prevent is the one the owner reported: a
// control that looks live, takes a click, and does nothing. Two shapes of
// dishonesty are in circulation — a silent no-op, and a toast that says
// "该功能将在 V1 后期开放" as though a toast were an answer.
//
// So an unavailable control is rendered *unavailable*: `disabled` and inert, so
// it cannot be clicked into a no-op, with the reason on the tooltip, on
// `aria-disabled`, and on a visible glyph next to it. A control the user can
// see is not the same as a control the user can press and be ignored.

import * as React from 'react';
import { Lu } from '@/components/design/lucide';

/**
 * Wraps any control in the unavailable treatment.
 *
 * `children` should already carry its own `disabled` (or otherwise inert)
 * styling; this component is what supplies the reason and the visual marker, so
 * a caller cannot accidentally produce a clickable control with a warning
 * badge next to it.
 */
export function Unavailable({
  reason,
  children,
  block = false,
}: {
  /** Shown on hover, on the disabled control's title, and to a screen reader. */
  reason: string;
  children: React.ReactNode;
  /** Full-width, for list rows rather than buttons. */
  block?: boolean;
}) {
  return (
    <span
      title={reason}
      aria-disabled="true"
      style={{
        display: block ? 'flex' : 'inline-flex',
        alignItems: 'center',
        gap: 6,
        minWidth: 0,
        cursor: 'not-allowed',
        opacity: 0.5,
        flexShrink: block ? 0 : undefined,
      }}
    >
      {children}
      <Lu name="ban" size={11} color="var(--fg-3)" />
    </span>
  );
}

/**
 * A standalone "not available yet" card. Used where a whole panel is a feature
 * the backend cannot hold, so the page can show what the feature *is* and what
 * is missing instead of rendering fake controls for it.
 */
export function UnavailablePanel({
  title,
  missing,
}: {
  title: React.ReactNode;
  /** The specific route, field or artefact that would make this work. */
  missing: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginTop: 16,
        padding: '22px 20px',
        background: 'var(--bg-1)',
        border: '1px dashed var(--border-strong)',
        borderRadius: 'var(--r-md)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Lu name="ban" size={14} color="var(--fg-3)" />
        <span className="cjk t-body-lg" style={{ color: 'var(--fg-1)', fontWeight: 600 }}>
          {title}
        </span>
      </div>
      <div className="cjk t-caption" style={{ color: 'var(--fg-2)', marginTop: 8, lineHeight: 1.7 }}>
        {missing}
      </div>
    </div>
  );
}
