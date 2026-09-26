import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Constitution Principle V: dependencies point inward. The domain and application layers must
// stay free of frameworks, browser globals and outer layers so they remain pure and testable.
const INNER_LAYERS = ['src/domain', 'src/application'];

const FORBIDDEN_IMPORTS = [
  /from ['"]wxt/u,
  /from ['"]#imports['"]/u,
  /from ['"]react/u,
  /from ['"]@\/infrastructure/u,
  /from ['"]@\/ui/u,
];
const FORBIDDEN_GLOBALS = [/\bbrowser\./u, /\bchrome\./u, /\bdocument\b/u, /\bwindow\b/u];

function sourceFiles(dir: string): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    const isSource = /\.tsx?$/u.test(entry.name) && !/\.test\.tsx?$/u.test(entry.name);
    return isSource ? [full] : [];
  });
}

describe('architecture boundaries', () => {
  const files = INNER_LAYERS.flatMap((layer) => sourceFiles(layer));

  it.each(files)('%s does not depend on frameworks, browser APIs or outer layers', (file) => {
    const code = readFileSync(file, 'utf8');
    const violations = [...FORBIDDEN_IMPORTS, ...FORBIDDEN_GLOBALS]
      .filter((pattern) => pattern.test(code))
      .map((pattern) => pattern.source);

    expect(violations).toEqual([]);
  });
});
