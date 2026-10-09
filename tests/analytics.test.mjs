import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';

const externalRequire = createRequire(import.meta.url);

// Reuse the repository's compiler + node:test approach. All provider calls stay in memory.
function harness({ window, clarityId = 'test-only', mocks = {}, document, Element } = {}) {
  const modules = new Map();
  const ga = [], clarity = [], effects = [];
  const providers = {
    '@next/third-parties/google': { sendGAEvent: (...args) => ga.push(args) },
    '@microsoft/clarity': { default: { event: name => clarity.push(name) }, __esModule: true },
    react: { ...React, useEffect: (callback, deps) => effects.push({ callback, deps }) },
    ...mocks,
  };
  function load(relative) {
    const filename = path.resolve(relative);
    if (modules.has(filename)) return modules.get(filename).exports;
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const loaded = { exports: {} };
    modules.set(filename, loaded);
    const resolve = id => {
      if (Object.hasOwn(providers, id)) return providers[id];
      if (id.endsWith('.css')) return {};
      if (id.startsWith('@/') || id.startsWith('.')) {
        const base = id.startsWith('@/') ? path.resolve('src', id.slice(2)) : path.resolve(path.dirname(filename), id);
        return load(['.ts', '.tsx'].map(ext => base + ext).find(fs.existsSync));
      }
      return externalRequire(id);
    };
    vm.runInThisContext(`(function(require,module,exports,window,process,document,Element,getComputedStyle){${output}\n})`, { filename })(
      resolve, loaded, loaded.exports, window, { env: { NEXT_PUBLIC_CLARITY_PROJECT_ID: clarityId } }, document, Element,
      () => ({ getPropertyValue: () => '' }),
    );
    return loaded.exports;
  }
  return { load, ga, clarity, effects };
}

function descendants(node) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...React.Children.toArray(node.props?.children).flatMap(descendants)];
}

const initializedWindow = () => ({ dataLayer: [], clarity() {} });

test('provider policy and allowlists drop extra fields, including booking PII', () => {
  const h = harness({ window: initializedWindow() });
  const { configureAnalytics, trackEvent } = h.load('src/lib/analytics/client.ts');
  configureAnalytics(true);
  trackEvent('booking_complete', { meeting_type: 'intro_call', email: 'test@example.invalid', attendee: { name: 'Private' }, source: 'footer' });
  trackEvent('projects_pagination', { page: 2, direction: 'next', category: 'corporate' });
  trackEvent('schedule_tab_change', { meeting_type: 'career_conversation' });
  trackEvent('cta_click', { cta: 'view_all_projects', source: 'home_highlights' });
  assert.deepEqual(h.ga[0], ['event', 'booking_complete', { meeting_type: 'intro_call' }]);
  assert.equal(h.ga.length, 4);
  assert.deepEqual(h.clarity, ['booking_complete']);
});

test('missing providers and server rendering no-op; one failing provider does not stop the other', () => {
  const server = harness();
  const serverClient = server.load('src/lib/analytics/client.ts');
  serverClient.configureAnalytics(true);
  assert.doesNotThrow(() => serverClient.trackEvent('resume_click', { source: 'footer' }));
  assert.equal(server.ga.length + server.clarity.length, 0);
  for (const window of [{}, initializedWindow()]) {
    const h = harness({ window, clarityId: '' });
    const client = h.load('src/lib/analytics/client.ts');
    client.trackEvent('resume_click', { source: 'footer' });
    assert.equal(h.ga.length + h.clarity.length, 0);
    client.configureAnalytics(true);
    if (!window.dataLayer) {
      client.trackEvent('resume_click', { source: 'footer' });
      assert.equal(h.ga.length, 0);
    }
  }
  const blocked = harness({ window: initializedWindow(), mocks: {
    '@next/third-parties/google': { sendGAEvent() { throw Error('blocked'); } },
  } });
  const client = blocked.load('src/lib/analytics/client.ts');
  client.configureAnalytics(true);
  assert.doesNotThrow(() => client.trackEvent('resume_click', { source: 'footer' }));
  assert.deepEqual(blocked.clarity, ['resume_click']);
  const failedClarity = harness({ window: initializedWindow(), mocks: {
    '@microsoft/clarity': { default: { event() { throw Error('blocked'); } }, __esModule: true },
  } });
  const otherClient = failedClarity.load('src/lib/analytics/client.ts');
  otherClient.configureAnalytics(true);
  assert.doesNotThrow(() => otherClient.trackEvent('contact_click', { source: 'home_meta', channel: 'email' }));
  assert.equal(failedClarity.ga.length, 1);
});

test('DOM decoding rejects unknown events/values and converts pagination to a number', () => {
  const { readAnalyticsEvent, analyticsAttributes, analyticsEventFromElement } = harness().load('src/lib/analytics/events.ts');
  for (const name of ['page_view', 'githubClick', '__proto__', 'constructor']) {
    assert.equal(readAnalyticsEvent(name, () => 'footer'), null);
  }
  assert.equal(readAnalyticsEvent('contact_click', key => ({ source: 'footer', channel: 'test@example.invalid' })[key]), null);
  for (const page of ['0', '-1', '2.1', 'Infinity', undefined]) {
    assert.equal(readAnalyticsEvent('projects_pagination', key => ({ page, direction: 'next', category: 'all' })[key]), null);
  }
  const attributes = analyticsAttributes('projects_pagination', { page: 2, direction: 'next', category: 'all' });
  const element = { getAttribute: key => key in attributes ? String(attributes[key]) : null };
  assert.deepEqual(analyticsEventFromElement(element), ['projects_pagination', { page: 2, direction: 'next', category: 'all' }]);
});

test('one delegated event for nested SVG clicks; cleanup/replay leaves one listener and does not block navigation', () => {
  const listeners = new Set();
  class Element {
    constructor(attributes = {}, parent = null) { this.attributes = attributes; this.parent = parent; }
    getAttribute(key) { return this.attributes[key] ?? null; }
    closest() { return this.getAttribute('data-analytics-event') ? this : this.parent?.closest() ?? null; }
  }
  const document = {
    addEventListener(type, fn, options) { assert.equal(type, 'click'); assert.deepEqual(options, { capture: true, passive: true }); listeners.add(fn); },
    removeEventListener(type, fn, capture) { assert.equal(capture, true); listeners.delete(fn); },
  };
  const h = harness({ window: initializedWindow(), document, Element });
  const { AnalyticsEventListener } = h.load('src/components/analytics/AnalyticsEventListener.tsx');
  const { analyticsAttributes } = h.load('src/lib/analytics/events.ts');
  AnalyticsEventListener({ gaEnabled: true });
  h.effects[0].callback()(); // Strict Mode's initial setup/cleanup.
  const cleanup = h.effects[0].callback();
  assert.equal(listeners.size, 1);
  const link = new Element(analyticsAttributes('project_link_click', { project: 'Public portfolio project', source: 'home_featured', destination: 'github' }));
  const click = { target: new Element({}, new Element({}, link)), preventDefault() { assert.fail('Navigation blocked'); } };
  for (const listener of listeners) listener(click);
  assert.equal(h.ga.length, 1);
  assert.deepEqual(h.clarity, ['project_link_click']);
  for (const listener of listeners) listener({ target: new Element() });
  assert.equal(h.ga.length, 1);
  cleanup();
  assert.equal(listeners.size, 0);
});

test('archive exposes typed filter, pagination and project actions without client handlers', () => {
  const { ProjectsGallery } = harness().load('src/components/ProjectsGallery.tsx');
  const tree = ProjectsGallery({ categories: [{ name: 'corporate', count: 20 }], initialData: {
    projects: [{ id: 'public', name: 'Public project', stack: [], category: 'corporate', status: 'production', link: 'https://example.com', github: 'https://github.com/example', codepen: 'https://codepen.io/example' }],
    totalPages: 3, currentPage: 2, totalItems: 20, activeCategory: 'corporate',
  } });
  const actions = descendants(tree).filter(node => node.props['data-analytics-event']);
  assert.equal(actions.length, 7);
  assert(actions.every(node => !node.props.onClick));
  assert.deepEqual(actions.filter(node => node.props['data-analytics-event'] === 'project_link_click').map(node => node.props['data-analytics-destination']), ['live_site', 'github', 'codepen']);
  const pages = actions.filter(node => node.props['data-analytics-event'] === 'projects_pagination').map(node => node.props);
  assert.deepEqual(pages.map(p => [p['data-analytics-page'], p['data-analytics-direction'], p['data-analytics-category']]), [[1, 'previous', 'corporate'], [3, 'next', 'corporate']]);
});

test('RainbowGlowLink forwards analytics only to the inner link, preserving its existing anchor props', () => {
  const h = harness({ mocks: { react: {
    ...React, useEffect() {}, useMemo: fn => fn(), useRef: () => ({ current: null }), useState: value => [value, () => {}],
  } } });
  const { RainbowGlowLink } = h.load('src/components/RainbowGlowLink/RainbowGlowLink.tsx');
  const { analyticsAttributes } = h.load('src/lib/analytics/events.ts');
  const attributes = analyticsAttributes('resume_click', { source: 'footer' });
  const tree = RainbowGlowLink({ href: 'https://example.com/cv', children: 'CV', target: '_blank', rel: 'noreferrer', ...attributes });
  assert.equal(tree.props['data-analytics-event'], undefined);
  const tracked = descendants(tree).filter(node => node.props['data-analytics-event']);
  assert.equal(tracked.length, 1);
  assert.equal(tracked[0].props.href, 'https://example.com/cv');
  assert.equal(tracked[0].props.target, '_blank');
  assert.equal(tracked[0].props.rel, 'noreferrer');
  assert.equal(tracked[0].props.onClick, undefined);
});

test('featured details report opens only, independently of responsive action copies', () => {
  const events = [];
  const stage = { activeIndex: null, cardRefs: { current: [] }, onToggle(index) { this.activeIndex = index; }, onClose() {} };
  stage.onToggle = index => { stage.activeIndex = stage.activeIndex === index ? null : index; };
  const h = harness({ mocks: {
    '@/lib/analytics/client': { trackEvent: (...args) => events.push(args) },
    './usePortfolioCardsStage': { usePortfolioCardsStage: () => stage },
  } });
  const PortfolioSection = h.load('src/components/portfolio/PortfolioSection.tsx').default;
  const props = { featuredProjects: [{ name: 'Public project', stack: [], link: 'https://example.com', github: 'https://github.com/example', description: '' }] };
  const toggle = () => descendants(PortfolioSection(props)).find(node => node.props['data-role'] === 'toggle').props.onClick();
  toggle();
  toggle();
  PortfolioSection(props);
  assert.deepEqual(events, [['project_details_open', { project: 'Public project', source: 'home_featured' }]]);
  const links = descendants(PortfolioSection(props)).filter(node => node.props['data-analytics-event']);
  assert.equal(links.length, 4);
  assert(links.every(node => !node.props.onClick));
});

test('Cal subscriptions deduplicate completion, ignore payloads, clean up, and track only intentional tab changes', async () => {
  const events = [], effects = [], subscriptions = [], removed = [];
  let stateIndex = 0;
  const h = harness({ document: { documentElement: {} }, mocks: {
    react: { ...React, useState: () => [[true, 'intro-call'][stateIndex++], () => {}], useRef: () => ({ current: null }), useCallback: fn => fn, useEffect: (callback, deps) => effects.push({ callback, deps }) },
    'next/navigation': { usePathname: () => '/', useRouter: () => ({ replace() {} }), useSearchParams: () => new URLSearchParams('meet=hour-meeting') },
    'next/dynamic': () => () => null,
    '@/lib/analytics/client': { trackEvent: (...args) => events.push(args) },
    '@calcom/embed-react': { getCalApi: async () => (action, subscription) => {
      if (action === 'on') subscriptions.push(subscription);
      if (action === 'off') removed.push(subscription);
    } },
  } });
  const { CalPopup } = h.load('src/components/CalPopup/CalPopup.tsx');
  const tree = CalPopup({});
  assert.equal(events.length, 0);
  const tabs = descendants(tree).filter(node => node.props.role === 'tab');
  tabs[0].props.onClick();
  assert.equal(events.length, 0);
  tabs[1].props.onClick();
  assert.deepEqual(events.shift(), ['schedule_tab_change', { meeting_type: 'career_conversation' }]);
  const bookingEffect = effects.find(effect => effect.deps[0] === 'intro-call' && effect.deps[1] === true);
  const cancelledCleanup = bookingEffect.callback();
  cancelledCleanup();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(subscriptions.length, 0);
  const cleanup = bookingEffect.callback();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(subscriptions.length, 1);
  assert.equal(subscriptions[0].action, 'bookingSuccessfulV2');
  const unreadablePayload = new Proxy({}, { get() { assert.fail('Booking payload was read'); } });
  subscriptions[0].callback(unreadablePayload);
  subscriptions[0].callback(unreadablePayload);
  assert.deepEqual(events, [['booking_complete', { meeting_type: 'intro_call' }]]);
  cleanup();
  assert.equal(removed[0], subscriptions[0]);
  subscriptions[0].callback(unreadablePayload);
  assert.equal(events.length, 1);
});
