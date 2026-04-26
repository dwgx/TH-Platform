/* global React, UI, SHARED, Lu */
const { useState: useStateR } = React;
const { Button: BtnR, Avatar: AvR, Badge: BdgR, Tag: TagR } = UI;
const { ServerRail: RailR, Row: RowR, SectionLabel: SLR, Tabs: TabsR, IdentityCard: IdR, ChatMessage: CMR, StatusDot: SDR } = SHARED;

const SEATS = [
  { idx: 1, name: '幽幽子', handle: 'yuyuko', status: 'online', role: '正常', char: '灵梦', mono: '灵', ready: true },
  { idx: 2, name: '妖梦',   handle: 'youmu',  status: 'online', role: '正常', char: '魔理沙', mono: '魔', ready: true },
  { idx: 3, name: '咲夜',   handle: 'sakuya', status: 'online', role: '正常', char: '咲夜', mono: '咲', ready: true },
  { idx: 4, name: '魔理沙', handle: 'marisa', status: 'away',   role: '观战', char: null,    mono: null, ready: false },
  { idx: 5, name: null }, { idx: 6, name: null },
];
const SPECTATORS = ['小野塚小町','十六夜咲夜','博丽灵梦','雾雨魔理沙','蕾米莉亚','爱丽丝','帕秋莉','藤原妹红'];
const ROOM_CHAT = [
  { kind: 'sys', t: '21:00', text: '妖梦 加入了 #2 号位' },
  { kind: 'sys', t: '21:04', text: '幽幽子 选择了 灵梦' },
  { who: '幽幽子', t: '21:02', msg: '今晚打 Lunatic，先适应一下手感' },
  { who: '妖梦',   t: '21:03', msg: '稳，我用魔理沙' },
  { who: '咲夜',   t: '21:05', msg: '@youmu 你不是要打吗，怎么观战了' , mention: 'youmu' },
];

function CharPlate({ mono, isActive }) {
  return (
    <div style={{
      width: 84, height: 84, borderRadius: 10,
      background: 'var(--bg-2)',
      border: `1px ${mono ? 'solid' : 'dashed'} ${isActive ? 'var(--border-strong)' : 'var(--border)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {mono ? (
        <span className="cjk" style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg-1)' }}>{mono}</span>
      ) : (
        <span className="cjk" style={{ fontSize: 10, color: 'var(--fg-3)', textAlign: 'center', lineHeight: 1.4 }}>未选择<br/>角色</span>
      )}
    </div>
  );
}

function RoleChipR({ value, options, disabled }) {
  return (
    <div style={{ display: 'inline-flex', background: 'var(--bg-2)', borderRadius: 999, padding: 2, border: '1px solid var(--border)' }}>
      {options.map(o => (
        <button key={o} disabled={disabled} style={{
          height: 20, paddingInline: 8, borderRadius: 999, border: 'none',
          background: value === o ? 'var(--bg-1)' : 'transparent',
          color: value === o ? 'var(--fg-0)' : 'var(--fg-2)',
          fontSize: 10.5, fontWeight: 600, fontFamily: 'var(--font-sans)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}><span className="cjk">{o}</span></button>
      ))}
    </div>
  );
}

function SeatCard({ seat, isHost, index = 0 }) {
  if (!seat.name) {
    return (
      <div className="anim-row-in" style={{ height: 196, padding: 14, borderRadius: 'var(--r-md)', border: '1px dashed var(--border-strong)', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, '--i': index }}>
        <Lu name="user-plus" size={20} color="var(--fg-3)" />
        <div className="cjk" style={{ fontSize: 12, color: 'var(--fg-2)', fontWeight: 600 }}>邀请玩家</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>SEAT #{seat.idx}</div>
      </div>
    );
  }
  return (
    <div className="anim-row-in" style={{
      height: 196, padding: 14, borderRadius: 'var(--r-md)',
      background: 'var(--bg-1)',
      border: `1px solid ${seat.ready ? 'var(--border-strong)' : 'var(--border)'}`,
      display: 'flex', flexDirection: 'column', gap: 10, position: 'relative',
      transition: 'border-color var(--duration-fast) var(--ease-out-quart)',
      '--i': index,
    }}>
      <div className="mono" style={{ position: 'absolute', top: 10, right: 12, fontSize: 10, color: 'var(--fg-3)' }}>#{seat.idx}</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
          <AvR size={42} name={seat.name} status={seat.status} />
          <div style={{ minWidth: 0, textAlign: 'center', width: '100%' }}>
            <div className="cjk" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-0)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {seat.name}
              {isHost ? <Lu name="crown" size={11} color="var(--fg-2)" /> : null}
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-2)' }}>@{seat.handle}</div>
          </div>
        </div>
        <CharPlate mono={seat.mono} isActive={seat.ready} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
        <RoleChipR value={seat.role} options={['正常','观战','缺席']} disabled={!isHost} />
        <span className={seat.ready ? 'mono num anim-ready' : 'mono num'} style={{
          fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 4,
          background: seat.ready ? 'var(--bg-3)' : 'transparent',
          color: seat.ready ? 'var(--fg-0)' : 'var(--fg-3)',
          border: '1px solid',
          borderColor: seat.ready ? 'var(--accent)' : 'var(--border)',
          letterSpacing: '0.06em',
        }}>{seat.ready ? 'READY' : 'WAITING'}</span>
      </div>
    </div>
  );
}

function ParamRowR({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
      <span className="cjk" style={{ fontSize: 12, color: 'var(--fg-2)' }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{children}</span>
    </div>
  );
}

function DiffRadio({ value, disabled }) {
  return (
    <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
      {['Easy','Normal','Hard','Lunatic','Extra'].map(o => (
        <button key={o} disabled={disabled} style={{
          height: 24, paddingInline: 9, borderRadius: 6, border: '1px solid',
          background: value === o ? 'var(--bg-3)' : 'var(--bg-2)',
          borderColor: value === o ? 'var(--border-strong)' : 'var(--border)',
          color: value === o ? 'var(--fg-0)' : 'var(--fg-2)',
          fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}>{o}</button>
      ))}
    </div>
  );
}

function StepperR({ value }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, height: 26, overflow: 'hidden' }}>
      <button style={{ width: 24, height: 26, border: 'none', background: 'transparent', color: 'var(--fg-1)', cursor: 'pointer' }}>−</button>
      <span className="mono" style={{ width: 28, textAlign: 'center', fontSize: 12, color: 'var(--fg-0)', fontWeight: 600 }}>{value}</span>
      <button style={{ width: 24, height: 26, border: 'none', background: 'transparent', color: 'var(--fg-1)', cursor: 'pointer' }}>+</button>
    </div>
  );
}

function ParamPanel() {
  const [tab, setTab] = useStateR('basic');
  return (
    <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 16px 0' }}>
        <div className="cjk" style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-0)', marginBottom: 10 }}>对局参数</div>
        <TabsR dense
          tabs={[{id:'basic',label:<span className="cjk">基础</span>},{id:'adv',label:<span className="cjk">进阶</span>},{id:'net',label:<span className="cjk">网络</span>},{id:'ac',label:<span className="cjk">反作弊</span>}]}
          active={tab} onChange={setTab} />
      </div>
      <div style={{ padding: '6px 16px 16px', overflowY: 'auto' }}>
        {tab === 'basic' && (<>
          <ParamRowR label="难度"><DiffRadio value="Lunatic" /></ParamRowR>
          <ParamRowR label="模式">
            <button style={{ height: 26, paddingInline: 10, gap: 6, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--fg-0)', fontSize: 11.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}><span className="cjk">Standard</span><Lu name="chevron-down" size={12} /></button>
          </ParamRowR>
          <ParamRowR label="最大 Lives"><StepperR value={3} /></ParamRowR>
          <ParamRowR label="最大 Bombs"><StepperR value={3} /></ParamRowR>
          <ParamRowR label="随机种子">
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-1)', background: 'var(--bg-2)', padding: '3px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>0x4F2A91C7</span>
            <button style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--fg-1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="dices" size={13} /></button>
          </ParamRowR>
        </>)}
        {tab === 'net' && (<>
          <ParamRowR label="连接方式">
            <span style={{ display: 'inline-flex', gap: 4 }}>
              {['P2P 直连','Relay','LAN','FRP'].map((c, i) => (
                <span key={c} className="cjk" style={{ height: 24, paddingInline: 8, display: 'inline-flex', alignItems: 'center', borderRadius: 6, background: i === 0 ? 'var(--bg-3)' : 'var(--bg-2)', color: i === 0 ? 'var(--fg-0)' : 'var(--fg-2)', border: '1px solid var(--border)', fontSize: 10.5, fontWeight: 600 }}>{c}</span>
              ))}
            </span>
          </ParamRowR>
          <ParamRowR label="NAT 类型"><span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-0)' }}>Full Cone</span><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-online)' }} /></ParamRowR>
          <ParamRowR label="当前 RTT"><span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-0)', fontWeight: 600 }}>24 ms</span></ParamRowR>
          <ParamRowR label="MTU"><span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-1)' }}>1492</span></ParamRowR>
          <ParamRowR label="加密"><span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-1)', padding: '2px 6px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 4 }}>AES-256-GCM</span></ParamRowR>
        </>)}
        {tab === 'ac' && (<>
          <ParamRowR label="DLL 签名"><span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-1)' }}>SHA256:af3c…91d2</span></ParamRowR>
          <ParamRowR label="哈希校验"><Lu name="check" size={13} color="var(--status-online)" /><span className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-1)' }}>已通过</span></ParamRowR>
          <ParamRowR label="最近注入"><span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-1)' }}>20:58:14</span></ParamRowR>
          <ParamRowR label="完整性评分">
            <span style={{ width: 80, height: 4, background: 'var(--bg-2)', borderRadius: 999, overflow: 'hidden' }}>
              <span style={{ display: 'block', width: '98%', height: '100%', background: 'var(--fg-1)' }} />
            </span>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-0)', fontWeight: 600 }}>98 / 100</span>
          </ParamRowR>
        </>)}
        {tab === 'adv' && (<>
          <ParamRowR label="自机机型 锁定"><span className="cjk" style={{ fontSize: 11, color: 'var(--fg-2)' }}>关闭</span></ParamRowR>
          <ParamRowR label="符卡同步频率"><span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-0)' }}>60 Hz</span></ParamRowR>
          <ParamRowR label="掉线宽限"><span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-0)' }}>10s</span></ParamRowR>
          <ParamRowR label="允许中途加入"><span className="cjk" style={{ fontSize: 11, color: 'var(--fg-2)' }}>否</span></ParamRowR>
        </>)}
      </div>
    </div>
  );
}

function RoomTopBar() {
  return (
    <div style={{ height: 56, paddingInline: 18, display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--border)', background: 'var(--bg-0)' }}>
      <button style={{ height: 28, paddingInline: 10, gap: 6, display: 'inline-flex', alignItems: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg-1)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}><Lu name="arrow-left" size={13} /><span className="cjk">返回大厅</span></button>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
        <div className="cjk" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-0)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
          永夜抄 PvP — 北京 <span className="mono" style={{ color: 'var(--fg-3)', fontSize: 12, fontWeight: 600 }}>#4912</span>
        </div>
        <div className="cjk" style={{ fontSize: 11, color: 'var(--fg-2)', display: 'inline-flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
          <span className="uppercase-tag" style={{ color: 'var(--accent)' }}>OFFICIAL · TH08</span>
          <span style={{ color: 'var(--fg-3)' }}>·</span>
          <span><span style={{ color: 'var(--fg-1)' }}>主</span> 幽幽子</span><span style={{ color: 'var(--fg-3)' }}>·</span>
          <span className="mono">24ms</span><span style={{ color: 'var(--fg-3)' }}>·</span>
          <span className="mono" style={{ color: 'var(--fg-1)', fontWeight: 600 }}>4/6</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={{ height: 28, paddingInline: 10, gap: 6, display: 'inline-flex', alignItems: 'center', borderRadius: 999, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg-1)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-online)' }} /><span className="cjk">公开 · 直接加入</span><Lu name="chevron-down" size={12} /></button>
        <button title="复制邀请" style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg-1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="copy" size={13} /></button>
        <button title="房间设置" style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg-1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="settings" size={13} /></button>
      </div>
    </div>
  );
}

function RoomBottomBar({ state = 'lobby' }) {
  const cta = state === 'loading' ? { label: '正在加载…', spin: true, disabled: true, glow: false }
    : state === 'post' ? { label: '再来一局 REMATCH', glow: false }
    : { label: '开始对局 START · 3 ready', glow: true };
  return (
    <div style={{ height: 76, paddingInline: 18, display: 'flex', alignItems: 'center', gap: 14, borderTop: '1px solid var(--border)', background: 'var(--bg-0)' }}>
      <div style={{ flex: 1, minWidth: 0, height: 44, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', paddingInline: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <AvR size={24} name="咲夜" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="cjk" style={{ fontSize: 11, color: 'var(--fg-2)' }}><span style={{ color: 'var(--fg-1)', fontWeight: 600 }}>咲夜</span> · 21:05</div>
          <div className="cjk" style={{ fontSize: 12, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ background: 'var(--accent-soft)', color: 'var(--fg-0)', padding: '0 5px', borderRadius: 4, fontWeight: 600, marginRight: 4, border: '1px solid var(--border-strong)' }}>@youmu</span>
            你不是要打吗，怎么观战了
          </div>
        </div>
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>展开 #room-4912 →</span>
      </div>
      <button disabled={cta.disabled} className={`btn-pressable ${cta.glow ? 'anim-cta-glow' : ''}`} style={{ minWidth: 220, height: 44, paddingInline: 22, borderRadius: 'var(--r-md)', background: 'var(--accent)', color: 'var(--bg-0)', border: '1px solid var(--accent)', fontSize: 13, fontWeight: 700, cursor: cta.disabled ? 'not-allowed' : 'pointer', opacity: cta.disabled ? 0.55 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-sans)' }}>
        {cta.spin ? <span className="spinner" style={{ width: 12, height: 12, borderColor: 'rgba(0,0,0,0.25)', borderTopColor: 'var(--bg-0)' }} /> : null}
        <span className="cjk">{cta.label}</span>
      </button>
      <button className="btn-pressable" style={{ height: 44, paddingInline: 14, borderRadius: 'var(--r-md)', background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}><span className="cjk">离开房间</span></button>
    </div>
  );
}

function ChatDrawerR() {
  return (
    <aside style={{ width: 320, background: 'var(--bg-1)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-0)' }}># room-4912</div>
          <div className="cjk" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>房间私聊 · 4 人在线</div>
        </div>
        <button style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="x" size={14} /></button>
      </div>
      <div style={{ margin: 12, padding: 10, borderRadius: 'var(--r-md)', background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="uppercase-tag" style={{ color: 'var(--fg-2)' }}>对局信息 · 最近 5 条</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          {['幽幽子 选择了 灵梦','妖梦 选择了 魔理沙','咲夜 选择了 咲夜','魔理沙 加入观战','难度调整为 Lunatic'].map((s, i) => (
            <div key={i} className="cjk" style={{ fontSize: 11, color: 'var(--fg-1)', display: 'flex', gap: 8 }}>
              <span className="mono" style={{ color: 'var(--fg-3)', fontSize: 10 }}>21:0{i+1}</span><span>{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ROOM_CHAT.map((m, i) => {
          if (m.kind === 'sys') return (
            <div key={i} className="cjk" style={{ fontSize: 11, color: 'var(--fg-3)', textAlign: 'center', padding: '4px 0' }}>
              <span className="mono" style={{ marginRight: 6 }}>{m.t}</span>{m.text}
            </div>
          );
          const prev = ROOM_CHAT[i-1];
          const samegroup = prev && prev.kind !== 'sys' && prev.who === m.who;
          return <CMR key={i} msg={m} samegroup={samegroup} />;
        })}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-strong)', paddingInline: 10, height: 34 }}>
          <input className="cjk" placeholder="发个消息到 #room-4912" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg-0)', fontSize: 12.5 }} />
          <button style={{ width: 22, height: 22, border: 'none', background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="smile" size={13} /></button>
          <button style={{ width: 24, height: 24, border: 'none', background: 'var(--accent)', color: 'var(--bg-0)', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lu name="send-horizontal" size={12} /></button>
        </div>
      </div>
    </aside>
  );
}

function ResultsCard() {
  return (
    <div style={{ maxWidth: 540, margin: '24px auto', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <span className="uppercase-tag" style={{ color: 'var(--accent)' }}>SESSION ENDED</span>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>21:42:08 · 用时 18:24</span>
      </div>
      <h2 className="cjk" style={{ margin: '6px 0 0', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--fg-0)', letterSpacing: '-0.015em' }}>
        妖梦 通关 永夜抄 <span style={{ color: 'var(--fg-2)' }}>2 面</span>
      </h2>
      <div className="cjk" style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4 }}>使用 魔理沙·B装备 · Lunatic · 3 lives</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 18 }}>
        {[['得分','4,128,920,470'],['用时','18:24'],['Lives / Death','2 / 1']].map(([k,v]) => (
          <div key={k} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
            <div className="cjk" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>{k}</div>
            <div className="mono" style={{ fontSize: 15, color: 'var(--fg-0)', fontWeight: 600, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <div className="uppercase-tag" style={{ color: 'var(--fg-2)', marginBottom: 8 }}>关键符卡</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[['04:12','蝶符「Vivid Butterfly」','1 try','online'],['08:45','宿灵「Death Ageha」','2 try','warn'],['13:01','霊符「无寿之命」','missed','error'],['17:50','宿命「Riding the Dragon」','1 try','online']].map(([t, n, r, st], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 6, border: '1px solid var(--border)' }}>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', width: 40 }}>{t}</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: `var(--status-${st})` }} />
              <span className="cjk" style={{ flex: 1, fontSize: 12, color: 'var(--fg-0)', fontWeight: 600 }}>{n}</span>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-1)' }}>{r}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <BtnR variant="primary" size="lg" style={{ flex: 1 }}><span className="cjk">再来一局</span></BtnR>
        <BtnR variant="secondary" size="lg" style={{ flex: 1 }}><span className="cjk">返回房间席位</span></BtnR>
      </div>
    </div>
  );
}

function Room({ theme = 'dark', state = 'lobby' }) {
  return (
    <div className={`thp theme-${theme} anim-page-in`} style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg-0)', overflow: 'hidden', borderRadius: 'var(--r-lg)' }}>
      <RailR active="th08" />
      <aside style={{ width: 240, background: 'var(--bg-1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border)' }}>
          <div className="uppercase-tag" style={{ color: 'var(--fg-2)' }}>当前房间</div>
          <div className="cjk" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-0)', marginTop: 4, fontFamily: 'var(--font-display)' }}>永夜抄 PvP — 北京</div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 2 }}>#4912 · 4/6</div>
        </div>
        <div style={{ padding: 10, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <SLR>本房频道</SLR>
            <div style={{ marginTop: 6 }}>
              <RowR active leading={<span style={{ color: 'var(--fg-2)', fontWeight: 500, fontSize: 14, width: 14, textAlign: 'center' }}>#</span>}>
                <span className="cjk" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-0)' }}>room-4912</span>
              </RowR>
              <RowR leading={<span style={{ color: 'var(--fg-2)', fontWeight: 500, fontSize: 14, width: 14, textAlign: 'center' }}>#</span>}>
                <span className="cjk" style={{ fontSize: 12.5 }}>战术讨论</span>
              </RowR>
            </div>
          </div>
          <div>
            <SLR>房间信息</SLR>
            <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['难度','Lunatic'],['模式','Standard'],['Lives','3'],['加密','AES-256']].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span className="cjk" style={{ color: 'var(--fg-2)' }}>{k}</span>
                  <span className="mono" style={{ color: 'var(--fg-0)', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SLR right={<span className="mono" style={{ fontSize: 10, color: 'var(--status-online)' }}>3 ready</span>}>队伍</SLR>
            <div style={{ marginTop: 6 }}>
              {SEATS.filter(s => s.name).map(s => (
                <RowR key={s.idx}
                  leading={<AvR size={22} name={s.name} status={s.status} />}
                  trailing={s.idx === 1 ? <Lu name="crown" size={11} color="var(--fg-2)" /> : <SDR status={s.ready ? 'online' : 'idle'} />}>
                  <span className="cjk" style={{ fontSize: 12, color: 'var(--fg-0)' }}>{s.name}</span>
                </RowR>
              ))}
            </div>
          </div>
        </div>
        <IdR />
      </aside>
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <RoomTopBar />
        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
          {state === 'post' ? (
            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-0)' }}><ResultsCard /></div>
          ) : (
            <>
              <section style={{ flex: '1 1 60%', minWidth: 0, padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className="cjk" style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--fg-0)' }}>席位 <span className="mono" style={{ color: 'var(--fg-2)', fontSize: 12, fontWeight: 600 }}>4/6</span></h3>
                  <span className="cjk" style={{ fontSize: 11, color: 'var(--fg-2)' }}>主机可调整 · 拖拽换位</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {SEATS.map((s, i) => <SeatCard key={s.idx} seat={s} isHost={s.idx === 1} index={i} />)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span className="cjk" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg-1)' }}>观战席</span>
                    <span style={{ height: 1, background: 'var(--border)', flex: 1 }} />
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>20</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {SPECTATORS.slice(0, 8).map((n, i) => <AvR key={i} size={26} name={n} />)}
                    <span className="mono" style={{ height: 26, paddingInline: 9, borderRadius: 999, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg-1)', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>+12</span>
                  </div>
                </div>
              </section>
              <section style={{ flex: '1 1 40%', minWidth: 320, padding: '18px 20px 18px 0', overflow: 'hidden' }}>
                <ParamPanel />
              </section>
            </>
          )}
        </div>
        <RoomBottomBar state={state} />
      </main>
      <ChatDrawerR />
    </div>
  );
}
window.Room = Room;
