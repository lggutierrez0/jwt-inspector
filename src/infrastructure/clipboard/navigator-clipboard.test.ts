import { NavigatorClipboard } from './navigator-clipboard';

describe('NavigatorClipboard', () => {
  it('writes through navigator.clipboard', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();

    await expect(new NavigatorClipboard().writeText('a.b.c')).resolves.toEqual({ ok: true });
    expect(writeText).toHaveBeenCalledWith('a.b.c');
  });

  it('reports a rejected write as a value', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('NotAllowedError'));

    await expect(new NavigatorClipboard().writeText('a.b.c')).resolves.toEqual({ ok: false });
  });
});
