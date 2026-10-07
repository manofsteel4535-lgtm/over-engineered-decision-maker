import { siteTimeZone, formatHeaderTime, TIME_ZONE_OPTIONS } from './time-zone.js';

/** Mount once in the shared header; module navigation never recreates this clock. */
export function initHeaderClock() {
  const clock = document.getElementById('clock');
  const digits = document.getElementById('clock-digits');
  const badge = document.getElementById('timezone-badge');

  function render() {
    const tz = siteTimeZone.selectedTimeZone;
    const next = TIME_ZONE_OPTIONS[(TIME_ZONE_OPTIONS.indexOf(tz) + 1) % TIME_ZONE_OPTIONS.length];
    digits.textContent = formatHeaderTime(new Date(), tz);
    badge.textContent = tz;
    clock.dataset.timezone = tz;
    badge.setAttribute('aria-label', `Time zone: ${tz}. Click to switch to ${next}`);
  }

  // Native buttons also support Enter/Space and touch, without hover or disclosure state.
  badge.addEventListener('click', () => siteTimeZone.cycleTimeZone());
  siteTimeZone.subscribe(render);
  setInterval(render, 1000);
}