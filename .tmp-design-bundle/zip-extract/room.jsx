/* global React, UI, SHARED */
// Room page — between-matches lounge. LOBBY state primary, POST alt.

const { useState: useStateR } = React;
const { Button: BtnR, Avatar: AvR, Badge: BdgR, Input: InpR, Icon: IcR } = UI;
const { ServerRail: RailR, Row: RowR, SectionLabel: SLR, Divider: DivR, Tabs: TabsR, IdentityCard: IdR, ChatMessage: CMR, StatusDot: SDR } = SHARED;

// ---- mock data ----
const SEATS = [
  { idx: 1, name: '幽幽子', handle: 'yuyuko', status: 'online', role: '正常', char: '灵梦', ready: true },
  { idx: 2, name: '妖梦',   handle: 'youmu',  status: 'online', role: '正常', char: '魔理沙', ready: true },
  { idx: 3, name: '咲夜',   handle: 'sakuya', status: 'online', role: '正常', char: '咲夜', ready: true },
  { idx: 4, name: '魔理沙', handle: 'marisa', status: 'away',   role: '观战', char: null,    ready: false },
  { idx: 5, name: null },
  { idx: 6, name: null },
];
const SPECTATORS = [
  '小野塚小町','十六夜咲夜','博丽灵梦','雾雨魔理沙','蕾米莉亚','爱丽丝','帕秋莉','藤原妹红'
];

const ROOM_CHAT = [
  { kind: 'sys', t: '20:58', text: '幽幽子 创建了房间' },
  { kind: 'sys', t: '21:00', text: '妖梦 加入了 #2 号位' },
  { kind: 'sys', t: '21:01', text: '咲夜 加入了 #3 号位' },
  { who: '幽幽子', handle: 'yuyuko', t: '21:02', msg: '今晚打 Lunatic，先适应一下手感' },
  { who: '妖梦',   handle: 'youmu',  t: '21:03', msg: '稳，我用魔理沙' },
  { kind: 'sys', t: '21:04', text: '幽幽子 选择了 灵梦' },
  { kind: 'sys', t: '21:04', text: '妖梦 加入观战' },
  { who: '咲夜',   handle: 'sakuya', t: '21:05', msg: '@youmu 你不是要打吗，怎么观战了' , mention: 'youmu' },
];

// =========================================================
function CharPortrait({ char }) {
  // Solid pastel-tinted silhouette plate (no gradient, no photo).
  const tints = {
    '灵梦':   { bg: 'rgba(248,113,113,0.10)', stroke: 'rgba(248,113,113,0.6)' },
    '魔理沙': { bg: 'rgba(245,181,68,0.10)',  stroke: 'rgba(245,181,68,0.7)'  },
    '咲夜':   { bg: 'rgba(124,92,255,0.10)',  stroke: 'rgba(124,92,255,0.7)'  },
    '妖梦':   { bg: 'rgba(74,222,128,0.10)',  stroke: 'rgba(74,222,128,0.7)'  },
  };
  const t = char ? tints[char] : { bg: 'var(--bg-2)', stroke: 'var(--fg-3)' };
  return (
    <div style={{
      width: 84, height: 84, borderRadius: 12,
      background: t.bg,
      border: `1px ${char ? 'solid' : 'dashed'} ${t.stroke}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {char ? (
        <span className="cjk" style={{ fontSize: 14, fontWeight: 800, color: t.stroke, letterSpacing: '0.04em' }}>{char}</span>
      ) : (
        <span className="cjk" style={{ fontSize: 10, fontWeight: 600, color: 'var(--fg-3)', textAlign: 'center', lineHeight: 1.4 }}>
          未选择<br/>角色
        </span>
      )}
    </div>
  );
}

function RoleChip({ value, options, disabled }) {
  return (
    <div style={{ display: 'inline-flex', background: 'var(--bg-2)', borderRadius: 999, padding: 2, border: '1px solid var(--border)' }}>
      {options.map(o => (
        <button key={o} disabled={disabled} style={{
          height: 22, paddingInline: 9, borderRadius: 999, border: 'none',
          background: value === o ? 'var(--bg-1)' : 'transparent',
          color: value === o ? 'var(--fg-0)' : 'var(--fg-2)',
          fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: value === o ? 'var(--shadow-sm)' : 'none',
        }}>
          <span className="cjk">{o}</span>
        </button>
      ))}
    </div>
  );
}

function SeatCard({ seat, isHost }) {
  if (!seat.name) {
    return (
      <div style={{
        height: 200, padding: 14,
        borderRadius: 'var(--r-md)',
        border: '1.5px dashed var(--border-strong)',
        background: 'transparent',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--bg-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--fg-3)', fontSize: 20,
        }}>+</div>
        <div className="cjk" style={{ fontSize: 12, color: 'var(--fg-2)', fontWeight: 600 }}>邀请玩家</div>
        <div style={{ fontSize: 10.5, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>SEAT #{seat.idx}</div>
      </div>
    );
  }
  return (
    <div style={{
      height: 200, padding: 14,
      borderRadius: 'var(--r-md)',
      background: 'var(--bg-1)',
      border: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', gap: 10,
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>#{seat.idx}</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
          <AvR size={44} name={seat.name} status={seat.status} ring={isHost ? 2 : 0} ringColor="var(--warning)" />
          <div style={{ minWidth: 0, textAlign: 'center', width: '100%' }}>
            <div className="cjk" style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-0)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {seat.name}
              {isHost ? <span style={{ color: 'var(--warning)', fontSize: 10 }}>{IcR.crown}</span> : null}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>@{seat.handle}</div>
          </div>
        </div>
        <CharPortrait char={seat.char} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
        <RoleChip value={seat.role} options={['正常','观战','缺席']} disabled={!isHost} />
        <BdgR tone={seat.ready ? 'success' : 'neutral'} dot={seat.ready}>
          {seat.ready ? 'READY' : '待选角色'}
        </BdgR>
      </div>
    </div>
  );
}

function ParamRow({ label, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, padding: '12px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span className="cjk" style={{ fontSize: 12.5, color: 'var(--fg-2)', fontWeight: 500 }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{children}</span>
    </div>
  );
}

function DiffRadio({ value, onChange, disabled }) {
  const opts = ['Easy','Normal','Hard','Lunatic','Extra'];
  return (
    <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
      {opts.map(o => (
        <button key={o} disabled={disabled} onClick={() => onChange && onChange(o)} style={{
          height: 26, paddingInline: 10, borderRadius: 8, border: '1px solid',
          background: value === o ? 'var(--brand-soft)' : 'var(--bg-2)',
          borderColor: value === o ? 'var(--brand-ring)' : 'var(--border)',
          color: value === o ? 'var(--brand)' : 'var(--fg-1)',
          fontSize: 11.5, fontWeight: 600, fontFamily: 'var(--font-sans)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}>{o}</button>
      ))}
    </div>
  );
}

function Stepper({ value, disabled }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, height: 28, overflow: 'hidden' }}>
      <button disabled={disabled} style={{ width: 26, height: 28, border: 'none', background: 'transparent', color: 'var(--fg-1)', cursor: disabled ? 'not-allowed' : 'pointer' }}>−</button>
      <span style={{ width: 28, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-0)', fontWeight: 600 }}>{value}</span>
      <button disabled={disabled} style={{ width: 26, height: 28, border: 'none', background: 'transparent', color: 'var(--fg-1)', cursor: disabled ? 'not-allowed' : 'pointer' }}>+</button>
    </div>
  );
}

function NetChip({ active, children }) {
  return (
    <button style={{
      height: 26, paddingInline: 10, borderRadius: 8,
      background: active ? 'var(--brand-soft)' : 'var(--bg-2)',
      color: active ? 'var(--brand)' : 'var(--fg-1)',
      border: `1px solid ${active ? 'var(--brand-ring)' : 'var(--border)'}`,
      fontSize: 11, fontWeight: 600, cursor: 'pointer',
    }}>{children}</button>
  );
}

function ParamPanel({ isHost = true }) {
  const [tab, setTab] = useStateR('basic');
  const lock = !isHost ? <span style={{ color: 'var(--fg-3)', fontSize: 10 }}>{IcR.lock}</span> : null;
  return (
    <div style={{
      background: 'var(--bg-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      display: 'flex', flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{ padding: '14px 16px 0' }}>
        <div className="cjk" style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-0)', marginBottom: 10 }}>对局参数</div>
        <TabsR
          dense
          tabs={[
            { id: 'basic', label: <span className="cjk">基础</span> },
            { id: 'adv',   label: <span className="cjk">进阶</span> },
            { id: 'net',   label: <span className="cjk">网络</span> },
            { id: 'ac',    label: <span className="cjk">反作弊</span> },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>
      <div style={{ padding: '6px 16px 16px', overflowY: 'auto' }}>
        {tab === 'basic' && (
          <>
            <ParamRow label={<>难度 {lock}</>}><DiffRadio value="Lunatic" disabled={!isHost} /></ParamRow>
            <ParamRow label={<>模式 {lock}</>}>
              <button disabled={!isHost} style={{
                height: 28, paddingInline: 10, gap: 6, borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg-2)', color: 'var(--fg-0)', fontSize: 12, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center',
              }}><span className="cjk">Standard</span>{IcR.chevron}</button>
            </ParamRow>
            <ParamRow label={<>最大 Lives {lock}</>}><Stepper value={3} disabled={!isHost} /></ParamRow>
            <ParamRow label={<>最大 Bombs {lock}</>}><Stepper value={3} disabled={!isHost} /></ParamRow>
            <ParamRow label={<>随机种子 {lock}</>}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-1)', background: 'var(--bg-2)', padding: '4px 8px', borderRadius: 6 }}>0x4F2A91C7</span>
              <button disabled={!isHost} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: isHost ? 'pointer' : 'not-allowed', color: 'var(--fg-1)', fontSize: 13 }}>🎲</button>
            </ParamRow>
          </>
        )}
        {tab === 'net' && (
          <>
            <ParamRow label="连接方式">
              <span style={{ display: 'inline-flex', gap: 5 }}>
                <NetChip active>P2P 直连</NetChip>
                <NetChip>Relay</NetChip>
                <NetChip>LAN</NetChip>
                <NetChip>FRP</NetChip>
              </span>
            </ParamRow>
            <ParamRow label="NAT 类型"><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>Full Cone (Type 1)</span></ParamRow>
            <ParamRow label="当前 RTT"><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>24 ms</span></ParamRow>
            <ParamRow label="MTU"><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-0)' }}>1492</span></ParamRow>
            <ParamRow label="加密"><BdgR tone="success">AES-256-GCM</BdgR></ParamRow>
          </>
        )}
        {tab === 'ac' && (
          <>
            <ParamRow label="DLL 签名"><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-1)' }}>SHA256:af3c…91d2</span></ParamRow>
            <ParamRow label="哈希校验"><BdgR tone="success" dot>已通过</BdgR></ParamRow>
            <ParamRow label="最近注入"><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-1)' }}>20:58:14</span></ParamRow>
            <ParamRow label="完整性评分">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 80, height: 6, background: 'var(--bg-2)', borderRadius: 999, overflow: 'hidden' }}>
                  <span style={{ display: 'block', width: '98%', height: '100%', background: 'var(--success)' }} />
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-0)', fontWeight: 600 }}>98 / 100</span>
              </span>
            </ParamRow>
          </>
        )}
        {tab === 'adv' && (
          <>
            <ParamRow label="自机机型 锁定"><BdgR tone="warning">关闭</BdgR></ParamRow>
            <ParamRow label="符卡同步频率"><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-0)' }}>60 Hz</span></ParamRow>
            <ParamRow label="掉线宽限"><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-0)' }}>10s</span></ParamRow>
            <ParamRow label="允许中途加入"><BdgR tone="neutral">否</BdgR></ParamRow>
          </>
        )}
      </div>
    </div>
  );
}

// ---- Top bar ----
function RoomTopBar() {
  return (
    <div style={{
      height: 60, paddingInline: 20,
      display: 'flex', alignItems: 'center', gap: 16,
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-0)',
    }}>
      <button style={{
        height: 32, paddingInline: 10, gap: 6,
        display: 'inline-flex', alignItems: 'center',
        background: 'transparent', border: '1px solid var(--border)',
        borderRadius: 8, color: 'var(--fg-1)', cursor: 'pointer',
        fontSize: 12.5, fontWeight: 600,
      }}>← <span className="cjk">返回大厅</span></button>

      <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
        <div className="cjk" style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-0)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
          永夜抄 PvP — 北京 <span style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>#4912</span>
        </div>
        <div className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-2)', display: 'inline-flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
          <BdgR tone="brand" dot>官方</BdgR>
          <span>TH08</span><span style={{ color: 'var(--fg-3)' }}>·</span>
          <span><span style={{ color: 'var(--fg-1)', fontWeight: 600 }}>主机</span> 幽幽子</span><span style={{ color: 'var(--fg-3)' }}>·</span>
          <span><span style={{ color: 'var(--fg-1)', fontWeight: 600 }}>网络</span> <span style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>24ms</span></span><span style={{ color: 'var(--fg-3)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-1)', fontWeight: 600 }}>4/6</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button style={{
          height: 32, paddingInline: 12, gap: 6, display: 'inline-flex', alignItems: 'center',
          borderRadius: 999, background: 'var(--bg-2)', border: '1px solid var(--border)',
          color: 'var(--fg-1)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
          <span className="cjk">公开房间 · 直接加入</span>
          {IcR.chevron}
        </button>
        <button title="复制邀请" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg-1)', cursor: 'pointer' }}>📋</button>
        <button title="房间设置" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg-1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{IcR.cog}</button>
      </div>
    </div>
  );
}

// ---- Bottom action bar ----
function RoomBottomBar({ state = 'lobby', isHost = true, readyCount = 3 }) {
  const cta = state === 'loading'
    ? { label: '正在加载…', spin: true, disabled: true, variant: 'secondary' }
    : state === 'post'
    ? { label: '再来一局 REMATCH', disabled: false, variant: 'primary' }
    : isHost
    ? { label: `开始对局 START · ${readyCount} ready`, disabled: readyCount < 2, variant: 'primary' }
    : { label: '准备就绪 READY', toggle: true, variant: 'primary' };

  return (
    <div style={{
      height: 80, paddingInline: 20,
      display: 'flex', alignItems: 'center', gap: 16,
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-0)',
    }}>
      <div style={{
        flex: 1, minWidth: 0, height: 48,
        background: 'var(--bg-1)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)', paddingInline: 12,
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer',
      }}>
        <AvR size={26} name="咲夜" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="cjk" style={{ fontSize: 12, color: 'var(--fg-2)' }}>
            <span style={{ color: 'var(--fg-1)', fontWeight: 700 }}>咲夜</span> · 21:05
          </div>
          <div className="cjk" style={{ fontSize: 12.5, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ background: 'var(--brand-soft)', color: 'var(--brand)', padding: '0 5px', borderRadius: 5, fontWeight: 600, marginRight: 4 }}>@youmu</span>
            你不是要打吗，怎么观战了
          </div>
        </div>
        <span style={{ fontSize: 10.5, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>展开 #room-4912 →</span>
      </div>

      <button disabled={cta.disabled} style={{
        minWidth: 240, height: 48, paddingInline: 24,
        borderRadius: 'var(--r-md)',
        background: cta.variant === 'primary' ? 'linear-gradient(180deg, var(--brand) 0%, color-mix(in oklab, var(--brand) 86%, #000 14%) 100%)' : 'var(--bg-2)',
        color: cta.variant === 'primary' ? '#fff' : 'var(--fg-0)',
        border: cta.variant === 'primary' ? '1px solid color-mix(in oklab, var(--brand) 60%, #000 40%)' : '1px solid var(--border-strong)',
        boxShadow: cta.variant === 'primary' ? '0 1px 0 rgba(255,255,255,0.10) inset, 0 4px 14px var(--brand-soft)' : 'none',
        fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-sans)',
        cursor: cta.disabled ? 'not-allowed' : 'pointer',
        opacity: cta.disabled ? 0.7 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {cta.spin ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'thp-spin .8s linear infinite' }} /> : null}
        <span className="cjk">{cta.label}</span>
      </button>

      <button style={{
        height: 48, paddingInline: 16, borderRadius: 'var(--r-md)',
        background: 'transparent', border: '1px solid var(--border-strong)',
        color: 'var(--fg-1)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}><span className="cjk">离开房间</span></button>
    </div>
  );
}

// ---- Drawer (slide-in chat) ----
function ChatDrawer() {
  return (
    <aside style={{
      width: 360, background: 'var(--bg-1)',
      borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--fg-0)' }}># room-4912</div>
          <div className="cjk" style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 2 }}>房间私聊 · 4 人在线</div>
        </div>
        <button style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer' }}>×</button>
      </div>

      <div style={{
        margin: 12, padding: 10, borderRadius: 'var(--r-md)',
        background: 'var(--bg-2)', border: '1px solid var(--border)',
      }}>
        <div className="cjk" style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>@对局信息 · 最近 5 条</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          {[
            '幽幽子 选择了 灵梦',
            '妖梦 选择了 魔理沙',
            '咲夜 选择了 咲夜',
            '魔理沙 加入观战',
            '难度调整为 Lunatic',
          ].map((s, i) => (
            <div key={i} className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-1)', display: 'flex', gap: 8, lineHeight: 1.5 }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', fontSize: 10 }}>21:0{i+1}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 14px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ROOM_CHAT.map((m, i) => {
          if (m.kind === 'sys') {
            return (
              <div key={i} className="cjk" style={{ fontSize: 11, color: 'var(--fg-3)', textAlign: 'center', padding: '4px 0', fontFamily: 'var(--font-sans)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', marginRight: 6 }}>{m.t}</span>
                {m.text}
              </div>
            );
          }
          const prev = ROOM_CHAT[i-1];
          const samegroup = prev && prev.kind !== 'sys' && prev.who === m.who;
          return <CMR key={i} msg={m} samegroup={samegroup} />;
        })}
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--bg-2)', borderRadius: 'var(--r-md)',
          border: '1px solid var(--border)', paddingInline: 10, height: 36,
        }}>
          <input className="cjk" placeholder="发个消息到 #room-4912" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg-0)', fontSize: 13, fontFamily: 'var(--font-sans)' }} />
          <button style={{ width: 24, height: 24, border: 'none', background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer' }}>{IcR.smile}</button>
          <button style={{ width: 26, height: 26, border: 'none', background: 'var(--brand)', color: '#fff', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IcR.send}</button>
        </div>
      </div>
    </aside>
  );
}

// ---- POST results card ----
function ResultsCard() {
  return (
    <div style={{
      maxWidth: 560, margin: '24px auto',
      background: 'var(--bg-1)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: 28,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <BdgR tone="success" dot>本局结束</BdgR>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)' }}>21:42:08 · 用时 18:24</span>
      </div>
      <h2 className="cjk" style={{ margin: '6px 0 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--fg-0)', letterSpacing: '-0.015em' }}>
        妖梦 通关 永夜抄 <span style={{ color: 'var(--fg-1)' }}>2 面</span>
      </h2>
      <div className="cjk" style={{ fontSize: 12.5, color: 'var(--fg-2)', marginTop: 4 }}>使用 魔理沙·B装备 · Lunatic · 3 lives</div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18,
      }}>
        {[
          { k: '得分', v: '4,128,920,470', mono: true },
          { k: '用时', v: '18:24', mono: true },
          { k: '残机/Death', v: '2 / 1', mono: true },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
            <div className="cjk" style={{ fontSize: 11, color: 'var(--fg-2)', fontWeight: 600 }}>{s.k}</div>
            <div style={{ fontSize: 16, color: 'var(--fg-0)', fontWeight: 700, fontFamily: s.mono ? 'var(--font-mono)' : 'var(--font-sans)', marginTop: 2 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="cjk" style={{ fontSize: 11, color: 'var(--fg-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>关键符卡</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { t: '04:12', name: '蝶符「Vivid Butterfly」', r: '🟢 1 try' },
            { t: '08:45', name: '宿灵「Death Ageha」',     r: '🟡 2 try' },
            { t: '13:01', name: '霊符「无寿之命」',         r: '🔴 missed' },
            { t: '17:50', name: '宿命「Riding the Dragon」',r: '🟢 1 try' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', width: 44 }}>{s.t}</span>
              <span className="cjk" style={{ flex: 1, fontSize: 12.5, color: 'var(--fg-0)', fontWeight: 600 }}>{s.name}</span>
              <span style={{ fontSize: 11, color: 'var(--fg-1)', fontFamily: 'var(--font-mono)' }}>{s.r}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
        <BtnR variant="primary" size="lg" style={{ flex: 1 }}><span className="cjk">再来一局</span></BtnR>
        <BtnR variant="secondary" size="lg" style={{ flex: 1 }}><span className="cjk">返回房间席位</span></BtnR>
      </div>
    </div>
  );
}

// ---- Page composer ----
function Room({ theme = 'dark', state = 'lobby' }) {
  return (
    <div className={`thp theme-${theme}`} style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg-0)', overflow: 'hidden', borderRadius: 'var(--r-lg)' }}>
      <style>{`@keyframes thp-spin { to { transform: rotate(360deg); } }`}</style>
      <RailR active="th08" />
      {/* Slim navigator */}
      <aside style={{ width: 240, background: 'var(--bg-1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)' }}>
          <div className="cjk" style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>当前房间</div>
          <div className="cjk" style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-0)', marginTop: 4, fontFamily: 'var(--font-display)' }}>永夜抄 PvP — 北京</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>#4912 · 4/6</div>
        </div>
        <div style={{ padding: 10, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <SLR>本房频道</SLR>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <RowR active leading={<span style={{ color: 'var(--fg-2)', fontWeight: 600, fontSize: 16, lineHeight: 1, width: 14, textAlign: 'center' }}>#</span>}>
                <span className="cjk" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>room-4912</span>
              </RowR>
              <RowR leading={<span style={{ color: 'var(--fg-2)', fontWeight: 600, fontSize: 16, lineHeight: 1, width: 14, textAlign: 'center' }}>#</span>}>
                <span className="cjk" style={{ fontSize: 13, color: 'var(--fg-1)' }}>战术讨论</span>
              </RowR>
            </div>
          </div>
          <div>
            <SLR>房间信息</SLR>
            <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['难度','Lunatic'],['模式','Standard'],['Lives','3'],['加密','AES-256'],
              ].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                  <span className="cjk" style={{ color: 'var(--fg-2)' }}>{k}</span>
                  <span style={{ color: 'var(--fg-0)', fontWeight: 600, fontFamily: /\d/.test(v) ? 'var(--font-mono)' : 'var(--font-sans)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SLR right={<span style={{ fontSize: 10.5, color: 'var(--success)', fontWeight: 600 }}>3 ready</span>}>队伍</SLR>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {SEATS.filter(s => s.name).map(s => (
                <RowR key={s.idx}
                  leading={<AvR size={22} name={s.name} status={s.status} />}
                  trailing={s.idx === 1 ? <span style={{ color: 'var(--warning)' }}>{IcR.crown}</span> : <SDR status={s.ready ? 'online' : 'idle'} />}
                >
                  <span className="cjk" style={{ fontSize: 12.5, color: 'var(--fg-0)', fontWeight: 500 }}>{s.name}</span>
                </RowR>
              ))}
            </div>
          </div>
        </div>
        <IdR />
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <RoomTopBar />
        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
          {state === 'post' ? (
            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-0)' }}><ResultsCard /></div>
          ) : (
            <>
              <section style={{ flex: '1 1 60%', minWidth: 0, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className="cjk" style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--fg-0)' }}>席位 <span style={{ color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>4/6</span></h3>
                  <span style={{ fontSize: 11, color: 'var(--fg-2)' }}><span className="cjk">主机可调整 · 拖拽换位</span></span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {SEATS.map(s => <SeatCard key={s.idx} seat={s} isHost={s.idx === 1} />)}
                </div>
                <div style={{ marginTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span className="cjk" style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-1)' }}>观战席</span>
                    <span style={{ height: 1, background: 'var(--border)', flex: 1 }} />
                    <span style={{ fontSize: 11, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>20</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {SPECTATORS.slice(0, 8).map((n, i) => (
                      <AvR key={i} size={28} name={n} />
                    ))}
                    <span style={{
                      height: 28, paddingInline: 10, borderRadius: 999,
                      background: 'var(--bg-2)', border: '1px solid var(--border)',
                      color: 'var(--fg-1)', fontSize: 11, fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-mono)',
                    }}>+12</span>
                  </div>
                </div>
              </section>
              <section style={{ flex: '1 1 40%', minWidth: 320, padding: '20px 20px 20px 0', overflow: 'hidden' }}>
                <ParamPanel isHost />
              </section>
            </>
          )}
        </div>
        <RoomBottomBar state={state} isHost />
      </main>

      <ChatDrawer />
    </div>
  );
}

window.Room = Room;
