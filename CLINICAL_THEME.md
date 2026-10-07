# Clinical Tactical HUD implementation

The live app uses `dist/styles.css` for semantic tokens and `dist/clinical.css` for Solar Diagnostic refinements. Light rules use `html:not(.dark)`; Deep Space uses the existing root `.dark` strategy. `dist/theme.js` persists the choice and emits `decision-theme-change`; `updateOpticalMode` in `dist/app.js` calls both renderer update hooks without changing simulation values.

| Role | Light token |
| --- | --- |
| Background / panels / borders | `#f8fafc` / `#ffffff` / `#cbd5e1` |
| Primary / hover / status dot | `#0891b2` / `#0e7490` / `#06b6d4` |
| Hazard / violet / blue / alert | `#ea580c` / `#7c3aed` / `#2563eb` / `#dc2626` |
| Headers / telemetry / captions | `#0f172a` / `#475569` / `#94a3b8` |
| Sun / moon | `#d97706` / `#6d28d9` |

Tailwind 4 keeps `@custom-variant dark (&:where(.dark, .dark *))`. The icon uses `text-[#d97706] dark:text-[#6d28d9]`; the toggle uses `transition-colors duration-300`. For reusable components, the CSS-variable utility equivalents are `bg-[var(--panel)] border-[var(--line)] text-[var(--text)]`, `hover:border-[var(--accent-border)] focus-within:border-[var(--accent-border)]`, and `bg-[var(--cyan)] hover:bg-[var(--button-hover)] text-[var(--button-text)] font-mono font-bold`. These consume the same root tokens in both modes. Dashboard-specific styles live in the dedicated stylesheet to keep the markup readable.

`DecisionTopology.setTheme(theme)` consumes `THEME_PALETTES[theme].scene`. Solar node order is choice teal, uncertainty blue, volatility orange, cost red, satisfaction emerald. This mapping remains stable even when Option B wins or context labels change. It updates mesh, wireframe, ring and sprite materials, renderer clear color, grid vertex colors and opacity, particles, vector lines and label accents in place. The light grid uses `0x94a3b8` at 0.2 opacity, vectors use `0x0891b2` at 0.6 opacity, and the main node's ring opacity pulses in the existing animation loop. Reduced motion suppresses that pulse.

`applyChartTheme(chart, theme)` updates dataset strokes and fills, every axis grid and tick color, legend labels, and tooltip colors, then calls `chart.update('none')`. Solar uses teal/violet curves, `#334155` ticks, and 0.5px `#e2e8f0` grid lines. HTML legend markers and input accents share the corresponding CSS tokens.

Risk cells use soft green → amber → red gradients. Each threat button contains a static SVG crosshair for light mode and a numbered marker for dark mode; its accessible label, focus, hover and click behavior remain intact. The executive panel's `data-state` enables the inner cyan standby pulse only while idle, with deep slate monospace copy.
