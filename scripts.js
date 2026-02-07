(function() {
  document.addEventListener('DOMContentLoaded', () => {
    initHexAnimation();
    initWorkToggle();
    initPhotoGallery();
    initPageTransitions();
    initHomepageInteraction();
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

    // 2. Create particle canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'hero-particles';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // 3. Particles
    const PARTICLE_COUNT = 60;
    const CONNECTION_DIST = 130;
    const MOUSE_RANGE = 220;
    const particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.5 + 0.8
      });
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

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(42, 42, 42, 0.12)';
        ctx.fill();
      }

      // Draw connections near cursor
      for (let i = 0; i < particles.length; i++) {
        const pi = particles[i];
        const dxM = pi.x - smoothPointer.x;
        const dyM = pi.y - smoothPointer.y;
        const dMouse = Math.sqrt(dxM * dxM + dyM * dyM);

        if (dMouse < MOUSE_RANGE) {
          const mouseAlpha = 1 - dMouse / MOUSE_RANGE;
          for (let j = i + 1; j < particles.length; j++) {
            const pj = particles[j];
            const dx = pi.x - pj.x;
            const dy = pi.y - pj.y;
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d < CONNECTION_DIST) {
              const alpha = (1 - d / CONNECTION_DIST) * mouseAlpha * 0.25;
              ctx.beginPath();
              ctx.moveTo(pi.x, pi.y);
              ctx.lineTo(pj.x, pj.y);
              ctx.strokeStyle = 'rgba(42, 42, 42, ' + alpha + ')';
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
      }

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
        const maxDist = 180;
        if (dist < maxDist && dist > 0) {
          const force = (1 - dist / maxDist) * 18;
          tx = (dx / dist) * force;
          ty = (dy / dist) * force;
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
