(function () {
  'use strict';

  var PLACEHOLDER =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  var WORK_PAGE =
    /\/(?:photography|code|film|resume|commercial-work|series-prints|stripling|decay|ape-drums-for-solara-sounds|nick-cheo-for-nukds|luco|portraiture|other-works)\.html$/;

  document.addEventListener('DOMContentLoaded', function () {
    initHexAnimation();
    initWorkToggle();
    initPhotoGallery();
  });

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initHexAnimation() {
    var ids = document.querySelectorAll('.nav-id');
    if (!ids.length) return;

    var hex = '0123456789ABCDEF';
    var speed = 50;
    var delay = 200;
    var state = [];
    var i;

    for (i = 0; i < ids.length; i++) {
      var raw = ids[i].getAttribute('data-base');
      var width = raw && raw.length >= 6 ? 6 : raw && raw.length >= 3 ? 3 : 6;
      var base =
        raw && raw.length >= width
          ? raw.slice(0, width).split('')
          : Array(width).fill('0');
      state.push({
        el: ids[i],
        base: base,
        width: width,
        chars: base.map(function () {
          return hex[(Math.random() * 16) | 0];
        }),
        locked: 0,
        done: false,
      });
      if (prefersReducedMotion()) {
        ids[i].textContent = base.join('');
        state[i].done = true;
      } else {
        ids[i].textContent = state[i].chars.join('');
      }
    }

    if (prefersReducedMotion() || state.every(function (s) { return s.done; })) {
      return;
    }

    var start = performance.now();
    var last = 0;
    var idleTimer = null;
    var running = true;

    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (!running && idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
    });

    function tick(ts) {
      var s;
      if (!running) {
        requestAnimationFrame(tick);
        return;
      }

      if (ts - last >= speed) {
        last = ts;
        for (i = 0; i < state.length; i++) {
          s = state[i];
          for (var d = s.locked; d < s.width; d++) {
            s.chars[d] = hex[(Math.random() * 16) | 0];
          }
          if (s.locked < s.width) s.el.textContent = s.chars.join('');
        }
      }

      for (i = 0; i < state.length; i++) {
        s = state[i];
        if (s.done) continue;
        var itemDelay = i * 200;
        var elapsed = ts - start - 1000 - itemDelay;
        if (elapsed < 0) continue;
        var n = Math.floor(elapsed / delay);
        while (s.locked < s.width && s.locked < n) {
          s.chars[s.locked] = s.base[s.locked];
          s.locked++;
        }
        if (s.locked >= s.width) {
          s.done = true;
          s.el.textContent = s.chars.join('');
        }
      }

      if (state.every(function (x) { return x.done; })) {
        idle();
        return;
      }
      requestAnimationFrame(tick);
    }

    function idle() {
      var s;
      if (!running) {
        idleTimer = setTimeout(idle, 200);
        return;
      }
      for (i = 0; i < state.length; i++) {
        s = state[i];
        s.chars[s.width - 1] = hex[(Math.random() * 16) | 0];
        s.el.textContent = s.chars.join('');
      }
      idleTimer = setTimeout(function () {
        requestAnimationFrame(idle);
      }, 90);
    }

    requestAnimationFrame(tick);
  }

  function initWorkToggle() {
    var btn = document.querySelector('.work-toggle');
    var sub = document.querySelector('.sub-links');
    if (sub && WORK_PAGE.test(location.pathname)) {
      sub.classList.add('expanded');
    }
    if (btn && sub) {
      btn.addEventListener('click', function () {
        sub.classList.toggle('expanded');
      });
    }
  }

  function initPhotoGallery() {
    var imgs = document.querySelectorAll(
      '.photo-gallery .photo-cell.explorer-item--file img, .photo-gallery .photo-cell:not(.photo-collection):not(.explorer-item--folder) img'
    );
    if (!imgs.length) return;

    var nFirst = 9;
    var loadZone = 400;

    function thumbOf(el) {
      return (
        el.getAttribute('data-thumb') ||
        el.getAttribute('data-src') ||
        el.currentSrc ||
        el.src
      );
    }

    function fullOf(el) {
      return el.getAttribute('data-full') || thumbOf(el);
    }

    for (var i = 0; i < imgs.length; i++) {
      var thumb = imgs[i].getAttribute('data-thumb') || imgs[i].getAttribute('src');
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

    function loadThumb(el) {
      var src = el.getAttribute('data-src') || el.getAttribute('data-thumb');
      if (!src || src.indexOf('data:') === 0) return;
      if (el.src && el.src.indexOf('data:') !== 0 && !el.getAttribute('data-src')) return;
      el.src = src;
      el.removeAttribute('data-src');
      el.classList.add('visible');
    }

    var loadObs = new IntersectionObserver(
      function (entries) {
        for (var j = 0; j < entries.length; j++) {
          if (entries[j].isIntersecting) loadThumb(entries[j].target);
        }
      },
      { threshold: 0, rootMargin: loadZone + 'px 0px' }
    );

    var unloadObs = new IntersectionObserver(
      function (entries) {
        for (var k = 0; k < entries.length; k++) {
          var el = entries[k].target;
          if (entries[k].isIntersecting) continue;
          if (!el.src || el.src.indexOf('data:') === 0) continue;
          el.setAttribute('data-src', thumbOf(el));
          el.src = PLACEHOLDER;
          el.classList.remove('visible');
        }
      },
      { threshold: 0, rootMargin: '1200px 0px' }
    );

    for (i = 0; i < imgs.length; i++) {
      loadObs.observe(imgs[i]);
      unloadObs.observe(imgs[i]);
    }

    var lb = document.createElement('div');
    lb.className = 'lightbox-overlay';
    var lbImg = document.createElement('img');
    lbImg.className = 'lightbox-img';
    lb.appendChild(lbImg);
    document.body.appendChild(lb);

    var idx = 0;
    var loadToken = 0;

    function preload(url) {
      if (!url) return;
      var im = new Image();
      im.decoding = 'async';
      im.src = url;
    }

    function show(idxN) {
      idx = (idxN + imgs.length) % imgs.length;
      var token = ++loadToken;
      var thumb = thumbOf(imgs[idx]);
      var full = fullOf(imgs[idx]);
      lbImg.src = thumb;
      if (full && full !== thumb) {
        var hi = new Image();
        hi.decoding = 'async';
        hi.onload = function () {
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

    for (i = 0; i < imgs.length; i++) {
      (function (index) {
        imgs[index].addEventListener('click', function () {
          show(index);
          lb.classList.add('active');
        });
      })(i);
    }

    lb.addEventListener('click', function (e) {
      if (e.target !== lbImg) closeLb();
    });

    document.addEventListener('keydown', function (e) {
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
})();
