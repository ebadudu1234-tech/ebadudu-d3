/* =========================================================
   D3 — EBADUDU, "the toy box". Written from zero for this site.
   ========================================================= */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const STILL = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOUSE = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- the works ---------- */
const bySlug = (slug) => PROJECTS.find((p) => p.slug === slug);
const mediaOf = (p) => MEDIA[p.slug] || [];
const thumbOf = (p) => `assets/thumbs/${p.slug}.jpg`;
const toyOf = (p) => `assets/trinkets/${p.slug}.png`;
const projectUrl = (p) => `project.html?p=${encodeURIComponent(p.slug)}`;
// newest first; the number a work carries everywhere (№ 01, 02 …)
const ORDER = [...PROJECTS].sort((a, b) => b.year - a.year);
const numberOf = (p) => String(ORDER.indexOf(p) + 1).padStart(2, '0');
// VIDEO is never written by hand: every work with a film gets it
PROJECTS.forEach((p) => {
  if (mediaOf(p).some((m) => m.type === 'video') && !p.tags.includes('VIDEO')) p.tags.push('VIDEO');
});
// one candy colour per tag, the same tag always the same colour
const CANDY = ['var(--pink)', 'var(--blue)', 'var(--green)', 'var(--orange)', 'var(--purple)', 'var(--yellow)'];
const candyOf = (tag) => CANDY[[...tag].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % CANDY.length];
const chipsHtml = (tags) => `<ul class="chips">${tags.map((t) => `<li style="--c:${candyOf(t)}">${esc(t)}</li>`).join('')}</ul>`;
// a steady random source: the same seed always gives the same numbers
function seeded(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// EBADUDU letter by letter, so each letter can bob on its own beat
const mixWord = (word) => [...word]
  .map((ch, i) => `<span class="ch" style="--i:${i}">${esc(ch)}</span>`).join('');

/* ---------- top bar: numbered landmarks, "you are here", rolling words ---------- */
function renderTop(top) {
  const page = document.body.dataset.page;
  const links = [
    { no: '01', label: 'WORK', href: 'work.html', key: 'work' },
    { no: '02', label: 'PLAY AREA', href: null, key: 'play' },
    { no: '03', label: 'ABOUT', href: 'about.html', key: 'about' },
  ];
  const roll = (t) => `<span class="roll"><span>${t}</span><span aria-hidden="true">${t}</span></span>`;
  top.innerHTML = `
    <a class="mark" href="index.html" aria-label="EBADUDU, home">${mixWord('EBADUDU')}</a>
    <ul class="nav">${links.map((l) => `<li>${l.href
      ? `<a href="${l.href}"${l.key === page ? ' aria-current="page"' : ''}><span class="no">${l.no}</span>${roll(l.label)}${l.key === page ? '<span class="here retro">YOU ARE HERE</span>' : ''}</a>`
      : `<a class="is-soon" aria-disabled="true" data-tag="COMING SOON"><span class="no">${l.no}</span>${roll(l.label)}</a>`}</li>`).join('')}</ul>`;
}

/* ---------- the lid: it closes over the box when you leave a page, opens when you arrive ---------- */
function setupLid(lid) {
  const KEY = 'd3-lid';
  let shut = false;
  try { shut = sessionStorage.getItem(KEY) === '1'; sessionStorage.removeItem(KEY); } catch (e) {}
  if (shut && !STILL) {
    lid.style.transition = 'none';
    lid.classList.add('is-shut');
    lid.offsetWidth;  // apply, then let it open
    lid.style.transition = '';
    requestAnimationFrame(() => requestAnimationFrame(() => lid.classList.remove('is-shut')));
  }
  addEventListener('pageshow', (e) => { if (e.persisted) lid.classList.remove('is-shut'); });
  document.addEventListener('click', (e) => {
    const a = e.target instanceof Element && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$/.test(url.pathname) || a.getAttribute('href').startsWith('#')) return;
    e.preventDefault();
    leaveTo(url.href);
  });
}
function leaveTo(href) {
  const lid = document.getElementById('lid');
  if (STILL || !lid) { location.href = href; return; }
  try { sessionStorage.setItem('d3-lid', '1'); } catch (e) {}
  lid.classList.add('is-shut');
  setTimeout(() => { location.href = href; }, 430);
}

/* ---------- the name-tag cursor: a yellow tag that says what is under the mouse (Jackie Hu) ---------- */
const cursor = { el: null, override: null };
function setupTagCursor(el) {
  if (!MOUSE) return;
  cursor.el = el;
  let x = -100, y = -100, queued = false, last = '';
  const place = () => {
    queued = false;
    el.style.transform = `translate(${x + 16}px, ${y + 18}px)`;
  };
  addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    const t = e.target instanceof Element ? e.target : null;
    const text = cursor.override
      || t?.closest('[data-tag]')?.dataset.tag
      || (t?.closest('a, button') ? 'CLICK!' : 'ZIHE ✦');
    if (text !== last) {
      el.textContent = text;
      last = text;
      el.classList.add('is-pop');
      setTimeout(() => el.classList.remove('is-pop'), 160);
    }
    el.classList.add('is-on');
    if (!queued) { queued = true; requestAnimationFrame(place); }
  }, { passive: true });
  document.addEventListener('pointerleave', () => el.classList.remove('is-on'));
}

/* ---------- the frog: a guide in the corner with a line for each page (Mr. Panda) ---------- */
const FROG_LINES = {
  home: ['Hi! Drag the toys around.', 'Click a toy to open its work.', 'Too tidy? Shake the box!'],
  work: ['Pick a word to filter the shelf.', 'Want a list? Try INDEX.', 'Touch a toy, it jumps!'],
  project: ['Scroll down for the whole story.', 'The next toy is at the bottom.'],
  about: ['This is Zihe. Say hi!', 'The email is at the bottom.'],
};
function setupFrog(frog, delay = 900) {
  const lines = FROG_LINES[document.body.dataset.page === 'work' && document.getElementById('project') ? 'project' : document.body.dataset.page] || [];
  const bubble = frog.querySelector('#bubble');
  let n = 0, timer = 0;
  const say = () => {
    if (!lines.length) return;
    bubble.textContent = lines[n % lines.length];
    n += 1;
    frog.classList.add('is-talking');
    clearTimeout(timer);
    timer = setTimeout(() => frog.classList.remove('is-talking'), 4200);
  };
  setTimeout(() => { frog.classList.add('is-in'); setTimeout(say, 700); }, delay);
  frog.querySelector('img').addEventListener('click', say);
  frog.querySelector('img').dataset.tag = 'RIBBIT!';
}

/* ============ Home: the toy box ============ */
function setupBox(box) {
  // the big wordmark behind the toys
  const mark = box.querySelector('#wordmark');
  mark.innerHTML = mixWord('EBADUDU');

  const layer = box.querySelector('#toys');
  const rand = seeded('toy-box');
  const bodies = [];
  let W = 0, H = 0, scale = 1;
  const measure = () => {
    W = box.clientWidth;
    H = box.clientHeight;
    scale = Math.max(0.55, Math.min(1, Math.min(W / 1440, H / 900)));
  };
  measure();

  // every work drops in one toy: the small object made from it
  ORDER.forEach((p) => {
    const img = new Image();
    img.className = 'toy';
    img.alt = p.title;
    img.draggable = false;
    const b = { p, img, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, w: 0, h: 0, r: 0, ready: false, held: false, base: 105 + rand() * 55 };
    img.onload = () => {
      const k = (b.base * scale) / Math.max(img.naturalWidth, img.naturalHeight);
      b.w = img.naturalWidth * k;
      b.h = img.naturalHeight * k;
      b.r = Math.max(b.w, b.h) * 0.42;
      img.style.width = `${b.w}px`;
      b.ready = true;
    };
    img.src = toyOf(p);
    img.style.visibility = 'hidden';
    layer.append(img);
    bodies.push(b);
  });
  const resize = () => {
    measure();
    bodies.forEach((b) => {
      if (!b.ready) return;
      const k = (b.base * scale) / Math.max(b.img.naturalWidth, b.img.naturalHeight);
      b.w = b.img.naturalWidth * k; b.h = b.img.naturalHeight * k; b.r = Math.max(b.w, b.h) * 0.42;
      b.img.style.width = `${b.w}px`;
      b.x = Math.min(Math.max(b.x, b.r), W - b.r);
    });
  };
  addEventListener('resize', resize);

  // drop them in from above, a little apart in time
  let running = false;
  const drop = () => {
    bodies.forEach((b, i) => {
      b.x = W * (0.08 + rand() * 0.84);
      b.y = -120 - i * 70 - rand() * 200;
      b.vx = (rand() - 0.5) * 300;
      b.vy = 0;
      b.va = (rand() - 0.5) * 300;
      b.img.style.visibility = '';
    });
    running = true;
  };

  // physics: gravity, bounces off the floor and walls, toys push each other apart
  const G = 2200, BOUNCE = 0.38;
  const step = (dt) => {
    bodies.forEach((b) => {
      if (!b.ready || b.held) return;
      b.vy += G * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.a += b.va * dt;
      b.va *= 0.995;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * BOUNCE; }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * BOUNCE; }
      if (b.y > H - b.r) {
        b.y = H - b.r;
        b.vy = Math.abs(b.vy) < 60 ? 0 : -Math.abs(b.vy) * BOUNCE;
        b.vx *= 0.9;
        b.va = (b.vx / b.r) * (180 / Math.PI);  // rolls along the floor
      }
    });
    for (let i = 0; i < bodies.length; i++) {
      const A = bodies[i];
      if (!A.ready) continue;
      for (let j = i + 1; j < bodies.length; j++) {
        const B = bodies[j];
        if (!B.ready) continue;
        const dx = B.x - A.x, dy = B.y - A.y;
        const d = Math.hypot(dx, dy) || 0.01, min = A.r + B.r;
        if (d >= min) continue;
        const nx = dx / d, ny = dy / d, push = min - d;
        // a held toy does not move: it pushes the other one the whole way
        const wa = A.held ? 0 : B.held ? 1 : 0.5, wb = 1 - wa;
        A.x -= nx * push * wa; A.y -= ny * push * wa;
        B.x += nx * push * wb; B.y += ny * push * wb;
        const rel = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
        if (rel < 0) {
          const imp = -(1 + 0.3) * rel;
          if (!A.held) { A.vx -= imp * nx * wa; A.vy -= imp * ny * wa; A.va -= imp * 0.2; }
          if (!B.held) { B.vx += imp * nx * wb; B.vy += imp * ny * wb; B.va += imp * 0.2; }
        }
      }
    }
  };
  const draw = () => {
    bodies.forEach((b) => {
      if (!b.ready) return;
      b.img.style.transform = `translate(${(b.x - b.w / 2).toFixed(1)}px, ${(b.y - b.h / 2).toFixed(1)}px) rotate(${b.a.toFixed(1)}deg)`;
    });
  };
  let prev = 0;
  const tick = (now) => {
    requestAnimationFrame(tick);
    const dt = Math.min(0.033, prev ? (now - prev) / 1000 : 0.016);
    prev = now;
    if (!running || document.hidden) return;
    step(dt / 2);
    step(dt / 2);
    draw();
  };
  requestAnimationFrame(tick);

  // pick up, carry, throw; a quick click without moving opens the work
  const toyAt = (x, y) => {
    for (let i = layer.children.length - 1; i >= 0; i--) {
      const b = bodies.find((o) => o.img === layer.children[i]);
      if (b?.ready && Math.hypot(x - b.x, y - b.y) < b.r * 0.95) return b;
    }
    return null;
  };
  let held = null, ox = 0, oy = 0, downX = 0, downY = 0, downT = 0, track = [];
  box.addEventListener('pointerdown', (e) => {
    const r = box.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const b = toyAt(x, y);
    if (!b) return;
    e.preventDefault();
    held = b;
    b.held = true;
    b.img.classList.add('is-held');
    layer.append(b.img);           // the one in hand comes to the front
    ox = x - b.x; oy = y - b.y;
    downX = x; downY = y; downT = performance.now();
    track = [{ x, y, t: downT }];
  });
  addEventListener('pointermove', (e) => {
    const r = box.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (held) {
      const t = performance.now();
      track.push({ x, y, t });
      if (track.length > 6) track.shift();
      const nx = x - ox, ny = y - oy;
      held.va = (nx - held.x) * 6;    // it swings as you carry it
      held.x = nx; held.y = ny;
      held.vx = 0; held.vy = 0;
      cursor.override = 'WHEEE!';
      return;
    }
    if (!MOUSE) return;
    const b = toyAt(x, y);
    cursor.override = b ? `№ ${numberOf(b.p)} ${b.p.title.length > 34 ? `${b.p.title.slice(0, 32)}…` : b.p.title}` : null;
  }, { passive: true });
  const release = () => {
    if (!held) return;
    const b = held;
    held = null;
    b.held = false;
    b.img.classList.remove('is-held');
    cursor.override = null;
    const last = track[track.length - 1], first = track[0];
    const dt = Math.max(16, last.t - first.t) / 1000;
    b.vx = Math.max(-3000, Math.min(3000, (last.x - first.x) / dt));
    b.vy = Math.max(-3000, Math.min(3000, (last.y - first.y) / dt));
    const moved = Math.hypot(last.x - downX, last.y - downY);
    if (moved < 6 && performance.now() - downT < 350) leaveTo(projectUrl(b.p));
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);

  // shake the box: everything jumps
  box.querySelector('#shake').addEventListener('click', () => {
    bodies.forEach((b) => {
      b.vy = -(700 + rand() * 900);
      b.vx = (rand() - 0.5) * 1100;
      b.va = (rand() - 0.5) * 900;
    });
  });

  return drop;
}

/* The begin: a capsule-toy machine. The counter runs to 100, the capsule wobbles and pops, the
   toys drop into the box (Robert Tran's playable intro, K95's counter). Once per visit. */
async function playIntro(intro, onOpen) {
  const capsule = intro.querySelector('#capsule');
  const count = intro.querySelector('#count');
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    capsule.classList.add('is-open');
    onOpen();
    setTimeout(() => intro.classList.add('is-gone'), 260);
    setTimeout(() => intro.remove(), 700);
  };
  intro.addEventListener('click', finish);
  addEventListener('keydown', finish, { once: true });
  const t0 = performance.now(), RUN = 1200;
  const run = (now) => {
    if (done) return;
    const t = Math.min(1, (now - t0) / RUN);
    count.textContent = Math.round((1 - (1 - t) ** 3) * 100);
    if (t < 1) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
  await wait(RUN * 0.55);
  capsule.classList.add('is-shaking');
  await wait(RUN * 0.45 + 450);
  finish();
}

/* ============ Work: the shelf and the index ============ */
function setupWork() {
  const shelf = document.getElementById('shelf-view');
  const index = document.getElementById('index-view');
  const filter = document.getElementById('filter');
  const peek = document.getElementById('peek');
  const rand = seeded('shelf');

  // the filter is a sentence: "Show me all, brand, packaging … work." (Gander)
  const counts = {};
  PROJECTS.forEach((p) => p.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
  const tags = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  filter.innerHTML = `Show me <button type="button" data-f="" aria-pressed="true">all</button>, ${
    tags.map((t) => `<button type="button" data-f="${esc(t)}" aria-pressed="false">${esc(t.toLowerCase())}</button>`).join(', ')} work.`;

  // the shelf: one plank per year, each toy stands on it with its tag hanging below
  const years = [...new Set(ORDER.map((p) => p.year))];
  shelf.innerHTML = years.map((y) => {
    const list = ORDER.filter((p) => p.year === y);
    return `<section class="shelf-row" data-year="${y}">
      <p class="px shelf-year"><span>${y}</span><span class="n">${list.length} TOYS</span></p>
      <div class="shelf-scroll"><div class="shelf-items">${list.map((p) => `
        <a class="item" href="${projectUrl(p)}" data-tags="${esc(p.tags.join('|'))}" data-tag="OPEN № ${numberOf(p)}">
          <img src="${toyOf(p)}" alt="" loading="lazy" decoding="async">
          <span class="tag" style="--tilt:${((rand() - 0.5) * 8).toFixed(1)}deg"><b>${esc(p.title)}</b><span>№ ${numberOf(p)} · ${esc(p.tags.slice(0, 2).join(' / '))}</span></span>
        </a>`).join('')}</div></div>
    </section>`;
  }).join('');

  // the index: the same works as a table (Base)
  index.innerHTML = `<table class="index">
    <thead><tr><th>№</th><th>WORK</th><th class="tags-col">DISCIPLINES</th><th class="yr">YEAR</th></tr></thead>
    <tbody>${ORDER.map((p) => `<tr data-href="${projectUrl(p)}" data-slug="${p.slug}" data-tags="${esc(p.tags.join('|'))}" data-tag="OPEN →">
      <td class="no">${numberOf(p)}</td><td class="name">${esc(p.title)}</td><td class="tags-col">${chipsHtml(p.tags)}</td><td class="yr">${p.year}</td></tr>`).join('')}</tbody></table>`;
  index.querySelectorAll('tbody tr').forEach((tr) => tr.addEventListener('click', () => leaveTo(tr.dataset.href)));

  // the hovered row's cover rides beside the cursor
  if (MOUSE) {
    const img = peek.querySelector('img');
    index.addEventListener('pointermove', (e) => {
      const tr = e.target instanceof Element && e.target.closest('tbody tr');
      if (!tr) { peek.classList.remove('is-on'); return; }
      const src = thumbOf(bySlug(tr.dataset.slug));
      if (!img.src.endsWith(src)) img.src = src;
      peek.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 90}px)`;
      peek.classList.add('is-on');
    });
    index.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
  }

  // filtering works on both views
  const apply = (tag) => {
    shelf.querySelectorAll('.item').forEach((a) => { a.hidden = !!tag && !a.dataset.tags.split('|').includes(tag); });
    shelf.querySelectorAll('.shelf-row').forEach((row) => {
      const n = row.querySelectorAll('.item:not([hidden])').length;
      row.hidden = !n;
      row.querySelector('.n').textContent = `${n} TOY${n === 1 ? '' : 'S'}`;
    });
    index.querySelectorAll('tbody tr').forEach((tr) => { tr.hidden = !!tag && !tr.dataset.tags.split('|').includes(tag); });
  };
  filter.addEventListener('click', (e) => {
    const b = e.target instanceof Element && e.target.closest('button');
    if (!b) return;
    filter.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    apply(b.dataset.f);
  });

  // SHELF / INDEX
  const views = document.getElementById('views');
  const show = (v) => {
    views.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.view === v)));
    shelf.hidden = v !== 'shelf';
    index.hidden = v !== 'index';
    try { sessionStorage.setItem('d3-view', v); } catch (e) {}
  };
  views.addEventListener('click', (e) => {
    const b = e.target instanceof Element && e.target.closest('button');
    if (b) show(b.dataset.view);
  });
  let saved = 'shelf';
  try { saved = sessionStorage.getItem('d3-view') || 'shelf'; } catch (e) {}
  show(saved);
}

/* ============ Project ============ */
function renderProject(root) {
  const p = bySlug(new URLSearchParams(location.search).get('p'));
  if (!p) {
    root.innerHTML = `<h1 class="big">Lost toy.</h1><p class="p-sub">This work is not in the box. <a class="btn" href="work.html">BACK TO THE SHELF</a></p>`;
    return;
  }
  document.title = `${p.title} — EBADUDU`;
  const media = mediaOf(p);
  const heroIdx = p.hero || 0;
  const hero = media[heroIdx];
  const hidden = new Set([heroIdx, ...(p.hide || [])]);
  const clip = (m, extra = '') => `<video src="${m.src}" poster="${m.poster}" muted loop playsinline preload="metadata"${extra}></video>`;
  const pic = (m) => (m.type === 'video' ? clip(m) : `<img src="${m.src}" width="${m.w}" height="${m.h}" alt="" loading="lazy" decoding="async">`);
  const next = ORDER[(ORDER.indexOf(p) + 1) % ORDER.length];
  const paras = p.text || [];

  root.innerHTML = `
    <header class="p-head">
      <p class="px specs">№ ${numberOf(p)} · ${p.year} · ${esc(p.tags.join(' / '))}</p>
      <h1 class="big">${esc(p.title)}</h1>
      ${p.subtitle ? `<p class="p-sub">${esc(p.subtitle)}</p>` : ''}
    </header>
    <figure class="p-cover${p.fit === 'contain' ? ' contain' : ''}">
      <div class="frame">${hero ? (hero.type === 'video' ? clip(hero, ' autoplay') : `<img src="${hero.src}" alt="${esc(p.title)}">`) : ''}</div>
      <img class="corner-toy" src="${toyOf(p)}" alt="">
    </figure>
    <section class="p-story">
      <p class="px label">_THE STORY</p>
      <div>${paras.map((t) => `<p class="p-text">${esc(t)}</p>`).join('')}</div>
    </section>
    <p class="px label" style="margin-top:56px">_GALLERY</p>
    <div class="p-gallery">${media.map((m, i) => (hidden.has(i) ? '' : `<div class="frame">${pic(m)}</div>`)).join('')}</div>
    <a class="p-next" href="${projectUrl(next)}" data-tag="NEXT TOY →">
      <span><span class="px label">NEXT TOY · № ${numberOf(next)}</span><b>${esc(next.title)}</b></span>
      <img src="${toyOf(next)}" alt="">
    </a>`;
  root.querySelector('.p-head .big').style.fontSize = 'clamp(40px, 6vw, 96px)';

  // films play by themselves, muted, while on screen
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) e.target.play().catch(() => {}); else e.target.pause();
  }), { threshold: 0.3 });
  root.querySelectorAll('video').forEach((v) => io.observe(v));
}

/* ============ Boot ============ */
const topBar = document.getElementById('top');
if (topBar) renderTop(topBar);
const lid = document.getElementById('lid');
if (lid) setupLid(lid);
const tagCursor = document.getElementById('tag-cursor');
if (tagCursor) setupTagCursor(tagCursor);
const frog = document.getElementById('frog');

const box = document.getElementById('box');
if (box) {
  const drop = setupBox(box);
  const intro = document.getElementById('intro');
  let seen = false;
  try { seen = sessionStorage.getItem('d3-intro') === '1'; } catch (e) {}
  if (intro && !seen && !STILL) {
    try { sessionStorage.setItem('d3-intro', '1'); } catch (e) {}
    playIntro(intro, () => { drop(); if (frog) setupFrog(frog, 1200); });
  } else {
    intro?.remove();
    drop();
    if (frog) setupFrog(frog);
  }
} else if (frog) {
  setupFrog(frog);
}
if (document.getElementById('shelf-view')) setupWork();
const project = document.getElementById('project');
if (project) renderProject(project);
