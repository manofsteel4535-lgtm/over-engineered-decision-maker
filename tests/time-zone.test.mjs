import test from 'node:test';
import assert from 'node:assert/strict';
import { TimeZoneState, TIME_ZONE_STORAGE_KEY, getTimeZoneOffset, formatHeaderTime, resolveBrowserTimeZone } from '../dist/time-zone.js';

const detectUTC = () => 'UTC';

test('header zones use fixed UTC offsets and wrap IST through midnight', () => {
  assert.equal(getTimeZoneOffset('IST'), 5.5);
  const date = new Date('2026-10-06T21:45:13Z');
  assert.equal(formatHeaderTime(date, 'UTC'), '21:45:13');
  assert.equal(formatHeaderTime(date, 'GMT'), '21:45:13');
  assert.equal(formatHeaderTime(date, 'IST'), '03:15:13');
  assert.equal(formatHeaderTime(new Date('2026-10-06T08:03:13Z'), 'IST'), '13:33:13');
});

test('one shared preference notifies module subscribers immediately and survives reload', () => {
  const saved = new Map();
  const storage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
  const state = new TimeZoneState(storage, detectUTC), header = [], anotherModule = [];
  const stop = state.subscribe(tz => header.push(tz));
  state.subscribe(tz => anotherModule.push(tz));
  state.setTimeZone('IST');
  assert.deepEqual(header, ['UTC', 'IST']);
  assert.deepEqual(anotherModule, header);
  assert.equal(saved.get(TIME_ZONE_STORAGE_KEY), 'IST');
  assert.equal(new TimeZoneState(storage).selectedTimeZone, 'IST');
  stop(); state.setTimeZone('GMT');
  assert.deepEqual(header, ['UTC', 'IST']);
  assert.deepEqual(anotherModule, ['UTC', 'IST', 'GMT']);
  assert.equal(new TimeZoneState(storage).selectedTimeZone, 'GMT');
  assert.deepEqual([...saved.keys()], [TIME_ZONE_STORAGE_KEY], 'no decision/simulation persistence');
});

test('invalid preferences and denied storage do not break the header clock', () => {
  assert.equal(new TimeZoneState({ getItem: () => 'EST' }, detectUTC).selectedTimeZone, 'UTC');
  const denied = { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } };
  const state = new TimeZoneState(denied, detectUTC);
  assert.equal(state.selectedTimeZone, 'UTC');
  state.setTimeZone('IST'); assert.equal(state.selectedTimeZone, 'IST');
  assert.throws(() => state.setTimeZone('EST'), RangeError);
  assert.equal(state.selectedTimeZone, 'IST');
});

test('native region names and offsets map to IST, GMT or UTC, including London in summer', () => {
  assert.equal(resolveBrowserTimeZone('Asia/Kolkata', -330), 'IST');
  assert.equal(resolveBrowserTimeZone('Asia/Calcutta', -330), 'IST');
  assert.equal(resolveBrowserTimeZone(undefined, -330), 'IST');
  assert.equal(resolveBrowserTimeZone('Europe/London', -60), 'GMT');
  assert.equal(resolveBrowserTimeZone('Etc/GMT', 0), 'GMT');
  assert.equal(resolveBrowserTimeZone('Africa/Abidjan', 0), 'GMT');
  assert.equal(resolveBrowserTimeZone('America/New_York', 240), 'UTC');
  assert.equal(resolveBrowserTimeZone(undefined, NaN), 'UTC');
});

test('fresh initialization detects and saves once; saved manual preferences skip detection', () => {
  const saved = new Map();
  const storage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
  let calls = 0;
  const detect = () => { calls++; return 'IST'; };
  const state = new TimeZoneState(storage, detect);
  assert.equal(state.selectedTimeZone, 'IST');
  assert.equal(saved.get(TIME_ZONE_STORAGE_KEY), 'IST');
  assert.equal(calls, 1);
  state.setTimeZone('GMT');
  assert.equal(new TimeZoneState(storage, detect).selectedTimeZone, 'GMT');
  assert.equal(calls, 1);
  saved.set(TIME_ZONE_STORAGE_KEY, 'invalid');
  assert.equal(new TimeZoneState(storage, detect).selectedTimeZone, 'IST');
  assert.equal(calls, 2);
});

test('click cycling follows UTC → IST → GMT → UTC and persists each immediate update', () => {
  const saved = new Map();
  const storage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
  const state = new TimeZoneState(storage, detectUTC), updates = [];
  state.subscribe(tz => updates.push(tz));
  for (const expected of ['IST', 'GMT', 'UTC']) {
    state.cycleTimeZone();
    assert.equal(state.selectedTimeZone, expected);
    assert.equal(saved.get(TIME_ZONE_STORAGE_KEY), expected);
    assert.equal(new TimeZoneState(storage).selectedTimeZone, expected);
  }
  assert.deepEqual(updates, ['UTC', 'IST', 'GMT', 'UTC']);
  assert.deepEqual([...saved.keys()], [TIME_ZONE_STORAGE_KEY]);
});
