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

// Nav dropdown (Resources: Field Notes / Library / More Info)
document.querySelectorAll('.nav-dropdown-toggle').forEach((toggle) => {
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const parent = toggle.closest('.nav-dropdown');
    const isOpen = parent.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
});
function closeDropdown(dropdown) {
  dropdown.classList.remove('open');
  const toggle = dropdown.querySelector('.nav-dropdown-toggle');
  toggle.setAttribute('aria-expanded', 'false');
  if (dropdown.contains(document.activeElement)) {
    document.activeElement.blur();
  }
}
document.addEventListener('click', (e) => {
  document.querySelectorAll('.nav-dropdown.open').forEach((dropdown) => {
    if (!dropdown.contains(e.target)) closeDropdown(dropdown);
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.nav-dropdown.open').forEach(closeDropdown);
  }
});
