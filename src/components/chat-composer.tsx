
// One chat composer for every channel surface (lobby, room, group, DM).
//
// Before this existed, each page had its own composer and all four were dead:
// lobby toasted "已发送" without sending anything, and room / group / DM had a
// bare <input> with no Enter handler and no send button at all. This one POSTs
// to POST /v1/channels/{id}/messages and renders whatever the server actually
// said.
//
// The write path is only implemented for group text channels today — the server
// seeds m.channels with yegumi.* and nothing else, so `CreateChannelMessage`
// answers 404 for a lobby, room or DM channel id (probed: `POST
// /v1/channels/lobby-th08/messages` -> 404, `/v1/channels/yegumi.th08/messages`
// -> 201). This component therefore reports that failure to the user instead of
// swallowing it or claiming success; when the server grows the other scopes,
// the client is already correct and needs no change.

import * as React from 'react';
import { api } from '@/lib/api/client';
import { Lu } from '@/components/design/lucide';

const { useState } = React;

export function ChatComposer({
  channelId,
  placeholder = '发个消息…',
  onSent,
  onFailed,
  disabled = false,
  disabledReason = '',
}: {
  /** Path segment of the channel to POST into. */
  channelId: string;
  placeholder?: string;
  onSent?: (msg: unknown) => void;
  onFailed?: (channelId: string, error: unknown) => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const msg = await api.sendMessage(channelId, body);
      setText('');
      onSent && onSent(msg);
    } catch (error) {
      // Keep the draft. The message did not reach the server, so throwing away
      // what the user typed is the one thing we must not do here.
      onFailed && onFailed(channelId, error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'var(--bg-2)', borderRadius: 'var(--r-md)',
        border: '1px solid var(--border-strong)', paddingInline: 10, height: 36,
        opacity: disabled ? 0.5 : 1,
      }}>
        <input
          className="cjk t-body"
          placeholder={disabled && disabledReason ? disabledReason : placeholder}
          disabled={disabled || busy}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg-0)' }}
        />
        <button
          title="表情"
          disabled={disabled || busy}
          className="btn-pressable"
          style={{ width: 24, height: 24, border: 'none', background: 'transparent', color: 'var(--fg-2)', cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Lu name="smile" size={14} />
        </button>
        <button
          title={busy ? '发送中…' : '发送'}
          aria-label="发送"
          disabled={disabled || busy || !text.trim()}
          onClick={() => void send()}
          className="btn-pressable"
          style={{
            width: 26, height: 26, border: 'none', borderRadius: 6,
            background: disabled || busy || !text.trim() ? 'var(--bg-3)' : 'var(--accent)',
            color: disabled || busy || !text.trim() ? 'var(--fg-3)' : 'var(--bg-0)',
            cursor: disabled || busy || !text.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Lu name="send-horizontal" size={13} />
        </button>
      </div>
    </div>
  );
}

/**
 * Turn a failed send into a toast. The two failure shapes a user can hit are
 * different problems with different fixes, so they get different copy:
 *
 *  - the server answered, and the answer was 404 "channel … not found": the
 *    server has no writable channel for this scope yet. That is a backend gap,
 *    and saying so is more use than a generic "failed".
 *  - the request never got an answer: the server is down or unreachable.
 */
export function sendFailureToast(err: unknown): {
  tone: string;
  title: string;
  body: string;
} {
  const raw = err instanceof Error ? err.message : String(err);
  if (/returned no message/.test(raw)) {
    const channel = /\/v1\/channels\/([^/]+)\/messages/.exec(raw)?.[1] ?? '?';
    return {
      tone: 'warn',
      title: '服务端没有这个频道',
      body: `POST /v1/channels/${channel}/messages 未实现，后端只写了群组文字频道。草稿已保留。`,
    };
  }
  return {
    tone: 'error',
    title: '发送失败',
    body: `${raw.slice(0, 80)} · 草稿已保留`,
  };
}