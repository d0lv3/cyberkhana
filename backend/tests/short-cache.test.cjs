const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { shortCache } = require('../dist/utils/shortCache');

// No database: with buffering off, an unconnected query fails the moment it runs, which is
// enough to see how many times it ran and whether a second run was attempted.
const db = new mongoose.Mongoose();
db.set('bufferCommands', false);
const Thing = db.model('Thing', new db.Schema({ name: String }));

test('a Mongoose query handed to the cache runs once, however many requests wait on it', async () => {
  const cache = shortCache(2000);
  const load = () => Thing.findById(new db.Types.ObjectId()).lean();
  const results = await Promise.allSettled(Array.from({ length: 5 }, () => cache.get('k', load)));
  for (const r of results) {
    assert.equal(r.status, 'rejected');
    // "Query was already executed" is what production returned for every event read.
    assert.doesNotMatch(String(r.reason?.message), /already executed/);
  }
});

test('concurrent reads share one load, and a failure is not remembered', async () => {
  const cache = shortCache(2000);
  let loads = 0;
  const ok = () => new Promise(resolve => setTimeout(() => resolve(++loads), 20));
  const values = await Promise.all(Array.from({ length: 50 }, () => cache.get('k', ok)));
  assert.deepEqual(new Set(values), new Set([1]));

  let attempts = 0;
  const failing = () => { attempts++; return Promise.reject(new Error('down')); };
  await assert.rejects(cache.get('f', failing));
  await assert.rejects(cache.get('f', failing));
  assert.equal(attempts, 2);
});

test('set replaces the entry with the given value', async () => {
  const cache = shortCache(2000);
  await cache.get('k', async () => 'old');
  cache.set('k', 'new');
  assert.equal(await cache.get('k', async () => 'loaded'), 'new');
});

test('an older commit arriving late does not replace a newer cached event', async () => {
  const { rememberEvent, readEvent } = require('../dist/services/eventLive');
  const _id = new db.Types.ObjectId();
  rememberEvent({ _id, eventRevision: 2, name: 'newer' });
  rememberEvent({ _id, eventRevision: 1, name: 'older' });
  assert.equal((await readEvent(String(_id))).name, 'newer');
  rememberEvent({ _id, eventRevision: 3, name: 'newest' });
  assert.equal((await readEvent(String(_id))).name, 'newest');
});
