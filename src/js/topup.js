import { gsap } from 'gsap';

// "Top Up Games" motion: a one-time entry sequence when the section docks, then a
// "wave" where the cards hop one after another, left to right, every couple of
// seconds. Hover lifts are in topup.css. Seconds and px; tweak freely.

const ENTRY = {
  ease: 'power3.out',
  titleRise: 24, // headline rises this far while fading in
  titleDuration: 0.7,
  stepRise: 16, // subtext, logo row, button + links
  stepDuration: 0.6,
  stepStart: 0.2, // first follow-up step starts here
  stepStagger: 0.1,
  cardStart: 0.45, // first card starts sliding up here
  cardFrom: 120, // % of the card's own height below its resting spot
  cardDuration: 0.95,
  cardStagger: 0.08, // left to right
};

const WAVE = {
  firstDelay: 1.5, // rest after the entry, before the first wave
  delay: 3, // rest between waves
  height: 20, // px each card hops up; topup.css sinks the cards 24px to hide their cut edge
  up: 0.22, // seconds to the top of the hop
  down: 0.3, // seconds back to rest
  stagger: 0.1, // gap between neighbouring cards, left to right
};

const TRIGGER_RATIO = 0.45; // how much of the section must be visible to start

export function initTopUp({ reduceMotion }) {
  const section = document.querySelector('[data-topup]');
  if (!section || reduceMotion) return;

  const title = section.querySelector('[data-tu="title"]');
  const steps = section.querySelectorAll('[data-tu="step"]');
  const cards = [...section.querySelectorAll('[data-tu="card"]')];
  let played = false;
  let wave = null;

  function play() {
    played = true;
    const tl = gsap.timeline({ defaults: { ease: ENTRY.ease } });

    tl.fromTo(title, { opacity: 0, y: ENTRY.titleRise }, { opacity: 1, y: 0, duration: ENTRY.titleDuration }, 0);
    tl.fromTo(
      steps,
      { opacity: 0, y: ENTRY.stepRise },
      { opacity: 1, y: 0, duration: ENTRY.stepDuration, stagger: ENTRY.stepStagger },
      ENTRY.stepStart,
    );

    cards.forEach((card, i) => {
      // The tilt is baked into each card image, so "no tilt" is the inverse rotation.
      const tilt = Number(card.dataset.tilt) || 0;
      const at = ENTRY.cardStart + i * ENTRY.cardStagger;
      tl.fromTo(
        card,
        { opacity: 1, yPercent: ENTRY.cardFrom },
        { yPercent: 0, duration: ENTRY.cardDuration },
        at,
      );
      tl.fromTo(card, { rotation: -tilt }, { rotation: 0, duration: ENTRY.cardDuration, ease: 'power2.inOut' }, at);
    });

    tl.call(startWave);
  }

  // Each wave runs on `y`, separate from the entry's yPercent, so the two never fight.
  function startWave() {
    wave = gsap.timeline({ repeat: -1, repeatDelay: WAVE.delay, delay: WAVE.firstDelay });
    cards.forEach((card, i) => {
      const at = i * WAVE.stagger;
      wave.to(card, { y: -WAVE.height, duration: WAVE.up, ease: 'power2.out' }, at);
      wave.to(card, { y: 0, duration: WAVE.down, ease: 'power2.in' }, at + WAVE.up);
    });
  }

  new IntersectionObserver(
    ([entry]) => {
      if (entry.intersectionRatio >= TRIGGER_RATIO && !played) play();
      // The wave only runs while the section is on screen.
      if (wave) wave.paused(!entry.isIntersecting);
    },
    { threshold: [0, TRIGGER_RATIO] },
  ).observe(section);
}
