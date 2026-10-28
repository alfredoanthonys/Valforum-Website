// Fixed navbar: transparent over the hero, solid black once the page scrolls.

const SCROLLED_AT = 8; // px of scroll before the bar turns solid

export function initNav() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;

  let frame = 0;
  const update = () => {
    frame = 0;
    nav.classList.toggle('is-scrolled', window.scrollY > SCROLLED_AT);
  };

  window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
  update();
}
