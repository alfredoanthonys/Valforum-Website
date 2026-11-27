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
| Every outbound link (most still `#`) | `site.config.js`. Replace the URLs and rebuild. |
| Design tokens (colours, fonts, gutters) | `src/styles/tokens.css` |
| Navbar brand-pill font: Pilot Command Condensed. **The bundled file is the free, non-commercial download: buy a commercial licence (iconian.com/commercial.html) before launch.** | `src/assets/fonts/`, `@font-face` in `src/styles/tokens.css` |
| Section styles | `src/styles/*.css` (one file per area) |
| Top Up entry and wave timings | constants at the top of `src/js/topup.js` |
| Reveal timings | constants at the top of `src/js/reveal.js` |
| Fixed navbar (transparent → black on scroll, same as valjubel.com) | `src/styles/nav.css`, `src/js/nav.js` |
| Animated Valforum logo (Lottie, loops; reduced motion shows the still SVG) | `src/js/logo.js`, `src/assets/brands/valforum.json` |
| Snap stack and parallax depth | `src/js/stack.js` |
| Welcome popup (every page load) | `src/js/welcome.js` |
| Tablet / phone menu (brand cards, opened from the navbar button) | `src/styles/nav.css`, `src/js/menu.js` |
| Login: popup on tablet/desktop, its own page on phones | `src/styles/login.css`, `src/js/login.js`, `login.html` |
| Login art (greyscale; the CSS tints it gold) | `src/assets/img/login-bg.webp` |

## Images

Source images live in `../Valforum Design Assets`. The design exports are the 4× re-exports in `4x/`. The account screenshots and the favicon source sit at the top level. The folder holds only what the build uses. To regenerate the optimised WebP files in `src/assets/img/`, run:

```bash
npm run images
```

Every image except the favicon ships at 1× and 2× through `srcset`, so Retina screens get sharp art and 1× screens skip the extra weight. The hero background is graded gold from the grayscale `4x/Split.png` to match the design. The build cuts the account screenshots out along their frame, so a new screenshot needs its own `extract` box. See `scripts/build-images.mjs` for both.

Phoenix and Jett in the hero use `Phoenix_artwork_official.png` and `Jett_artwork_official.png`: Riot's official portraits cut to the design's frame and re-lit with the design's glow, because the design's own 4× exports are upscaled from low-resolution art. The hero badge's pulsing glow is pre-rendered too (`hero-badge-glow`), so the page only fades its opacity.

### Brand backgrounds

The Sewa, Jual and Beli quick-link cards (on hover) and the Sewa and Jual Beli sections use still images in each brand's style. Nothing in them animates.

| Look | Files | Made by |
| --- | --- | --- |
| Valjubel shattered glass (valforum.com/jual-beli-akun) | `ql-jual-shards`, `ql-beli-shards`, `panel-jual-shards`, `panel-jual-shards-tall` | `npm run backgrounds` (`scripts/build-backgrounds.mjs`, seeded, so the same seed gives the same image) |
| Valsewa red smoke (valsewa.com's last section) | `ql-sewa-ether`, `panel-sewa-ether`, `panel-sewa-ether-tall` | `scripts/sewa-smoke.html`: open it on the dev server (`/scripts/sewa-smoke.html`) and download the three files |

The `-tall` versions are used when a section is taller than it is wide (phones, upright tablets).

The vector brand marks and the logo animation in `src/assets/brands/` (`valforum.svg`, `valsewa.svg`, `valjubel.svg`, `valforum.json`) come from valjubel.com's `/brands/` folder.

## Scroll and motion behaviour

- **Order.** Everything follows the hero buttons: Top Up → Jual → Beli → Sewa (quick-link cards, entry popup), and the stack is Top Up → Jual Beli → Sewa.
- **Snapping.** The stack's sections are sticky, full-height panels. Each scroll gesture, key press or wheel notch moves exactly one panel. Snapping turns on only from the stack downwards, so the hero and quick links scroll freely. Screens shorter than 520px never snap.
- **Panel layout.** Desktop panels scale the 1298 × 826 design artboard to fit. Portrait screens switch to a stacked layout.
- **Reduced motion.** With `prefers-reduced-motion`, all entrance, ambient and parallax motion is off. Content renders in its final state.

## Keeping it smooth

Scrolling and looping animations must only change `transform` and `opacity`, on elements that have their own GPU layer. Anything else (filters, shadows, backgrounds, blend modes, sizes) is repainted on every frame and makes scrolling lag.

- **Covered panels.** While the next section slides over a panel, `stack.js` scales it and fades its shade. Every visible panel (not `.is-idle`) gives its card and shade their own GPU layers (`will-change`, in `panels.css`), so the panel is drawn once as it scrolls in and then only transformed. Idle panels drop their layers.
- **Per-frame work.** `stack.js` reads layout only in `measure()` (load, resize, fonts); the per-frame `update()` only reads `scrollY` and writes transforms, and skips writes when nothing changed.
- **Glows.** To pulse a glow, fade a pre-rendered glow image (see `hero-badge-glow`) rather than animating `filter: drop-shadow`.
- **Off-screen sections.** Sections that are off-screen or fully covered get `.is-idle`, which pauses their ambient animations.
