(() => {
  'use strict';

  // Edit these once – they power the command palette (⌘K).
  const SITE = {
    email: 'mail@markushennig.com',
    github: 'https://github.com/mahennig',
    linkedin: 'https://www.linkedin.com/in/markus-hennig-80b301139',
  };

  const doc = document.documentElement;
  const root = doc.dataset.root || './';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMac = /Mac|iPhone|iPad/.test(navigator.userAgentData?.platform || navigator.platform || '');

  /* ---------- Theme ---------- */
  function toggleTheme() {
    const next = doc.dataset.theme === 'light' ? 'dark' : 'light';
    doc.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch { /* storage unavailable */ }
    document.dispatchEvent(new CustomEvent('themechange'));
  }
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => btn.addEventListener('click', toggleTheme));

  /* ---------- Toast ---------- */
  const toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  document.body.append(toastEl);
  let toastTimer;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(SITE.email);
      toast('Email copied to clipboard');
    } catch {
      location.href = `mailto:${SITE.email}`;
    }
  }

  /* ---------- Header state ---------- */
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.progress');
  function onScroll() {
    header?.classList.toggle('scrolled', scrollY > 8);
    if (progress) {
      const max = doc.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Small details ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  const portrait = document.querySelector('.portrait img');
  if (portrait) {
    const hide = () => { portrait.parentElement.hidden = true; };
    if (portrait.complete && !portrait.naturalWidth) hide();
    else portrait.addEventListener('error', hide);
  }

  const rotator = document.querySelector('.rotator');
  if (rotator && !reduceMotion) {
    const words = rotator.dataset.words.split(',');
    let i = 0;
    setInterval(() => {
      rotator.classList.add('out');
      setTimeout(() => {
        i = (i + 1) % words.length;
        rotator.textContent = words[i];
        rotator.classList.remove('out');
      }, 300);
    }, 2800);
  }

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll('.reveal');
  document.querySelectorAll('.hero .reveal').forEach((el, i) => { el.style.transitionDelay = `${i * 90}ms`; });
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      }
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Interactive dot grid ---------- */
  const canvas = document.querySelector('.hero-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const GAP = 26;
    const RADIUS = 150;
    const pointer = { x: -1e4, y: -1e4 };
    let w = 0, h = 0, raf = 0, colors = {};

    const readColors = () => {
      const s = getComputedStyle(doc);
      colors = { dot: s.getPropertyValue('--dot').trim(), accent: s.getPropertyValue('--accent').trim() };
    };

    const draw = () => {
      raf = 0;
      ctx.clearRect(0, 0, w, h);
      for (let y = GAP / 2; y < h; y += GAP) {
        for (let x = GAP / 2; x < w; x += GAP) {
          const t = Math.max(0, 1 - Math.hypot(x - pointer.x, y - pointer.y) / RADIUS);
          ctx.globalAlpha = t > 0 ? 0.2 + t * 0.8 : 1;
          ctx.fillStyle = t > 0 ? colors.accent : colors.dot;
          ctx.beginPath();
          ctx.arc(x, y, 1.1 + t * 1.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      schedule();
    };

    readColors();
    resize();
    new ResizeObserver(resize).observe(canvas);
    document.addEventListener('themechange', () => { readColors(); schedule(); });

    if (!reduceMotion) {
      addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
        schedule();
      }, { passive: true });
      document.addEventListener('pointerleave', () => { pointer.x = pointer.y = -1e4; schedule(); });
    }
  }

  /* ---------- Command palette ---------- */
  document.querySelectorAll('.kbd-mod').forEach((el) => { el.textContent = isMac ? '⌘' : 'Ctrl'; });

  const go = (url) => { location.href = url; };
  const openExternal = (url) => { window.open(url, '_blank', 'noopener,noreferrer'); };

  const commands = [
    { group: 'Navigate', label: 'Home', run: () => go(root) },
    { group: 'Navigate', label: 'About', run: () => go(`${root}#about`) },
    { group: 'Navigate', label: 'Writing', run: () => go(`${root}blog/`) },
    { group: 'Elsewhere', label: 'GitHub', hint: '↗', run: () => openExternal(SITE.github) },
    { group: 'Elsewhere', label: 'LinkedIn', hint: '↗', run: () => openExternal(SITE.linkedin) },
    { group: 'Actions', label: 'Copy email address', run: copyEmail },
    { group: 'Actions', label: 'Send an email', run: () => go(`mailto:${SITE.email}`) },
    { group: 'Actions', label: 'Toggle light / dark theme', hint: 'T', run: toggleTheme },
  ];

  const dialog = document.createElement('dialog');
  dialog.className = 'palette';
  dialog.setAttribute('aria-label', 'Command menu');

  const input = document.createElement('input');
  input.className = 'palette-input';
  input.type = 'text';
  input.placeholder = 'Type a command or search…';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'true');
  input.setAttribute('aria-controls', 'palette-list');
  input.setAttribute('aria-label', 'Search commands');

  const list = document.createElement('ul');
  list.className = 'palette-list';
  list.id = 'palette-list';
  list.setAttribute('role', 'listbox');

  const foot = document.createElement('p');
  foot.className = 'palette-foot mono';
  foot.textContent = '↑↓ navigate · ↵ select · esc close';

  dialog.append(input, list, foot);
  document.body.append(dialog);

  let filtered = commands;
  let active = 0;

  function setActive(index) {
    const items = list.querySelectorAll('.palette-item');
    if (!items.length) return;
    active = (index + items.length) % items.length;
    items.forEach((el, i) => el.setAttribute('aria-selected', String(i === active)));
    items[active].scrollIntoView({ block: 'nearest' });
    input.setAttribute('aria-activedescendant', items[active].id);
  }

  function render() {
    const q = input.value.trim().toLowerCase();
    filtered = commands.filter((c) => `${c.label} ${c.group}`.toLowerCase().includes(q));
    list.replaceChildren();
    let lastGroup = '';
    filtered.forEach((cmd, i) => {
      if (cmd.group !== lastGroup) {
        const g = document.createElement('li');
        g.className = 'palette-group';
        g.setAttribute('role', 'presentation');
        g.textContent = cmd.group;
        list.append(g);
        lastGroup = cmd.group;
      }
      const li = document.createElement('li');
      li.className = 'palette-item';
      li.id = `palette-item-${i}`;
      li.setAttribute('role', 'option');
      const label = document.createElement('span');
      label.textContent = cmd.label;
      li.append(label);
      if (cmd.hint) {
        const hint = document.createElement('span');
        hint.className = 'palette-hint';
        hint.textContent = cmd.hint;
        li.append(hint);
      }
      li.addEventListener('click', () => run(i));
      li.addEventListener('pointermove', () => { if (active !== i) setActive(i); });
      list.append(li);
    });
    if (!filtered.length) {
      const empty = document.createElement('li');
      empty.className = 'palette-empty';
      empty.textContent = 'No results';
      list.append(empty);
      input.removeAttribute('aria-activedescendant');
    }
    setActive(0);
  }

  function run(index) {
    const cmd = filtered[index];
    if (!cmd) return;
    dialog.close();
    cmd.run();
  }

  function openPalette() {
    if (dialog.open) return;
    input.value = '';
    render();
    dialog.showModal();
    input.focus();
  }

  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); run(active); }
  });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  document.querySelectorAll('[data-palette-open]').forEach((btn) => btn.addEventListener('click', openPalette));

  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      dialog.open ? dialog.close() : openPalette();
      return;
    }
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if (!typing && !dialog.open && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 't') toggleTheme();
  });
})();
