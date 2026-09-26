import { useId, type ReactNode } from 'react';

interface SectionProps {
  /** Position in the document; RFC-style numbering is the panel's grammar (DESIGN.md). */
  readonly number: number;
  readonly title: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}

/** A numbered document section, exposed as a named region. */
export function Section({ number, title, actions, children }: SectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2 pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
        <h2 id={headingId} className="text-head">
          {`${number}. ${title}`}
        </h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
