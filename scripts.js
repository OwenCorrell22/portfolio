(function() {
  document.addEventListener('DOMContentLoaded', () => {
    initHexAnimation();
    initWorkToggle();
    initPhotoGallery();
    initCustomCursor();
  });

  function initHexAnimation() {
    const ids = document.querySelectorAll('.nav-id');
    if (!ids.length) return;

    const hex = '0123456789ABCDEF';
    const speed = 50;
    const delay = 200;
    const state = [];

    for (let i = 0; i < ids.length; i++) {
      const raw = ids[i].getAttribute('data-base');
      const base = (raw && raw.length >= 6) ? raw.slice(0, 6).split('') : ['0','0','0','0','0','0'];
      state.push({
        el: ids[i],
        base: base,
        chars: base.map(() => hex[(Math.random() * 16) | 0]),
        locked: 0,
        done: false
      });
      ids[i].textContent = state[i].chars.join('');
    }

    const start = performance.now();
    let last = 0;

    function tick(ts) {
      if (ts - last >= speed) {
        last = ts;
        for (let i = 0; i < state.length; i++) {
          const s = state[i];
          for (let d = s.locked; d < 6; d++) {
            s.chars[d] = hex[(Math.random() * 16) | 0];
          }
          if (s.locked < 6) s.el.textContent = s.chars.join('');
        }
      }

      for (let i = 0; i < state.length; i++) {
        const s = state[i];
        if (s.done) continue;
        const itemDelay = i * 200;
        const elapsed = ts - start - 1000 - itemDelay;
        if (elapsed < 0) continue;
        const n = Math.floor(elapsed / delay);
        while (s.locked < 6 && s.locked < n) {
          s.chars[s.locked] = s.base[s.locked];
          s.locked++;
        }
        if (s.locked >= 6) {
          s.done = true;
          s.el.textContent = s.chars.join('');
        }
      }

      if (state.every(s => s.done)) {
        idle();
        return;
      }
      requestAnimationFrame(tick);
    }

    function idle() {
      for (let i = 0; i < state.length; i++) {
        const s = state[i];
        s.chars[5] = hex[(Math.random() * 16) | 0];
        s.el.textContent = s.chars.join('');
      }
      setTimeout(() => requestAnimationFrame(idle), 90);
    }

    requestAnimationFrame(tick);
  }

  function initWorkToggle() {
    const WORK_DROPDOWN = false; // set true to restore Projects / Photo / Video dropdown
    const btn = document.querySelector('.work-toggle');
    const sub = document.querySelector('.sub-links');
    if (WORK_DROPDOWN && btn && sub) {
      btn.addEventListener('click', () => sub.classList.toggle('expanded'));
    }
  }

  var PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  function initPhotoGallery() {
    const imgs = document.querySelectorAll('.photo-gallery img');
    if (!imgs.length) return;

    const nFirst = 9;
    const loadZone = 400;

    function thumbOf(el) {
      return el.getAttribute('data-thumb') || el.getAttribute('data-src') || el.currentSrc || el.src;
    }

    function fullOf(el) {
      return el.getAttribute('data-full') || thumbOf(el);
    }

    for (let i = 0; i < imgs.length; i++) {
      const thumb = imgs[i].getAttribute('data-thumb') || imgs[i].getAttribute('src');
      imgs[i].setAttribute('data-thumb', thumb);
      imgs[i].setAttribute('decoding', 'async');
      if (i >= nFirst) {
        imgs[i].setAttribute('data-src', thumb);
        imgs[i].src = PLACEHOLDER;
        imgs[i].setAttribute('loading', 'lazy');
      } else {
        imgs[i].src = thumb;
        imgs[i].setAttribute('loading', 'eager');
        if (i < 3) imgs[i].setAttribute('fetchpriority', 'high');
        imgs[i].classList.add('visible');
      }
    }

    function inZone(el) {
      var r = el.getBoundingClientRect();
      return r.bottom > -loadZone && r.top < window.innerHeight + loadZone;
    }

    function loadThumb(el) {
      var src = el.getAttribute('data-src') || el.getAttribute('data-thumb');
      if (!src || src.indexOf('data:') === 0) return;
      if (el.src && el.src.indexOf('data:') !== 0 && !el.getAttribute('data-src')) return;
      el.src = src;
      el.removeAttribute('data-src');
      el.classList.add('visible');
    }

    function catchUp() {
      for (let i = 0; i < imgs.length; i++) {
        if (inZone(imgs[i])) loadThumb(imgs[i]);
      }
    }

    const loadObs = new IntersectionObserver((entries) => {
      for (let i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) loadThumb(entries[i].target);
      }
    }, { threshold: 0, rootMargin: loadZone + 'px 0px' });

    const unloadObs = new IntersectionObserver((entries) => {
      for (let i = 0; i < entries.length; i++) {
        const el = entries[i].target;
        if (entries[i].isIntersecting) continue;
        if (!el.src || el.src.indexOf('data:') === 0) continue;
        el.setAttribute('data-src', thumbOf(el));
        el.src = PLACEHOLDER;
        el.classList.remove('visible');
      }
    }, { threshold: 0, rootMargin: '1200px 0px' });

    for (let i = 0; i < imgs.length; i++) {
      loadObs.observe(imgs[i]);
      unloadObs.observe(imgs[i]);
    }

    catchUp();
    window.addEventListener('scroll', catchUp, { passive: true });

    const lb = document.createElement('div');
    lb.className = 'lightbox-overlay';
    const lbImg = document.createElement('img');
    lbImg.className = 'lightbox-img';
    lb.appendChild(lbImg);
    document.body.appendChild(lb);

    let idx = 0;
    let loadToken = 0;

    function preload(url) {
      if (!url) return;
      const im = new Image();
      im.decoding = 'async';
      im.src = url;
    }

    function show(idxN) {
      idx = (idxN + imgs.length) % imgs.length;
      const token = ++loadToken;
      const thumb = thumbOf(imgs[idx]);
      const full = fullOf(imgs[idx]);
      lbImg.src = thumb;
      if (full && full !== thumb) {
        const hi = new Image();
        hi.decoding = 'async';
        hi.onload = function() {
          if (token !== loadToken) return;
          lbImg.src = full;
        };
        hi.src = full;
      }
      preload(fullOf(imgs[(idx + 1) % imgs.length]));
      preload(fullOf(imgs[(idx - 1 + imgs.length) % imgs.length]));
    }

    function closeLb() {
      lb.classList.remove('active');
      loadToken++;
    }

    for (let i = 0; i < imgs.length; i++) {
      imgs[i].addEventListener('click', function() {
        idx = i;
        show(i);
        lb.classList.add('active');
      });
    }

    lb.addEventListener('click', (e) => {
      if (e.target !== lbImg) closeLb();
    });

    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('active')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLb();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        show(e.key === 'ArrowLeft' ? idx - 1 : idx + 1);
      }
    });
  }

  function initCustomCursor() {
    if ('ontouchstart' in window) return;

    const STORAGE_KEY = 'portfolio-cursor-pos';
    const cur = document.createElement('div');
    cur.className = 'custom-cursor';
    document.body.appendChild(cur);

    function place(x, y) {
      cur.style.left = x + 'px';
      cur.style.top = y + 'px';
    }

    function savePos(x, y) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ x: x, y: y }));
      } catch (_) {}
    }

    function updateHover(x, y) {
      const el = document.elementFromPoint(x, y);
      if (el && (el.tagName === 'A' || el.tagName === 'BUTTON' || el.closest('a') || el.closest('button'))) {
        cur.classList.add('hovering');
      } else {
        cur.classList.remove('hovering');
      }
    }

    let restored = false;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const pos = JSON.parse(raw);
        if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
          place(pos.x, pos.y);
          updateHover(pos.x, pos.y);
          restored = true;
        }
      }
    } catch (_) {}

    if (!restored) {
      cur.style.opacity = '0';
    }

    function onPointer(x, y) {
      place(x, y);
      savePos(x, y);
      updateHover(x, y);
      cur.style.opacity = '1';
    }

    document.addEventListener('mousemove', (e) => onPointer(e.clientX, e.clientY));

    document.addEventListener('mousedown', (e) => savePos(e.clientX, e.clientY));

    document.addEventListener('mouseleave', () => {
      cur.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      cur.style.opacity = '1';
    });
  }

})();
