/* global React, UI, SHARED, Lu */
const { useState: useStateP } = React;
const { Button: BtnP, Avatar: AvP, Tag: TagP, Badge: BdgP } = UI;
const { ServerRail: RailP, Row: RowP, SectionLabel: SLP, IdentityCard: IdP, StatusDot: SDP } = SHARED;

const ME = {
  name: '幽幽子',
  handle: 'yuyuko',
  pronoun: 'she/her',
  status: 'online',
  presence: '正在游玩 永夜抄 PvP — 北京 · #4912',
  joined: '2024.03.14',
  bio: '夜组成员 · Lunatic 路线党 · 周三、五 21:00 集训\n咲夜的固定搭档 · 4B 路线 18 通关',
  badges: ['创始成员','Lunatic 通关 +50','夜组管理员'],
  ranks: { th06: 'Hard', th07: 'Lunatic', th08: 'Lunatic+', th09: 'Hard' },
  recent: [
    { game: 'TH08', mode: 'Lunatic 4B', score: '4,128,920,470', time: '今天 21:42' },
    { game: 'TH08', mode: 'Normal 6A',  score: '982,140,560',  time: '昨天 22:08' },
    { game: 'TH09', mode: 'Hard',       score: '410,220',      time: '3 天前' },
    { game: 'TH07', mode: 'Lunatic',    score: '2,840,991,210',time: '上周三' },
  ],
  groups: [
    { name: '夜组 · 永夜抄研究会', role: '管理员' },
    { name: 'PoFV 国服公开赛', role: '成员' },
    { name: 'TH06 EoSD 复习班', role: '成员' },
  ],
};

function PortraitPlate({ size = 96, mono = '幽' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 'var(--r-md)',
      background: 'var(--bg-2)', border: '1px solid var(--border-strong)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span className="cjk" style={{ fontSize: size * 0.36, fontWeight: 700, color: 'var(--fg-0)', fontFamily: 'var(--font-display)' }}>{mono}</span>
    </div>
  );
}

function ProfilePopover() {
  return (
    <div style={{
      width: 320, background: 'var(--bg-1)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', overflow: 'hidden',
      boxShadow: '0 10px 32px -8px rgba(0,0,0,0.32), 0 2px 4px rgba(0,0,0,0.08)',
    }}>
      {/* Banner — flat bg-2 + accent left border, no gradient */}
      <div style={{ height: 64, background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', borderLeft: '2px solid var(--accent)', position: 'relative' }}>
        <span className="uppercase-tag" style={{ position: 'absolute', top: 10, right: 12, color: 'var(--fg-2)' }}>夜组 · 管理员</span>
      </div>
      <div style={{ padding: '0 16px 16px', marginTop: -32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <PortraitPlate size={64} />
            <span style={{ position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: 'var(--status-online)', border: '2px solid var(--bg-1)' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 4, marginLeft: 'auto' }}>
            <BtnP variant="secondary" size="sm"><Lu name="message-square" size={11} /><span className="cjk" style={{ marginLeft: 4 }}>消息</span></BtnP>
            <BtnP variant="ghost" size="sm"><Lu name="more-horizontal" size={12} /></BtnP>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="cjk" style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-0)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{ME.name}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 2 }}>@{ME.handle} · {ME.pronoun}</div>
        </div>
        <div style={{ marginTop: 10, padding: 10, background: 'var(--bg-2)', border: '1px solid var(--border)', borderLeft: '2px solid var(--accent)', borderRadius: 6 }}>
          <div className="uppercase-tag" style={{ color: 'var(--accent)' }}>当前游戏</div>
          <div className="cjk" style={{ fontSize: 12, color: 'var(--fg-0)', marginTop: 4, fontWeight: 600 }}>永夜抄 PvP — 北京</div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)', marginTop: 1 }}>#4912 · 已游玩 18 分钟 · Lunatic</div>
          <BtnP variant="primary" size="sm" style={{ marginTop: 8, width: '100%' }}><span className="cjk">围观这局</span></BtnP>
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="uppercase-tag" style={{ color: 'var(--fg-2)' }}>关于</div>
          <div className="cjk" style={{ fontSize: 12, color: 'var(--fg-1)', marginTop: 6, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{ME.bio}</div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="uppercase-tag" style={{ color: 'var(--fg-2)' }}>共同群组 · 3</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {ME.groups.map(g => (
              <div key={g.name} className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-1)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{g.name}</span><span style={{ color: 'var(--fg-3)' }}>{g.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileFull({ theme = 'dark' }) {
  return (
    <div className={`thp theme-${theme} anim-page-in`} style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg-0)', overflow: 'hidden', borderRadius: 'var(--r-lg)' }}>
      <RailP active="dm" />
      <aside style={{ width: 240, background: 'var(--bg-1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
          <div className="uppercase-tag" style={{ color: 'var(--fg-2)' }}>个人主页</div>
          <div className="cjk" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-0)', marginTop: 4 }}>@{ME.handle}</div>
        </div>
        <div style={{ padding: '8px 6px', flex: 1 }}>
          <RowP active leading={<Lu name="user" size={13} color="var(--fg-2)" />}><span className="cjk" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-0)' }}>概览</span></RowP>
          <RowP leading={<Lu name="bar-chart-3" size={13} color="var(--fg-2)" />}><span className="cjk" style={{ fontSize: 12.5 }}>战绩</span></RowP>
          <RowP leading={<Lu name="film" size={13} color="var(--fg-2)" />}><span className="cjk" style={{ fontSize: 12.5 }}>录像</span></RowP>
          <RowP leading={<Lu name="award" size={13} color="var(--fg-2)" />}><span className="cjk" style={{ fontSize: 12.5 }}>徽章</span></RowP>
          <RowP leading={<Lu name="users" size={13} color="var(--fg-2)" />}><span className="cjk" style={{ fontSize: 12.5 }}>群组</span></RowP>
        </div>
        <IdP />
      </aside>
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: 'var(--bg-0)' }}>
        {/* Banner */}
        <div style={{ height: 120, background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', borderLeft: '2px solid var(--accent)', display: 'flex', alignItems: 'flex-end', padding: '0 28px 0' }}>
          <div style={{ position: 'absolute', display: 'flex', alignItems: 'flex-end', gap: 16, transform: 'translateY(40px)' }}>
            <PortraitPlate size={96} />
          </div>
        </div>
        <div style={{ padding: '52px 28px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 96, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="cjk" style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--fg-0)', letterSpacing: '-0.015em' }}>{ME.name}</h1>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-online)' }} />
              <span className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>在线</span>
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 2 }}>@{ME.handle} · {ME.pronoun} · joined {ME.joined}</div>
            <div className="cjk" style={{ fontSize: 12, color: 'var(--fg-1)', marginTop: 4 }}>{ME.presence}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <BtnP variant="secondary" size="md"><Lu name="message-square" size={12} /><span className="cjk" style={{ marginLeft: 6 }}>发消息</span></BtnP>
            <BtnP variant="primary" size="md"><span className="cjk">围观对局</span></BtnP>
            <BtnP variant="ghost" size="md"><Lu name="more-horizontal" size={13} /></BtnP>
          </div>
        </div>
        <div style={{ padding: '0 28px 28px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Ranks */}
            <section style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16 }}>
              <div className="uppercase-tag" style={{ color: 'var(--fg-2)' }}>各作通关纪录</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 10 }}>
                {Object.entries(ME.ranks).map(([k, v]) => (
                  <div key={k} style={{ padding: '10px 12px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6 }}>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>{k.toUpperCase()}</div>
                    <div className="cjk" style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-0)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </section>
            {/* Recent */}
            <section style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="uppercase-tag" style={{ color: 'var(--fg-2)' }}>最近对局</div>
                <button className="cjk" style={{ background: 'transparent', border: 'none', color: 'var(--fg-2)', fontSize: 11, cursor: 'pointer' }}>查看全部 →</button>
              </div>
              <div style={{ marginTop: 8 }}>
                {ME.recent.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-1)', padding: '2px 6px', border: '1px solid var(--border)', borderRadius: 3, background: 'var(--bg-2)' }}>{r.game}</span>
                    <span className="cjk" style={{ fontSize: 12.5, color: 'var(--fg-0)', flex: 1, fontWeight: 600 }}>{r.mode}</span>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--fg-1)' }}>{r.score}</span>
                    <span className="cjk" style={{ fontSize: 11, color: 'var(--fg-3)', minWidth: 56, textAlign: 'right' }}>{r.time}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <section style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16 }}>
              <div className="uppercase-tag" style={{ color: 'var(--fg-2)' }}>关于</div>
              <div className="cjk" style={{ fontSize: 12.5, color: 'var(--fg-1)', marginTop: 6, lineHeight: 1.65, whiteSpace: 'pre-line' }}>{ME.bio}</div>
            </section>
            <section style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16 }}>
              <div className="uppercase-tag" style={{ color: 'var(--fg-2)' }}>徽章</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {ME.badges.map(b => <TagP key={b}><span className="cjk">{b}</span></TagP>)}
              </div>
            </section>
            <section style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16 }}>
              <div className="uppercase-tag" style={{ color: 'var(--fg-2)' }}>群组 · 3</div>
              <div style={{ marginTop: 6 }}>
                {ME.groups.map(g => (
                  <div key={g.name} style={{ padding: '8px 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                    <span className="cjk" style={{ fontSize: 12, color: 'var(--fg-1)' }}>{g.name}</span>
                    <span className="cjk" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{g.role}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

window.ProfilePopover = ProfilePopover;
window.ProfileFull = ProfileFull;
