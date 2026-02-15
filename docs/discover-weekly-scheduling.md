# Discover Weekly Scheduling System

## Overview

The Discover Weekly feature automatically generates personalized playlists based on your Last.fm listening history. The system uses intelligent week-based scheduling to ensure playlists are generated once per week, every Monday at 00:00.

## Architecture

### Components

1. **Service Layer** (`src/service/`)
   - `discover-weekly.ts` - Core playlist generation logic
   - `discover-weekly-manager.ts` - Scheduling, persistence, and week-based tracking

2. **Frontend Hook** (`src/app/hooks/`)
   - `use-discover-weekly.ts` - React hook for UI integration

3. **Electron Integration** (`electron/`)
   - `discover-weekly-scheduler.ts` - Background scheduler (Main Process)
   - `src/app/observers/discover-weekly-observer.tsx` - IPC event handler (Renderer Process)

4. **Storage**
   - `localStorage` for playlist data, metadata, and week flags

## How It Works

### 1. Week-Based Tracking

The system uses ISO week numbers (format: `"2026-W07"`) to track when playlists were generated:

```typescript
function getISOWeek(date: Date): string {
  // Returns format: "2026-W07"
}
```

**Benefits:**
- Prevents multiple generations in the same week
- Works across time zones
- Survives app restarts

### 2. Generation Triggers

#### A. Automatic Monday Generation (Electron)

**Main Process** (runs 24/7, even when app is closed):
```typescript
// electron/discover-weekly-scheduler.ts
startDiscoverWeeklyScheduler()
```

- Calculates time until next Monday 00:00
- Sends IPC event to Renderer Process
- Reschedules for following Monday

**Renderer Process**:
```typescript
// src/app/observers/discover-weekly-observer.tsx
window.electron.ipcRenderer.on('discover-weekly:schedule-event', handler)
```

- Receives Monday trigger
- Checks if generation is needed
- Generates playlist if required
- Shows notification

#### B. Catch-Up on Startup

If the app wasn't running on Monday, the system catches up:

```typescript
// src/app/hooks/use-discover-weekly.ts
useEffect(() => {
  const performCatchup = async () => {
    if (shouldGeneratePlaylist()) {
      await checkAndCatchUp(config)
    }
  }
  
  setTimeout(performCatchup, 2000) // Delay to not block render
}, [])
```

**Logic:**
1. Check stored `weekKey` vs current week
2. If different → generate new playlist
3. If same → load existing playlist

#### C. Manual Generation

Users can force regeneration:

```typescript
const { generate } = useDiscoverWeekly()

// Forces generation regardless of week
await generate() // force=true
```

### 3. Storage Strategy

**Three localStorage keys:**

```typescript
// Playlist data
localStorage.setItem('discover_weekly_playlist', JSON.stringify(songs))

// Metadata
localStorage.setItem('discover_weekly_metadata', JSON.stringify({
  generatedAt: '2026-02-15T00:00:00Z',
  artistsUsed: ['Artist 1', 'Artist 2'],
  totalSongs: 60,
  weekKey: '2026-W07'
}))

// Week flag (for quick checks)
localStorage.setItem('discover_weekly_current_week', '2026-W07')
```

### 4. Generation Flow

```
┌─────────────────────┐
│  Monday 00:00       │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ Electron Scheduler  │  (Main Process)
│ Detects Monday      │
└──────────┬──────────┘
           │
           │ IPC Event
           v
┌─────────────────────┐
│ DiscoverWeekly      │  (Renderer Process)
│ Observer            │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ shouldGenerate?     │
│ Check weekKey       │
└──────────┬──────────┘
           │
           v
    ┌──────┴──────┐
    │             │
   YES           NO
    │             │
    v             v
┌─────────┐  ┌────────┐
│Generate │  │ Skip   │
│Playlist │  │        │
└─────────┘  └────────┘
    │
    v
┌─────────────────────┐
│ Save to localStorage│
│ - Playlist          │
│ - Metadata          │
│ - Week Flag         │
└─────────────────────┘
    │
    v
┌─────────────────────┐
│ Show Notification   │
└─────────────────────┘
```

## Configuration

### Required Settings

In app settings (⚙️ → Integrations):

```typescript
{
  lastfm: {
    username: 'your-username',
    apiKey: 'your-api-key'
  }
}
```

### Optional Parameters

```typescript
const config = {
  targetArtists: 15,      // Number of similar artists to find
  songsPerArtist: 4,      // Songs per artist (total: 60)
}
```

## API Reference

### `discover-weekly-manager.ts`

#### `shouldGeneratePlaylist(): boolean`
Checks if playlist needs generation for current week.

**Returns:** `true` if:
- No playlist exists
- Current week differs from stored week
- Week flag is missing/invalid

#### `loadPlaylist(): { playlist, metadata }`
Loads playlist from localStorage.

#### `generateAndSavePlaylist(config, force?): Promise<Result>`
Generates and saves playlist.

**Parameters:**
- `config` - Last.fm credentials and options
- `force` - Skip week check (for manual generation)

#### `checkAndCatchUp(config): Promise<boolean>`
Performs catch-up check on app startup.

**Returns:** `true` if playlist was generated

#### `getMillisecondsUntilNextMonday(): number`
Calculates time until next Monday 00:00.

#### `startWeeklyScheduler(config, onGenerate?): () => void`
Starts weekly scheduler (alternative to Electron integration).

**Returns:** Cleanup function

### `use-discover-weekly.ts`

```typescript
const {
  playlist,          // Song[]
  isGenerating,      // boolean
  error,            // string | null
  lastGenerated,    // string | null (ISO timestamp)
  artistsUsed,      // string[]
  weekKey,          // string | null ("2026-W07")
  generate,         // () => Promise<void>
  isConfigured,     // boolean
} = useDiscoverWeekly()
```

## Testing

### Manual Testing

1. **Test Week Detection:**
   ```javascript
   // In browser console
   localStorage.setItem('discover_weekly_current_week', '2026-W06')
   // Reload app - should trigger regeneration
   ```

2. **Test Catch-Up:**
   ```javascript
   // Clear week flag
   localStorage.removeItem('discover_weekly_current_week')
   // Reload app
   ```

3. **Test Manual Generation:**
   - Go to Discover Weekly page
   - Click "Refresh" button
   - Should regenerate regardless of week

### Debugging

Enable console logging:

```javascript
// All operations log with [DiscoverWeekly] prefix
// Filter console: /DiscoverWeekly/
```

**Log Examples:**
```
[DiscoverWeekly] Starting generation...
[DiscoverWeekly] Got 30 overall + 30 recent artists
[DiscoverWeekly] Found 256 similar artists
[DiscoverWeekly] ✓ Found Artist Name (score: 2.45)
[DiscoverWeekly] ✓ Generated playlist with 60 songs
[DiscoverWeekly] Playlist for week 2026-W07 already exists
```

## Troubleshooting

### Playlist Not Generating

1. **Check Last.fm Config:**
   ```javascript
   console.log(localStorage.getItem('sona_lastfm_username'))
   console.log(localStorage.getItem('sona_lastfm_api_key'))
   ```

2. **Check Week Flag:**
   ```javascript
   console.log(localStorage.getItem('discover_weekly_current_week'))
   ```

3. **Force Regeneration:**
   ```javascript
   localStorage.removeItem('discover_weekly_current_week')
   // Reload app
   ```

### Scheduler Not Running

1. **Check Electron Integration:**
   ```typescript
   // electron/main/index.ts should include:
   import { startDiscoverWeeklyScheduler } from '../discover-weekly-scheduler'
   startDiscoverWeeklyScheduler()
   ```

2. **Check IPC Handler:**
   - Observer should be mounted in `App.tsx`
   - Only runs in Electron (not browser)

### Multiple Generations

If playlist generates multiple times in same week:

1. **Check Week Key Storage:**
   ```javascript
   const metadata = JSON.parse(
     localStorage.getItem('discover_weekly_metadata')
   )
   console.log('Week key:', metadata.weekKey)
   ```

2. **Verify ISO Week Function:**
   - Should return format: `"YYYY-Wnn"`
   - Week starts Monday

## Migration from Old System

If upgrading from previous version:

```javascript
// Old system didn't have weekKey
// Add it to existing metadata:
const metadata = JSON.parse(
  localStorage.getItem('discover_weekly_metadata')
)

if (!metadata.weekKey && metadata.generatedAt) {
  const date = new Date(metadata.generatedAt)
  metadata.weekKey = getISOWeek(date)
  
  localStorage.setItem(
    'discover_weekly_metadata',
    JSON.stringify(metadata)
  )
  localStorage.setItem(
    'discover_weekly_current_week',
    metadata.weekKey
  )
}
```

## Performance

### Generation Time

**Typical duration:** 10-30 seconds

**Factors:**
- Number of top artists
- Last.fm API response time
- Subsonic library size

### Optimization Tips

1. **Reduce Target Artists:**
   ```typescript
   targetArtists: 10  // Instead of 15
   ```

2. **Reduce Songs Per Artist:**
   ```typescript
   songsPerArtist: 3  // Instead of 4
   ```

3. **Cache Last.fm Results:**
   (Future enhancement)

## Future Enhancements

- [ ] Configurable generation day (not just Monday)
- [ ] Configurable generation time
- [ ] Multiple playlists (Daily Mix, etc.)
- [ ] Genre-based filtering
- [ ] Exclude artists feature
- [ ] Generation history
- [ ] Export to M3U/Subsonic playlist

## References

- [ISO Week Date](https://en.wikipedia.org/wiki/ISO_week_date)
- [Last.fm API](https://www.last.fm/api)
- [Electron IPC](https://www.electronjs.org/docs/latest/api/ipc-renderer)
