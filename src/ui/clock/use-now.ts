import { createContext, useContext, useSyncExternalStore } from 'react';

import type { ClockTicker } from './clock-ticker';

export const ClockContext = createContext<ClockTicker | null>(null);

/** Current time, re-rendering the caller on every shared tick. */
export function useNow(): number {
  const ticker = useContext(ClockContext);
  if (ticker === null) throw new Error('useNow must be used inside a ClockContext provider');
  return useSyncExternalStore(ticker.subscribe, ticker.getSnapshot);
}
