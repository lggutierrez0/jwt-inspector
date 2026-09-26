# Contract: Persisted vault, schema v1

The on-disk format is a public contract of the extension: once released, every later version
MUST read it (through a migration) without data loss. Changing it requires a new version number
and a migration with tests.

- **Area**: `storage.local` (extension-private, not synced).
- **Key**: `vault` (WXT item `local:vault`), version metadata managed by WXT (`vault$` meta key).
- **Version**: `1`.

## Shape

```json
{
  "tokens": [
    {
      "id": "0b6f3c1e-8a52-4d0e-9d7a-2f4c1f5e9a10",
      "raw": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2ln",
      "kind": "jws",
      "label": "123",
      "source": { "kind": "manual" },
      "addedAt": 1790380800000
    }
  ]
}
```

## Validation on read (valibot schema)

| Field     | Rule                                                                                 |
| --------- | ------------------------------------------------------------------------------------ |
| `tokens`  | array; missing item → fallback `{ "tokens": [] }`                                    |
| `id`      | non-empty string                                                                     |
| `raw`     | non-empty string, ≤ 64 KiB                                                           |
| `kind`    | `"jws"` or `"jwe"`                                                                   |
| `label`   | string, 1–60 chars after trim                                                        |
| `source`  | object with `kind` in the TokenSource list (data-model.md); extra fields are strings |
| `addedAt` | finite number ≥ 0                                                                    |

Invalid records are dropped from the in-memory view and reported once through the UI error
channel; the stored item is rewritten only on the next user change (no silent destructive
write on read). Duplicate `id` or `raw`: first occurrence wins.

## Guarantees

- Never contains secrets, keys or passphrases (FR-021).
- Order in the array is display order (most recent first).
- Feature 008 wraps this object in an encrypted envelope as schema v2; v1 → v2 migration only
  encrypts, it does not restructure records.
