import { jwe5Parts, NOW, over64KiB, valid1h } from '../../../tests/fixtures/tokens';
import {
  FixedClock,
  InMemoryVaultRepository,
  SequentialIdGenerator,
} from '../../../tests/support/in-memory-ports';
import { addToken } from './add-token';

function setup() {
  const repository = new InMemoryVaultRepository();
  const deps = { repository, clock: new FixedClock(NOW), ids: new SequentialIdGenerator() };
  return { repository, deps };
}

describe('addToken', () => {
  it('saves a new manual token first in the vault with its default label', async () => {
    const { repository, deps } = setup();
    repository.state = {
      tokens: [
        {
          id: 'old',
          raw: 'a.b.c',
          kind: 'jws',
          label: 'Old',
          source: { kind: 'manual' },
          addedAt: 0,
        },
      ],
    };

    const result = await addToken(`Bearer ${valid1h}`, { kind: 'manual' }, deps);

    const record = {
      id: 'id-1',
      raw: valid1h,
      kind: 'jws',
      label: '8f2c-41',
      source: { kind: 'manual' },
      addedAt: NOW,
    };
    expect(result).toEqual({ kind: 'added', record });
    expect(repository.state.tokens.map((token) => token.id)).toEqual(['id-1', 'old']);
  });

  it('does not save a duplicate and points to the existing token (FR-005)', async () => {
    const { repository, deps } = setup();
    await addToken(valid1h, { kind: 'manual' }, deps);

    const result = await addToken(`  ${valid1h}\n`, { kind: 'manual' }, deps);

    expect(result).toEqual({ kind: 'duplicate', id: 'id-1' });
    expect(repository.state.tokens).toHaveLength(1);
  });

  it('saves an encrypted token as recognized but unsupported (FR-004)', async () => {
    const { repository, deps } = setup();

    const result = await addToken(jwe5Parts, { kind: 'manual' }, deps);

    expect(result).toMatchObject({
      kind: 'unsupportedJwe',
      record: { kind: 'jwe', raw: jwe5Parts, label: 'Token 1' },
    });
    expect(repository.state.tokens).toHaveLength(1);
  });

  it('rejects malformed input and saves nothing', async () => {
    const { repository, deps } = setup();

    await expect(addToken('not-a-token', { kind: 'manual' }, deps)).resolves.toEqual({
      kind: 'invalid',
      error: { kind: 'wrongPartCount', count: 1 },
    });
    expect(repository.saves).toBe(0);
  });

  it('rejects a token over 64 KiB', async () => {
    const { deps } = setup();

    await expect(addToken(over64KiB, { kind: 'manual' }, deps)).resolves.toMatchObject({
      kind: 'invalid',
      error: { kind: 'tooLarge' },
    });
  });

  it('reports a storage failure without claiming success', async () => {
    const { repository, deps } = setup();
    repository.failNextSave = { ok: false, reason: 'quota' };

    await expect(addToken(valid1h, { kind: 'manual' }, deps)).resolves.toEqual({
      kind: 'saveFailed',
      reason: 'quota',
    });
    expect(repository.state.tokens).toHaveLength(0);
  });
});
