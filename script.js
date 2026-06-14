/* ═══════════════════════════════════════════════════
   HAMMER STREET CLEAN — script.js
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── STICKY HEADER ─────────────────────────────── */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── HAMBURGER / MOBILE NAV ─────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const primaryNav = document.getElementById('primary-nav');

  if (hamburger && primaryNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = primaryNav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen.toString());
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close nav when a link is clicked
    primaryNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        primaryNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close nav on Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && primaryNav.classList.contains('open')) {
        primaryNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });

    // Close nav when clicking outside
    document.addEventListener('click', e => {
      if (
        primaryNav.classList.contains('open') &&
        !primaryNav.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        primaryNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── SMOOTH SCROLL (for anchor links on same page) ─ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navHeight = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-height')) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── SCROLL-TRIGGERED FADE-UP ANIMATIONS ─────────── */
  const fadeElements = document.querySelectorAll(
    '.service-card, .section-header, .grant-content, .about-content, .contact-info, .contact-form-wrap, .grant-section, .summary-card, .sidebar-card'
  );

  if ('IntersectionObserver' in window && fadeElements.length) {
    fadeElements.forEach(el => el.classList.add('fade-up'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            // Stagger siblings in the same parent
            const siblings = Array.from(entry.target.parentElement.querySelectorAll('.fade-up'));
            const idx = siblings.indexOf(entry.target);
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, idx * 80);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    fadeElements.forEach(el => observer.observe(el));
  }

  /* ── ACTIVE NAV LINK HIGHLIGHTING ────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.primary-nav a[href^="#"]');

  if (sections.length && navLinks.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            navLinks.forEach(link => {
              link.classList.toggle(
                'active',
                link.getAttribute('href') === `#${entry.target.id}`
              );
            });
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: `-${(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72)}px 0px 0px 0px`
      }
    );
    sections.forEach(s => sectionObserver.observe(s));
  }

  /* ── CONTACT FORM VALIDATION & SUBMISSION ─────────── */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    setupForm(contactForm);
  }

  const grantForm = document.getElementById('grant-form');
  if (grantForm) {
    setupForm(grantForm);
  }

  function setupForm(form) {
    const requiredFields = form.querySelectorAll('[required]');

    // Live validation on blur
    requiredFields.forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) validateField(field);
      });
    });

    // Submit handler
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Run all validations
      let valid = true;
      requiredFields.forEach(field => {
        if (!validateField(field)) valid = false;
      });

      if (!valid) {
        // Focus first error
        const firstError = form.querySelector('.error');
        if (firstError) firstError.focus();
        return;
      }

      const submitBtn = form.querySelector('.btn-submit');
      const originalText = submitBtn.textContent;

      submitBtn.textContent = 'Sending…';
      submitBtn.disabled = true;

      try {
        const formData = new FormData(form);
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formData).toString(),
        });

        if (response.ok) {
          showSuccess(form);
        } else {
          throw new Error('Server error');
        }
      } catch (err) {
        // Fallback: show a friendly error
        submitBtn.textContent = 'Try Again';
        submitBtn.disabled = false;
        showFormError(form, 'Something went wrong. Please email us directly at hammerstreetclean@gmail.com');
      }
    });
  }

  function validateField(field) {
    const value = field.value.trim();
    let valid = true;

    if (field.required && !value) {
      valid = false;
    } else if (field.type === 'email' && value) {
      valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    field.classList.toggle('error', !valid);
    return valid;
  }

  function showSuccess(form) {
    // Replace form content with success message
    form.innerHTML = `
      <div class="form-success" style="display:block;">
        <div class="success-icon">✔</div>
        <h3>Message Sent!</h3>
        <p>Thanks for reaching out. We'll be in touch within a couple of days.</p>
      </div>
    `;
  }

  function showFormError(form, message) {
    let errorEl = form.querySelector('.form-error-msg');
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.className = 'form-error-msg';
      errorEl.style.cssText = 'color: #e63300; font-size: 0.875rem; margin-top: 0.5rem;';
      form.appendChild(errorEl);
    }
    errorEl.textContent = message;
  }

  /* ── LOGO SWAP UTILITY ────────────────────────────
     When you have a logo ready, call:
       HSC.setLogo('path/to/logo.png')
     from the browser console, or update the slot manually.
  ─────────────────────────────────────────────────── */
  window.HSC = {
    setLogo: function (src, alt = 'Hammer Street Clean') {
      document.querySelectorAll('#logo-img-slot').forEach(slot => {
        slot.innerHTML = `<img src="${src}" alt="${alt}" />`;
      });
    }
  };

})();
