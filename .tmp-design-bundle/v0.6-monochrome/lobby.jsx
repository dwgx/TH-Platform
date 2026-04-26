/* global React, UI, SHARED, Lu */
// Lobby — monochrome v0.6.

const { useState: useStateL } = React;
const { Button: BtnL, Avatar: AvL, Badge: BdgL, Tag: TagL, Input: InpL, icons: IcL } = UI;
const { ServerRail: RailL, Row: RowL, SectionLabel: SLL, Tabs: TabsL, IdentityCard: IdL, StatusDot: SDL, ChatMessage: CML } = SHARED;

const ROOMS = [
  { id: 1, kind: 'Official',  title: '永夜抄 PvP — 北京',     host: '幽幽子',    region: 'CN-East',  ping: 24, diff: 'Lunatic',  mode: 'Standard', taken: 3, total: 4 },
  { id: 2, kind: 'Personal',  title: '老咸鱼下午茶',           host: '咲夜',      region: 'CN-East',  ping: 31, diff: 'Hard',     mode: 'Standard', taken: 2, total: 4 },
  { id: 3, kind: 'Official',  title: 'IN 周末锦标赛 #14',      host: '灵梦',      region: 'CN-South', ping: 42, diff: 'Lunatic',  mode: 'Ranked',   taken: 4, total: 4 },
  { id: 4, kind: 'Personal',  title: '萌新练习房 · 慢慢打',    host: '魔理沙',    region: 'CN-East',  ping: 19, diff: 'Normal',   mode: 'Casual',   taken: 1, total: 4 },
  { id: 5, kind: 'Official',  title: 'Spell Card Showdown',    host: '妖梦',      region: 'JP-Tokyo', ping: 88, diff: 'Lunatic',  mode: 'Spell',    taken: 2, total: 4 },
  { id: 6, kind: 'Personal',  title: '深夜不困局 · 03:00',     host: '蕾米莉亚',  region: 'CN-East',  ping: 27, diff: 'Hard',     mode: 'Standard', taken: 3, total: 4 },
];
const FRIENDS = [
  { name: '小野塚小町', handle: 'komachi', status: 'online', game: 'TH09 中' },
  { name: '河城荷取',   handle: 'nitori',  status: 'online', game: 'TH08 中' },
  { name: '雾雨魔理沙', handle: 'marisa',  status: 'away',   game: '挂机' },
  { name: '十六夜咲夜', handle: 'sakuya',  status: 'online', game: 'TH06 中' },
  { name: '博丽灵梦',   handle: 'reimu',   status: 'dnd',    game: '勿扰' },
];
const CHAT = [
  { who: '河城荷取',   t: '21:04', msg: '今晚有人上分吗，本命永夜抄' },
  { who: '小野塚小町', t: '21:05', msg: '刚下班，等我十分钟' },
  { who: '十六夜咲夜', t: '21:07', msg: '@nitori 我开了一桌，进来吧', mention: 'nitori', share: { title: '永夜抄 PvP — 北京', host: '幽幽子', region: 'CN-East', ping: 24, diff: 'Lunatic', mode: 'Standard', taken: 3, total: 4, vis: 'public' } },
  { who: '雾雨魔理沙', t: '21:09', msg: '稳，先来一把试试手感', reactions: [{ icon: 'thumbs-up', count: 3, mine: true }] },
  { who: '河城荷取',   t: '21:10', msg: '好嘞，路上' },
];

function RoomRow({ r, active }) {
  const [hov, setHov] = useStateL(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px',
        background: active ? 'var(--bg-2)' : hov ? 'var(--hover)' : 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        cursor: 'pointer',
      }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="uppercase-tag" style={{ color: 'var(--fg-2)', padding: '1px 6px', border: '1px solid var(--border)', borderRadius: 4 }}>{r.kind === 'Official' ? '官方' : '个人'}</span>
          <span className="cjk" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
        </div>
        <div className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-2)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span><span style={{ color: 'var(--fg-1)' }}>主</span> {r.host}</span>
          <span style={{ color: 'var(--fg-3)' }}>·</span>
          <span className="mono">{r.ping}ms</span>
          <span style={{ color: 'var(--fg-3)' }}>·</span><span>{r.region}</span>
          <span style={{ color: 'var(--fg-3)' }}>·</span><span>{r.diff}</span>
          <span style={{ color: 'var(--fg-3)' }}>·</span><span>{r.mode}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {Array.from({ length: r.taken }).map((_, i) => (
          <span key={i} style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--bg-2)', border: '2px solid var(--bg-1)',
            marginLeft: i === 0 ? 0 : -6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--fg-1)', fontSize: 9, fontWeight: 600,
          }}>{['幽','妖','咲','魔','灵','蕾'][i]}</span>
        ))}
        {Array.from({ length: r.total - r.taken }).map((_, i) => (
          <span key={`e${i}`} style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'transparent', border: '1px dashed var(--border-strong)',
            marginLeft: -6,
          }} />
        ))}
        <span className="mono" style={{ marginLeft: 8, fontSize: 11, color: 'var(--fg-2)' }}>{r.taken}/{r.total}</span>
      </div>
    </div>
  );
}

function Lobby({ theme = 'dark' }) {
  return (
    <div className={`thp theme-${theme}`} style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg-0)', overflow: 'hidden', borderRadius: 'var(--r-lg)' }}>
      <RailL active="th08" />
      {/* Col 2 — Lobby navigator */}
      <aside style={{ width: 256, background: 'var(--bg-1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="cjk" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-0)' }}>大厅</div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: 'var(--fg-2)' }}>
              <SDL status="online" /> CN-East · <span className="mono" style={{ color: 'var(--fg-1)' }}>24ms</span>
            </span>
          </div>
          <div style={{ marginTop: 10 }}>
            <InpL leading={<Lu name="search" size={14} />} placeholder="搜索房间 · 玩家 · 频道" kbd="⌘K" />
          </div>
        </div>
        <div style={{ padding: 10, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <SLL>分类</SLL>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <RowL active leading={<Lu name="globe" size={14} />}>
                <span className="cjk" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-0)' }}>官方房间</span>
              </RowL>
              <RowL leading={<Lu name="user" size={14} />}>
                <span className="cjk" style={{ fontSize: 12.5 }}>个人房间</span>
              </RowL>
              <RowL leading={<Lu name="users" size={14} />} trailing={<Lu name="lock" size={11} color="var(--fg-3)" />} style={{ opacity: 0.55 }}>
                <span className="cjk" style={{ fontSize: 12.5, color: 'var(--fg-2)' }}>社区频道</span>
              </RowL>
            </div>
          </div>
          <div>
            <SLL>版本</SLL>
            <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['TH06','TH07','TH08','TH09'].map(v => (
                <span key={v} className="mono" style={{
                  height: 24, paddingInline: 8, display: 'inline-flex', alignItems: 'center',
                  borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: v === 'TH08' ? 'var(--bg-3)' : 'var(--bg-2)',
                  color: v === 'TH08' ? 'var(--fg-0)' : 'var(--fg-2)',
                  border: `1px solid ${v === 'TH08' ? 'var(--border-strong)' : 'var(--border)'}`,
                }}>{v}</span>
              ))}
            </div>
          </div>
          <div>
            <SLL right={<span style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>2</span>}>我的房间</SLL>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <RowL leading={<span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-online)' }} />}>
                <span className="cjk" style={{ fontSize: 12.5, color: 'var(--fg-0)' }}>昨日的房间</span>
                <div style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>TH08 · 3 人</div>
              </RowL>
              <RowL leading={<span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--fg-3)' }} />}>
                <span className="cjk" style={{ fontSize: 12.5, color: 'var(--fg-0)' }}>咲夜的茶话会</span>
                <div style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>TH07 · 待机中</div>
              </RowL>
            </div>
          </div>
          <div>
            <SLL right={<span className="mono" style={{ fontSize: 10.5, color: 'var(--status-online)' }}>3</span>}>好友在线</SLL>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {FRIENDS.map(f => (
                <RowL key={f.handle}
                  leading={<AvL size={22} name={f.name} status={f.status} />}>
                  <div className="cjk" style={{ fontSize: 12.5, color: 'var(--fg-0)' }}>{f.name}</div>
                  <div className="cjk" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>{f.game}</div>
                </RowL>
              ))}
            </div>
          </div>
        </div>
        <IdL />
      </aside>

      {/* Col 3 — Rooms list */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 className="cjk" style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--fg-0)', letterSpacing: '-0.01em' }}>
              永夜抄 <span style={{ color: 'var(--fg-2)' }}>·</span> <span className="mono" style={{ color: 'var(--fg-1)', fontSize: 14 }}>TH08</span>
            </h2>
            <div className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-2)', marginTop: 2 }}>当前 6 个房间在线 · 12 名玩家</div>
          </div>
          <BtnL variant="ghost" size="sm" icon={<Lu name="arrow-up-down" size={13} />}><span className="cjk">排序</span></BtnL>
          <BtnL variant="ghost" size="sm" icon={<Lu name="filter" size={13} />}><span className="cjk">筛选</span></BtnL>
          <BtnL variant="primary" size="sm" icon={<Lu name="plus" size={13} />}><span className="cjk">新房间</span></BtnL>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Featured strip — flat bg-1 with FEATURED tag */}
          <div style={{
            padding: '14px 16px',
            background: 'var(--bg-1)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--r-md)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <TagL>FEATURED · LUNATIC FRIDAY</TagL>
              <div className="cjk" style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-0)', marginTop: 4, fontFamily: 'var(--font-display)' }}>本周锦标赛 · 永夜抄 Lunatic</div>
              <div className="cjk" style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 2 }}>每周五 21:00 · 胜者拿走整桌的奶茶券 · 本期 18 人报名</div>
            </div>
            <BtnL variant="primary" size="md"><span className="cjk">报名参赛</span></BtnL>
          </div>

          {/* Room list */}
          {ROOMS.map(r => <RoomRow key={r.id} r={r} active={r.id === 1} />)}
        </div>
      </main>

      {/* Col 4 — Chat */}
      <aside style={{ width: 320, background: 'var(--bg-0)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '0 14px', borderBottom: '1px solid var(--border)' }}>
          <TabsL
            tabs={[
              { id: 'lobby',  label: <span className="cjk">大厅</span> },
              { id: 'fr',     label: <span className="cjk">好友</span>, dot: true },
              { id: 'room',   label: <span className="cjk">房间</span> },
            ]}
            active="lobby" onChange={() => {}}
          />
        </div>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-0)' }}># lobby-th08</span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>47 online</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CHAT.map((m, i) => {
            const prev = CHAT[i-1];
            const samegroup = prev && prev.who === m.who;
            return (
              <div key={i}>
                <CML msg={m} samegroup={samegroup} />
                {m.share ? (
                  <div style={{ marginLeft: 38, marginTop: 6 }}>
                    <SHARED.ServerCardFlat compact {...m.share} />
                  </div>
                ) : null}
              </div>
            );
          })}
          <div className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-3)', textAlign: 'center', padding: '14px 0', borderTop: '1px dashed var(--border)', marginTop: 10 }}>
            现在还没人在玩永夜抄，要不你来开第一桌？
          </div>
        </div>
        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg-2)', borderRadius: 'var(--r-md)',
            border: '1px solid var(--border-strong)', paddingInline: 10, height: 36,
          }}>
            <input className="cjk" placeholder="发个消息到 #闲聊…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg-0)', fontSize: 13 }} />
            <button style={{ width: 24, height: 24, border: 'none', background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="smile" size={14} /></button>
            <button style={{ width: 26, height: 26, border: 'none', background: 'var(--accent)', color: 'var(--bg-0)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="send-horizontal" size={13} /></button>
          </div>
        </div>
      </aside>
    </div>
  );
}

window.Lobby = Lobby;
