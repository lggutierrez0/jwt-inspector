import { act, screen } from '@testing-library/react';

import type { TokenRecord } from '@/domain/vault/token-record';

import { NOW, valid1h } from '../../../tests/fixtures/tokens';
import { FixedClock } from '../../../tests/support/in-memory-ports';
import { renderWithProviders } from '../../../tests/support/render';
import type * as IndexLineMetaModule from '../components/index-line-meta';
import { ListView } from './list-view';

const lineMetaRenders = vi.hoisted(() => ({ count: 0 }));

// Count renders of the static part of every index line (tail, source, lifetime).
vi.mock('../components/index-line-meta', async (importOriginal) => {
  const original = await importOriginal<typeof IndexLineMetaModule>();
  return {
    ...original,
    IndexLineMeta: (props: Parameters<typeof original.IndexLineMeta>[0]) => {
      lineMetaRenders.count += 1;
      return original.IndexLineMeta(props);
    },
  };
});

const tokens: TokenRecord[] = Array.from({ length: 200 }, (_, index) => ({
  id: `t${index}`,
  raw: `${valid1h}${index.toString(36).padStart(2, '0')}`,
  kind: 'jws',
  label: `Token ${index}`,
  source: { kind: 'manual' },
  addedAt: index,
}));

describe('ListView rendering cost (supports SC-004)', () => {
  it('re-renders only the time element of each line on a clock tick', () => {
    vi.useFakeTimers();
    const clock = new FixedClock(NOW);
    renderWithProviders(
      <ListView
        tokens={tokens}
        initialScroll={0}
        onOpen={vi.fn<(id: string, listScroll: number) => void>()}
        onAdd={vi.fn<() => void>()}
        onClearAll={vi.fn<() => Promise<{ ok: true }>>()}
        onClearExpired={vi.fn<() => Promise<{ ok: true }>>()}
      />,
      { clock },
    );
    const afterMount = lineMetaRenders.count;
    expect(afterMount).toBe(200);

    clock.current = NOW + 60_000;
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getAllByText('59 min left')).toHaveLength(200);
    expect(lineMetaRenders.count).toBe(afterMount);
    vi.useRealTimers();
  });
});
