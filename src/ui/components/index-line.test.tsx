import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TOKEN_SOURCE_KINDS, type TokenRecord } from '@/domain/vault/token-record';

import {
  expired3d,
  jwe5Parts,
  noExp,
  noIatNoNbf,
  notYetValid,
  valid1h,
} from '../../../tests/fixtures/tokens';
import { renderWithProviders } from '../../../tests/support/render';
import { IndexLine } from './index-line';

const record = (raw: string, overrides: Partial<TokenRecord> = {}): TokenRecord => ({
  id: 't1',
  raw,
  kind: 'jws',
  label: 'Checkout session',
  source: { kind: 'manual' },
  addedAt: 0,
  ...overrides,
});

function show(item: TokenRecord) {
  const onOpen = vi.fn<(id: string) => void>();
  renderWithProviders(
    <ul>
      <IndexLine record={item} onOpen={onOpen} />
    </ul>,
  );
  return { onOpen, button: screen.getByRole('button') };
}

describe('IndexLine (FR-008)', () => {
  it('shows label, leader and the status with time left in its color', () => {
    const { container } = renderWithProviders(
      <ul>
        <IndexLine record={record(valid1h)} onOpen={vi.fn<(id: string) => void>()} />
      </ul>,
    );

    expect(screen.getByText('Checkout session')).toBeInTheDocument();
    expect(container.querySelector('[data-leader]')).not.toBeNull();
    const time = screen.getByText('1 h left');
    expect(time.closest('[data-tone]')).toHaveAttribute('data-tone', 'valid');
    expect(screen.getByText('Valid')).toBeInTheDocument();
  });

  it('shows the last 8 characters of the token', () => {
    show(record(valid1h));

    expect(screen.getByText(`...${valid1h.slice(-8)}`)).toBeInTheDocument();
  });

  it.each(TOKEN_SOURCE_KINDS)('names the %s source', (kind) => {
    show(record(valid1h, { source: { kind } }));

    expect(screen.getByTestId('source')).not.toBeEmptyDOMElement();
  });

  it.each([
    [valid1h, '3 h lifetime'],
    [noIatNoNbf, 'lifetime unknown'],
    [noExp, 'no expiry'],
  ])('shows the total lifetime', (raw, text) => {
    show(record(raw));

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it.each([
    [expired3d, 'Expired', '3 d ago', 'expired'],
    [notYetValid, 'Not yet valid', 'in 2 h', 'future'],
  ])('marks %#: %s', (raw, word, phrase, tone) => {
    show(record(raw));

    expect(screen.getByText(word)).toBeInTheDocument();
    expect(screen.getByText(phrase).closest('[data-tone]')).toHaveAttribute('data-tone', tone);
  });

  it('says a token without exp never expires', () => {
    show(record(noExp));

    expect(screen.getByText('Never expires')).toBeInTheDocument();
  });

  it('labels an encrypted token', () => {
    show(record(jwe5Parts, { kind: 'jwe' }));

    expect(screen.getByText('Encrypted')).toBeInTheDocument();
  });

  it('is one button named by its label and status that opens the token', async () => {
    const user = userEvent.setup();
    const { onOpen, button } = show(record(valid1h));

    expect(button).toHaveAccessibleName(/Checkout session.*Valid.*1 h left/u);
    await user.click(button);

    expect(onOpen).toHaveBeenCalledWith('t1');
  });
});
