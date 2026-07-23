// T10 Lighthouse CI gates. Consumed by `lhci autorun` from tests/run-t10.sh,
// which serves the fixture build via `astro preview` and exports LHCI_BASE_URL
// (and CHROME_PATH pointing at the Playwright Chromium when system libs are
// missing). Category-score thresholds only — no audit-level assertions.
const base = process.env.LHCI_BASE_URL || 'http://localhost:44310';

module.exports = {
  ci: {
    collect: {
      url: [
        `${base}/`,
        `${base}/huntsville/`,
        `${base}/learn/post-fixture/`,
        `${base}/faq/`,
      ],
      numberOfRuns: 3,
      // No `preset` here: LHCI's 'perf' preset restricts collection to the
      // performance category only. Lighthouse's default settings are already
      // the mobile emulation preset (mobile form factor, simulated throttling),
      // which is what the T10 spec pins.
      settings: {},
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9, aggregationMethod: 'median' }],
        'categories:seo': ['error', { minScore: 1, aggregationMethod: 'median' }],
        'categories:accessibility': ['error', { minScore: 0.95, aggregationMethod: 'median' }],
        'categories:best-practices': ['error', { minScore: 0.95, aggregationMethod: 'median' }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
