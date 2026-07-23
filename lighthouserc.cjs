// T10 Lighthouse CI gates. Consumed by `lhci autorun` from tests/run-t10.sh,
// which serves the fixture build via `astro preview` and exports LHCI_BASE_URL
// (and CHROME_PATH pointing at the Playwright Chromium when system libs are
// missing). Category-score thresholds only — no audit-level assertions.
const base = process.env.LHCI_BASE_URL || 'http://localhost:44310';

// R3: shared GitHub runners are noisy — in CI collect a stricter sample
// (median of 5 runs per URL) to absorb perf variance. Same thresholds, same
// mobile preset; only the sample count changes. Locally stays median-of-3.
// R4: the sample count is wired for real — numberOfRuns reads LHCI_RUNS
// (default 3); ci.yml's t10 step sets LHCI_RUNS=5, and run-t10.sh echoes the
// effective count at start. Set LHCI_CI=1 in the CI step that runs test:t10.
const isCI = process.env.LHCI_CI === '1';
const numberOfRuns = Number.parseInt(process.env.LHCI_RUNS || '3', 10);

module.exports = {
  ci: {
    collect: {
      url: [
        `${base}/`,
        `${base}/huntsville/`,
        `${base}/learn/post-fixture/`,
        `${base}/faq/`,
      ],
      numberOfRuns,
      // No `preset` here: LHCI's 'perf' preset restricts collection to the
      // performance category only. Lighthouse's default settings are already
      // the mobile emulation preset (mobile form factor, simulated throttling),
      // which is what the T10 spec pins.
      settings: {
        // Pin a Linux user-data-dir (see tests/run-t10.sh): chrome-launcher's
        // WSL detection would otherwise hand the Linux browser a Windows temp
        // path that gets created literally inside the repo.
        // R5: --no-sandbox/--disable-dev-shm-usage are unconditional — Chrome
        // SIGABRTs at launch on GitHub runners without them ("Unable to
        // connect to Chrome"), and they are harmless locally.
        chromeFlags: [
          `--user-data-dir=${process.env.LHCI_CHROME_USER_DATA_DIR || '.codex-tmp/lhci-chrome-profile'}`,
          '--no-sandbox',
          '--disable-dev-shm-usage',
        ],
      },
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
