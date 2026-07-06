// Mobile nav toggle
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('primary-nav');

if (hamburger && nav) {
  hamburger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}
