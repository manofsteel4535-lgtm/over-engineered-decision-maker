/** Shared site preference. Decision inputs and simulation state remain volatile. */
export const TIME_ZONE_OPTIONS = Object.freeze(['UTC', 'IST', 'GMT']);
export const TIME_ZONE_STORAGE_KEY = 'oddm_user_timezone';
export const getTimeZoneOffset = tz => tz === 'IST' ? 5.5 : 0;

// Use UTC getters through ISO formatting so the host/browser timezone is irrelevant.
export function formatHeaderTime(date, tz) {
  return new Date(date.getTime() + getTimeZoneOffset(tz) * 3_600_000).toISOString().slice(11, 19);
}

function browserStorage() {
  try { return globalThis.localStorage; } catch { return undefined; }
}

// Offsets follow Date#getTimezoneOffset: India is -330 minutes, Greenwich is 0.
export function resolveBrowserTimeZone(zone, offsetMinutes) {
  if (zone === 'Asia/Kolkata' || zone === 'Asia/Calcutta' || offsetMinutes === -330) return 'IST';
  if (zone === 'Europe/London' || zone === 'Etc/GMT' || offsetMinutes === 0) return 'GMT';
  return 'UTC';
}

export function detectBrowserTimeZone() {
  let zone;
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* Use the native offset if Intl is unavailable. */ }
  return resolveBrowserTimeZone(zone, new Date().getTimezoneOffset());
}

export class TimeZoneState {
  #selectedTimeZone = 'UTC';
  #listeners = new Set();
  #storage;

  constructor(storage = browserStorage(), detect = detectBrowserTimeZone) {
    this.#storage = storage;
    try {
      const saved = storage?.getItem(TIME_ZONE_STORAGE_KEY);
      if (TIME_ZONE_OPTIONS.includes(saved)) {
        this.#selectedTimeZone = saved;
        return; // An explicit preference takes precedence over browser detection.
      }
    } catch { /* Privacy/storage restrictions must not break the clock. */ }
    this.setTimeZone(detect());
  }

  get selectedTimeZone() { return this.#selectedTimeZone; }

  setTimeZone(tz) {
    if (!TIME_ZONE_OPTIONS.includes(tz)) throw new RangeError('Unknown time zone.');
    this.#selectedTimeZone = tz;
    try { this.#storage?.setItem(TIME_ZONE_STORAGE_KEY, tz); } catch { /* Keep the in-memory preference usable. */ }
    for (const listener of this.#listeners) listener(tz);
  }

  cycleTimeZone() {
    const index = TIME_ZONE_OPTIONS.indexOf(this.#selectedTimeZone);
    this.setTimeZone(TIME_ZONE_OPTIONS[(index + 1) % TIME_ZONE_OPTIONS.length]);
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    listener(this.#selectedTimeZone);
    return () => this.#listeners.delete(listener);
  }
}

// ES modules share this single root instance across all suite modules.
export const siteTimeZone = new TimeZoneState();
