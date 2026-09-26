export type DetailNotice = 'alreadySaved';

export type Screen =
  | { readonly name: 'list' }
  | { readonly name: 'add' }
  | { readonly name: 'detail'; readonly id: string; readonly notice?: DetailNotice };

export interface ViewState {
  readonly screen: Screen;
  /** Scroll offset of the list, restored when coming back from a detail. */
  readonly listScroll: number;
}

export type ViewAction =
  | { readonly type: 'openAdd' }
  | {
      readonly type: 'openDetail';
      readonly id: string;
      readonly notice?: DetailNotice;
      readonly listScroll?: number;
    }
  | { readonly type: 'back' }
  | { readonly type: 'tokenRemovedExternally'; readonly id: string };

export const INITIAL_VIEW: ViewState = { screen: { name: 'list' }, listScroll: 0 };

export function viewReducer(state: ViewState, action: ViewAction): ViewState {
  if (action.type === 'openAdd') return { ...state, screen: { name: 'add' } };
  if (action.type === 'back') return { ...state, screen: { name: 'list' } };
  if (action.type === 'openDetail') {
    const screen: Screen =
      action.notice === undefined
        ? { name: 'detail', id: action.id }
        : { name: 'detail', id: action.id, notice: action.notice };
    return { screen, listScroll: action.listScroll ?? state.listScroll };
  }
  const isOpen = state.screen.name === 'detail' && state.screen.id === action.id;
  return isOpen ? { ...state, screen: { name: 'list' } } : state;
}
