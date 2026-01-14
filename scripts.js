// ===========================
// Filter System
// ===========================

document.addEventListener('DOMContentLoaded', () => {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');

      // Update active state
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Filter projects
      projectCards.forEach(card => {
        const categories = card.getAttribute('data-category').split(' ');

        if (filter === 'all' || categories.includes(filter)) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
});


// ===========================
// Smooth Scroll (Optional)
// ===========================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href !== '#' && href !== '#work') return;

    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
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
