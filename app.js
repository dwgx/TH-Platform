// ─── TH-Platform mockup interactions ──────────────────────────────
// Keep this tiny. No framework, no deps. Real behavior moves to
// React + state once the visual language is locked.

(() => {
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // ── Chat rail collapse / expand
  const collapseBtn = $('.chat-collapse');
  const body = document.body;
  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      const collapsed = body.dataset.chatCollapsed === 'true';
      body.dataset.chatCollapsed = collapsed ? 'false' : 'true';
      collapseBtn.style.transform = collapsed ? '' : 'rotate(180deg)';
    });
  }

  // ── Tab switching (visual only, no real routes yet)
  const groups = [
    { container: $('.topnav'), itemSel: '.topnav-item' },
    { container: $('.chat-tabs'), itemSel: '.chat-tab' },
  ];
  for (const { container, itemSel } of groups) {
    if (!container) continue;
    container.addEventListener('click', (e) => {
      const tab = e.target.closest(itemSel);
      if (!tab) return;
      $$(itemSel, container).forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
    });
  }

  // ── Server-type chip + game-pill toggling
  $$('.chip-row').forEach(row => {
    row.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip:not(.is-disabled)');
      if (!chip) return;
      $$('.chip', row).forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
    });
  });
  $$('.pill-row').forEach(row => {
    row.addEventListener('click', (e) => {
      const pill = e.target.closest('.pill:not(.is-muted)');
      if (!pill) return;
      $$('.pill', row).forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
    });
  });
})();
