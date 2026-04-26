/* global React, UI, SHARED, Lu */
const { useState: useStateD } = React;
const { Button: BtnD, Avatar: AvD, Tag: TagD, Badge: BdgD } = UI;
const { ServerRail: RailD, Row: RowD, SectionLabel: SLD, IdentityCard: IdD, StatusDot: SDD, ChatMessage: CMD } = SHARED;

const FRIENDS = [
  { name: '幽幽子', handle: 'yuyuko', status: 'online', game: 'TH08 永夜抄', subtle: '在 永夜抄 PvP — 北京' },
  { name: '咲夜',   handle: 'sakuya', status: 'online', game: 'TH08 永夜抄', subtle: '游戏中 · Lunatic 4B' },
  { name: '魔理沙', handle: 'marisa', status: 'idle',   subtle: '挂机 18 分钟' },
  { name: '爱丽丝', handle: 'alice',  status: 'online', game: 'TH09 PoFV',  subtle: '在 PoFV 国服公开赛' },
  { name: '帕秋莉', handle: 'patchouli', status: 'dnd', subtle: '请勿打扰 · 撰写中' },
  { name: '蕾米莉亚', handle: 'remilia', status: 'offline', subtle: '昨天 23:41' },
];

const PENDING = [
  { name: '十六夜咲夜', handle: 'izayoi', dir: 'in', mutual: 4 },
  { name: '小野塚小町', handle: 'komachi', dir: 'out' },
];

const DM_THREAD = [
  { who: '咲夜', t: '20:48', msg: '今晚要打 Lunatic 吗' },
  { who: 'me',   t: '20:49', msg: '打的，4B 路线还是老样子' },
  { who: '咲夜', t: '20:49', msg: '稳，我先去开房间', samegroup: true },
  { kind: 'embed', t: '20:50' },
  { who: 'me',   t: '20:51', msg: '收到，我两分钟后到' },
  { who: '咲夜', t: '20:53', msg: '魔理沙 也来 总共 3 个 等多 1 个就开打' },
  { who: 'me',   t: '20:54', msg: '@yuyuko 在不？要不要来打 Lunatic 4B', mention: 'yuyuko' },
  { who: '咲夜', t: '20:55', msg: '我去拉幽幽子 你先调下手感', samegroup: false },
];

function MiniRoomShare() {
  return (
    <div style={{
      maxWidth: 380, padding: 10, borderRadius: 'var(--r-md)',
      background: 'var(--bg-1)', border: '1px solid var(--border)',
      borderLeft: '2px solid var(--accent)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span className="uppercase-tag" style={{ color: 'var(--accent)' }}>OFFICIAL · TH08 · ROOM</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>#4912</span>
      </div>
      <div className="cjk" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-0)' }}>永夜抄 Lunatic · 4B 路线练习</div>
      <div className="cjk" style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 2 }}><span style={{ color: 'var(--fg-1)' }}>主</span> 咲夜 · 28ms · <span className="mono" style={{ color: 'var(--fg-1)', fontWeight: 600 }}>3/6</span></div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <BtnD variant="primary" size="sm" style={{ flex: 1 }}><span className="cjk">立即加入</span></BtnD>
        <BtnD variant="ghost" size="sm"><Lu name="copy" size={11} /></BtnD>
      </div>
    </div>
  );
}

function FriendRow({ f, kind = 'all' }) {
  const action = kind === 'pending' ? (
    f.dir === 'in' ? (
      <div style={{ display: 'flex', gap: 6 }}>
        <button title="接受" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--fg-0)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="check" size={13} /></button>
        <button title="忽略" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--fg-2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="x" size={13} /></button>
      </div>
    ) : <span className="cjk" style={{ fontSize: 11, color: 'var(--fg-2)' }}>等待回应</span>
  ) : (
    <div style={{ display: 'flex', gap: 6 }}>
      <button title="发消息" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--fg-1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="message-square" size={13} /></button>
      <button title="更多" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--fg-1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="more-horizontal" size={13} /></button>
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
      <AvD size={36} name={f.name} status={f.status} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="cjk" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>{f.name}</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>@{f.handle}</span>
          {f.mutual ? <span className="cjk" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>· {f.mutual} 个共同好友</span> : null}
        </div>
        <div className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          {f.game ? <span className="mono" style={{ fontSize: 10, padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--fg-1)' }}>{f.game}</span> : null}
          {f.subtle}
        </div>
      </div>
      {action}
    </div>
  );
}

function FriendsTab({ tab, count }) {
  const filtered = tab === 'online' ? FRIENDS.filter(f => f.status !== 'offline')
    : tab === 'pending' ? []
    : tab === 'blocked' ? []
    : FRIENDS;
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ paddingInline: 16, paddingTop: 14, paddingBottom: 8, position: 'sticky', top: 0, background: 'var(--bg-0)' }}>
        <div style={{ height: 32, background: 'var(--bg-1)', borderRadius: 6, border: '1px solid var(--border)', paddingInline: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lu name="search" size={13} color="var(--fg-2)" />
          <input className="cjk" placeholder="搜索好友" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg-0)', fontSize: 12.5 }} />
        </div>
        <div className="cjk uppercase-tag" style={{ color: 'var(--fg-2)', marginTop: 14 }}>
          {tab === 'online' ? `在线 — ${filtered.length}` : tab === 'all' ? `所有好友 — ${FRIENDS.length}` : tab === 'pending' ? `待处理 — ${PENDING.length}` : '已屏蔽 — 0'}
        </div>
      </div>
      {tab === 'pending' ? PENDING.map(p => <FriendRow key={p.handle} f={p} kind="pending" />) : filtered.map(f => <FriendRow key={f.handle} f={f} />)}
      {tab === 'blocked' && (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="cjk" style={{ fontSize: 12, color: 'var(--fg-2)' }}>没有屏蔽任何人</div>
        </div>
      )}
    </div>
  );
}

function FriendsHome({ active = 'online' }) {
  const [tab, setTab] = useStateD(active);
  return (
    <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-0)' }}>
      <div style={{ height: 48, paddingInline: 18, display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--border)' }}>
        <Lu name="users" size={14} color="var(--fg-2)" />
        <span className="cjk" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-0)' }}>好友</span>
        <span style={{ width: 1, height: 16, background: 'var(--border)' }} />
        {[
          { id: 'online', label: '在线' },
          { id: 'all', label: '全部' },
          { id: 'pending', label: '待处理', count: 1 },
          { id: 'blocked', label: '已屏蔽' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            height: 26, paddingInline: 10, borderRadius: 6, border: 'none',
            background: tab === t.id ? 'var(--bg-2)' : 'transparent',
            color: tab === t.id ? 'var(--fg-0)' : 'var(--fg-2)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}><span className="cjk">{t.label}</span>{t.count ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} /> : null}</button>
        ))}
        <span style={{ flex: 1 }} />
        <BtnD variant="primary" size="sm"><Lu name="user-plus" size={12} /><span className="cjk" style={{ marginLeft: 6 }}>添加好友</span></BtnD>
      </div>
      <FriendsTab tab={tab} />
      <aside style={{ display: 'none' }} />
    </main>
  );
}

function DMThread({ peer }) {
  return (
    <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-0)' }}>
      <div style={{ height: 48, paddingInline: 18, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
        <AvD size={26} name={peer.name} status={peer.status} />
        <div>
          <div className="cjk" style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-0)' }}>{peer.name} <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', fontWeight: 500 }}>@{peer.handle}</span></div>
          <div className="cjk" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>{peer.subtle}</div>
        </div>
        <span style={{ flex: 1 }} />
        <button style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: 'var(--fg-2)', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="phone" size={13} /></button>
        <button style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: 'var(--fg-2)', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="pin" size={13} /></button>
        <button style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: 'var(--fg-2)', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="user-plus" size={13} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <div className="cjk" style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-0)', fontFamily: 'var(--font-display)' }}>这是你和 {peer.name} 的私聊起点</div>
          <div className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-2)', marginTop: 4 }}>添加好友于 2024.03.14 · 共同群组 3 个 · 共同好友 8 人</div>
        </div>
        {DM_THREAD.map((m, i) => {
          if (m.kind === 'embed') return (
            <div key={i} style={{ paddingLeft: 50, marginTop: 4, marginBottom: 6 }}><MiniRoomShare /></div>
          );
          return <CMD key={i} msg={m} samegroup={m.samegroup} />;
        })}
        <div className="cjk" style={{ fontSize: 11, color: 'var(--fg-3)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, paddingLeft: 50 }}>
          <span style={{ display: 'inline-flex', gap: 2 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--fg-3)' }} />
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--fg-3)' }} />
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--fg-3)' }} />
          </span>
          {peer.name} 正在输入…
        </div>
      </div>
      <div style={{ padding: '6px 18px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-1)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-strong)', paddingInline: 12, height: 40 }}>
          <Lu name="plus" size={14} color="var(--fg-2)" />
          <input className="cjk" placeholder={`发个消息给 ${peer.name}`} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg-0)', fontSize: 13 }} />
          <Lu name="image" size={13} color="var(--fg-2)" />
          <Lu name="smile" size={13} color="var(--fg-2)" />
        </div>
      </div>
    </main>
  );
}

function DMSidebar({ activeId }) {
  return (
    <aside style={{ width: 240, background: 'var(--bg-1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ height: 30, background: 'var(--bg-2)', borderRadius: 6, border: '1px solid var(--border)', paddingInline: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lu name="search" size={12} color="var(--fg-2)" />
          <span className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>找一个 DM 或好友</span>
        </div>
      </div>
      <div style={{ padding: '8px 6px' }}>
        <RowD active={!activeId} leading={<Lu name="users" size={14} color="var(--fg-2)" />}>
          <span className="cjk" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-0)' }}>好友</span>
        </RowD>
        <RowD leading={<Lu name="inbox" size={14} color="var(--fg-2)" />}>
          <span className="cjk" style={{ fontSize: 12.5 }}>消息请求</span>
        </RowD>
      </div>
      <div style={{ padding: '4px 8px 0' }}>
        <SLD right={<button style={{ width: 16, height: 16, border: 'none', background: 'transparent', color: 'var(--fg-3)', cursor: 'pointer' }}><Lu name="plus" size={11} /></button>}>私聊</SLD>
      </div>
      <div style={{ padding: '6px 6px', overflowY: 'auto', flex: 1 }}>
        {FRIENDS.filter(f => f.status !== 'offline').slice(0, 5).map((f, i) => (
          <RowD key={f.handle} active={activeId === f.handle}
            leading={<AvD size={26} name={f.name} status={f.status} />}
            trailing={i === 0 ? <BdgD count={3} /> : null}>
            <div>
              <div className="cjk" style={{ fontSize: 12.5, fontWeight: 600, color: activeId === f.handle ? 'var(--fg-0)' : 'var(--fg-1)' }}>{f.name}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>@{f.handle}</div>
            </div>
          </RowD>
        ))}
      </div>
      <IdD />
    </aside>
  );
}

function FriendsApp({ theme = 'dark', mode = 'home' }) {
  const peer = FRIENDS[1]; // 咲夜
  return (
    <div className={`thp theme-${theme}`} style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg-0)', overflow: 'hidden', borderRadius: 'var(--r-lg)' }}>
      <RailD active="dm" />
      <DMSidebar activeId={mode === 'dm' ? peer.handle : null} />
      {mode === 'dm' ? <DMThread peer={peer} /> : <FriendsHome active="online" />}
    </div>
  );
}
window.FriendsApp = FriendsApp;
