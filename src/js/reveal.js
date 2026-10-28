import { gsap } from 'gsap';

// Entrance reveals: the hero plays on load; panels, quick links and the footer
// play once when they come into view. Top Up has its own sequence (topup.js).

const TEXT = { rise: 16, duration: 0.7, stagger: 0.08 };
const CARDS = { rise: 28, duration: 0.8, stagger: 0.07, delay: 0.25 };
const ART = { shift: 48, rise: 20, duration: 1.1 };

export function initReveals({ reduceMotion }) {
  if (reduceMotion) return;

  playHero();

  const groups = document.querySelectorAll('[data-panel]:not([data-topup]), [data-reveal-group]');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        reveal(entry.target);
      }
    },
    { threshold: 0.3 },
  );
  groups.forEach((group) => observer.observe(group));
}

function playHero() {
  gsap
    .timeline({ delay: 0.1, defaults: { ease: 'power3.out', clearProps: 'transform' } })
    .fromTo('[data-hero-art]', { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 1.1, stagger: 0.12 }, 0)
    .fromTo('[data-hero-badge]', { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.9 }, 0.25)
    .fromTo('[data-hero-btn]', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07 }, 0.5)
    .fromTo('[data-hero-caption]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.8);
}

function reveal(group) {
  const items = [...group.querySelectorAll('[data-reveal]')];
  const art = items.filter((el) => el.dataset.reveal === 'art');
  const cards = items.filter((el) => el.dataset.reveal === 'card');
  const text = items.filter((el) => !el.dataset.reveal);

  const tl = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'transform' } });

  if (art.length) {
    tl.fromTo(
      art,
      { opacity: 0, x: (_, el) => (isRightHalf(el) ? ART.shift : -ART.shift), y: ART.rise },
      { opacity: 1, x: 0, y: 0, duration: ART.duration },
      0,
    );
  }
  if (text.length) {
    tl.fromTo(text, { opacity: 0, y: TEXT.rise }, { opacity: 1, y: 0, duration: TEXT.duration, stagger: TEXT.stagger }, 0.1);
  }
  if (cards.length) {
    tl.fromTo(cards, { opacity: 0, y: CARDS.rise }, { opacity: 1, y: 0, duration: CARDS.duration, stagger: CARDS.stagger }, CARDS.delay);
  }
}

function isRightHalf(el) {
  const box = el.getBoundingClientRect();
  const parent = el.parentElement.getBoundingClientRect();
  return box.left + box.width / 2 > parent.left + parent.width / 2;
}
