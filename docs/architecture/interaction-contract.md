# Sona UX Interaction Contract (Baseline)

This document defines the baseline interaction rules for high-traffic UI patterns.
Goal: reduce behavior drift across Normal Player, Fullscreen, Mini Player, and overlays.

## Scope

- Queue and Lyrics drawers/overlays
- Playback primary actions
- Session/DJ mode toggles
- Escape/back behavior
- Active/hover/disabled semantics

## Global Rules

1. One panel at a time
- Queue and Lyrics are mutually exclusive.
- Switching panel closes the current one first, then opens the target.

2. Escape behavior priority
- If Queue/Lyrics is open: `Esc` closes panel only.
- If no panel is open in fullscreen: `Esc` exits fullscreen.
- `Esc` never closes unrelated modals first when a higher-priority panel is active.

3. Primary action placement
- `Play/Pause`, `Previous`, `Next` remain in center control cluster.
- Queue/Lyrics triggers stay in right utility cluster.
- Like/DJ/Volume stay utility-only and never replace transport controls.

4. State transition timing
- Panel open/close: 400-560ms max.
- No instant hard switches between Queue and Lyrics.
- No opacity jumps after transition end.

5. Toggle semantics
- Toggle off means "hide/disable behavior", not "delete data".
- Label text must describe effect explicitly.

## Drawer/Overlay Contract

- Source of truth: `setActiveDrawerPanel('queue' | 'lyrics' | null)`.
- `mainDrawerState` reflects whether any panel is open.
- Components should not directly set both `queueState` and `lyricsState`.

## Feedback Contract

- If an action is accepted, UI reacts immediately (optimistic visual feedback).
- Background failures show a toast or inline state, never silent fail.
- Dev diagnostics should use structured `logger` and avoid noisy `console.log`.

## Performance Guardrails

- Reuse shared query hooks for repeated sources (e.g. playlists).
- Avoid animated multi-layer gradients in high-frequency overlays.
- Budget: stream `loadstart -> loadedmetadata` above 3000ms is flagged in dev.

## Definition of Done (UI Interaction Changes)

- Works in Normal, Fullscreen, and Mini modes.
- Queue/Lyrics switching is smooth and deterministic.
- ESC behavior follows priority rules.
- Biome + existing critical tests pass.
