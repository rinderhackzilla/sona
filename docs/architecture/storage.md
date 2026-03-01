# Storage Conventions

This project uses a single access layer for browser storage:

- Use `src/utils/safe-storage.ts` for all local storage interactions.
- Do not call `localStorage` or `window.localStorage` directly in feature code.

## Why

- Prevent runtime crashes in environments where storage is unavailable.
- Keep error handling consistent.
- Make key usage discoverable and easier to refactor.

## Approved API

Use these helpers:

- `safeStorageGet(key)`
- `safeStorageSet(key, value)`
- `safeStorageRemove(key)`
- `safeStorageGetBoolean(key, fallback)`

For structured playlist persistence, use:

- `src/service/playlist-storage.ts`
  - `readStoredJson`
  - `writeStoredJson`
  - `readStoredPlaylist`
  - `writeStoredPlaylist`
  - `readStoredString`
  - `writeStoredString`

## Key Ownership

Keep keys close to their domain and export shared keys from dedicated files.

- Session/theme/fullscreen keys:
  - `src/utils/session-storage-keys.ts`
- EQ state key:
  - `src/app/audio/eq-state.ts`
- Image metadata cache key:
  - `src/cache/image.ts`
- Listening memory keys:
  - `src/utils/listening-memory.ts`

## Rules

1. New storage key must be declared as a constant.
2. Reused cross-feature keys must live in a shared constants module.
3. JSON parse/write must be wrapped through helpers with safe fallback behavior.
4. Route loaders and UI components follow the same storage rules as services.

## Migration Checklist

When touching old code:

1. Replace direct `localStorage` usage with `safe-storage` helpers.
2. If storing playlist + metadata pairs, move to `playlist-storage` helpers.
3. Keep behavior unchanged, then run:
   - `pnpm biome lint`
   - `pnpm tsc --noEmit`
