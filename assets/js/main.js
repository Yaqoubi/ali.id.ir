/* علی یعقوبی — رفتار صفحه. بدون وابستگی؛ بدون JS هم همهٔ محتوا و پیوندها کار می‌کنند. */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const FA = '۰۱۲۳۴۵۶۷۸۹';
  const fa = (n) => String(n).replace(/\d/g, (d) => FA[d]);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* حالت خصوصی */ } }
  };

  /* ── پیام کوتاه ─────────────────────────────────────────────────────── */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  /* ── تم ─────────────────────────────────────────────────────────────── */
  const root = document.documentElement;
  const themeBtn = $('#themeToggle');
  function paintThemeBtn() {
    const dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'تغییر به تم روشن' : 'تغییر به تم تاریک');
  }
  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store.set('theme', next);
    paintThemeBtn();
  });
  paintThemeBtn();

  /* ── ناوبری و برجسته‌سازی بخش جاری ──────────────────────────────────── */
  const nav = $('#nav');
  const menuBtn = $('#menuBtn');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
  }
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });

  const links = $$('a', nav);
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      const a = byId.get(en.target.id);
      if (a) a.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  const heroEl = $('#top');
  if (heroEl) new IntersectionObserver((en) => {
    if (en[0].isIntersecting) links.forEach((a) => a.removeAttribute('aria-current'));
  }, { rootMargin: '-35% 0px -60% 0px' }).observe(heroEl);

  /* ── جستجو و فیلتر ──────────────────────────────────────────────────── */
  const q = $('#q');
  const qClear = $('#qClear');
  const cards = $$('.tool');
  const tabs = $$('.tab');
  const chips = $$('.chip');
  const countEl = $('#count');
  const emptyEl = $('#empty');
  const emptyTitle = $('#emptyTitle');
  const state = { q: '', type: 'all', subject: null };

  // یکسان‌سازی املا: ی/ک عربی، نیم‌فاصله، اعراب، ارقام فارسی و عربی
  const norm = (s) => String(s).toLowerCase()
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[ۀة]/g, 'ه').replace(/[أإآ]/g, 'ا')
    .replace(/[‌‍‏ً-ٟـ]/g, '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\s+/g, ' ').trim();
  cards.forEach((c) => { c._hay = norm(c.dataset.search); });

  function applyFilter() {
    const nq = norm(state.q);
    const words = nq.split(' ').filter(Boolean);
    // عبارت چندکلمه‌ای (مثل «آی پی») ابتدا به‌صورت یک‌پارچه جستجو می‌شود؛ اگر چیزی نبود، تک‌تک کلمه‌ها
    const compact = nq.replace(/ /g, '');
    const phrase = words.length > 1 && cards.some((c) => c._hay.replace(/ /g, '').includes(compact));
    let shown = 0;
    cards.forEach((c) => {
      const okType = state.type === 'all' || c.dataset.cats.split(' ').includes(state.type);
      const okSub = !state.subject || c.dataset.subject === state.subject;
      const okQ = phrase ? c._hay.replace(/ /g, '').includes(compact) : words.every((w) => c._hay.includes(w));
      const ok = okType && okSub && okQ;
      c.hidden = !ok;
      if (ok) shown++;
    });
    const filtered = state.q.trim() || state.type !== 'all' || state.subject;
    countEl.textContent = filtered ? `${fa(shown)} ابزار از ${fa(cards.length)}` : `${fa(cards.length)} ابزار`;
    qClear.hidden = !state.q;
    emptyEl.hidden = shown > 0;
    if (!shown) emptyTitle.textContent = state.q.trim() ? `برای «${state.q.trim()}» ابزاری پیدا نشد` : 'با این فیلترها ابزاری پیدا نشد';
  }
  q.addEventListener('input', () => { state.q = q.value; applyFilter(); });
  q.addEventListener('keydown', (e) => { if (e.key === 'Escape' && q.value) { q.value = ''; state.q = ''; applyFilter(); } });
  qClear.addEventListener('click', () => { q.value = ''; state.q = ''; applyFilter(); q.focus(); });
  tabs.forEach((t) => t.addEventListener('click', () => {
    state.type = t.dataset.type;
    tabs.forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
    applyFilter();
  }));
  chips.forEach((c) => c.addEventListener('click', () => {
    const on = c.getAttribute('aria-pressed') !== 'true';
    chips.forEach((x) => x.setAttribute('aria-pressed', 'false'));
    c.setAttribute('aria-pressed', String(on));
    state.subject = on ? c.dataset.subject : null;
    applyFilter();
  }));
  $('#emptyReset').addEventListener('click', () => {
    q.value = ''; state.q = ''; state.type = 'all'; state.subject = null;
    tabs.forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.type === 'all')));
    chips.forEach((x) => x.setAttribute('aria-pressed', 'false'));
    applyFilter(); q.focus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault();
    q.focus(); q.select();
  });

  /* ── دموی زندهٔ کسر ─────────────────────────────────────────────────── */
  const toy = $('#toy');
  if (toy) {
    const bar = $('#toyBar'), numEl = $('#toyNum'), denEl = $('#toyDen'), words = $('#toyWords'),
          simple = $('#toySimple'), nOut = $('#toyN');
    const CARD = ['صفر', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه', 'ده'];
    const ORD = { 2: 'دوم', 3: 'سوم', 4: 'چهارم', 5: 'پنجم', 6: 'ششم', 7: 'هفتم', 8: 'هشتم', 9: 'نهم', 10: 'دهم' };
    const MIN = 2, MAX = 10, START_N = 8, START_ON = 3;
    let n = START_N;
    let on = Array.from({ length: n }, (_, i) => i < START_ON);
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const fracHTML = (a, b) => `<span class="frac" aria-hidden="true"><span class="num">${fa(a)}</span><span class="den">${fa(b)}</span></span>`;

    function drawCells() {
      bar.textContent = '';
      for (let i = 0; i < n; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cell' + (on[i] ? ' on' : '');
        b.setAttribute('aria-pressed', String(on[i]));
        b.setAttribute('aria-label', `قسمت ${fa(i + 1)}`);
        b.dataset.i = i;
        bar.appendChild(b);
      }
    }
    function readout() {
      const k = on.filter(Boolean).length;
      numEl.textContent = fa(k); denEl.textContent = fa(n); nOut.textContent = fa(n);
      if (k === 0) words.textContent = 'هنوز قسمتی رنگ نشده';
      else if (k === n) words.textContent = `${CARD[k]} ${ORD[n]}؛ یعنی یک کل`;
      else words.textContent = `${CARD[k]} ${ORD[n]}`;
      const g = gcd(k, n);
      if (k > 0 && k < n && g > 1) simple.innerHTML = `ساده‌شده: ${fracHTML(k / g, n / g)}`;
      else if (k > 0 && k < n) simple.textContent = 'این کسر ساده‌شده است.';
      else simple.textContent = '';
      $('#toyMinus').disabled = n <= MIN; $('#toyPlus').disabled = n >= MAX;
    }
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('.cell'); if (!b) return;
      const i = +b.dataset.i;
      on[i] = !on[i];
      b.classList.toggle('on', on[i]); b.setAttribute('aria-pressed', String(on[i]));
      readout();
    });
    $('#toyMinus').addEventListener('click', () => { if (n > MIN) { n--; on.length = n; drawCells(); readout(); } });
    $('#toyPlus').addEventListener('click', () => { if (n < MAX) { n++; on.push(false); drawCells(); readout(); } });
    $('#toyReset').addEventListener('click', () => {
      n = START_N; on = Array.from({ length: n }, (_, i) => i < START_ON); drawCells(); readout();
    });
    drawCells(); readout();
  }

  /* ── اتاق نمایش ─────────────────────────────────────────────────────── */
  const items = $$('.pl-item');
  const media = $('#screenMedia');
  if (items.length && media) {
    const cat = $('#screenCat'), title = $('#screenTitle'), desc = $('#screenDesc');
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const playSvg = '<svg class="i" aria-hidden="true" focusable="false"><use href="#i-play"/></svg>';

    const posterHTML = (d, eager) =>
      `<span class="poster" style="--h:${esc(d.hue)}"><span class="poster-t">${esc(d.short)}</span>` +
      `<img class="poster-img${d.contain ? ' contain' : ''}" src="${esc(d.thumb)}" alt="" decoding="async"${eager ? '' : ' loading="lazy"'} onerror="this.remove()"></span>`;

    function select(i, userInitiated) {
      const el = items[i]; const d = el.dataset;
      items.forEach((x) => x.removeAttribute('aria-current'));
      el.setAttribute('aria-current', 'true');
      cat.textContent = d.cat; title.textContent = d.title; desc.textContent = d.desc;
      const data = { short: d.short, thumb: d.thumb, hue: d.hue, contain: d.contain };
      if (d.type === 'image') {
        media.innerHTML = `<a class="stage-open" href="${esc(d.src)}" target="_blank" rel="noopener noreferrer" aria-label="باز کردن تصویر در اندازهٔ کامل: ${esc(d.title)}">${posterHTML(data, true)}</a>`;
      } else {
        media.innerHTML = `<button type="button" class="stage-play" aria-label="پخش ویدیو: ${esc(d.title)}">${posterHTML(data, true)}<span class="play-big">${playSvg}</span></button>`;
        $('.stage-play', media).addEventListener('click', () => play(d));
      }
      if (userInitiated && matchMedia('(max-width: 1079px)').matches && !reduceMotion) {
        $('#screen').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    function play(d) {
      const v = document.createElement('video');
      v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = 'metadata';
      v.setAttribute('aria-label', d.title);
      v.src = d.src;
      v.addEventListener('error', () => {
        v.remove();
        const f = document.createElement('div');
        f.className = 'stage-fail';
        f.innerHTML = `<p>این ویدیو بارگذاری نشد. اتصال را بررسی کنید یا فایل را مستقیم باز کنید.</p><a href="${esc(d.src)}" target="_blank" rel="noopener noreferrer">باز کردن فایل ویدیو</a>`;
        media.appendChild(f);
      });
      media.appendChild(v);
      v.play().catch(() => { /* کاربر با دکمه‌های خود پخش می‌کند */ });
    }
    items.forEach((el, i) => {
      el.addEventListener('click', (e) => { e.preventDefault(); select(i, true); });
      el.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        const t = items[i + (e.key === 'ArrowDown' ? 1 : -1)];
        if (t) t.focus();
      });
    });
    select(0, false);
  }

  /* ── آگهی با برگه‌های کندنی + کپی شماره ─────────────────────────────── */
  const PHONE = '09334272616';
  const strips = $$('.strip');
  const hint = $('#flyerHint');
  const restore = $('#flyerRestore');
  const remaining = () => strips.filter((s) => !s.classList.contains('torn')).length;
  function paintHint() {
    const r = remaining();
    if (r === strips.length) hint.textContent = 'برگه‌ای بکنید تا شماره کپی شود.';
    else if (r > 0) hint.textContent = `${fa(r)} برگه مانده است.`;
    else hint.textContent = 'همهٔ برگه‌ها کنده شد؛ شماره را همراه خودتان دارید.';
    restore.hidden = r === strips.length;
  }
  strips.forEach((s) => {
    s.addEventListener('click', async () => {
      if (s.classList.contains('torn')) return;
      const ok = await copyText(PHONE);
      s.classList.add('torn');
      if (reduceMotion) s.classList.add('gone');
      s.addEventListener('animationend', () => s.classList.add('gone'), { once: true });
      toast(ok ? 'شمارهٔ تماس کپی شد' : 'کپی نشد؛ شماره: ' + fa(PHONE));
      paintHint();
    });
  });
  restore.addEventListener('click', () => {
    strips.forEach((s) => s.classList.remove('torn', 'gone'));
    paintHint();
  });
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const ok = await copyText(b.dataset.copy);
    toast(ok ? 'شمارهٔ تماس کپی شد' : 'کپی نشد؛ شماره: ' + fa(b.dataset.copy));
  }));

  applyFilter();
})();
