/* global React, UI, SHARED, Lu */
const { useState: useStateG } = React;
const { Button: BtnG, Avatar: AvG, Badge: BdgG, Tag: TagG } = UI;
const { ServerRail: RailG, Row: RowG, SectionLabel: SLG, IdentityCard: IdG, StatusDot: SDG, ChatMessage: CMG } = SHARED;

const GROUP = {
  name: '夜组 · 永夜抄研究会',
  handle: 'yegumi',
  motto: '专研永夜抄 Lunatic 路线 · 每周三、五 21:00 集合',
  members: 248,
  online: 42,
  established: '2019.08',
};

const CATS = [
  { id: 'info', label: '群组信息', icon: 'megaphone', items: [
    { id: 'rules', label: '群规与守则', tag: '置顶' },
    { id: 'announce', label: '公告', unread: 2 },
    { id: 'events', label: '活动日程', unread: 0 },
  ]},
  { id: 'chat', label: '文字频道', icon: 'hash', items: [
    { id: 'lounge', label: '闲聊大厅' },
    { id: 'th08', label: '永夜抄研究' , active: true, unread: 14 },
    { id: 'th07', label: '妖妖梦' },
    { id: 'replay', label: '录像点评' },
    { id: 'tools', label: '工具与下载' },
  ]},
  { id: 'voice', label: '语音频道', icon: 'volume-2', items: [
    { id: 'v1', label: 'Lunatic 集训', voice: true, count: 5 },
    { id: 'v2', label: '深夜车队', voice: true, count: 0 },
    { id: 'v3', label: 'AFK 挂机', voice: true, count: 2 },
  ]},
];

const ANNOUNCEMENT = {
  pinnedBy: '幽幽子',
  time: '昨天 22:14',
  title: '本周永夜抄 Lunatic 集训安排',
  body: '周三 21:00 准时在 Lunatic 集训 语音频道集合，主攻 5 面与 6A 路线。本周新增 4B（魔理沙 + 爱丽丝）路线讨论，自带录像。\n\n报名截止：周三 18:00。报名表见 #活动日程。',
};

const GROUP_MSGS = [
  { who: '咲夜', t: '20:54', msg: '今晚有人想打 Lunatic 4B 吗？我录像看了一晚上有点想自己试' },
  { who: '魔理沙', t: '20:55', msg: '我可以陪打 但是 5 面我经常死在 Reisen 那张符卡' },
  { who: '咲夜', t: '20:55', msg: '那张符卡其实是规律弹 我录屏给你看下', samegroup: true },
  { kind: 'embed', t: '20:56' },
  { who: '幽幽子', t: '21:00', msg: '@everyone 集训开始 上语音吧', mention: 'everyone' },
];

function ChannelRow({ item, type, index = 0 }) {
  const lead = type === 'voice'
    ? <Lu name="volume-2" size={13} color="var(--fg-2)" />
    : <span style={{ color: 'var(--fg-2)', fontWeight: 500, fontSize: 14, width: 14, textAlign: 'center' }}>#</span>;
  const tail = type === 'voice'
    ? (item.count > 0 ? <span className="mono num" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>{item.count}/12</span> : null)
    : (item.unread ? <BdgG count={item.unread} /> : item.tag ? <span className="cjk" style={{ fontSize: 9.5, color: 'var(--fg-2)', padding: '1px 6px', border: '1px solid var(--border)', borderRadius: 3, background: 'var(--bg-1)' }}>{item.tag}</span> : null);
  return (
    <RowG active={item.active} leading={lead} trailing={tail} animateIn index={index}>
      <span className="cjk" style={{ fontSize: 12.5, fontWeight: item.active ? 600 : 500, color: item.active ? 'var(--fg-0)' : 'var(--fg-1)' }}>{item.label}</span>
    </RowG>
  );
}

function VoiceUserChip({ name, speaking }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px 3px 4px', borderRadius: 999, marginLeft: 22, marginTop: 2, background: 'transparent' }}>
      <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-2)', border: `1px solid ${speaking ? 'var(--fg-1)' : 'var(--border)'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: 'var(--fg-1)' }} className="cjk">{name.slice(0,1)}</span>
      <span className="cjk" style={{ fontSize: 11, color: speaking ? 'var(--fg-0)' : 'var(--fg-1)', fontWeight: speaking ? 600 : 500 }}>{name}</span>
      {speaking ? <span className="anim-mic-pulse" style={{ display: 'inline-flex' }}><Lu name="mic" size={9} color="var(--fg-1)" /></span> : null}
    </div>
  );
}

function RoomShareEmbed({ visibility = 'public' }) {
  const isPublic = visibility === 'public';
  const isPwd = visibility === 'pwd';
  const isFull = visibility === 'full';
  return (
    <div style={{
      maxWidth: 480, marginTop: 4, padding: 12, borderRadius: 'var(--r-md)',
      background: 'var(--bg-1)',
      border: '1px solid var(--border)',
      borderLeft: '2px solid var(--accent)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="uppercase-tag" style={{ color: 'var(--accent)' }}>OFFICIAL · TH08 · ROOM-SHARE</span>
        <span style={{ flex: 1 }} />
        {isPublic && <span className="cjk" style={{ fontSize: 10.5, color: 'var(--status-online)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--status-online)' }} />公开</span>}
        {isPwd && <span className="cjk" style={{ fontSize: 10.5, color: 'var(--fg-2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Lu name="lock" size={10} />密码</span>}
        {isFull && <span className="cjk" style={{ fontSize: 10.5, color: 'var(--status-warn)' }}>已满员</span>}
      </div>
      <div>
        <div className="cjk" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-0)', fontFamily: 'var(--font-display)' }}>
          永夜抄 Lunatic · 4B 路线练习
        </div>
        <div className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-2)', marginTop: 2 }}>
          <span style={{ color: 'var(--fg-1)', fontWeight: 600 }}>主</span> 咲夜 · CN-East · 28ms · 创建 2 分钟前
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {['Y','M','S','R'].map((c, i) => (
            <span key={i} className="cjk" style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--bg-2)', border: '1px solid var(--bg-1)',
              marginLeft: i === 0 ? 0 : -6,
              fontSize: 10, fontWeight: 600, color: 'var(--fg-1)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>{c}</span>
          ))}
        </div>
        <span className="mono" style={{ fontSize: 11, color: 'var(--fg-1)', fontWeight: 600 }}>
          {isFull ? '6/6' : '4/6'}
        </span>
        <span style={{ height: 12, width: 1, background: 'var(--border)' }} />
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>Lunatic · 3 lives · AES-256</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {isFull ? (
          <>
            <BtnG variant="secondary" size="sm" disabled style={{ flex: 1 }}><span className="cjk">已满员</span></BtnG>
            <BtnG variant="ghost" size="sm"><span className="cjk">围观</span></BtnG>
          </>
        ) : (
          <>
            <BtnG variant="primary" size="sm" style={{ flex: 1 }}>
              {isPwd ? <><Lu name="lock" size={11} /><span className="cjk" style={{ marginLeft: 4 }}>输入密码加入</span></> : <span className="cjk">立即加入</span>}
            </BtnG>
            <BtnG variant="ghost" size="sm"><Lu name="copy" size={11} /></BtnG>
          </>
        )}
      </div>
    </div>
  );
}

function Group({ theme = 'dark' }) {
  return (
    <div className={`thp theme-${theme} anim-page-in`} style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg-0)', overflow: 'hidden', borderRadius: 'var(--r-lg)' }}>
      <RailG active="yegumi" />
      {/* Col 2 — Channels */}
      <aside style={{ width: 240, background: 'var(--bg-1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Banner — flat bg-2 + 2px accent left border */}
        <div style={{
          padding: '14px 14px 12px',
          background: 'var(--bg-2)',
          borderBottom: '1px solid var(--border)',
          borderLeft: '2px solid var(--accent)',
        }}>
          <div className="cjk" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-0)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{GROUP.name}</div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 2 }}>@{GROUP.handle} · since {GROUP.established}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-1)' }}>
              <span style={{ color: 'var(--fg-0)', fontWeight: 700 }}>{GROUP.online}</span><span style={{ color: 'var(--fg-3)' }}> / {GROUP.members} </span>online
            </span>
            <span style={{ flex: 1 }} />
            <button title="搜索" style={{ width: 22, height: 22, border: 'none', background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer', borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="search" size={12} /></button>
            <button title="群组设置" style={{ width: 22, height: 22, border: 'none', background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer', borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="chevron-down" size={12} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
          {CATS.map(cat => (
            <div key={cat.id} style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingInline: 8, marginBottom: 2 }}>
                <Lu name="chevron-down" size={10} color="var(--fg-3)" />
                <span className="cjk uppercase-tag" style={{ color: 'var(--fg-2)', flex: 1 }}>{cat.label}</span>
                <button style={{ width: 16, height: 16, border: 'none', background: 'transparent', color: 'var(--fg-3)', cursor: 'pointer' }}><Lu name="plus" size={11} /></button>
              </div>
              <div>
                {cat.items.map((item, j) => (
                  <div key={item.id}>
                    <ChannelRow item={item} type={cat.id === 'voice' ? 'voice' : 'text'} index={j} />
                    {cat.id === 'voice' && item.id === 'v1' && (
                      <div style={{ marginBottom: 4 }}>
                        <VoiceUserChip name="幽幽子" speaking />
                        <VoiceUserChip name="妖梦" />
                        <VoiceUserChip name="魔理沙" speaking />
                        <VoiceUserChip name="爱丽丝" />
                        <VoiceUserChip name="蕾米莉亚" />
                      </div>
                    )}
                    {cat.id === 'voice' && item.id === 'v3' && (
                      <div style={{ marginBottom: 4 }}>
                        <VoiceUserChip name="帕秋莉" />
                        <VoiceUserChip name="十六夜咲夜" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <IdG />
      </aside>
      {/* Col 3 — Channel content */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-0)' }}>
        <div style={{ height: 48, paddingInline: 18, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--fg-2)', fontSize: 16, fontWeight: 500 }}>#</span>
          <span className="cjk" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-0)' }}>永夜抄研究</span>
          <span style={{ width: 1, height: 16, background: 'var(--border)' }} />
          <span className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>Lunatic 路线、符卡处理、录像点评</span>
          <span style={{ flex: 1 }} />
          <button style={{ width: 26, height: 26, border: 'none', background: 'transparent', color: 'var(--fg-2)', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="bell" size={13} /></button>
          <button style={{ width: 26, height: 26, border: 'none', background: 'transparent', color: 'var(--fg-2)', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="pin" size={13} /></button>
          <button style={{ width: 26, height: 26, border: 'none', background: 'transparent', color: 'var(--fg-2)', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="users" size={13} /></button>
          <div style={{ height: 26, width: 180, background: 'var(--bg-2)', borderRadius: 6, border: '1px solid var(--border)', paddingInline: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lu name="search" size={12} color="var(--fg-2)" />
            <span className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>搜索消息</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
          {/* Pinned announcement */}
          <div style={{ margin: '14px 18px 8px', padding: 14, background: 'var(--bg-1)', border: '1px solid var(--border)', borderLeft: '2px solid var(--accent)', borderRadius: 'var(--r-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Lu name="pin" size={12} color="var(--accent)" />
              <span className="uppercase-tag" style={{ color: 'var(--accent)' }}>置顶公告</span>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{ANNOUNCEMENT.pinnedBy} · {ANNOUNCEMENT.time}</span>
            </div>
            <div className="cjk" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-0)', fontFamily: 'var(--font-display)' }}>{ANNOUNCEMENT.title}</div>
            <div className="cjk" style={{ fontSize: 12.5, color: 'var(--fg-1)', marginTop: 6, lineHeight: 1.65, whiteSpace: 'pre-line' }}>{ANNOUNCEMENT.body}</div>
          </div>
          {/* Messages */}
          <div style={{ padding: '8px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {GROUP_MSGS.map((m, i) => {
              if (m.kind === 'embed') return (
                <div key={i} style={{ display: 'flex', gap: 10, paddingLeft: 50, marginTop: 4 }}>
                  <RoomShareEmbed visibility="public" />
                </div>
              );
              return <CMG key={i} msg={m} samegroup={m.samegroup} />;
            })}
            {/* New message divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', marginTop: 4 }}>
              <span style={{ height: 1, background: 'var(--accent)', flex: 1, opacity: 0.5 }} />
              <span className="cjk uppercase-tag" style={{ color: 'var(--accent)' }}>新消息</span>
              <span style={{ height: 1, background: 'var(--accent)', flex: 1, opacity: 0.5 }} />
            </div>
            <CMG msg={{ who: '妖梦', t: '21:01', msg: '我去 v1 了' }} />
          </div>
        </div>
        <div style={{ padding: '6px 18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-1)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-strong)', paddingInline: 12, height: 40 }}>
            <Lu name="plus" size={14} color="var(--fg-2)" />
            <input className="cjk" placeholder="发个消息到 #永夜抄研究" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg-0)', fontSize: 13 }} />
            <Lu name="at-sign" size={13} color="var(--fg-2)" />
            <Lu name="image" size={13} color="var(--fg-2)" />
            <Lu name="smile" size={13} color="var(--fg-2)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span className="cjk" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>支持 Markdown · /room 分享当前房间 · @ 提及</span>
          </div>
        </div>
      </main>
      {/* Col 4 — Embed states sidebar */}
      <aside style={{ width: 308, background: 'var(--bg-1)', borderLeft: '1px solid var(--border)', flexShrink: 0, padding: 16, overflowY: 'auto' }}>
        <div className="uppercase-tag" style={{ color: 'var(--fg-2)' }}>Room-Share · 三种状态</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
          <RoomShareEmbed visibility="public" />
          <RoomShareEmbed visibility="pwd" />
          <RoomShareEmbed visibility="full" />
        </div>
        <div style={{ marginTop: 18, padding: 12, border: '1px dashed var(--border)', borderRadius: 'var(--r-md)' }}>
          <div className="uppercase-tag" style={{ color: 'var(--fg-2)' }}>触发方式</div>
          <div className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-1)', marginTop: 6, lineHeight: 1.7 }}>
            在任意频道输入 <span className="mono" style={{ color: 'var(--accent)', background: 'var(--bg-2)', padding: '1px 5px', borderRadius: 3 }}>/room</span> 即可分享当前房间。<br/>
            或从房间右上角 <Lu name="copy" size={11} /> 复制链接，粘贴自动展开。
          </div>
        </div>
      </aside>
    </div>
  );
}
window.Group = Group;
