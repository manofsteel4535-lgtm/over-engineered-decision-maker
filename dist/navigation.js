/** Module metadata and navigation only; the mounted matrix owns its own state. */
export const MODULES = Object.freeze({
  MATRIX: { index: '01', title: 'Quantum Matrix' },
  FIGHTER: { index: '02', title: 'Option Fighter II' },
  TRIAL: { index: '03', title: 'Quantum Trial' },
  ARCHIVES: { index: '04', title: 'Black Box Archives' }
});

export class ModuleNavigation {
  constructor(onChange, preference = globalThis.DecisionNavigation) {
    this.preference = preference;
    this.activeModule = Object.hasOwn(MODULES, preference?.activeModule) ? preference.activeModule : 'MATRIX';
    this.onChange = onChange;
    this.tabs = [...document.querySelectorAll('[data-module]')];
    this.matrix = document.getElementById('matrix-view');
    this.trial = document.getElementById('trial-view');
    this.fighter = document.getElementById('fighter-view');
    this.archives = document.getElementById('archives-view');
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => this.select(tab.dataset.module));
      // Roving tab stop and automatic activation follow the horizontal tab pattern.
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % this.tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + this.tabs.length) % this.tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = this.tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        this.select(this.tabs[next].dataset.module);
        this.tabs[next].focus({ preventScroll: true });
      });
    });
    // Render the restored view without activating controllers that are still mounting.
    this.render();
  }

  select(module) {
    if (!Object.hasOwn(MODULES, module)) return;
    this.preference?.setActiveModule(module);
    if (module === this.activeModule) return;
    this.activeModule = module;
    this.render();
    this.onChange?.(module);
  }

  render() {
    const module = this.activeModule;
    const isMatrix = module === 'MATRIX';
    const isTrial = module === 'TRIAL';
    const isFighter = module === 'FIGHTER';
    // Hide, never replace, the dashboard: inputs, ongoing runs and renderers survive.
    this.matrix.hidden = !isMatrix;
    this.trial.hidden = !isTrial;
    this.fighter.hidden = !isFighter;
    this.archives.hidden = module !== 'ARCHIVES';
    for (const tab of this.tabs) {
      const selected = tab.dataset.module === module;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    document.getElementById('active-module-announcement').textContent = isMatrix
      ? 'Quantum Matrix dashboard active.'
      : isTrial ? 'Quantum Trial courtroom active.'
      : isFighter ? 'Option Fighter II combat arena active.'
      : 'Black Box Archives forensic repository active.';
    // Keep the selected tab within the touch-scroll strip without scrolling the page.
    const selectedTab = this.tabs.find(tab => tab.dataset.module === module);
    const strip = selectedTab.parentElement;
    if (selectedTab.offsetLeft < strip.scrollLeft) strip.scrollLeft = selectedTab.offsetLeft;
    else if (selectedTab.offsetLeft + selectedTab.offsetWidth > strip.scrollLeft + strip.clientWidth) {
      strip.scrollLeft = selectedTab.offsetLeft + selectedTab.offsetWidth - strip.clientWidth;
    }
  }
}
