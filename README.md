# Toss

Call it in the air.

Toss is a small coin-flip app. Pick heads or tails, toss a fair coin, and keep a running record of your hits and streaks. Everything happens in the browser: there is no backend, no account, and nothing is sent anywhere.

## Features

- **Fair toss.** Each result is one unbiased bit from `crypto.getRandomValues`. The animation lands on the result that was already decided, never the other way round.
- **Call it.** Lock in heads or tails before you toss, or toss blind.
- **Record keeping.** Tracks heads, tails, current streak, best streak, calls right, and your last 20 tosses.
- **Persistent on-device.** The record lives in `localStorage` (key `toss.v1`) and is validated on load, so a corrupted value can't break the app.
- **3D coin and sound.** A CSS-3D coin with an SVG-drawn face, plus a synthesized spin-and-ring sound (Web Audio, no audio files). Sound can be toggled off.
- **Accessible.** Full keyboard control, screen-reader announcements for every result, visible focus states, and `prefers-reduced-motion` support.

## Controls

| Action           | Mouse / touch      | Keyboard         |
| ---------------- | ------------------ | ---------------- |
| Call heads       | **Heads** button   | `H`              |
| Call tails       | **Tails** button   | `T`              |
| Clear your call  | Tap the same side  | `H` / `T` again  |
| Toss             | **Toss the coin**  | `Space`          |
| Toggle sound     | **Sound on / off** | n/a              |
| Clear the record | **Reset**          | n/a              |

In the history strip, a gold ring means the call was right and a pale ring means it missed. Tosses made without a call have no ring.

## Getting started

Requires Node.js 20.19+ or 22.12+ (see `.nvmrc`).

```bash
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173).

### Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the dev server with hot reload  |
| `npm run build`     | Produce a production build in `dist/` |
| `npm run preview`   | Serve the production build locally    |
| `npm run typecheck` | Type-check the project with `tsc`     |

## Project structure

```
src/
  main.tsx       App entry point
  TossApp.tsx    UI, toss flow, keyboard handling
  storage.ts     localStorage load/save and the random source
  audio.ts       Web Audio toss sound
  toss.css       All styles
public/
  favicon.svg
```

## Deploying

`npm run build` outputs a fully static site to `dist/`, built with relative asset paths so it works from any host or sub-path: GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any static file server.

The only external request is to Google Fonts for Fraunces and Outfit. If the fonts fail to load, the app falls back to system serif and sans-serif fonts.

## Tech

React 19, TypeScript, and Vite. No runtime dependencies beyond React.

## License

[MIT](LICENSE)
