# Changelog

All notable changes to Sona will be documented in this file.

## [Unreleased]

---

## [0.21.1] - 2026-09-12

### What's New

#### Daytime Mood Mix Optimization:
- Switched candidate gathering to parallel execution using `Promise.allSettled`, reducing generation latency by up to 50%.
- Fixed missing user favorites in candidate selection by properly resolving the starred song list.

#### Player Performance & Render Throttling:
- Throttled player progress animation frame state updates to at most once every 200ms, reducing CPU and battery usage during playback by over 90% while maintaining smooth slider interactions.
- Memoized `MiniWaveform` component to prevent redundant component re-renders on playback progress ticks.
- Replaced per-frame `getBoundingClientRect()` layout thrashing in `RailCoverVisualizer` with a responsive `ResizeObserver`, eliminating forced synchronous reflows inside the animation loop.
- Automatically paused marquee text scrolling in `MarqueeTitle` when the window or tab is hidden (`document.hidden`), preventing background CSS animation CPU draw.

#### Download Management & Observer Architecture:
- Centralized Electron desktop download IPC listeners (`downloadCompletedListener`, `downloadFailedListener`) in a new top-level `DownloadObserver` mounted in `App.tsx`.
- Refactored `useDownload` hook to dispatch download requests without registering redundant local event listeners, preventing duplicate toast notifications and memory leaks.
- Updated electron preload download event listeners to persistent handlers (`ipcRenderer.on`) instead of single-fire listeners (`ipcRenderer.once`).

#### Bundle & Code-Splitting Architecture:
- Lazy-loaded `DiscoverWeekly`, `ThisIsArtistPage`, and `Top50Year` routes with Suspense fallbacks, removing their dependencies from the initial application entry chunk.
- Resolved cross-platform manual chunking on Windows by normalizing path separators, eliminating bloated 550 kB+ bundle chunks and structuring vendor libraries into cohesive packages (`vendor-react`, `vendor-ui`, `vendor-tanstack`, `vendor-markdown`, `vendor-forms`, etc.).
- Pruned 5 unused heavy npm dependencies (`butterchurn`, `butterchurn-presets`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-hover-card`, `@radix-ui/react-menubar`).

#### Codebase Cleanup & Pruning:
- Deleted 30 orphaned and dead files including unreferenced UI wrappers (`aspect-ratio`, `breadcrumb`, `hover-card`, `menubar`, `numeric-input`, `sidebar`, `table`), legacy podcast hooks (`use-podcast-options`, `use-podcast-playing`, `use-episode-progress`), obsolete radio table headers (`radio-title`), unused utility hooks, table column definitions, and dead components.

### Fixes

#### UI & Styling Consistency:
- Harmonized `DaytimeMoodCard` border styling across wide and narrow layouts with the rest of the dashboard cards by removing custom persistent colored active borders (`border-primary/50` and box-shadow glow), utilizing consistent `sona-panel` subtle hover states.
- Cleaned up redundant outer container wrappers in narrow mode for `DaytimeMoodCard` to align with `SecondaryTileFrame` layout standards.
- Aligned corner radius tokens across dialogs, alerts, textareas, context menus, and dashboard edit cards with the design system tokens (`--radius-surface`, `--radius-control`, `--radius-control-sm`).
- Fixed incorrect toast status methods and message keys in `radios/form-dialog` and `playlist/form-dialog`.
- Localized `PlaylistSavedDialog` across English and German translation files.

#### React & Hook Compliance:
- Fixed a React Hook rule violation in `backdrop.tsx` where an early return preceded `useMemo`, `useState`, and `useEffect`, preventing potential crashes when toggling Focus mode.
- Corrected TypeScript types on `IDashboardLayoutSettings` to support nullable slots, eliminating all `as any` type casts across home dashboard slot handlers.
- Resolved all Biome exhaustive dependency warnings in `daytime-mood-card.tsx` and `progress.tsx` cleanly without disabling lint rules or using void operators.
- Resolved all Biome lint errors and removed unused imports and variables across settings and player components.

---

## [0.21.0] - 2026-07-17

### What's New

#### Search & Resilient Lyrics Lookup:
- Search now ranks artists, albums, and songs by relevance before showing results, with stronger matches and higher-result artists/albums appearing first.
- Search sections now pull a larger candidate pool internally while keeping the visible result list compact and readable.
- Synced lyrics lookup is now more resilient by trying precise and relaxed LRCLIB matches before falling back to plain lyrics.

#### Offline Scrobble Queue & Outage Prevention:
- Integrated a persistent local storage cache for failed scrobbles. During network or server outages, scrobbles are queued and automatically retried with their original listening timestamps when connection is restored (either on app startup or upon the next successful scrobble).

#### Flexible "On This Day" (Jubiläum):
- Redesigned the anniversary algorithm to query all years from 1 to 50 concurrently. It prioritizes exact calendar week anniversaries (±5 days from today), and features singular/plural grammatical localization (e.g., "Vor 1 Jahr" vs. "Vor X Jahren").

#### Playlist Page Overhaul & Management:
- Added a header action button to toggle visibility of auto-imported playlists.
- Introduced a select checkbox column on the left to mark active playlists to keep.
- Removed numbering, comments, and public status columns from the playlists table.
- Completely removed public/private configuration options from create/edit playlist dialogs, setting the default to private.

#### Playlist Cover Recalculation:
- Added a context menu action "Cover neu berechnen" to recalculate playlist cover art on the server, while invalidating the local browser Cache Storage (`'images'`) for immediate, flicker-free reloading.

#### UI & Layout Enhancements:
- Simplified the full-screen queue to show only artist and song name, removed metadata text shadows in full-screen lyrics, and ensured the album art in full-screen lyrics is perfectly square.
- Made the Now Playing cover art in the right sidebar larger by utilizing full sidebar width (`aspect-square w-full`), and made the sidebar itself 10px narrower (`410px` / `440px`) to maximize main panel display space.
- Set `staleTime` for the "Recently Added" query to `0` and enabled `refetchOnWindowFocus: true` to ensure new albums scan and appear instantly when the app is focused.
- Redesigned the Recently Added box to display `56px` cover arts with `p-2.5` padding and a fixed gap to fit the container height perfectly without gaps or vertical stretching.

### Fixes

#### Playlist Table Interactions:
- Prevented click and double-click event propagation on the select checkbox column to stop double-clicks from playing the playlist.
- Fixed a React.memo rendering block in table cells, ensuring checked/unchecked checkbox states update instantly.

#### Search & Metadata Matching:
- Fixed empty or irrelevant zero-result artists/albums appearing in search results.
- Fixed active Lyrics and Queue control icons so they keep the correct accent color on hover.
- Fixed synced lyrics getting stuck on stale plain-text cache entries after enabling synced lyrics.
- Fixed packaged Electron builds failing to reliably load LRCLIB lyrics by falling back to the main-process fetch proxy.
- Fixed LRCLIB lookups being too strict when album or duration metadata differs slightly from the external lyrics database.

---

## Previous Releases

See [GitHub Releases](https://github.com/rinderhackzilla/sona/releases) for full release history.
