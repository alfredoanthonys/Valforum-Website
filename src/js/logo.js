import animationUrl from '../assets/brands/valforum.json?url';

// Animated Valforum wordmark in the navbar: the Valsewa and Valjubel marks merge
// into the Valforum logo, then the wordmark builds out, on a loop. Same Lottie
// and player settings as valjubel.com. The player loads after the page so it
// never competes with the hero; reduced motion keeps the still SVG instead.

const LOAD_TIMEOUT = 4000; // ms before showing the still logo while the animation loads

export function initLogo({ reduceMotion }) {
  const host = document.querySelector('[data-logo-anim]');
  if (!host || reduceMotion) return;

  const fallback = () => host.classList.add('is-fallback');
  const timer = setTimeout(fallback, LOAD_TIMEOUT);

  async function start() {
    try {
      const { default: lottie } = await import('lottie-web/build/player/lottie_light');
      const anim = lottie.loadAnimation({
        container: host,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: animationUrl,
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true },
      });
      anim.addEventListener('DOMLoaded', () => {
        clearTimeout(timer);
        host.classList.remove('is-fallback');
        anim.play();
      });
      anim.addEventListener('data_failed', () => {
        clearTimeout(timer);
        fallback();
      });
      // Pause while the tab is hidden, and during section glides (stack.js) so the
      // SVG frames don't compete with the scroll on phones.
      let gliding = false;
      const sync = () => (document.hidden || gliding ? anim.pause() : anim.play());
      document.addEventListener('visibilitychange', sync);
      document.addEventListener('stack:glide', (event) => {
        gliding = event.detail;
        sync();
      });
    } catch (error) {
      clearTimeout(timer);
      fallback();
      console.error('Valforum logo animation failed to load', error);
    }
  }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
