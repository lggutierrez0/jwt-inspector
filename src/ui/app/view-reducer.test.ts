import { INITIAL_VIEW, viewReducer, type ViewState } from './view-reducer';

describe('viewReducer (data-model "State transitions")', () => {
  it('starts on the list at the top', () => {
    expect(INITIAL_VIEW).toEqual({ screen: { name: 'list' }, listScroll: 0 });
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
    });
  });

  it('goes back to the list keeping the remembered scroll position', () => {
    const detail: ViewState = { screen: { name: 'detail', id: 't1' }, listScroll: 240 };

    expect(viewReducer(detail, { type: 'back' })).toEqual({
      screen: { name: 'list' },
      listScroll: 240,
    });
  });

  it('returns to the list when the open token is removed elsewhere', () => {
    const detail: ViewState = { screen: { name: 'detail', id: 't1' }, listScroll: 0 };

    expect(viewReducer(detail, { type: 'tokenRemovedExternally', id: 't1' }).screen).toEqual({
      name: 'list',
    });
  });

  it('ignores removals of other tokens', () => {
    const detail: ViewState = { screen: { name: 'detail', id: 't1' }, listScroll: 0 };

    expect(viewReducer(detail, { type: 'tokenRemovedExternally', id: 't2' })).toBe(detail);
  });
});
