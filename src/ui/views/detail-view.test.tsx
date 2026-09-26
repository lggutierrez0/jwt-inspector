import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { TokenRecord } from '@/domain/vault/token-record';

import {
  expBeforeIat,
  expired3d,
  invalidTimeClaims,
  jwe5Parts,
  noExp,
  notYetValid,
  personalClaimsPayload,
  valid1h,
  withPersonalClaims,
} from '../../../tests/fixtures/tokens';
import { RecordingClipboard } from '../../../tests/support/in-memory-ports';
import { renderWithProviders } from '../../../tests/support/render';
import { DetailView } from './detail-view';

const record = (raw: string, overrides: Partial<TokenRecord> = {}): TokenRecord => ({
  id: 't1',
  raw,
  kind: 'jws',
  label: 'Checkout session',
  source: { kind: 'manual' },
  addedAt: 0,
  ...overrides,
});

function show(raw: string, overrides: Partial<TokenRecord> = {}) {
  const onBack = vi.fn<() => void>();
  const view = renderWithProviders(<DetailView record={record(raw, overrides)} onBack={onBack} />);
  return { ...view, onBack };
}

const follows = (first: Element, second: Element) =>
  (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

function showWithClipboard(raw: string) {
  const clipboard = new RecordingClipboard();
  renderWithProviders(<DetailView record={record(raw)} onBack={vi.fn<() => void>()} />, {
    clipboard,
  });
  return { clipboard, user: userEvent.setup() };
}

describe('DetailView (US1, FR-013)', () => {
  it('opens with the label and RFC-style front matter', () => {
    show(valid1h);

    expect(screen.getByText('Checkout session')).toBeInTheDocument();
    const front = screen.getByRole('region', { name: 'Token summary' });
    expect(within(front).getByText('auth.example.test')).toBeInTheDocument();
    expect(within(front).getByText('8f2c-41')).toBeInTheDocument();
    expect(within(front).getByText('api')).toBeInTheDocument();
  });

  it('answers "valid, and for how long" first', () => {
    show(valid1h);

    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText('1 h left')).toBeInTheDocument();
  });

  it('presents the sections in the FR-013 order', () => {
    show(valid1h);

    const status = screen.getByText('Valid');
    const timing = screen.getByText('Issued:');
    const ruler = screen.getByRole('figure', { name: /Lifetime/u });
    const headings = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual(['1. Structure', '2. Header', '3. Payload claims', '4. JSON']);
    const structure = screen.getByRole('heading', { name: '1. Structure' });
    expect(follows(status, timing)).toBe(true);
    expect(follows(timing, ruler)).toBe(true);
    expect(follows(ruler, structure)).toBe(true);
  });

  it('shows every timing claim as relative and absolute time with the time zone', () => {
    show(valid1h);

    const timing = screen.getByText('Issued:').closest('dl')!;
    expect(within(timing).getByText(/2 hours ago/u)).toBeInTheDocument();
    expect(within(timing).getByText(/in 1 hour/u)).toBeInTheDocument();
    expect(within(timing).getAllByText(/UTC/u).length).toBeGreaterThanOrEqual(2);
  });

  it('marks an expired token and how long ago it expired', () => {
    show(expired3d);

    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText('3 d ago')).toBeInTheDocument();
  });

  it('marks a token that is not valid yet and when it will be', () => {
    show(notYetValid);

    expect(screen.getByText('Not yet valid')).toBeInTheDocument();
    expect(screen.getByText('in 2 h')).toBeInTheDocument();
  });

  it('says a token without exp never expires and draws no ruler', () => {
    show(noExp);

    expect(screen.getByText('Never expires')).toBeInTheDocument();
    expect(screen.queryByRole('figure', { name: /Lifetime/u })).not.toBeInTheDocument();
  });

  it('warns about time claims it cannot trust', () => {
    show(invalidTimeClaims);

    expect(screen.getByText(/The "exp" claim isn't a valid date/u)).toBeInTheDocument();
    expect(screen.getByText(/The "iat" claim isn't a valid date/u)).toBeInTheDocument();
  });

  it('warns when exp is earlier than iat', () => {
    show(expBeforeIat);

    expect(screen.getByText('The "exp" claim is earlier than "iat".')).toBeInTheDocument();
  });

  it('masks the signature and every sensitive claim by default (constitution III, FR-015)', () => {
    const { container } = show(withPersonalClaims);

    const [, , signature] = withPersonalClaims.split('.');
    expect(container).not.toHaveTextContent(signature!);
    expect(container).not.toHaveTextContent('maria@example.test');
    expect(container).not.toHaveTextContent('María Example');
    expect(container).not.toHaveTextContent('k-123');
    expect(screen.getByRole('button', { name: 'reveal signature' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'reveal email' })).toBeInTheDocument();
  });

  it('shows header parameters and payload claims with their explanations', () => {
    show(valid1h);

    expect(screen.getByText('Algorithm')).toBeInTheDocument();
    expect(screen.getByText('Expiration Time')).toBeInTheDocument();
    expect(screen.getByText('RFC 7519, Section 4.1.4')).toBeInTheDocument();
  });

  it('shows the encoded segments of the token', () => {
    show(valid1h);

    const [header, payload] = valid1h.split('.');
    const structure = screen.getByRole('region', { name: '1. Structure' });
    expect(within(structure).getByText(header!)).toBeInTheDocument();
    expect(within(structure).getByText(payload!)).toBeInTheDocument();
  });

  it('explains that encrypted tokens are not supported yet and shows their header', () => {
    show(jwe5Parts, { kind: 'jwe' });

    expect(screen.getByText(/encrypted tokens isn't supported yet/u)).toBeInTheDocument();
    expect(screen.getByText('"enc"')).toBeInTheDocument();
    expect(screen.getByText('A256GCM')).toBeInTheDocument();
  });

  it('shows the already-saved notice when asked to', () => {
    renderWithProviders(
      <DetailView record={record(valid1h)} notice="alreadySaved" onBack={vi.fn<() => void>()} />,
    );

    expect(screen.getByText(/This token was already saved/u)).toBeInTheDocument();
  });

  it('goes back to the list', () => {
    const { onBack } = show(valid1h);

    screen.getByRole('button', { name: 'back' }).click();

    expect(onBack).toHaveBeenCalledOnce();
  });

  describe('copying (US3, FR-016)', () => {
    it('copies the whole token', async () => {
      const { clipboard, user } = showWithClipboard(valid1h);

      await user.click(screen.getByRole('button', { name: 'copy token' }));

      expect(clipboard.written).toEqual([valid1h]);
    });

    it('copies the header and payload JSON unmasked', async () => {
      const { clipboard, user } = showWithClipboard(withPersonalClaims);

      await user.click(screen.getByRole('button', { name: 'copy header JSON' }));
      await user.click(screen.getByRole('button', { name: 'copy payload JSON' }));

      expect(clipboard.written).toEqual([
        JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2),
        JSON.stringify(personalClaimsPayload, null, 2),
      ]);
    });

    it('copies a single claim value, even a masked one', async () => {
      const { clipboard, user } = showWithClipboard(withPersonalClaims);

      await user.click(screen.getByRole('button', { name: 'copy email' }));
      await user.click(screen.getByRole('button', { name: 'copy roles' }));

      expect(clipboard.written).toEqual(['maria@example.test', '["admin"]']);
    });
  });

  it('masks revealed values again when the detail is reopened (US3 AS4)', async () => {
    const user = userEvent.setup();
    const first = show(withPersonalClaims);
    await user.click(screen.getByRole('button', { name: 'reveal email' }));
    expect(screen.getByText('maria@example.test')).toBeInTheDocument();
    first.unmount();

    show(withPersonalClaims);

    expect(screen.queryByText('maria@example.test')).not.toBeInTheDocument();
  });
});
