// Shared optical spectrum for both canvas renderers. CSS uses the same accents.
export const THEME_PALETTES = {
  dark: {
    text: '#e2e8f0', ticks: '#94a3b8', grid: 'rgba(255,255,255,0.1)',
    optionA: '#00f3ff', optionB: '#efa957', fillA: 'rgba(0,243,255,0.12)', fillB: 'rgba(239,169,87,0.10)',
    tooltip: '#1f2937', tooltipBorder: '#475569',
    scene: { background: 0x0a0e17, cyan: 0x00f3ff, amber: 0xefa957, secondary: 0x79bcff, grid: 0x64748b, gridOpacity: .3, particleOpacity: .38, lineOpacity: .45 }
  },
  light: {
    text: '#0f172a', ticks: '#334155', grid: '#e2e8f0',
    optionA: '#0891b2', optionB: '#7c3aed', fillA: 'rgba(8,145,178,0.10)', fillB: 'rgba(124,58,237,0.08)',
    tooltip: '#ffffff', tooltipBorder: '#94a3b8',
    // Stable semantic order: choice, uncertainty, volatility, cost, satisfaction.
    scene: { background: 0xf8fafc, cyan: 0x0891b2, amber: 0xea580c, secondary: 0xdc2626,
      nodeColors: [0x0891b2, 0x2563eb, 0xea580c, 0xdc2626, 0x059669],
      grid: 0x94a3b8, gridOpacity: .2, particleOpacity: .22, lineOpacity: .6 }
  }
};

/** Recolor in place, preserving outcomes, animation state and canvas identity. */
export function applyChartTheme(chart, theme) {
  if (!chart) return;
  const palette = THEME_PALETTES[theme];
  chart.options.color = palette.text;
  for (const axis of Object.values(chart.options.scales)) {
    axis.grid.color = palette.grid;
    axis.grid.lineWidth = theme === 'light' ? .5 : 1;
    axis.ticks.color = palette.ticks;
    axis.border.color = palette.grid;
  }
  chart.options.plugins.legend.labels.color = palette.text;
  Object.assign(chart.options.plugins.tooltip, {
    backgroundColor: palette.tooltip, borderColor: palette.tooltipBorder,
    titleColor: palette.text, bodyColor: palette.text, footerColor: palette.text
  });
  const [a, b] = chart.data.datasets;
  a.borderColor = palette.optionA; a.backgroundColor = palette.fillA;
  b.borderColor = palette.optionB; b.backgroundColor = palette.fillB;
  chart.update('none');
}
