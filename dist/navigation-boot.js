// Parser-blocking: synchronize accessible tab state before the app module loads.
// Visual selection already follows the synchronous root data-active-module marker.
(() => {
  window.DecisionTheme.syncToggle();
  const active = window.DecisionNavigation.activeModule;
  const tabs = [...document.querySelectorAll('[data-module]')];
  for (const tab of tabs) {
    const selected = tab.dataset.module === active;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
  // Keep the restored tab in view on mobile before the first header paint.
  const tab = tabs.find(tab => tab.dataset.module === active);
  const strip = tab.parentElement;
  if (tab.offsetLeft + tab.offsetWidth > strip.clientWidth) {
    strip.scrollLeft = tab.offsetLeft + tab.offsetWidth - strip.clientWidth;
  }
})();
