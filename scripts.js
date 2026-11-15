(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initHomeSlideshow();
    initLightbox();
  });

  /* ── Home slideshow ── */

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initHomeSlideshow() {
    var root = document.querySelector('[data-home-slideshow]');
    if (!root) return;

    var photoIds = [29, 5, 52, 2, 22, 1, 78];
    var intervalMs = parseInt(root.getAttribute('data-interval'), 10) || 2500;
    var layerA = root.querySelector('.home-slideshow__layer--a');
    var layerB = root.querySelector('.home-slideshow__layer--b');
    var btnPrev = document.getElementById('slideshow-prev');
    var btnNext = document.getElementById('slideshow-next');
    if (!layerA || !layerB || !photoIds.length) return;

    var index = 0;
    var useA = true;
    var timer = null;

    function srcFor(id) {
      return 'assets/view/' + id + '.jpg';
    }

    function setAlt(img, id) {
      img.alt = 'Photograph ' + id + ' by Owen Correll';
    }

    // Show initial photo
    layerA.src = srcFor(photoIds[0]);
    setAlt(layerA, photoIds[0]);
    layerA.classList.add('is-visible');
    layerB.classList.remove('is-visible');

    function showIndex(newIndex) {
      var id = photoIds[newIndex];
      var next = useA ? layerB : layerA;
      var current = useA ? layerA : layerB;
      var preload = new Image();
      preload.onload = function () {
        next.src = srcFor(id);
        setAlt(next, id);
        next.classList.add('is-visible');
        current.classList.remove('is-visible');
        useA = !useA;
      };
      preload.src = srcFor(id);
    }

    function advance() {
      index = (index + 1) % photoIds.length;
      showIndex(index);
    }

    function retreat() {
      index = (index - 1 + photoIds.length) % photoIds.length;
      showIndex(index);
    }

    function resetTimer() {
      if (timer) clearInterval(timer);
      timer = setInterval(advance, intervalMs);
    }

    if (!prefersReducedMotion()) {
      timer = setInterval(advance, intervalMs);

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          clearInterval(timer);
          timer = null;
        } else if (!timer) {
          timer = setInterval(advance, intervalMs);
        }
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', function () {
        retreat();
        if (!prefersReducedMotion()) resetTimer();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', function () {
        advance();
        if (!prefersReducedMotion()) resetTimer();
      });
    }
  }

  /* ── Lightbox ── */

  function initLightbox() {
    var grid = document.querySelector('.photo-grid');
    if (!grid) return;

    var overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Photo viewer');

    var img = document.createElement('img');
    img.className = 'lightbox__img';
    img.alt = '';

    overlay.appendChild(img);
    document.body.appendChild(overlay);

    function open(src, alt) {
      img.src = src;
      img.alt = alt || '';
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      overlay.focus();
    }

    function close() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      img.src = '';
    }

    grid.addEventListener('click', function (e) {
      var target = e.target.closest('.photo-grid__item');
      if (!target) return;
      open(target.src, target.alt);
    });

    overlay.addEventListener('click', function () {
      close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
        close();
      }
    });
  }

})();
