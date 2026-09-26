import { fakeBrowser } from 'wxt/testing/fake-browser';

import { BrowserLocalePreferenceRepository } from './browser-locale-preference-repository';

describe('BrowserLocalePreferenceRepository (FR-029)', () => {
  it('has no override by default', async () => {
    await expect(new BrowserLocalePreferenceRepository().load()).resolves.toBeNull();
  });

  it('round-trips a saved locale', async () => {
    const repository = new BrowserLocalePreferenceRepository();

    await repository.save('es');

    await expect(repository.load()).resolves.toBe('es');
    await expect(new BrowserLocalePreferenceRepository().load()).resolves.toBe('es');
  });

  it('clears the override when saved as null', async () => {
    const repository = new BrowserLocalePreferenceRepository();
    await repository.save('es');

    await repository.save(null);

    await expect(repository.load()).resolves.toBeNull();
  });

  it('never writes to storage.sync', async () => {
    await new BrowserLocalePreferenceRepository().save('es');

    await expect(fakeBrowser.storage.sync.get(null)).resolves.toEqual({});
  });
});
