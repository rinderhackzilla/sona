# Changelog

All notable changes to Sona will be documented in this file.

## [Unreleased]

### What's New

- Search now ranks artists, albums, and songs by relevance before showing results, with stronger matches and higher-result artists/albums appearing first.
- Search sections now pull a larger candidate pool internally while keeping the visible result list compact and readable.
- Synced lyrics lookup is now more resilient by trying precise and relaxed LRCLIB matches before falling back to plain lyrics.

### Fixes

- Fixed empty or irrelevant zero-result artists/albums appearing in search results.
- Fixed active Lyrics and Queue control icons so they keep the correct accent color on hover.
- Fixed synced lyrics getting stuck on stale plain-text cache entries after enabling synced lyrics.
- Fixed packaged Electron builds failing to reliably load LRCLIB lyrics by falling back to the main-process fetch proxy.
- Fixed LRCLIB lookups being too strict when album or duration metadata differs slightly from the external lyrics database.

---

## Previous Releases

See [GitHub Releases](https://github.com/rinderhackzilla/sona/releases) for full release history.
