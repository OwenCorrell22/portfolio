(function() {
  document.addEventListener('DOMContentLoaded', () => {
    initHexAnimation();
    initWorkToggle();
    initPhotoGallery();
    initPageTransitions();
    initHomepageInteraction();
    initNavName();
    initCustomCursor();
  });

  // ===========================
  // Hex ID Animation (rAF-batched)
  // ===========================

  function initHexAnimation() {
    const navIds = document.querySelectorAll('.nav-id');
    if (!navIds.length) return;

    const hexChars = '0123456789ABCDEF';
    const SCRAMBLE_SPEED = 50;       // ms between random flips during scramble
    const SCRAMBLE_HOLD = 1000;      // ms of pure scramble before locking starts
    const LOCK_DELAY = 200;          // ms between each digit locking in
    const IDLE_SPEED = 90;           // ms for last-digit idle cycle
    const DIGITS = 6;                // length of hex ID
    const state = [];

    for (let i = 0; i < navIds.length; i++) {
      const base = navIds[i].getAttribute('data-base').split('');
      state.push({
        el: navIds[i],
        base: base,
        chars: base.map(() => hexChars[(Math.random() * 16) | 0]),
        locked: 0,                   // how many digits locked from left
        done: false
      });
      // start fully scrambled
      navIds[i].textContent = state[i].chars.join('');
    }

    const startTime = performance.now();
    let lastScramble = 0;

    function tick(timestamp) {
      // scramble unlocked digits
      if (timestamp - lastScramble >= SCRAMBLE_SPEED) {
        lastScramble = timestamp;
        for (let i = 0; i < state.length; i++) {
          const s = state[i];
          let changed = false;
          for (let d = s.locked; d < DIGITS; d++) {
            s.chars[d] = hexChars[(Math.random() * 16) | 0];
            changed = true;
          }
          if (changed) s.el.textContent = s.chars.join('');
        }
      }

      // lock digits one at a time, staggered per nav item
      for (let i = 0; i < state.length; i++) {
        const s = state[i];
        if (s.done) continue;
        // each nav item starts locking after a stagger
        const itemDelay = i * 200;
        const elapsed = timestamp - startTime - SCRAMBLE_HOLD - itemDelay;
        if (elapsed < 0) continue;
        const shouldLock = Math.floor(elapsed / LOCK_DELAY);
        while (s.locked < DIGITS && s.locked < shouldLock) {
          s.chars[s.locked] = s.base[s.locked];
          s.locked++;
        }
        if (s.locked >= DIGITS) {
          s.done = true;
          s.el.textContent = s.chars.join('');
        }
      }

      // once all decoded, switch to idle: only last digit cycles
      if (state.every(s => s.done)) {
        idleTick();
        return;
      }

      requestAnimationFrame(tick);
    }

    function idleTick() {
      for (let i = 0; i < state.length; i++) {
        const s = state[i];
        s.chars[DIGITS - 1] = hexChars[(Math.random() * 16) | 0];
        s.el.textContent = s.chars.join('');
      }
      setTimeout(() => requestAnimationFrame(idleTick), IDLE_SPEED);
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

    // Kick animation on nav clicks
    const navItems = document.querySelectorAll('.nav-links a, .work-toggle');
    for (let i = 0; i < navItems.length; i++) {
      navItems[i].addEventListener('click', function() {
        this.classList.remove('nav-kick');
        void this.offsetWidth; // reflow to restart animation
        this.classList.add('nav-kick');
      });
      navItems[i].addEventListener('animationend', function() {
        this.classList.remove('nav-kick');
      });
    }
  }

  // Photo Gallery (Fade-in + Lightbox)

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

    let currentIndex = 0;

    function showImage(idx) {
      currentIndex = (idx + images.length) % images.length;
      lightboxImg.src = images[currentIndex].getAttribute('data-full') || images[currentIndex].src;
    }

    function closeLightbox() {
      overlay.classList.remove('active');
    }

    for (let i = 0; i < images.length; i++) {
      images[i].addEventListener('click', function() {
        currentIndex = i;
        showImage(i);
        overlay.classList.add('active');
      });
    }

    overlay.addEventListener('click', (e) => {
      if (e.target !== lightboxImg) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
      if (e.key === 'ArrowRight') showImage(currentIndex + 1);
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
  // ===========================
  // Nav Name (hide on home, fade in elsewhere)
  // ===========================

  function initNavName() {
    const nameEl = document.querySelector('.name');
    if (!nameEl) return;
    const isHome = !!document.querySelector('.hero');

    if (isHome) {
      nameEl.style.opacity = '0';
      nameEl.style.pointerEvents = 'none';
    } else {
      nameEl.style.opacity = '0';
      requestAnimationFrame(() => {
        nameEl.style.transition = 'opacity 0.5s ease';
        nameEl.style.opacity = '1';
        nameEl.addEventListener('transitionend', function handler() {
          nameEl.style.transition = '';
          nameEl.style.opacity = '';
          nameEl.removeEventListener('transitionend', handler);
        });
      });
    }
  }

  // ===========================
  // Homepage Interaction
  // ===========================

  function initHomepageInteraction() {
    const heroTitle = document.querySelector('.hero h1');
    if (!heroTitle) return;

    // 1. Split text into individual letter spans
    const text = heroTitle.textContent;
    heroTitle.innerHTML = '';
    const letters = [];
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
      span.className = 'hero-letter';
      heroTitle.appendChild(span);
      letters.push(span);
    }

    // Pointer state (smooth) — only activates on real mouse movement after 0.5s
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const smoothPointer = { x: pointer.x, y: pointer.y };
    let active = false;

    setTimeout(() => {
      document.addEventListener('mousemove', function onFirstMove(e) {
        active = true;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        document.removeEventListener('mousemove', onFirstMove);
        document.addEventListener('mousemove', (ev) => {
          pointer.x = ev.clientX;
          pointer.y = ev.clientY;
        });
      });
    }, 500);

    // Click/tap burst (works regardless of active)
    let burst = null;
    document.addEventListener('click', (e) => {
      burst = { x: e.clientX, y: e.clientY, time: performance.now() };
    });
    document.addEventListener('touchend', (e) => {
      if (e.changedTouches.length) {
        burst = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY, time: performance.now() };
      }
    });

    // Animation loop
    function animate() {
      for (let i = 0; i < letters.length; i++) {
        const span = letters[i];
        let tx = 0, ty = 0;

        if (active) {
          // Smooth pointer
          smoothPointer.x += (pointer.x - smoothPointer.x) * 0.08;
          smoothPointer.y += (pointer.y - smoothPointer.y) * 0.08;

          const rect = span.getBoundingClientRect();
          const lx = rect.left + rect.width / 2;
          const ly = rect.top + rect.height / 2;
          const dx = lx - smoothPointer.x;
          const dy = ly - smoothPointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Magnetic push
          const maxDist = 400;
          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 50;
            tx = (dx / dist) * force;
            ty = (dy / dist) * force;
          }

          // Dynamic shadow (light source at pointer)
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          const shadowX = (smoothPointer.x - cx) / cx * -6;
          const shadowY = (smoothPointer.y - cy) / cy * -6;
          const shadowBlur = 3 + (Math.abs(shadowX) + Math.abs(shadowY)) * 0.6;
          span.style.textShadow = shadowX + 'px ' + shadowY + 'px ' + shadowBlur + 'px rgba(42,42,42,0.12)';
        }

        // Click burst (works even when not active)
        if (burst) {
          const rect = span.getBoundingClientRect();
          const lx = rect.left + rect.width / 2;
          const ly = rect.top + rect.height / 2;
          const elapsed = performance.now() - burst.time;
          const duration = 800;
          if (elapsed < duration) {
            const progress = elapsed / duration;
            const ease = Math.sin(progress * Math.PI);
            const strength = ease * 60;
            const bx = lx - burst.x;
            const by = ly - burst.y;
            const bDist = Math.sqrt(bx * bx + by * by) || 1;
            const falloff = Math.max(0, 1 - bDist / 500);
            tx += (bx / bDist) * strength * falloff;
            ty += (by / bDist) * strength * falloff;
          } else {
            burst = null;
          }
        }

        span.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
      }

      requestAnimationFrame(animate);
    }

    animate();
  }
  function initCustomCursor() {
    if ('ontouchstart' in window) return;

    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';

      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && (el.tagName === 'A' || el.tagName === 'BUTTON' || el.closest('a') || el.closest('button'))) {
        cursor.classList.add('hovering');
      } else {
        cursor.classList.remove('hovering');
      }
    });

    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      cursor.style.opacity = '1';
    });
  }

})();
