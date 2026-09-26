import { useI18n } from '../i18n/i18n-context';
import { MaskedValue } from './masked-value';

interface StructureFigureProps {
  readonly segments: readonly [string, string, string];
}

/**
 * The encoded token as an RFC figure: segments colored by part and captioned, the signature
 * masked until revealed (DESIGN.md "Structure figure").
 */
export function StructureFigure({ segments }: StructureFigureProps) {
  const { t } = useI18n();
  const [header, payload, signature] = segments;

  return (
    <figure className="flex flex-col gap-3 rounded-control bg-surface-sunken p-3 font-stretch-condensed">
      <div className="flex flex-col gap-1">
        <span className="break-all text-part-header">{header}</span>
        <figcaption className="text-cite text-ink-muted">{t('parts.header')}</figcaption>
      </div>
      <div className="flex flex-col gap-1">
        <span className="break-all text-part-payload">{payload}</span>
        <span className="text-cite text-ink-muted">{t('parts.payload')}</span>
      </div>
      <div className="flex flex-col gap-1 text-part-signature">
        <MaskedValue name={t('parts.signature')} revealed={signature} />
        <span className="text-cite text-ink-muted">{t('parts.signature')}</span>
      </div>
    </figure>
  );
}
