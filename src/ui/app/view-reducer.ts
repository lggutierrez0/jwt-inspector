export type DetailNotice = 'alreadySaved';

export type Screen =
  | { readonly name: 'list' }
  | { readonly name: 'add' }
  | { readonly name: 'detail'; readonly id: string; readonly notice?: DetailNotice }
  | { readonly name: 'info' };

export interface ViewState {
  readonly screen: Screen;
  /** Scroll offset of the list, restored when coming back from a detail. */
  readonly listScroll: number;
  /** Token opened last, so going back can return focus to its line. */
  readonly lastOpenedId: string | null;
  /** Screen `info` was opened from, so its `back` returns there (US5 AS3). */
  readonly returnTo: Screen | null;
}

export type ViewAction =
  | { readonly type: 'openAdd' }
  | {
      readonly type: 'openDetail';
      readonly id: string;
      readonly notice?: DetailNotice;
      readonly listScroll?: number;
    }
  | { readonly type: 'openInfo' }
  | { readonly type: 'back' }
  | { readonly type: 'tokenRemovedExternally'; readonly id: string };

export const INITIAL_VIEW: ViewState = {
  screen: { name: 'list' },
  listScroll: 0,
  lastOpenedId: null,
  returnTo: null,
};

export function viewReducer(state: ViewState, action: ViewAction): ViewState {
  if (action.type === 'openAdd') return { ...state, screen: { name: 'add' }, returnTo: null };
  if (action.type === 'openInfo') {
    return { ...state, screen: { name: 'info' }, returnTo: state.screen };
  }
  if (action.type === 'back') {
    const screen =
      state.screen.name === 'info'
        ? (state.returnTo ?? { name: 'list' })
        : { name: 'list' as const };
    return { ...state, screen, returnTo: null };
  }
  if (action.type === 'openDetail') {
    const screen: Screen =
      action.notice === undefined
        ? { name: 'detail', id: action.id }
        : { name: 'detail', id: action.id, notice: action.notice };
    return {
      screen,
      listScroll: action.listScroll ?? state.listScroll,
      lastOpenedId: action.id,
      returnTo: null,
    };
  }
  const isOpen = state.screen.name === 'detail' && state.screen.id === action.id;
  return isOpen ? { ...state, screen: { name: 'list' }, returnTo: null } : state;
}
