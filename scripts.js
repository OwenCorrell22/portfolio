// ===========================
// Constantly Changing ID Tags Animation
// ===========================

document.addEventListener('DOMContentLoaded', () => {
  const navIds = document.querySelectorAll('.nav-id');
  const hexChars = '0123456789ABCDEF';

  function getRandomHexChar() {
    return hexChars[Math.floor(Math.random() * hexChars.length)];
  }

  navIds.forEach((idSpan) => {
    const baseId = idSpan.getAttribute('data-base');
    let currentId = baseId.split('');

    // First digit stays static
    // Second digit changes slowly (800ms)
    setInterval(() => {
      currentId[1] = getRandomHexChar();
      idSpan.textContent = currentId.join('');
    }, 800);

    // Third digit changes medium speed (400ms)
    setInterval(() => {
      currentId[2] = getRandomHexChar();
      idSpan.textContent = currentId.join('');
    }, 400);

    // Fourth digit changes fastest (80ms)
    setInterval(() => {
      currentId[3] = getRandomHexChar();
      idSpan.textContent = currentId.join('');
    }, 80);
  });
});

// ===========================
// Work Submenu Toggle
// ===========================

document.addEventListener('DOMContentLoaded', () => {
  const workToggle = document.querySelector('.work-toggle');
  const subLinks = document.querySelector('.sub-links');

  if (workToggle && subLinks) {
    workToggle.addEventListener('click', function() {
      subLinks.classList.toggle('expanded');
    });
  }
});

// ===========================
// Photo Fade In on Scroll
// ===========================

document.addEventListener('DOMContentLoaded', () => {
  const photos = document.querySelectorAll('.photo-gallery img');
  if (!photos.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  photos.forEach(img => observer.observe(img));
});

// ===========================
// Photo Lightbox
// ===========================

document.addEventListener('DOMContentLoaded', () => {
  const galleryImages = document.querySelectorAll('.photo-gallery img');
  if (!galleryImages.length) return;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.classList.add('lightbox-overlay');
  document.body.appendChild(overlay);

  // Create expanded image
  const lightboxImg = document.createElement('img');
  lightboxImg.classList.add('lightbox-img');
  overlay.appendChild(lightboxImg);

  galleryImages.forEach(img => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      overlay.classList.add('active');
    });
  });

  overlay.addEventListener('click', (e) => {
    if (e.target !== lightboxImg) {
      overlay.classList.remove('active');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      overlay.classList.remove('active');
    }
  });
});

// ===========================
// Page Transition Fade Out
// ===========================

document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('a[href$=".html"]');
  const main = document.querySelector('main');

  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const href = this.getAttribute('href');

      if (main) {
        main.classList.add('fade-out');
        setTimeout(() => {
          window.location.href = href;
        }, 300);
      }
    });
  });
});
