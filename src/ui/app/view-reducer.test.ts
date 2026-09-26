import { INITIAL_VIEW, viewReducer, type ViewState } from './view-reducer';

describe('viewReducer (data-model "State transitions")', () => {
  it('starts on the list at the top', () => {
    expect(INITIAL_VIEW).toEqual({
      screen: { name: 'list' },
      listScroll: 0,
      lastOpenedId: null,
      returnTo: null,
    });
  });

  it('opens the add screen', () => {
    expect(viewReducer(INITIAL_VIEW, { type: 'openAdd' }).screen).toEqual({ name: 'add' });
  });

  it('opens a detail, optionally with a notice, remembering the list scroll position', () => {
    const state = viewReducer(INITIAL_VIEW, {
      type: 'openDetail',
      id: 't1',
      notice: 'alreadySaved',
      listScroll: 240,
    });

    expect(state).toEqual({
      screen: { name: 'detail', id: 't1', notice: 'alreadySaved' },
      listScroll: 240,
      lastOpenedId: 't1',
      returnTo: null,
    });
  });

  it('goes back to the list keeping the remembered scroll position', () => {
    const detail: ViewState = {
      screen: { name: 'detail', id: 't1' },
      listScroll: 240,
      lastOpenedId: 't1',
      returnTo: null,
    };

    expect(viewReducer(detail, { type: 'back' })).toEqual({
      screen: { name: 'list' },
      listScroll: 240,
      lastOpenedId: 't1',
      returnTo: null,
    });
  });

  it('returns to the list when the open token is removed elsewhere', () => {
    const detail: ViewState = {
      screen: { name: 'detail', id: 't1' },
      listScroll: 0,
      lastOpenedId: 't1',
      returnTo: null,
    };

    expect(viewReducer(detail, { type: 'tokenRemovedExternally', id: 't1' }).screen).toEqual({
      name: 'list',
    });
  });

  it('ignores removals of other tokens', () => {
    const detail: ViewState = {
      screen: { name: 'detail', id: 't1' },
      listScroll: 0,
      lastOpenedId: 't1',
      returnTo: null,
    };

    expect(viewReducer(detail, { type: 'tokenRemovedExternally', id: 't2' })).toBe(detail);
  });

  it('opens info from any screen, remembering that screen (US5 AS3)', () => {
    const detail: ViewState = {
      screen: { name: 'detail', id: 't1' },
      listScroll: 0,
      lastOpenedId: 't1',
      returnTo: null,
    };

    const state = viewReducer(detail, { type: 'openInfo' });

    expect(state.screen).toEqual({ name: 'info' });
    expect(state.returnTo).toEqual({ name: 'detail', id: 't1' });
  });

  it('back from info returns to the screen it was opened from, not always the list', () => {
    const info = viewReducer(INITIAL_VIEW, { type: 'openAdd' });
    const state = viewReducer(info, { type: 'openInfo' });

    const back = viewReducer(state, { type: 'back' });

    expect(back.screen).toEqual({ name: 'add' });
    expect(back.returnTo).toBeNull();
  });

  it('back from info with nothing remembered falls back to the list', () => {
    const state: ViewState = {
      screen: { name: 'info' },
      listScroll: 0,
      lastOpenedId: null,
      returnTo: null,
    };

    expect(viewReducer(state, { type: 'back' }).screen).toEqual({ name: 'list' });
  });
});
