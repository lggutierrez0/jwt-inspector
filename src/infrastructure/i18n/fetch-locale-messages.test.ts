import { loadLocaleMessages } from './fetch-locale-messages';

function stubFetch(response: Response) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
}

describe('loadLocaleMessages', () => {
  it('fetches the built messages.json for a locale through the extension URL', async () => {
    const body = { extName: { message: 'JWT Inspector' } };
    const fetchSpy = stubFetch(new Response(JSON.stringify(body), { status: 200 }));

    await expect(loadLocaleMessages('es')).resolves.toEqual(body);

    expect(fetchSpy).toHaveBeenCalledWith(new URL('/_locales/es/messages.json', location.href));
    fetchSpy.mockRestore();
  });

  it('rejects when the locale file cannot be fetched', async () => {
    const fetchSpy = stubFetch(new Response(null, { status: 404 }));

    await expect(loadLocaleMessages('en')).rejects.toThrow(/404/u);
    fetchSpy.mockRestore();
  });
});
