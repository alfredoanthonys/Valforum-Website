import './styles/main.css';
import { initNav } from './js/nav.js';
import { initMenu } from './js/menu.js';
import { initLogo } from './js/logo.js';
import { initStack } from './js/stack.js';
import { initReveals } from './js/reveal.js';
import { initTopUp } from './js/topup.js';
import { initWelcome } from './js/welcome.js';
import { initLogin } from './js/login.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tells the inline guard in index.html that the animation bundle is running.
document.documentElement.classList.add('anim-ready');

initNav();
initMenu({ reduceMotion });
initLogo({ reduceMotion });
initStack({ reduceMotion });
initReveals({ reduceMotion });
initTopUp({ reduceMotion });
initWelcome({ reduceMotion });
initLogin({ reduceMotion });
