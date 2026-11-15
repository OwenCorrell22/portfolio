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
    var root = document.querySelector('[data-home-slideshow], .site-pane--home[data-home-slideshow]');
    if (!root) return;

    var photoIds = [29, 68, 1, 78, 52, 5, 2, 22];
    var intervalMs = parseInt(root.getAttribute('data-interval'), 10) || 3000;
    var layerA = root.querySelector('.home-slideshow__layer--a');
    var layerB = root.querySelector('.home-slideshow__layer--b');
    if (!layerA || !layerB || !photoIds.length) return;

    var index = 0;
    var useA = true;

    function srcFor(id) {
      return 'assets/view/' + id + '.jpg';
    }

    function setAlt(img, id) {
      img.alt = 'Photograph ' + id + ' by Owen Correll';
    }

    layerA.src = srcFor(photoIds[0]);
    setAlt(layerA, photoIds[0]);
    layerA.classList.add('is-visible');
    layerB.classList.remove('is-visible');

    if (prefersReducedMotion()) return;

    var timer = setInterval(advance, intervalMs);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearInterval(timer);
        timer = null;
      } else if (!timer) {
        timer = setInterval(advance, intervalMs);
      }
    });

    function advance() {
      index = (index + 1) % photoIds.length;
      var id = photoIds[index];
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
  }

  /* ── Lightbox ── */

  function initLightbox() {
    var grid = document.querySelector('.photo-grid');
    if (!grid) return;

    // Build overlay
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

    // Click grid images to open
    grid.addEventListener('click', function (e) {
      var target = e.target.closest('.photo-grid__item');
      if (!target) return;
      open(target.src, target.alt);
    });

    // Click overlay (outside image) or image to close
    overlay.addEventListener('click', function () {
      close();
    });

    // Keyboard close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
        close();
      }
    });
  }

})();
