export interface LocaleMessages {
  readonly [key: string]: { readonly message: string };
}

/**
 * Untyped shape of `Translate` (from `./i18n-context`): any key, any arguments. Callers that need
 * the generated, key-checked `Translate` cast at the boundary (e.g. `switchable-i18n.tsx`), since
 * this module works over a plain dictionary parsed at runtime and cannot know the generated keys.
 */
export type GenericTranslate = (key: string, ...args: readonly unknown[]) => string;

type NamedSubstitutions = Readonly<Record<string, unknown>>;

function isNamedSubstitutions(value: unknown): value is NamedSubstitutions {
  return typeof value === 'object' && value !== null;
}

const POSITIONAL_RE = /\$(\$|[1-9])/gu;
const NAMED_RE = /\{([A-Za-z0-9_]+)\}/gu;

function substitutePositional(message: string, subs: readonly string[]): string {
  return message.replaceAll(POSITIONAL_RE, (_match, token: string) =>
    token === '$' ? '$' : (subs[Number(token) - 1] ?? ''),
  );
}

function applyNamed(message: string, subs: NamedSubstitutions): string {
  return message.replace(NAMED_RE, (match, key: string) =>
    Object.hasOwn(subs, key) ? String(subs[key]) : match,
  );
}

function pickPlural(message: string, count: number): string {
  const forms = message.split(' | ');
  if (forms.length === 1) return forms[0] ?? message;
  const index = forms.length === 2 ? (count === 1 ? 0 : 1) : count === 0 || count === 1 ? count : 2;
  return forms[index] ?? message;
}

/**
 * Reimplements `@wxt-dev/i18n`'s `createI18n().t` algorithm (positional/named substitution,
 * plural split) over a plain message dictionary instead of `browser.i18n.getMessage`, which
 * cannot be pointed at a locale other than the extension's own UI language (FR-029). Both the
 * production switchable translator and this module share one algorithm — see also
 * `tests/support/i18n.ts`, which exercises the real `createI18n()` for tests that do not switch
 * language.
 */
export function createTranslator(messages: LocaleMessages): GenericTranslate {
  return (key: string, ...args: readonly unknown[]): string => {
    let sub: readonly unknown[] | undefined;
    let namedSub: NamedSubstitutions | undefined;
    let count: number | undefined;
    for (const arg of args) {
      if (arg === null || arg === undefined) continue;
      else if (typeof arg === 'number') count = arg;
      else if (Array.isArray(arg)) sub = arg;
      else if (isNamedSubstitutions(arg)) namedSub = arg;
    }
    const positional = sub ?? (count === undefined ? undefined : [count]);

    const entry = messages[key.replaceAll('.', '_')];
    if (entry === undefined) {
      console.warn(`[i18n] Message not found: "${key}"`);
      return '';
    }
    // `$$` always collapses to a literal `$`, even with no substitutions to fill (Chrome i18n).
    let message = substitutePositional(entry.message, (positional ?? []).map(String));
    if (count !== undefined) message = pickPlural(message, count);
    return namedSub === undefined ? message : applyNamed(message, namedSub);
  };
}
