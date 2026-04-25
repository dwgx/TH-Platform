/* global React, UI, SHARED */
// Settings — full-screen takeover, no rail/sidebar.

const { useState: useStateS } = React;
const { Avatar: AvS, Badge: BdgS, Icon: IcS, Button: BtnS, Input: InpS } = UI;
const { Row: RowS, SectionLabel: SLS, Divider: DivS } = SHARED;

const NAV = [
  { group: '用户', items: [
    { id: 'account', label: '我的账号' },
    { id: 'profile', label: '个人资料' },
    { id: 'privacy', label: '隐私与安全' },
    { id: 'oauth',   label: '第三方绑定' },
  ]},
  { group: '应用', items: [
    { id: 'appear',  label: '外观' },
    { id: 'notify',  label: '通知' },
    { id: 'text',    label: '文字与表情' },
    { id: 'kbd',     label: '键盘快捷键' },
    { id: 'lang',    label: '语言' },
    { id: 'adv',     label: '高级' },
  ]},
  { group: 'TH-Platform', items: [
    { id: 'inj',     label: '注入器' },
    { id: 'net',     label: '网络' },
    { id: 'about',   label: '关于' },
  ]},
];

function NavItem({ active, children, danger, onClick }) {
  const [hov, setHov] = useStateS(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center',
        height: 30, padding: '0 10px', borderRadius: 6, border: 'none',
        background: active ? 'var(--active)' : hov ? 'var(--hover)' : 'transparent',
        color: danger ? 'var(--danger)' : active ? 'var(--fg-0)' : 'var(--fg-1)',
        fontSize: 13, fontWeight: active ? 600 : 500,
        fontFamily: 'var(--font-sans)', cursor: 'pointer',
        textAlign: 'left', width: '100%',
      }}>
      <span className="cjk">{children}</span>
    </button>
  );
}

function Field({ label, helper, children, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <label className="cjk" style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
        {action}
      </div>
      {children}
      {helper ? <div className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-2)', lineHeight: 1.5 }}>{helper}</div> : null}
    </div>
  );
}

function Toggle({ on }) {
  return (
    <span style={{
      width: 36, height: 20, borderRadius: 999,
      background: on ? 'var(--brand)' : 'var(--bg-3)',
      border: '1px solid var(--border)', position: 'relative',
      transition: 'background .15s', cursor: 'pointer', display: 'inline-block',
    }}>
      <span style={{
        position: 'absolute', top: 1, left: on ? 16 : 1,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        transition: 'left .15s',
      }} />
    </span>
  );
}

function ToggleRow({ label, helper, on }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div className="cjk" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>{label}</div>
        {helper ? <div className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-2)', marginTop: 2 }}>{helper}</div> : null}
      </div>
      <Toggle on={on} />
    </div>
  );
}

function ThemeCard({ name, kind, active }) {
  const swatches = {
    light: { bg: '#FFFFFF', fg: '#1A1B22', sub: '#F4F5F9' },
    dark:  { bg: '#1B1D24', fg: '#E8EAF1', sub: '#21232C' },
    auto:  { bg: 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 50%, #1B1D24 50%, #1B1D24 100%)', fg: '#7C5CFF', sub: 'transparent' },
  };
  const s = swatches[kind];
  return (
    <button style={{
      flex: 1, padding: 12, borderRadius: 'var(--r-md)',
      background: 'var(--bg-1)',
      border: `1.5px solid ${active ? 'var(--brand)' : 'var(--border-strong)'}`,
      cursor: 'pointer', textAlign: 'left',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{
        height: 76, borderRadius: 8, background: s.bg, position: 'relative',
        border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: 7, gap: 4,
      }}>
        <div style={{ height: 6, width: '38%', borderRadius: 3, background: s.fg, opacity: 0.85 }} />
        <div style={{ height: 4, width: '70%', borderRadius: 2, background: s.fg, opacity: 0.4 }} />
        <div style={{ marginTop: 'auto', display: 'flex', gap: 4 }}>
          <div style={{ flex: 1, height: 14, borderRadius: 4, background: s.sub }} />
          <div style={{ flex: 1, height: 14, borderRadius: 4, background: s.sub }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="cjk" style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-0)' }}>{name}</span>
        {active ? <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--brand)', color: '#fff', fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✓</span> : null}
      </div>
    </button>
  );
}

function ProviderCard({ kind, linked }) {
  const meta = {
    qq:      { name: 'QQ',      color: '#12B7F5', scope: '获取 QQ 昵称、头像 · 不读取好友列表' },
    discord: { name: 'Discord', color: '#5865F2', scope: '读取 identify, email · 不发送消息' },
    github:  { name: 'GitHub',  color: '#E8EAF1', scope: '读取 user:email · 用于贡献者徽章' },
  };
  const m = meta[kind];
  return (
    <div style={{ padding: 16, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: linked ? m.color : 'var(--bg-3)', color: linked ? (kind === 'github' ? '#1A1B22' : '#fff') : 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
        {m.name.slice(0, 2)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-0)' }}>{m.name}</span>
          {linked
            ? <BdgS tone="success" dot><span className="cjk">已绑定</span></BdgS>
            : <BdgS tone="neutral"><span className="cjk">未绑定</span></BdgS>}
        </div>
        <div className="cjk" style={{ fontSize: 11.5, color: 'var(--fg-2)', marginTop: 4, lineHeight: 1.5 }}>{m.scope}</div>
      </div>
      {linked
        ? <BtnS variant="secondary" size="sm"><span className="cjk">解除绑定</span></BtnS>
        : <BtnS variant="primary" size="sm"><span className="cjk">连接</span></BtnS>}
    </div>
  );
}

// ============== sections ==============
function SectionAccount() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 className="cjk" style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--fg-0)' }}>我的账号</h2>

      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="显示名称" helper="他人在房间和频道里看到的名字。每 7 天可改一次。">
          <InpS placeholder="dwgx" trailing={<span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>4 / 32</span>} />
        </Field>
        <DivS />
        <Field label="Handle" helper="全局唯一，用于搜索与提及。仅小写字母 / 数字 / 下划线。">
          <InpS leading={<span style={{ color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>@</span>} placeholder="dwgx" trailing={<BdgS tone="success" dot><span className="cjk">可用</span></BdgS>} />
        </Field>
        <DivS />
        <Field label="UID" helper="出生时分配，不可修改。靠前的号段是公开的纪念号池。">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--fg-0)', background: 'var(--bg-2)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>100029481</span>
            <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-2)', color: 'var(--fg-1)', cursor: 'pointer' }}>⧉</button>
          </div>
        </Field>
        <DivS />
        <Field label="邮箱"><InpS placeholder="rinnosuke@example.com" /></Field>
        <DivS />
        <Field label="密码"><BtnS variant="secondary"><span className="cjk">修改密码</span></BtnS></Field>
      </div>
    </div>
  );
}

function SectionAppearance() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 className="cjk" style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--fg-0)' }}>外观</h2>

      <Field label="主题" helper="所有界面颜色与对比度的总开关。跟随系统会在浅色与深色间自动切换。">
        <div style={{ display: 'flex', gap: 12 }}>
          <ThemeCard name="浅色" kind="light" />
          <ThemeCard name="深色" kind="dark" active />
          <ThemeCard name="跟随系统" kind="auto" />
        </div>
      </Field>

      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '4px 22px' }}>
        <ToggleRow label="紧凑模式" helper="压缩房间卡片与列表行高，单屏显示更多内容。" on={false} />
        <ToggleRow label="减弱动效" helper="减少过渡动画，对眩晕敏感的玩家友好。" on />
        <div style={{ padding: '12px 0' }}>
          <Field label="字号">
            <button style={{ height: 36, paddingInline: 12, gap: 8, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-2)', color: 'var(--fg-0)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              <span className="cjk">中等</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-2)', fontSize: 11 }}>14px</span>
              {IcS.chevron}
            </button>
          </Field>
        </div>
      </div>
    </div>
  );
}

function SectionOAuth() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 className="cjk" style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--fg-0)' }}>第三方绑定</h2>
      <div className="cjk" style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.55, marginTop: -16 }}>
        TH-Platform 仅获取以下范围的最少信息，不会发送任何消息或访问你的好友列表。所有 token 加密存储在本地。
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ProviderCard kind="qq" linked />
        <ProviderCard kind="discord" linked={false} />
        <ProviderCard kind="github" linked />
      </div>
    </div>
  );
}

function SectionInjector() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 className="cjk" style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--fg-0)' }}>注入器</h2>

      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="TH08.exe 路径" action={<BtnS variant="secondary" size="sm"><span className="cjk">浏览…</span></BtnS>}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-1)', background: 'var(--bg-2)', padding: '8px 12px', borderRadius: 8, display: 'inline-block', border: '1px solid var(--border)' }}>
            C:\Games\Touhou\th08\th08.exe
          </span>
        </Field>
        <DivS />
        <Field label="DLL 版本"><span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-0)' }}>th-platform-net.dll v0.4.2 <span style={{ color: 'var(--success)' }}>·</span> <span style={{ color: 'var(--success)', fontWeight: 600 }}>已签名</span></span></Field>
        <DivS />
        <Field label="最近注入"><span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-1)' }}>2026-04-26 20:58:14 · <span style={{ color: 'var(--success)' }}>成功</span></span></Field>
        <DivS />
        <div style={{ display: 'flex', gap: 8 }}>
          <BtnS variant="primary"><span className="cjk">测试注入</span></BtnS>
          <BtnS variant="secondary"><span className="cjk">查看注入日志</span></BtnS>
        </div>
      </div>

      <Field label="日志 · 最近 20 行">
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 14, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--fg-2)', lineHeight: 1.7, maxHeight: 220, overflowY: 'auto' }}>
{`[20:58:11] thp: locating th08.exe…
[20:58:11] thp: found PID 18420
[20:58:12] thp: opening process handle (PROCESS_ALL_ACCESS)
[20:58:12] thp: VirtualAllocEx 0x00890000 size=4096 ✓
[20:58:13] thp: WriteProcessMemory ✓
[20:58:13] thp: CreateRemoteThread tid=24112
[20:58:14] dll : thp_init() entry
[20:58:14] dll : hooking d3d8::Present @ 0x6F4A21C0
[20:58:14] dll : hooking dinput8::GetDeviceState
[20:58:14] dll : net handshake → th-platform.cn:8443
[20:58:14] net : TLS 1.3 ECDHE-ECDSA-AES256-GCM established
[20:58:14] net : NAT probe → Full Cone (Type 1)
[20:58:14] net : RTT 24ms · MTU 1492
[20:58:15] thp: ready · waiting for room`}
        </div>
      </Field>
    </div>
  );
}

function SectionLanguage() {
  const opts = [
    { code: 'zh-CN', label: '简体中文', tag: '默认' },
    { code: 'zh-TW', label: '繁體中文', tag: '即将支持' },
    { code: 'en',    label: 'English',  tag: 'soon' },
    { code: 'ja',    label: '日本語',   tag: 'soon' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 className="cjk" style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--fg-0)' }}>语言</h2>
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        {opts.map((o, i) => {
          const dis = o.tag !== '默认';
          const sel = o.code === 'zh-CN';
          return (
            <label key={o.code} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
              cursor: dis ? 'not-allowed' : 'pointer', opacity: dis ? 0.55 : 1,
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                border: `2px solid ${sel ? 'var(--brand)' : 'var(--border-strong)'}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{sel ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} /> : null}</span>
              <span className="cjk" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-0)', flex: 1 }}>{o.label}</span>
              <BdgS tone={sel ? 'brand' : 'neutral'}><span className="cjk">{o.tag}</span></BdgS>
            </label>
          );
        })}
      </div>
      <ToggleRow label="跟随系统语言" helper="启动时读取系统 locale，未支持的语言回落到简体中文。" on={false} />
    </div>
  );
}

function SectionKbd() {
  const items = [
    { a: '切换静音',    k: 'Ctrl + Shift + M' },
    { a: '快速切换频道', k: '⌘ K' },
    { a: '打开设置',    k: '⌘ ,' },
    { a: '退出房间',    k: 'Ctrl + Shift + L' },
    { a: 'Push to talk', k: '— · 预留 V2', dim: true },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 className="cjk" style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--fg-0)' }}>键盘快捷键</h2>
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        {items.map((it, i) => (
          <div key={i} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: i === 0 ? 'none' : '1px solid var(--border)', opacity: it.dim ? 0.55 : 1 }}>
            <span className="cjk" style={{ fontSize: 13, color: 'var(--fg-0)', fontWeight: 500 }}>{it.a}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-1)', background: 'var(--bg-2)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>{it.k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionAdv() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 className="cjk" style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--fg-0)' }}>高级</h2>
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="UID 颜色种子" helper="重置后 banner 与默认头像配色会重新生成。"><BtnS variant="secondary"><span className="cjk">重置颜色种子</span></BtnS></Field>
        <DivS />
        <Field label="导出聊天历史" helper="所有频道与私聊导出为 JSON 压缩包，仅在本机解压。"><BtnS variant="secondary"><span className="cjk">导出聊天历史</span></BtnS></Field>
        <DivS />
        <Field label="清除本地缓存" helper="约 142 MB 的图片与 metadata 缓存，不会丢失消息。"><BtnS variant="secondary"><span className="cjk">清除本地缓存</span></BtnS></Field>
      </div>
      <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.30)', borderRadius: 'var(--r-lg)', padding: 22 }}>
        <div className="cjk" style={{ fontSize: 13, fontWeight: 800, color: 'var(--danger)', marginBottom: 6 }}>危险区</div>
        <div className="cjk" style={{ fontSize: 12, color: 'var(--fg-1)', lineHeight: 1.55, marginBottom: 14 }}>
          注销账户后 UID 将进入冷却池 90 天，期间任何人都无法重新注册同一 UID。无法恢复。
        </div>
        <button style={{ height: 36, paddingInline: 16, borderRadius: 8, background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <span className="cjk">注销账户</span>
        </button>
      </div>
    </div>
  );
}

const SECTIONS = {
  account: SectionAccount,
  appear:  SectionAppearance,
  oauth:   SectionOAuth,
  inj:     SectionInjector,
  lang:    SectionLanguage,
  kbd:     SectionKbd,
  adv:     SectionAdv,
};

function Settings({ theme = 'dark', section = 'appear' }) {
  const [active, setActive] = useStateS(section);
  const Section = SECTIONS[active] || (() => (
    <div className="cjk" style={{ color: 'var(--fg-2)', fontSize: 14, padding: 24 }}>
      该章节正在搭建中。
    </div>
  ));
  return (
    <div className={`thp theme-${theme}`} style={{ width: '100%', height: '100%', position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
      {/* dim backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.80)' }} />
      {/* panel */}
      <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-0)', display: 'flex', overflow: 'hidden' }}>
        {/* nav rail */}
        <aside style={{ width: 218, background: 'var(--bg-1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '36px 12px 12px' }}>
          <div className="cjk" style={{ fontSize: 11, fontWeight: 800, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px 8px' }}>设置</div>
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {NAV.map(g => (
              <div key={g.group}>
                <div className="cjk" style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 10px 6px' }}>{g.group}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {g.items.map(it => (
                    <NavItem key={it.id} active={active === it.id} onClick={() => setActive(it.id)}>{it.label}</NavItem>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
            <NavItem danger>退出登录</NavItem>
          </div>
        </aside>

        {/* content */}
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          <div style={{ maxWidth: 740, padding: '48px 40px 64px' }}>
            <Section />
          </div>
        </main>

        {/* ESC */}
        <button title="关闭设置" style={{
          position: 'absolute', top: 28, right: 28,
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}>
          <span style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '2px solid var(--border-strong)',
            color: 'var(--fg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>×</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-2)', fontWeight: 600, letterSpacing: '0.05em' }}>ESC</span>
        </button>
      </div>
    </div>
  );
}

window.Settings = Settings;
