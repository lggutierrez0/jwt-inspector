import type { DecodeError } from '@/domain/jwt/types';

import type { Translate } from './i18n-context';

/** One specific, actionable message per decode failure (FR-003, SC-003). */
export function decodeErrorMessage(error: DecodeError, t: Translate): string {
  if (error.kind === 'empty') return t('add.errors.empty');
  if (error.kind === 'wrongPartCount') return t('add.errors.wrongPartCount', [String(error.count)]);
  if (error.kind === 'tooLarge') {
    return t('add.errors.tooLarge', [String(Math.ceil(error.bytes / 1024))]);
  }
  const part = t(`parts.${error.part}`);
  if (error.kind === 'invalidBase64Url') return t('add.errors.invalidBase64Url', [part]);
  if (error.kind === 'invalidUtf8') return t('add.errors.invalidUtf8', [part]);
  if (error.kind === 'invalidJson') return t('add.errors.invalidJson', [part]);
  return t('add.errors.notAnObject', [part]);
}
