import type { Configuration } from 'lint-staged';

// Staged files only: fast feedback. Whole-project checks (types, tests, audit) run in the hooks.
const config: Configuration = {
  '*.{ts,tsx}': ['oxfmt', 'oxlint --type-aware --deny-warnings --fix'],
  '*.{json,jsonc,yml,yaml,md,css,html}': ['oxfmt --no-error-on-unmatched-pattern'],
};

export default config;
