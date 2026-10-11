/* =========================================================
   D3 — EBADUDU, "the toy box". Written from zero for this site.
   ========================================================= */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
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
  if (shut) {
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
  if (!lid) { location.href = href; return; }
  try { sessionStorage.setItem('d3-lid', '1'); } catch (e) {}
  lid.classList.add('is-shut');
  // the lid takes .38s; leave the moment it is shut, not a beat later
  setTimeout(() => { location.href = href; }, 360);
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
      || (t?.closest('a') ? 'OPEN' : t?.closest('button') ? 'PRESS' : 'ZIHE ✦');
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
// short, in the second person, one idea each (stop-slop); a phone gets its own words for
// what a mouse would do
const FROG_LINES = {
  home: [
    MOUSE ? 'Hi! Grab a toy and throw it.' : 'Hi! Drag a toy with your finger and fling it.',
    'Can you stack three toys so they stand?',
    'SHAKE THE BOX sends every toy flying.',
  ],
  work: [
    'Pick a word in the sentence to filter the shelf.',
    'INDEX shows the same works as a list.',
    MOUSE ? 'Point at a toy and it hops.' : 'Tap a toy to open its work.',
  ],
  project: ['The story and the pictures are below.', 'The next toy waits at the bottom.'],
  about: ['This is Zihe. Say hi!', 'Zihe’s email is at the bottom.'],
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
  // a click is one discrete event, so a one-shot hop (Web Animations) fits it. It moves the
  // separate translate/rotate/scale, so it adds to the hover lift; a new click restarts it
  const img = frog.querySelector('img');
  let hop = null;
  img.addEventListener('click', () => {
    say();
    hop?.cancel();
    hop = img.animate([
      { translate: '0 0' },
      { translate: '0 -22px', rotate: '-6deg', offset: 0.4, easing: 'cubic-bezier(.2, 0, .3, 1)' },
      { translate: '0 0', scale: '1.05 .92', offset: 0.75 },
      { translate: '0 0', scale: '1 1' },
    ], { duration: 560, easing: 'cubic-bezier(.3, 0, .2, 1)' });
  });
  img.dataset.tag = 'RIBBIT!';
}

/* ============ Home: the toy box ============
   Physics by Matter.js (rigid bodies, friction, stacking, sleeping). Each toy's collision shape
   is the convex outline traced from its own picture (its opaque pixels), so toys touch where
   they look like they touch, rest on each other and stop. Toys are only for play here: they
   can be picked up, thrown and shaken, and do not lead anywhere. */
function setupBox(box) {
  const mark = box.querySelector('#wordmark');
  mark.innerHTML = mixWord('EBADUDU');
  const layer = box.querySelector('#toys');
  const rand = seeded('toy-box');
  const M = window.Matter;

  let W = box.clientWidth, H = box.clientHeight;
  const unit = () => Math.max(0.55, Math.min(1, Math.min(W / 1440, H / 900)));

  // the outline of a picture: the convex hull of its opaque pixels, in px around its centre
  // (a picture without transparency comes back as its rectangle)
  const outline = (img, w, h) => {
    const S = 72, k = S / Math.max(img.naturalWidth, img.naturalHeight);
    const cw = Math.max(2, Math.round(img.naturalWidth * k)), ch = Math.max(2, Math.round(img.naturalHeight * k));
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, cw, ch);
    let data = null;
    try { data = g.getImageData(0, 0, cw, ch).data; } catch (e) { data = null; }
    const pts = [];
    if (data) {
      for (let y = 0; y < ch; y++) {
        // the leftmost and rightmost solid pixel of each row is enough for a convex hull
        let a = -1, b = -1;
        for (let x = 0; x < cw; x++) if (data[(y * cw + x) * 4 + 3] > 80) { if (a < 0) a = x; b = x; }
        if (a >= 0) pts.push([a, y], [b + 1, y], [a, y + 1], [b + 1, y + 1]);
      }
    }
    if (pts.length < 3) return [{ x: -w / 2, y: -h / 2 }, { x: w / 2, y: -h / 2 }, { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 }];
    // monotone-chain convex hull
    pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [], upper = [];
    pts.forEach((p) => {
      while (lower.length > 1 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
      lower.push(p);
    });
    [...pts].reverse().forEach((p) => {
      while (upper.length > 1 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
      upper.push(p);
    });
    const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
    return hull.map(([x, y]) => ({ x: (x / cw - 0.5) * w, y: (y / ch - 0.5) * h }));
  };

  // the toys: every work's small object
  const toys = ORDER.map((p) => {
    const img = new Image();
    img.className = 'toy';
    img.alt = '';
    img.draggable = false;
    img.style.visibility = 'hidden';
    img.src = toyOf(p);
    layer.append(img);
    return { p, img, base: 105 + rand() * 55, body: null, off: { x: 0, y: 0 }, w: 0, h: 0 };
  });
  const loaded = Promise.all(toys.map((t) => (t.img.complete
    ? Promise.resolve()
    : new Promise((r) => { t.img.onload = r; t.img.onerror = r; }))));
  const sizeOf = (t) => {
    const k = (t.base * unit()) / Math.max(t.img.naturalWidth || 1, t.img.naturalHeight || 1);
    t.w = (t.img.naturalWidth || 100) * k;
    t.h = (t.img.naturalHeight || 100) * k;
    t.img.style.width = `${t.w}px`;
  };

  // no physics library (offline): the toys simply sit along the floor
  if (!M) {
    return async () => {
      await loaded;
      toys.forEach((t, i) => {
        sizeOf(t);
        t.img.style.transform = `translate(${(i / toys.length) * (W - t.w)}px, ${H - t.h - 10}px)`;
        t.img.style.visibility = '';
      });
    };
  }

  const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Query, Sleeping, Vertices, Events } = M;
  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = 1.15;
  engine.positionIterations = 10;
  engine.velocityIterations = 8;

  // the box: a floor and two walls, and a high lid so nothing is thrown out for good
  const T = 400;
  const walls = {
    floor: Bodies.rectangle(W / 2, H + T / 2, W * 4, T, { isStatic: true }),
    left: Bodies.rectangle(-T / 2, H / 2 - 2000, T, H + 6000, { isStatic: true }),
    right: Bodies.rectangle(W + T / 2, H / 2 - 2000, T, H + 6000, { isStatic: true }),
    lid: Bodies.rectangle(W / 2, -3000, W * 4, T, { isStatic: true }),
  };
  Composite.add(engine.world, Object.values(walls));
  addEventListener('resize', () => {
    W = box.clientWidth;
    H = box.clientHeight;
    Body.setPosition(walls.floor, { x: W / 2, y: H + T / 2 });
    Body.setPosition(walls.left, { x: -T / 2, y: H / 2 - 2000 });
    Body.setPosition(walls.right, { x: W + T / 2, y: H / 2 - 2000 });
    toys.forEach((t) => t.body && Sleeping.set(t.body, false));
  });

  // grab, carry, throw: Matter's mouse (and finger) constraint; the wheel is left alone
  const mouse = Mouse.create(box);
  mouse.pixelRatio = 1;
  ['wheel', 'mousewheel', 'DOMMouseScroll'].forEach((n) => box.removeEventListener(n, mouse.mousewheel));
  const grab = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, damping: 0.08, render: { visible: false } } });
  Composite.add(engine.world, grab);

  // each toy's body is built from its own outline
  const build = (t) => {
    sizeOf(t);
    const verts = outline(t.img, t.w, t.h);
    t.off = Vertices.centre(verts);    // where the body's centre sits inside the picture
    t.body = Bodies.fromVertices(0, 0, [verts], {
      friction: 0.6,
      frictionStatic: 0.9,
      frictionAir: 0.012,
      restitution: 0.25,
      density: 0.0016,
      sleepThreshold: 40,
    }, true);
    t.body.plugin.toy = t;
  };

  // drop them in from above, one after another
  const drop = async () => {
    await loaded;
    toys.forEach((t, i) => {
      build(t);
      Body.setPosition(t.body, { x: W * (0.1 + rand() * 0.8), y: -100 - i * 90 });
      Body.setAngle(t.body, (rand() - 0.5) * 1.2);
      Body.setVelocity(t.body, { x: (rand() - 0.5) * 4, y: 0 });
      Composite.add(engine.world, t.body);
      t.img.style.visibility = '';
    });
  };

  // a fixed step keeps the stacking steady whatever the screen's frame rate
  const STEP = 1000 / 60;
  let acc = 0, prev = 0;
  const tick = (now) => {
    requestAnimationFrame(tick);
    if (document.hidden) { prev = now; return; }
    acc += Math.min(100, prev ? now - prev : STEP);
    prev = now;
    while (acc >= STEP) { Engine.update(engine, STEP); acc -= STEP; }
    toys.forEach((t) => {
      const b = t.body;
      if (!b) return;
      // the picture's centre is the body's centre minus the turned offset
      const c = Math.cos(b.angle), s = Math.sin(b.angle);
      const x = b.position.x - (t.off.x * c - t.off.y * s);
      const y = b.position.y - (t.off.x * s + t.off.y * c);
      t.img.style.transform = `translate(${(x - t.w / 2).toFixed(1)}px, ${(y - t.h / 2).toFixed(1)}px) rotate(${b.angle.toFixed(4)}rad)`;
    });
  };
  requestAnimationFrame(tick);

  // what the tag says: the work's name over a toy, a cheer while carrying one
  const bodies = () => toys.map((t) => t.body).filter(Boolean);
  Events.on(grab, 'startdrag', (e) => {
    const t = e.body.plugin.toy;
    cursor.override = 'WHEEE!';
    if (t) { t.img.classList.add('is-held'); layer.append(t.img); }
  });
  Events.on(grab, 'enddrag', (e) => {
    cursor.override = null;
    e.body.plugin.toy?.img.classList.remove('is-held');
  });
  box.addEventListener('pointermove', () => {
    if (!MOUSE || grab.body) return;
    const t = Query.point(bodies(), mouse.position)[0]?.plugin.toy;
    cursor.override = t ? `№ ${numberOf(t.p)} ${t.p.title.length > 34 ? `${t.p.title.slice(0, 32)}…` : t.p.title}` : null;
  });
  box.addEventListener('pointerleave', () => { if (!grab.body) cursor.override = null; });

  // the way out (VIEW ALL MY WORK) and the SHAKE button keep their presses to themselves:
  // Matter's mouse would otherwise cancel a tap on a phone
  box.querySelectorAll('#go-work, #shake').forEach((el) => {
    ['mousedown', 'touchstart'].forEach((n) => el.addEventListener(n, (e) => e.stopPropagation(), { passive: true }));
  });

  // shake the box: everything jumps
  box.querySelector('#shake').addEventListener('click', () => {
    toys.forEach((t) => {
      if (!t.body) return;
      Sleeping.set(t.body, false);
      Body.setVelocity(t.body, { x: (rand() - 0.5) * 22, y: -(12 + rand() * 14) });
      Body.setAngularVelocity(t.body, (rand() - 0.5) * 0.4);
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
      <td class="no">${numberOf(p)}</td><td class="name"><a href="${projectUrl(p)}">${esc(p.title)}</a></td><td class="tags-col">${chipsHtml(p.tags)}</td><td class="yr">${p.year}</td></tr>`).join('')}</tbody></table>`;
  // the name is a real link (Tab, Enter, Cmd/Ctrl-click, middle-click); the rest of the row
  // is a larger target for the same place
  index.querySelectorAll('tbody tr').forEach((tr) => tr.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('a')) return;
    leaveTo(tr.dataset.href);
  }));

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
  // the picked word is kept in the address (work.html?tag=MOTION), so a filtered shelf can be
  // shared and survives Back; a screen reader hears how many works are left
  const status = document.getElementById('filter-status');
  const pick = (tag, announce) => {
    filter.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.f === tag)));
    apply(tag);
    if (!announce) return;
    const n = index.querySelectorAll('tbody tr:not([hidden])').length;
    if (status) status.textContent = `${n} ${n === 1 ? 'work' : 'works'}${tag ? `, ${tag.toLowerCase()}` : ''}`;
    const url = new URL(location.href);
    if (tag) url.searchParams.set('tag', tag); else url.searchParams.delete('tag');
    history.replaceState(null, '', url);
  };
  filter.addEventListener('click', (e) => {
    const b = e.target instanceof Element && e.target.closest('button');
    if (b) pick(b.dataset.f, true);
  });
  const fromUrl = new URLSearchParams(location.search).get('tag');
  if (fromUrl && tags.includes(fromUrl)) pick(fromUrl, false);

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
  document.querySelector('meta[name="description"]')?.setAttribute('content',
    `${p.title}: ${(p.subtitle || p.tags.join(', ')).split('|')[0].trim()}, ${p.year}. A project by Zihe Wang (EBADUDU).`);
  const media = mediaOf(p);
  const heroIdx = p.hero || 0;
  const hero = media[heroIdx];
  const hidden = new Set([heroIdx, ...(p.hide || [])]);
  // gallery pictures are named by their place in the work, so a screen reader can tell them apart
  const altOf = (m) => `${p.title}, ${m.type === 'video' ? 'film' : 'image'} ${media.indexOf(m) + 1} of ${media.length}`;
  // films play muted by themselves
  const clip = (m, extra = '') => `<video src="${m.src}" poster="${m.poster}" muted loop playsinline preload="metadata" aria-label="${esc(altOf(m))}"${extra}></video>`;
  const pic = (m) => (m.type === 'video' ? clip(m) : `<img src="${m.src}" width="${m.w}" height="${m.h}" alt="${esc(altOf(m))}" loading="lazy" decoding="async">`);
  const next = ORDER[(ORDER.indexOf(p) + 1) % ORDER.length];
  const paras = p.text || [];

  root.innerHTML = `
    <header class="p-head">
      <p class="px specs">№ ${numberOf(p)} · ${p.year} · ${esc(p.tags.join(' / '))}</p>
      <h1 class="big">${esc(p.title)}</h1>
      ${p.subtitle ? `<p class="p-sub">${esc(p.subtitle)}</p>` : ''}
    </header>
    <figure class="p-cover${p.fit === 'contain' ? ' contain' : ''}">
      <div class="frame">${hero ? (hero.type === 'video' ? clip(hero, ' autoplay') : `<img src="${hero.src}" alt="${esc(p.title)}" fetchpriority="high">`) : ''}</div>
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
  if (intro && !seen) {
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
