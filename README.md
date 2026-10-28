# Valforum landing page

One-page site built from the Valforum design. It uses Vite, plain HTML, CSS and JS, and GSAP.

```bash
npm install
npm run dev       # local dev server
npm run build     # production build in dist/ (static files, host anywhere)
npm run preview   # serve the production build
```

## Where things live

| What | Where |
| --- | --- |
| Page markup and copy | `index.html` |
| Every outbound link (currently `#`) | `site.config.js`. Replace the URLs and rebuild. |
| Design tokens (colours, fonts, gutters) | `src/styles/tokens.css` |
| Section styles | `src/styles/*.css` (one file per area) |
| Top Up entry and wave timings | constants at the top of `src/js/topup.js` |
| Reveal timings | constants at the top of `src/js/reveal.js` |
| Fixed navbar (transparent → black on scroll, same as valjubel.com) | `src/styles/nav.css`, `src/js/nav.js` |
| Animated Valforum logo (Lottie, loops; reduced motion shows the still SVG) | `src/js/logo.js`, `src/assets/brands/valforum.json` |
| Snap stack and parallax depth | `src/js/stack.js` |
| Welcome popup (every page load) | `src/js/welcome.js` |

## Images

Source images live in `../Valforum Design Assets`. The design exports are the 4× re-exports in `4x/`. The account screenshots and the favicon source sit at the top level. The folder holds only what the build uses. To regenerate the optimised WebP files in `src/assets/img/`, run:

```bash
npm run images
```

Every image except the favicon ships at 1× and 2× through `srcset`, so Retina screens get sharp art and 1× screens skip the extra weight. The hero background is graded gold from the grayscale `4x/Split.png` to match the design. The build cuts the account screenshots out along their frame, so a new screenshot needs its own `extract` box. See `scripts/build-images.mjs` for both.

The vector brand marks and the logo animation in `src/assets/brands/` (`valforum.svg`, `valsewa.svg`, `valjubel.svg`, `valforum.json`) come from valjubel.com's `/brands/` folder.

## Scroll and motion behaviour

- **Snapping.** Sewa → Jual → Beli → Top Up are sticky, full-height panels. Each scroll gesture, key press or wheel notch moves exactly one panel. Snapping turns on only from the stack downwards, so the hero and quick links scroll freely. Screens shorter than 520px never snap.
- **Panel layout.** Desktop panels scale the 1298 × 826 design artboard to fit. Portrait screens switch to a stacked layout.
- **Reduced motion.** With `prefers-reduced-motion`, all entrance, ambient and parallax motion is off. Content renders in its final state.
