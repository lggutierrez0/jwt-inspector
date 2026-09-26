import { useEffect, useRef, type ReactNode } from 'react';

interface FocusHeadingProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * The heading of a view that just opened. It takes focus on mount so keyboard and screen-reader
 * users land on the new content instead of the page body (WCAG 2.4.3).
 */
export function FocusHeading({ children, className = '' }: FocusHeadingProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <h2 ref={heading} tabIndex={-1} className={`outline-offset-4 ${className}`}>
      {children}
    </h2>
  );
}
