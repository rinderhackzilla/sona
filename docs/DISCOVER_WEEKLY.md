# Discover Weekly - Technical Documentation

## Overview

Discover Weekly is a personalized playlist feature that generates weekly music recommendations based on Last.fm listening history. The system intelligently manages playlist generation to ensure:

- ✅ **Weekly updates** every Monday at 00:00
- ✅ **No duplicate generations** within the same week
- ✅ **Automatic catch-up** if the app wasn't running on Monday
- ✅ **Manual refresh** option for users
- ✅ **Persistent storage** with localStorage

## Architecture

### Components

```
┌─────────────────────────────────────────────────┐
│           Electron Main Process                 │
│  electron/discover-weekly-scheduler.ts          │
│  • Background timer (Monday 00:00)              │
│  • Sends IPC events to renderer                 │
└──────────────────┬──────────────────────────────┘
                   │ IPC: 'discover-weekly:schedule-event'
                   ▼
┌─────────────────────────────────────────────────┐
│          Renderer Process (React)               │
│                                                 │
│  src/service/discover-weekly-manager.ts         │
│  • Week-based logic (ISO week format)           │
│  • localStorage persistence                     │
│  • Generation & caching                         │
│                                                 │
│  src/app/hooks/use-discover-weekly.ts           │
│  • React integration                            │
│  • One-time catch-up check on mount             │
│  • Manual generation trigger                    │
│                                                 │
│  src/app/pages/discover-weekly.tsx              │
│  • UI display                                   │
│  • Play/Shuffle controls                        │
└─────────────────────────────────────────────────┘
```

## Week Tracking System

### ISO Week Format

Playlists are tracked using **ISO 8601 week numbers**:
- Format: `YYYY-Www` (e.g., `2026-W07`)
- Week starts on **Monday**
- Ensures consistent week boundaries globally

### Storage Keys

```typescript
localStorage keys:
- 'discover_weekly_playlist'          // Array<Song>
- 'discover_weekly_metadata'          // Metadata + weekKey
- 'discover_weekly_current_week'      // "2026-W07" flag
```

### Generation Logic

```typescript
function shouldGeneratePlaylist(): boolean {
  const currentWeek = getISOWeek(new Date())  // e.g., "2026-W07"
  const storedWeek = localStorage.getItem('discover_weekly_current_week')
  
  return currentWeek !== storedWeek  // Generate if weeks differ
}
```

## Flow Diagrams

### App Startup Flow

```
App Launch
  |
  ├─> Load cached playlist from localStorage
  |
  ├─> Wait 2 seconds (UI priority)
  |
  └─> Check if catch-up needed
       ├─> Current week === Stored week? → No action
       └─> Current week !== Stored week? → Generate new playlist
```

### Monday 00:00 Flow (Background)

```
Electron Scheduler (Main Process)
  |
  ├─> Calculate time until Monday 00:00
  |
  ├─> Set timeout
  |
  └─> Monday arrives
       |
       └─> Send IPC event to renderer
            |
            └─> Renderer checks shouldGeneratePlaylist()
                 ├─> Already generated? → Skip
                 └─> Not generated? → Generate & save
```

### Manual Refresh Flow

```
User clicks "Refresh" button
  |
  └─> generateAndSavePlaylist(config, force: true)
       |
       ├─> Fetch Last.fm top artists
       ├─> Get similar artists
       ├─> Search in Subsonic library
       ├─> Generate playlist
       |
       └─> Save to localStorage with new weekKey
```

## API Reference

### `discover-weekly-manager.ts`

#### `shouldGeneratePlaylist(): boolean`
Checks if current week differs from stored week.

```typescript
if (shouldGeneratePlaylist()) {
  // Generate new playlist
}
```

#### `loadPlaylist(): { playlist: Song[], metadata: PlaylistMetadata | null }`
Loads cached playlist from localStorage.

```typescript
const { playlist, metadata } = loadPlaylist()
```

#### `generateAndSavePlaylist(config, force?): Promise<{ playlist, metadata }>`
Generates and saves playlist. Set `force: true` to bypass week check.

```typescript
await generateAndSavePlaylist(
  { username: 'user', apiKey: 'key' },
  true  // Force regeneration
)
```

#### `checkAndCatchUp(config): Promise<boolean>`
Performs catch-up generation if needed. Returns `true` if generated.

```typescript
const wasGenerated = await checkAndCatchUp(config)
```

#### `startWeeklyScheduler(config, onGenerate?): () => void`
Starts in-renderer timer for Monday checks. Returns cleanup function.

```typescript
const cleanup = startWeeklyScheduler(config, (success) => {
  console.log('Generated:', success)
})

// Later:
cleanup()
```

### `use-discover-weekly.ts` Hook

```typescript
const {
  playlist,          // Song[]
  isGenerating,      // boolean
  error,             // string | null
  lastGenerated,     // string (ISO timestamp)
  artistsUsed,       // string[]
  weekKey,           // string ("2026-W07")
  generate,          // () => Promise<void> - Manual refresh
  isConfigured,      // boolean - Last.fm configured?
} = useDiscoverWeekly()
```

## Integration Guide

### Step 1: Enable Electron Scheduler (Optional)

In `electron/main.ts`:

```typescript
import { startDiscoverWeeklyScheduler } from './discover-weekly-scheduler'

app.whenReady().then(() => {
  // ... other initialization
  
  startDiscoverWeeklyScheduler()
})
```

### Step 2: Listen to IPC Events (Optional)

In renderer (e.g., `App.tsx` or main layout):

```typescript
import { useEffect } from 'react'
import { checkAndCatchUp } from '@/service/discover-weekly-manager'
import { useAppIntegrations } from '@/store/app.store'

function App() {
  const { lastfm } = useAppIntegrations()

  useEffect(() => {
    const handler = (event: any, data: any) => {
      console.log('Received scheduler event:', data)
      
      // Trigger catch-up
      checkAndCatchUp({
        username: lastfm.username,
        apiKey: lastfm.apiKey,
      })
    }

    window.electron?.ipcRenderer.on('discover-weekly:schedule-event', handler)

    return () => {
      window.electron?.ipcRenderer.off('discover-weekly:schedule-event', handler)
    }
  }, [lastfm])

  return <YourApp />
}
```

### Step 3: Use the Hook

The hook automatically handles catch-up on mount:

```typescript
function DiscoverWeeklyPage() {
  const { playlist, generate, isGenerating } = useDiscoverWeekly()
  
  return (
    <div>
      <button onClick={generate} disabled={isGenerating}>
        Refresh Playlist
      </button>
      {/* ... render playlist */}
    </div>
  )
}
```

## Testing

### Simulate Week Change

```typescript
// In browser console:
localStorage.setItem('discover_weekly_current_week', '2026-W06')
location.reload()  // Should trigger catch-up
```

### Check Current Week

```typescript
function getISOWeek(date = new Date()) {
  const target = new Date(date.valueOf())
  const dayNumber = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNumber + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7))
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
  return `${target.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}

console.log('Current week:', getISOWeek())
```

### Force Regeneration

```typescript
import { generateAndSavePlaylist } from '@/service/discover-weekly-manager'

await generateAndSavePlaylist(
  { username: 'your-username', apiKey: 'your-key' },
  true  // Force
)
```

## Troubleshooting

### Playlist not regenerating on Monday

1. Check localStorage flag:
   ```javascript
   console.log(localStorage.getItem('discover_weekly_current_week'))
   ```

2. Verify Electron scheduler is running (check console logs)

3. Ensure Last.fm credentials are configured

### Multiple generations in same week

- This should not happen. Check if `force: true` is being used unintentionally.
- Clear localStorage and reload:
  ```javascript
  localStorage.removeItem('discover_weekly_current_week')
  location.reload()
  ```

### Catch-up not working

- Check console for `[DiscoverWeekly]` logs
- Verify `hasCheckedCatchup` flag in hook state
- Ensure 2-second delay hasn't been interrupted

## Performance Considerations

- **Catch-up delay**: 2 seconds after mount to prioritize UI rendering
- **localStorage**: Playlist stored as JSON (~50KB typical)
- **Monday check**: Calculated timeout, not polling
- **IPC overhead**: Minimal, event-driven

## Future Improvements

- [ ] IndexedDB migration for larger playlists
- [ ] Configurable generation day (not just Monday)
- [ ] Progress notifications during generation
- [ ] Playlist history (previous weeks)
- [ ] User-configurable parameters (artists count, songs per artist)
