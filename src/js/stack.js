import { gsap } from 'gsap';

// Sticky snap stack: turns snapping on once the reader reaches the stack, steps
// one section per wheel/trackpad/touch gesture, keeps the snap markers aligned
// with the panels, drives the section dots, and adds scroll-linked depth (a
// covered panel dims and shrinks, background layers drift into place).

const COVER_SCALE = 0.05; // how much a panel shrinks while the next one covers it
const COVER_SHADE = 0.55; // how dark it gets

// Gesture stepping. Native mandatory snapping needs a drag past half a screen;
// these thresholds commit to the next section after a small push instead.
const STEP = {
  wheel: 30, // px of wheel / trackpad travel
  swipe: 40, // px of finger travel on touch screens
  quietGap: 160, // ms without wheel events that ends a trackpad gesture (and its inertia)
  duration: 0.7, // s for the glide to the next section
  ease: 'power2.inOut',
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function initStack({ reduceMotion }) {
  const stack = document.querySelector('[data-stack]');
  if (!stack) return;

  const panels = [...stack.querySelectorAll('[data-panel]')];
  const markers = [...stack.querySelectorAll('[data-marker]')];
  const cards = panels.map((panel) => panel.querySelector('.panel__card'));
  const copy = panels.map((panel) => panel.querySelector('.panel__content, .topup__head'));
  const layers = panels.map((panel) =>
    [...panel.querySelectorAll('[data-parallax]')].map((el) => ({ el, depth: Number(el.dataset.parallax) })),
  );
  const root = document.documentElement;
  const dots = document.querySelector('[data-dots]');
  const dotLinks = dots ? [...dots.querySelectorAll('a')] : [];
  const tallEnough = window.matchMedia('(min-height: 521px)');

  let stackTop = 0;
  let viewport = window.innerHeight;
  let tops = [];
  let active = -1;
  let gliding = false;
  const last = panels.map(() => ({ enter: -1, cover: -1 }));

  const stackEnd = () => tops[tops.length - 1] + panels[panels.length - 1].offsetHeight;

  function measure() {
    viewport = window.innerHeight;
    stackTop = stack.getBoundingClientRect().top + window.scrollY;

    // If a panel's copy no longer fits (tiny or heavily zoomed screens), let the card scroll internally.
    panels.forEach((panel, i) => {
      const fits = !copy[i] || copy[i].offsetHeight <= cards[i].clientHeight - 24;
      panel.classList.toggle('is-relaxed', !fits);
    });

    let y = 0;
    tops = panels.map((panel, i) => {
      const top = y;
      y += panel.offsetHeight;
      markers[i].style.top = `${top}px`;
      markers[i].style.height = `${panel.offsetHeight}px`;
      return top;
    });
  }

  function update() {
    const y = window.scrollY - stackTop;
    const end = stackEnd();

    // Snap from half a screen above the first panel onwards; above that, scroll freely.
    root.classList.toggle('snap-on', y > -viewport * 0.5);

    let index = -1;
    tops.forEach((top, i) => {
      if (y >= top - viewport * 0.5) index = i;
    });
    dots?.classList.toggle('is-visible', y > -viewport * 0.5 && y < end - viewport * 0.5);
    if (index !== active) {
      active = index;
      dotLinks.forEach((link, i) => link.setAttribute('aria-current', String(i === index)));
    }

    if (reduceMotion) return;

    panels.forEach((panel, i) => {
      const enter = clamp((y + viewport - tops[i]) / viewport, 0, 1);
      const next = tops[i + 1];
      const cover = next === undefined ? 0 : clamp((y - tops[i]) / (next - tops[i]), 0, 1);
      const prev = last[i];

      // Off-screen or fully covered panels stop their ambient animations, so phones
      // don't hold GPU layers for four animated backgrounds at once.
      panel.classList.toggle('is-idle', enter < 0.01 || cover > 0.99); // a pixel of rounding slack

      if (cover !== prev.cover) {
        prev.cover = cover;
        cards[i].style.transform = cover > 0 && cover < 1 ? `scale(${1 - cover * COVER_SCALE})` : '';
        cards[i].style.setProperty('--shade', (cover * COVER_SHADE).toFixed(3));
      }
      if (enter !== prev.enter) {
        prev.enter = enter;
        for (const { el, depth } of layers[i]) el.style.translate = `0 ${((1 - enter) * depth).toFixed(1)}px`;
      }
    });
  }

  // Browsers don't re-snap when snapping is switched on mid-scroll, so a scroll
  // that ends between two panels is finished here.
  function settle() {
    if (gliding || !root.classList.contains('snap-on') || !getComputedStyle(root).scrollSnapType.includes('mandatory')) return;
    const y = window.scrollY - stackTop;
    const end = stackEnd();
    if (y <= -viewport * 0.5 || y >= end) return; // outside the stack: free scrolling
    const targets = [...tops, end];
    if (targets.some((t) => Math.abs(y - t) < 2)) return;
    const nearest = targets.reduce((a, t) => (Math.abs(t - y) < Math.abs(a - y) ? t : a));
    window.scrollTo({ top: stackTop + nearest, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /* ---------- Gesture stepping ---------- */

  // Is the stack (or the footer right after it) in charge of this scroll?
  function inStack() {
    if (!tallEnough.matches || root.classList.contains('is-locked')) return false;
    return window.scrollY - stackTop > -viewport * 0.5;
  }

  // A relaxed panel's card scrolls internally first; leave those gestures alone.
  function scrollsInside(target, dir) {
    const card = target instanceof Element && target.closest('.panel.is-relaxed .panel__card');
    if (!card) return false;
    return dir > 0 ? card.scrollTop + card.clientHeight < card.scrollHeight - 1 : card.scrollTop > 0;
  }

  // Section positions, from the end of the quick links down to the footer.
  function stopFor(dir) {
    const y = window.scrollY;
    const stops = [stackTop - viewport, ...tops.map((t) => stackTop + t), stackTop + stackEnd()];
    return dir > 0 ? stops.find((s) => s > y + 2) : stops.reverse().find((s) => s < y - 2);
  }

  function glide(dir) {
    const target = stopFor(dir);
    if (target === undefined) return false;
    gliding = true;
    root.classList.add('is-gliding');
    const state = { y: window.scrollY };
    gsap.to(state, {
      y: target,
      duration: reduceMotion ? 0 : STEP.duration,
      ease: STEP.ease,
      overwrite: true,
      onUpdate: () => window.scrollTo(0, state.y),
      onComplete: () => {
        gliding = false;
        root.classList.remove('is-gliding');
      },
    });
    return true;
  }

  // Wheel and trackpad: a small push commits; the gesture's inertia tail is swallowed.
  let wheelTotal = 0;
  let lastWheel = 0;
  let lastSize = 0;
  let spent = false; // this gesture already moved a section

  function onWheel(event) {
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !inStack()) return;
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport : 1;
    const delta = event.deltaY * scale;
    const dir = Math.sign(delta);
    if (!dir || scrollsInside(event.target, dir)) return;

    const now = performance.now();
    const gap = now - lastWheel;
    const size = Math.abs(delta);
    lastWheel = now;

    // Nothing further in this direction (bottom of the footer): let the page be.
    if (!gliding && !spent && stopFor(dir) === undefined) return;
    event.preventDefault();

    // A pause or a clearly stronger push starts a new gesture; anything else is inertia.
    const fresh = gap > STEP.quietGap || size > lastSize * 1.6 + 4;
    lastSize = size;
    if (gliding) return;
    if (spent && !fresh) return;
    if (spent || gap > STEP.quietGap) {
      spent = false;
      wheelTotal = 0;
    }

    wheelTotal += delta;
    if (Math.abs(wheelTotal) >= STEP.wheel && glide(Math.sign(wheelTotal))) {
      spent = true;
      wheelTotal = 0;
    }
  }

  // Touch: a short vertical swipe commits to the next section.
  let touchY = null;
  let touchX = 0;
  let swiped = false;

  function onTouchStart(event) {
    touchY = inStack() && event.touches.length === 1 ? event.touches[0].clientY : null;
    touchX = event.touches[0]?.clientX ?? 0;
    swiped = false;
  }

  function onTouchMove(event) {
    if (touchY === null) return;
    const dy = touchY - event.touches[0].clientY;
    const dx = touchX - event.touches[0].clientX;
    if (Math.abs(dx) > Math.abs(dy)) return;
    const dir = Math.sign(dy);
    if (!dir || scrollsInside(event.target, dir)) return;
    if (!swiped && !gliding && stopFor(dir) === undefined) return;
    event.preventDefault();
    if (swiped || gliding || Math.abs(dy) < STEP.swipe) return;
    swiped = glide(dir);
  }

  /* ---------- Wiring ---------- */

  let frame = 0;
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
  };
  const remeasure = () => { measure(); update(); };

  if ('onscrollend' in window) {
    window.addEventListener('scrollend', settle);
  } else {
    let idle = 0;
    window.addEventListener('scroll', () => { clearTimeout(idle); idle = setTimeout(settle, 200); }, { passive: true });
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', () => { touchY = null; }, { passive: true });
  window.addEventListener('resize', remeasure);
  document.fonts?.ready.then(remeasure);
  window.addEventListener('load', remeasure, { once: true });
  remeasure();
}
