/** Result of a user action as the UI shows it: done, or a message saying what went wrong. */
export type ActionOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };
