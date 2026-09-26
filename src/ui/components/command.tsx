import type { ButtonHTMLAttributes, Ref } from 'react';

type Tone = 'default' | 'primary' | 'danger';

interface CommandProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Visible command word, e.g. "copy"; brackets are drawn around it. */
  readonly label: string;
  readonly tone?: Tone;
  readonly ref?: Ref<HTMLButtonElement>;
}

const TONES: Record<Tone, string> = {
  default: 'text-ink',
  primary: 'bg-ink px-2 text-surface',
  danger: 'text-status-expired',
};

/**
 * Bracketed text command (DESIGN.md "Commands"). Brackets are decorative; the accessible name is
 * the word or an explicit `aria-label` that adds context ("reveal email").
 */
export function Command({
  label,
  tone = 'default',
  className = '',
  type = 'button',
  ...props
}: CommandProps) {
  return (
    <button
      type={type}
      className={`group inline-flex min-h-6 cursor-pointer items-baseline rounded-control whitespace-nowrap disabled:cursor-not-allowed disabled:line-through disabled:opacity-70 ${TONES[tone]} ${className}`}
      {...props}
    >
      <span
        aria-hidden="true"
        className="text-ink-muted transition-transform duration-150 group-focus-visible:text-focus group-active:translate-x-0.5"
      >
        [
      </span>
      <span className="px-1 underline-offset-4 group-hover:underline">{label}</span>
      <span
        aria-hidden="true"
        className="text-ink-muted transition-transform duration-150 group-focus-visible:text-focus group-active:-translate-x-0.5"
      >
        ]
      </span>
    </button>
  );
}
