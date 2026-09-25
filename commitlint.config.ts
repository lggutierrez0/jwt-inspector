import type { UserConfig } from '@commitlint/types';

// Conventional Commits drive release-please: feat -> minor, fix -> patch, `!`/BREAKING CHANGE -> major.
const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'core',
        'detect',
        'storage',
        'crypto',
        'ui',
        'i18n',
        'docs',
        'deps',
        'ci',
        'release',
        'spec',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'body-max-line-length': [2, 'always', 100],
  },
};

export default config;
