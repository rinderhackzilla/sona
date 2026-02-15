# Discover Weekly - Changelog

## [2.0.0] - 2026-02-15

### 🎉 Major Improvements

**Smart Week-Based Scheduling**
- Playlist now generates **once per week** using ISO week numbers (format: `2026-W07`)
- No more duplicate generations within the same week
- Automatic catch-up if app wasn't running on Monday

### ✨ New Features

**Background Scheduler** (`electron/discover-weekly-scheduler.ts`)
- Runs in Electron main process independently
- Calculates exact time until next Monday 00:00
- Sends IPC events to renderer for generation
- Includes startup check after 5-second delay

**Manager Service** (`src/service/discover-weekly-manager.ts`)
- `shouldGeneratePlaylist()` - Smart week-based check
- `loadPlaylist()` - Load from localStorage
- `generateAndSavePlaylist()` - Generate with force option
- `checkAndCatchUp()` - Startup catch-up logic
- `startWeeklyScheduler()` - In-renderer timer (alternative to Electron scheduler)

**Improved Hook** (`src/app/hooks/use-discover-weekly.ts`)
- One-time catch-up check on mount (prevents multiple triggers)
- 2-second delay to prioritize UI rendering
- Manual `generate()` with force flag
- Returns `weekKey` in metadata

### 🐛 Bug Fixes

- **Fixed**: Playlist regenerating every time page was opened
- **Fixed**: Multiple generations on the same day
- **Fixed**: Hourly interval causing unnecessary checks
- **Fixed**: No catch-up when app missed Monday

### 📄 Storage Changes

**New localStorage keys:**
```
discover_weekly_current_week  // "2026-W07" - Week flag
```

**Updated metadata structure:**
```typescript
interface PlaylistMetadata {
  generatedAt: string
  artistsUsed: string[]
  totalSongs: number
  weekKey: string        // NEW: ISO week format
}
```

### 🛠️ Breaking Changes

- **Removed**: `checkAndRegenerate()` function (replaced by automatic catch-up)
- **Removed**: Hourly interval check
- **Removed**: Old `shouldRegeneratePlaylist()` from service (now in manager)
- **Deleted**: `use-discover-weekly.tsx` (duplicate file)

### 📚 Documentation

- Added comprehensive documentation: `docs/DISCOVER_WEEKLY.md`
- Architecture diagrams
- Flow charts for all scenarios
- Complete API reference
- Integration guide
- Testing instructions
- Troubleshooting section

### ⬆️ Migration Guide

#### From v1.x to v2.0

**No action required for existing users!**

The new system will:
1. Detect old playlist in localStorage
2. Check if it's from current week
3. Auto-generate if needed
4. Add `weekKey` to metadata

**Optional: Enable Electron Scheduler**

Add to `electron/main.ts`:
```typescript
import { startDiscoverWeeklyScheduler } from './discover-weekly-scheduler'

app.whenReady().then(() => {
  startDiscoverWeeklyScheduler()
})
```

### 📊 Performance

- **Reduced checks**: From every hour to once per week
- **Faster startup**: Catch-up delayed by 2 seconds
- **No polling**: Event-driven architecture
- **Cached playlists**: Instant loading from localStorage

### 🔍 Testing

Simulate week change:
```javascript
localStorage.setItem('discover_weekly_current_week', '2026-W06')
location.reload()
```

### 👏 Credits

Thanks to the Sona development team for implementing smart playlist scheduling!

---

## [1.0.0] - Previous Version

### Features
- Initial Discover Weekly implementation
- Last.fm integration
- Manual generation
- localStorage caching
- Hourly regeneration check
