// Tablet / phone menu: full-screen dialog opened from the navbar button.

const CLOSE_FALLBACK = 280; // ms; in case animationend never fires
const DESKTOP = window.matchMedia('(min-width: 1024px)');

export function initMenu({ reduceMotion }) {
  const menu = document.querySelector('[data-menu]');
  const opener = document.querySelector('[data-menu-open]');
  if (!menu || !opener || typeof menu.showModal !== 'function') return;

  const root = document.documentElement;

  function open() {
    menu.showModal();
    root.classList.add('is-locked');
    opener.setAttribute('aria-expanded', 'true');
  }

  function close() {
    if (!menu.open || menu.classList.contains('is-closing')) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      menu.classList.remove('is-closing');
      menu.close();
      root.classList.remove('is-locked');
      opener.setAttribute('aria-expanded', 'false');
    };
    if (reduceMotion) return finish();
    menu.classList.add('is-closing');
    menu.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, CLOSE_FALLBACK);
  }

  opener.setAttribute('aria-expanded', 'false');
  opener.addEventListener('click', open);
  menu.querySelector('[data-menu-close]')?.addEventListener('click', close);
  // Esc
  menu.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  // The menu only exists below the desktop breakpoint.
  DESKTOP.addEventListener('change', (event) => { if (event.matches) close(); });
}
