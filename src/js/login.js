// Login: a popup on tablet and desktop. On phones the navbar link goes to login.html.

const CLOSE_FALLBACK = 280; // ms; in case animationend never fires
const POPUP = window.matchMedia('(min-width: 768px)');

export function initLogin({ reduceMotion }) {
  const dialog = document.querySelector('[data-login]');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const root = document.documentElement;

  function open() {
    dialog.showModal();
    root.classList.add('is-locked');
  }

  function close() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      dialog.classList.remove('is-closing');
      dialog.close();
      root.classList.remove('is-locked');
    };
    if (reduceMotion) return finish();
    dialog.classList.add('is-closing');
    dialog.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, CLOSE_FALLBACK);
  }

  for (const link of document.querySelectorAll('[data-login-open]')) {
    link.addEventListener('click', (event) => {
      if (!POPUP.matches) return; // phones follow the link to the login page
      event.preventDefault();
      open();
    });
  }

  dialog.querySelector('[data-login-close]')?.addEventListener('click', close);
  // Esc
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  // Click on the backdrop (the dialog element itself, outside the box)
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  // Shrinking to phone width swaps the popup for the page.
  POPUP.addEventListener('change', (event) => { if (!event.matches) close(); });
}
