// Restore the view before first paint. This preference never stores live decisions.
(() => {
  const key = 'oddm_active_tab';
  const modules = { '01': 'MATRIX', '02': 'FIGHTER', '03': 'TRIAL', '04': 'ARCHIVES' };
  document.documentElement.classList.add('preload');
  let saved;
  try { saved = localStorage.getItem(key); } catch { /* Navigation works without storage. */ }
  let activeModule = Object.hasOwn(modules, saved) ? modules[saved] : 'MATRIX';
  const apply = () => { document.documentElement.dataset.activeModule = activeModule; };
  window.DecisionNavigation = {
    get activeModule() { return activeModule; },
    setActiveModule(next) {
      const entry = Object.entries(modules).find(([, module]) => module === next);
      if (!entry) throw new RangeError('Unknown suite module.');
      activeModule = next; apply();
      try { localStorage.setItem(key, entry[0]); } catch { /* Retain in-session routing. */ }
    }
  };
  apply();
})();
