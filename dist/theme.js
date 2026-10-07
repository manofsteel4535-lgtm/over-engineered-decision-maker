// Runs synchronously in <head>, before styles, to prevent a wrong-theme flash.
(() => {
  const key = 'decision_maker_theme';
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let saved;
  try { saved = localStorage.getItem(key); } catch { /* Storage may be unavailable. */ }
  let explicitPreference = saved === 'dark' || saved === 'light';
  let theme = explicitPreference ? saved : system.matches ? 'dark' : 'light';

  // The label and inline SVGs are selected by root CSS, with no DOM replacement.
  // Also called during parsing once the header exists, before deferred app code.
  function syncToggle() {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    const dark = theme === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', 'Optical Mode: switch to ' + (dark ? 'Solar Diagnostic' : 'Deep Space'));
    button.title = dark ? 'Deep Space Command' : 'Solar Diagnostic / Clinical Cleanroom';
  }

  function apply(next, persist = false) {
    if (next !== 'dark' && next !== 'light') throw new RangeError('Unknown optical mode.');
    theme = next;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    syncToggle();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0e17' : '#f8fafc');
    if (persist) {
      explicitPreference = true;
      try { localStorage.setItem(key, theme); } catch { /* Keep the toggle functional. */ }
    }
    window.dispatchEvent(new CustomEvent('decision-theme-change', { detail: { theme } }));
  }

  window.DecisionTheme = {
    get theme() { return theme; },
    syncToggle,
    setTheme(next) { apply(next, true); },
    toggle() { apply(theme === 'dark' ? 'light' : 'dark', true); }
  };
  apply(theme);
  system.addEventListener('change', event => {
    if (!explicitPreference) apply(event.matches ? 'dark' : 'light');
  });
})();
