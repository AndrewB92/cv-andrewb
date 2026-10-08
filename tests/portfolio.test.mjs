import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createRequire } from 'node:module';
const externalRequire = createRequire(import.meta.url);
globalThis.AsyncLocalStorage = AsyncLocalStorage;
const { unstable_cache } = externalRequire('next/cache');
const { workAsyncStorage } = externalRequire('next/dist/server/app-render/work-async-storage.external');
const { MongoNetworkError } = externalRequire('mongodb');

// Compile application TS with the existing compiler; no added test framework or production hooks.
function loadSource(relative, mocks = {}, modules = new Map()) {
  const filename = path.resolve(relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  modules.set(filename, loaded);
  const resolve = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.startsWith('@/')) return loadSource(`src/${id.slice(2)}.ts`, mocks, modules);
    if (id.startsWith('.')) return loadSource(path.resolve(path.dirname(filename), `${id}.ts`), mocks, modules);
    return externalRequire(id);
  };
  vm.runInThisContext(`(function(require,module,exports,console){${output}\n})`, { filename })(resolve, loaded, loaded.exports, mocks.console ?? console);
  return loaded.exports;
}
const { projectArchive, projectsHref } = loadSource('src/data/projects.ts');
const archiveProjects = Array.from({ length: 18 }, (_, i) => ({ id: String(i), category: i < 10 ? 'corporate' : 'ecommerce', stack: [] }));

test('archive filters before paginating and preserves whole-archive category counts', () => {
  const result = projectArchive(archiveProjects, { category: 'corporate', page: '2' });
  assert.equal(result.totalItems, 10);
  assert.equal(result.totalPages, 2);
  assert.deepEqual(result.projects.map(p => p.id), ['8', '9']);
  assert.deepEqual(result.categories, [{ name: 'ecommerce', count: 8 }, { name: 'corporate', count: 10 }]);
});
test('archive handles repeated, invalid, fractional and out-of-range URL parameters', () => {
  assert.equal(projectArchive(archiveProjects, { page: ['2', '3'] }).currentPage, 2);
  assert.equal(projectArchive(archiveProjects, { category: ['corporate', 'ecommerce'] }).totalItems, 10);
  for (const page of ['0', '-2', 'bad', 'Infinity']) assert.equal(projectArchive(archiveProjects, { page }).currentPage, 1);
  assert.equal(projectArchive(archiveProjects, { page: '2.9' }).currentPage, 2);
  assert.equal(projectArchive(archiveProjects, { page: '999' }).currentPage, 3);
  assert.equal(projectArchive(archiveProjects, { category: 'invalid' }).activeCategory, null);
  assert.equal(projectArchive([], {}).totalPages, 1);
  assert.equal(projectArchive([], {}).currentPage, 1);
});
test('archive URLs reset page on filtering and retain category across pagination', () => {
  assert.equal(projectsHref(null), '/projects');
  assert.equal(projectsHref('corporate'), '/projects?category=corporate');
  assert.equal(projectsHref(null, 2), '/projects?page=2');
  assert.equal(projectsHref('corporate', 2), '/projects?category=corporate&page=2');
});

function dataHarness() {
  let reads = 0, unavailable = false, invalid = false, stale = false, connections = 0;
  const entries = new Map(), writes = [], logs = [];
  const driver = {
    collection(name) {
      return {
        async findOne(query) {
          reads++;
          if (unavailable) throw new MongoNetworkError('private-driver-diagnostics');
          return name === '_profile' && query._id === 'skills' ? { _id: 'skills', frontend: ['React', 'react', ' TypeScript '] } : null;
        },
        find() { return { sort() { return { async toArray() {
          reads++;
          if (unavailable) throw new MongoNetworkError('private-driver-diagnostics');
          if (name === '_profile_experiences') return [{ company: 'Test fixture', role: 'Test role', start: '2020', end: '2021', achievements: [] }];
          if (name === '_portfolio') return [{ id: 'fixture', name: 'Test fixture', summary: invalid ? undefined : 'Test-only content', category: 'corporate', status: 'private', stack: [] }];
          return [];
        } } } } },
      };
    },
  };
  globalThis.__incrementalCache = {
    generateSimpleCacheKey: async key => key,
    get: async key => entries.has(key) ? { value: entries.get(key), isStale: stale } : null,
    set: async (key, value, options) => { entries.set(key, value); writes.push({ value, options }); },
  };
  const app = loadSource('src/data/profile.ts', {
    '@/lib/mongodb': { getDatabase: async () => driver },
    'next/cache': { unstable_cache },
    'next/server': { connection: async () => { connections++; } },
    console: { error: message => logs.push(message) },
  });
  return { app, entries, writes, logs, reads: () => reads, connections: () => connections, fail: () => { unavailable = true; }, recover: () => { unavailable = false; }, invalidateSchema: () => { invalid = true; }, stale: () => { stale = true; } };
}

test('successful normalized content uses the actual Next cache across successive calls', async () => {
  const old = process.env.MONGODB_URI;
  process.env.MONGODB_URI = 'test-only-not-a-connection';
  try {
    const h = dataHarness();
    const first = await h.app.getPortfolioContent();
    const second = await h.app.getPortfolioContent();
    assert.equal(h.reads(), 3);
    assert.equal(first.available, true);
    assert.deepEqual(first, second);
    assert.deepEqual(first.skills[0].items, ['React', 'TypeScript']);
    assert.equal(h.writes.length, 1);
    assert.equal(h.writes[0].value.revalidate, 86400);
    assert.deepEqual(h.writes[0].options.tags, ['portfolio']);
    assert.equal(h.connections(), 0);
  } finally { if (old === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = old; }
});
test('cold network failures do not cache empty data, deduplicate logs and recover', async () => {
  const old = process.env.MONGODB_URI;
  process.env.MONGODB_URI = 'test-only-not-a-connection';
  try {
    const h = dataHarness(); h.fail();
    const first = await h.app.getPortfolioContent();
    await h.app.getPortfolioContent();
    assert.equal(first.available, false);
    assert.deepEqual(first.projects, []);
    assert.equal(h.writes.length, 0);
    assert.equal(h.connections(), 2);
    assert.equal(h.logs.length, 1);
    assert(!h.logs.join('').includes('private-driver-diagnostics'));
    h.recover();
    assert.equal((await h.app.getPortfolioContent()).available, true);
    assert.equal(h.writes.length, 1);
  } finally { if (old === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = old; }
});
test('stale successful content survives an actual Next background revalidation failure', async () => {
  const old = process.env.MONGODB_URI, oldError = console.error;
  process.env.MONGODB_URI = 'test-only-not-a-connection';
  const frameworkLogs = [];
  try {
    const h = dataHarness();
    const first = await h.app.getPortfolioContent();
    h.fail(); h.stale();
    const store = { route: '/', incrementalCache: globalThis.__incrementalCache, isStaticGeneration: false };
    console.error = (...args) => frameworkLogs.push(args);
    const stale = await workAsyncStorage.run(store, () => h.app.getPortfolioContent());
    await Promise.all(Object.values(store.pendingRevalidates));
    assert.deepEqual(stale, first);
    assert.equal(h.writes.length, 1);
    assert.equal(h.connections(), 0);
    assert.equal(frameworkLogs.length, 1);
    assert.equal(h.logs.length, 0);
    assert(!JSON.stringify(frameworkLogs).includes('private-driver-diagnostics'));
  } finally { console.error = oldError; if (old === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = old; }
});
test('malformed content fails visibly and is never cached as successful content', async () => {
  const old = process.env.MONGODB_URI;
  process.env.MONGODB_URI = 'test-only-not-a-connection';
  try {
    const h = dataHarness(); h.invalidateSchema();
    await assert.rejects(h.app.getPortfolioContent(), /database configuration and schema/);
    assert.equal(h.writes.length, 0);
    assert.equal(h.connections(), 0);
  } finally { if (old === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = old; }
});
test('missing configuration uses an explicit uncached unavailable state', async () => {
  const old = process.env.MONGODB_URI; delete process.env.MONGODB_URI;
  try {
    const h = dataHarness();
    const result = await h.app.getPortfolioContent();
    assert.equal(result.available, false);
    assert.equal(h.reads(), 0);
    assert.equal(h.writes.length, 0);
    assert.match(h.logs[0], /missing_configuration/);
  } finally { if (old !== undefined) process.env.MONGODB_URI = old; }
});
