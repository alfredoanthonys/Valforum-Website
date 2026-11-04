// Service picker shown on every page load, until the visitor picks "Jangan tampilkan lagi".

const OPEN_DELAY = 500; // ms after load, so it never competes with the hero paint
const CLOSE_FALLBACK = 320; // ms; in case animationend never fires
const HIDE_KEY = 'valforum:welcome-hidden';

// Storage can throw (private mode, blocked site data); the picker then just shows.
function isHidden() {
  try {
    return localStorage.getItem(HIDE_KEY) === '1';
  } catch {
    return false;
  }
}

function hideForGood() {
  try {
    localStorage.setItem(HIDE_KEY, '1');
  } catch {
    // Nothing to remember it in; closing is enough.
  }
}

export function initWelcome({ reduceMotion }) {
  const dialog = document.querySelector('[data-welcome]');
  if (!dialog || typeof dialog.showModal !== 'function' || isHidden()) return;

  const root = document.documentElement;

  function open() {
    dialog.showModal();
    root.classList.add('is-locked');
  }

  function close(then) {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      dialog.classList.remove('is-closing');
      dialog.close();
      root.classList.remove('is-locked');
      then?.();
    };
    if (reduceMotion) return finish();
    dialog.classList.add('is-closing');
    dialog.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, CLOSE_FALLBACK);
  }

  // Esc
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  // Click on the backdrop (the dialog element itself, outside the box)
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  dialog.querySelector('[data-welcome-close]')?.addEventListener('click', () => close());
  dialog.querySelector('[data-welcome-never]')?.addEventListener('click', () => {
    hideForGood();
    close();
  });

  for (const link of dialog.querySelectorAll('[data-welcome-link]')) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const target = document.querySelector(link.hash);
      close(() => {
        target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        history.replaceState(null, '', link.hash);
      });
    });
  }

  const schedule = () => setTimeout(open, OPEN_DELAY);
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
}
