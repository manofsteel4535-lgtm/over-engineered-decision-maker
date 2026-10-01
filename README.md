# The Over-Engineered Decision Maker

A responsive, single-page mission-control dashboard for completely ordinary choices.

## Run

Requires Node.js 20.11 or newer. No installation or API keys are needed.

```sh
npm start
```

Open http://127.0.0.1:4173. Serve the `dist` folder with any static web server for deployment. ES modules require HTTP; double-clicking `index.html` is not supported.

## Features

- Three.js 3D topology with OrbitControls, projected labels, node hover metrics, view reset, and rotation pause.
- 10,000 paired Monte Carlo outcomes per run, with genuine mean, median, standard deviation, lower-tail percentage, histogram, and Wilson 95% confidence interval.
- Weighted 3×3 risk heatmap with context-aware fictional threats and accessible, focusable markers.
- Web Audio hum, processing sequence, and completion drop/chime. Audio starts after a user gesture; mute affects all sounds.
- High-performance mode reduces particles from 1,200 to 150 and limits rendering to 30 fps.
- Responsive layout, keyboard controls, reduced-motion support, and a numerical fallback if WebGL is unavailable.

## Source

`dist/engine.js` owns the fictional utility model and statistics. `dist/topology.js` owns the 3D scene. `dist/audio.js` synthesizes audio. `dist/app.js` coordinates UI state, charts, and logging. `dist/styles.css` defines the dashboard. Tailwind is compiled to `dist/tailwind.css`; Lucide, Chart.js, and Three.js are locally vendored in `dist/vendor`.

To regenerate Tailwind after editing utility classes, run `npm ci` and `npm run build:css`. This is optional for running the shipped app.

The simulation is entertainment. Its confidence interval estimates win frequency under the fictional model, not real-world certainty. Regret is the simulated losing fraction of the recommended option. Risks are procedurally generated independently of the outcome samples.

Google Fonts is optional; system fonts provide an offline fallback. All functional dependencies are bundled locally. Third-party license notices are in the vendor files and `THIRD_PARTY_NOTICES.md`.
