(function() {
  document.addEventListener('DOMContentLoaded', () => {
    initHexAnimation();
    initWorkToggle();
    initPhotoGallery();
    initPageTransitions();
  });

  // ===========================
  // Hex ID Animation (rAF-batched)
  // ===========================

  function initHexAnimation() {
    const navIds = document.querySelectorAll('.nav-id');
    if (!navIds.length) return;

    const hexChars = '0123456789ABCDEF';
    const intervals = [0, 800, 400, 80];
    const state = [];

    for (let i = 0; i < navIds.length; i++) {
      state.push({
        el: navIds[i],
        chars: navIds[i].getAttribute('data-base').split(''),
        lastUpdate: [0, 0, 0, 0]
      });
    }

    function tick(timestamp) {
      for (let i = 0; i < state.length; i++) {
        const s = state[i];
        let changed = false;
        for (let d = 1; d < 4; d++) {
          if (timestamp - s.lastUpdate[d] >= intervals[d]) {
            s.chars[d] = hexChars[(Math.random() * 16) | 0];
            s.lastUpdate[d] = timestamp;
            changed = true;
          }
        }
        if (changed) {
          s.el.textContent = s.chars.join('');
        }
      }
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // ===========================
  // Work Submenu Toggle
  // ===========================

  function initWorkToggle() {
    const workToggle = document.querySelector('.work-toggle');
    const subLinks = document.querySelector('.sub-links');
    if (workToggle && subLinks) {
      workToggle.addEventListener('click', () => subLinks.classList.toggle('expanded'));
    }
  }

  // ===========================
  // Photo Gallery (Fade-in + Lightbox)
  // ===========================

  function initPhotoGallery() {
    const images = document.querySelectorAll('.photo-gallery img');
    if (!images.length) return;

    // Fade-in on scroll
    const observer = new IntersectionObserver((entries) => {
      for (let i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('visible');
          observer.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.1 });

    for (let i = 0; i < images.length; i++) {
      observer.observe(images[i]);
    }

    // Lightbox
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    const lightboxImg = document.createElement('img');
    lightboxImg.className = 'lightbox-img';
    overlay.appendChild(lightboxImg);
    document.body.appendChild(overlay);

    function closeLightbox() {
      overlay.classList.remove('active');
    }

    for (let i = 0; i < images.length; i++) {
      images[i].addEventListener('click', function() {
        lightboxImg.src = this.src;
        overlay.classList.add('active');
      });
    }

    overlay.addEventListener('click', (e) => {
      if (e.target !== lightboxImg) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  // ===========================
  // Page Transition Fade Out
  // ===========================

  function initPageTransitions() {
    const main = document.querySelector('main');
    if (!main) return;

    const links = document.querySelectorAll('a[href$=".html"]');
    for (let i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function(e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        main.classList.add('fade-out');
        setTimeout(() => { window.location.href = href; }, 300);
      });
    }
  }
})();
