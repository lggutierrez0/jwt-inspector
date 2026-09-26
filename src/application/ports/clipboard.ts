export interface Clipboard {
  writeText(text: string): Promise<{ readonly ok: boolean }>;
}
