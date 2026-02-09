(function() {
  document.addEventListener('DOMContentLoaded', () => {
    initHexAnimation();
    initWorkToggle();
    initPhotoGallery();
    initPageTransitions();
    initHomepageInteraction();
    initNavName();
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

    // Pointer state (smooth)
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const smoothPointer = { x: pointer.x, y: pointer.y };

    document.addEventListener('mousemove', (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    });

    document.addEventListener('touchmove', (e) => {
      pointer.x = e.touches[0].clientX;
      pointer.y = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchstart', (e) => {
      pointer.x = e.touches[0].clientX;
      pointer.y = e.touches[0].clientY;
    }, { passive: true });

    // Click/tap burst
    let burst = null;
    document.addEventListener('click', (e) => {
      burst = { x: e.clientX, y: e.clientY, time: performance.now() };
    });
    document.addEventListener('touchend', (e) => {
      if (e.changedTouches.length) {
        burst = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY, time: performance.now() };
      }
    });

    // Gyroscope for mobile
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma !== null && e.beta !== null) {
          pointer.x = window.innerWidth / 2 + (e.gamma / 45) * window.innerWidth * 0.4;
          pointer.y = window.innerHeight / 2 + ((e.beta - 40) / 45) * window.innerHeight * 0.4;
        }
      });
    }

    // Animation loop
    function animate() {
      // Smooth pointer
      smoothPointer.x += (pointer.x - smoothPointer.x) * 0.08;
      smoothPointer.y += (pointer.y - smoothPointer.y) * 0.08;

      // Magnetic text + Dynamic light source
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;

      for (let i = 0; i < letters.length; i++) {
        const span = letters[i];
        const rect = span.getBoundingClientRect();
        const lx = rect.left + rect.width / 2;
        const ly = rect.top + rect.height / 2;

        const dx = lx - smoothPointer.x;
        const dy = ly - smoothPointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Magnetic push
        let tx = 0, ty = 0;
        const maxDist = 400;
        if (dist < maxDist && dist > 0) {
          const force = (1 - dist / maxDist) * 50;
          tx = (dx / dist) * force;
          ty = (dy / dist) * force;
        }

        // Click burst
        if (burst) {
          const elapsed = performance.now() - burst.time;
          const duration = 800;
          if (elapsed < duration) {
            const progress = elapsed / duration;
            // ease-out curve: ramps up gently, fades slowly
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

        // Dynamic shadow (light source at pointer)
        const shadowX = (smoothPointer.x - cx) / cx * -6;
        const shadowY = (smoothPointer.y - cy) / cy * -6;
        const shadowBlur = 3 + (Math.abs(shadowX) + Math.abs(shadowY)) * 0.6;

        span.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
        span.style.textShadow = shadowX + 'px ' + shadowY + 'px ' + shadowBlur + 'px rgba(42,42,42,0.12)';
      }

      requestAnimationFrame(animate);
    }

    animate();
  }
})();
