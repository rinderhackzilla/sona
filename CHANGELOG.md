# Changelog

All notable changes to Sona will be documented in this file.

## [Unreleased]

### Added

#### Discover Weekly Enhancements

- **Intelligent Week-Based Scheduling**: Playlists now generate once per week using ISO week numbers (e.g., "2026-W07")
- **Automatic Monday Generation**: Electron background scheduler triggers playlist generation every Monday at 00:00
- **Smart Catch-Up System**: If app wasn't running on Monday, playlist automatically generates on next startup
- **Desktop Notifications**: Shows notification when new playlist is generated
- **Manual Regeneration**: Users can force regenerate playlist anytime via "Refresh" button
- **Persistent Storage**: Playlists cached in localStorage with metadata (generation date, artists used, week key)
- **IPC Integration**: Electron Main Process communicates with Renderer Process for seamless scheduling

#### New Components

- `src/service/discover-weekly-manager.ts` - Week-based scheduling and persistence manager
- `electron/discover-weekly-scheduler.ts` - Background scheduler for Electron Main Process
- `src/app/observers/discover-weekly-observer.tsx` - IPC event handler for scheduled generation
- `docs/discover-weekly-scheduling.md` - Comprehensive documentation

### Changed

- **Discover Weekly Hook**: Refactored `use-discover-weekly.ts` to use new manager system
- **Generation Logic**: Removed aggressive hourly checks, replaced with event-driven architecture
- **Storage Keys**: Added `discover_weekly_current_week` flag for quick week validation
- **Metadata**: Enhanced with `weekKey` field for precise tracking

### Fixed

- **Multiple Generations**: Prevents generating playlist multiple times in same week
- **Performance**: Eliminated unnecessary checks when opening Discover Weekly page or Home
- **State Persistence**: Playlists survive app restarts and maintain correct week association

### Technical Details

**Before:**
- Generated on every page load
- Checked every hour if Monday
- No week tracking
- Could generate multiple times per week

**After:**
- Generates once per week (Monday 00:00)
- Week-based validation with ISO week numbers
- Catch-up on startup if missed
- Background scheduler in Electron Main Process
- Event-driven IPC communication

**Storage:**
```javascript
localStorage:
  - discover_weekly_playlist: Song[]
  - discover_weekly_metadata: {
      generatedAt: ISO timestamp,
      artistsUsed: string[],
      totalSongs: number,
      weekKey: "YYYY-Wnn"
    }
  - discover_weekly_current_week: "YYYY-Wnn"
```

### Migration

Existing playlists automatically gain `weekKey` on next generation. No user action required.

---

## Previous Releases

See [GitHub Releases](https://github.com/rinderhackzilla/sona/releases) for full release history.
