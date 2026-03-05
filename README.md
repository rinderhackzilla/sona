<a id="readme-top"></a>

<br />
<div align="center">
  <a href="https://github.com/rinderhackzilla/sona">
    <img src="./resources/sona_header.png" alt="Sona">
  </a>

  <h3 align="center">Sona</h3>
  <p align="center">
    A modern Windows desktop music client for Navidrome/Subsonic servers built with React and Electron.
    <br />
    <br />
    Forked from <a href="https://github.com/victoralvesf/aonsoku">Aonsoku</a>
  </p>

  [![React][React.js]][React-url] [![Electron][Electron]][Electron-url]
</div>

<details open>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-sona">About Sona</a>
    </li>
    <li>
      <a href="#features">Features</a>
    </li>
    <li>
      <a href="#planned-features">Planned Features</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#running">Running</a></li>
        <li><a href="#building-windows-executable">Building Windows Executable</a></li>
        <li><a href="#recommended-ide-setup">Recommended IDE Setup</a></li>
      </ul>
    </li>
    <li>
      <a href="#setup-guides">Setup Guides</a>
      <ul>
        <li><a href="#audio-visualizer-setup">Audio Visualizer Setup</a></li>
        <li><a href="#lidarr-integration-setup">Lidarr Integration Setup</a></li>
      </ul>
    </li>
    <li><a href="#developer-notes">Developer Notes</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

## About Sona

Sona is a fork of Aonsoku, customized and enhanced for Windows desktop use. This project focuses on delivering a powerful music client experience with advanced audio features and music discovery capabilities.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Features

### Core Features
- **Subsonic Integration:** Sona integrates with your Navidrome or Subsonic server, providing you with easy access to your music collection.
- **Intuitive UI:** Modern, clean and user-friendly interface designed to enhance your music listening experience.
- **Fullscreen Player:** Dedicated fullscreen scene with queue/lyrics/now-playing views, animated backdrop option, and immersive layout.
- **Mini Player Mode:** Compact always-on-top style player mode for quick control without the full interface.
- **Session Modes:** One-click listening modes:
  - **Focus:** reduced-distraction playback mood
  - **Night:** high-contrast atmospheric mode with neon-inspired styling
- **Sona DJ Modes:** Queue intelligence modes for different listening goals:
  - **Wildcard:** musical detours between queue tracks
  - **Drift:** keeps the current vibe/genre moving
  - **Timekeeper:** stays within a similar era/decade flow
- **Podcast Support:** Easily access, manage, and listen to your favorite podcasts directly within the app.
- **Synchronized Lyrics:** Automatically find synced lyrics from LRCLIB if none is provided by the server.
- **Unsynchronized Lyrics:** Display embedded unsynchronized lyrics from your songs.
- **Radio:** Listen to radio shows directly within Sona if your server supports it.
- **Scrobble:** Sync played songs with your server.
- **Discord Rich Presence:** Show off your music taste to your Discord friends.

### Audio Features
- **Audio Visualizer:** Real-time audio visualization with multiple visual styles for an immersive listening experience.
- **Equalizer:** Built-in 10-band equalizer with presets and custom settings for personalized sound control.
- **Crossfade Playback:** Smooth transitions between tracks for less abrupt song changes.

### Music Discovery & Playlists
- **Discover Weekly:** Personalized weekly playlists powered by Last.fm integration, automatically generated every Monday with ~50 songs from similar artists based on your listening history.
- **Your Top 50:** Your top 50 most played tracks from the last 12 months, synced from Last.fm listening history and updated weekly.
- **Rabbit Hole:** Generate a 50-song discovery queue on-demand with tracks from similar artists. Perfect for diving deep into your music taste and finding new favorites.
- **This Is [Artist]:** Daily artist-focused playlist generated from your listening profile.
- **Daypart Playlist:** Time-of-day driven playlist logic (morning, noon, afternoon, evening, night, midnight) with mood-aware genre selection.

### Integrations
- **Lidarr Integration:** Send music requests directly to Lidarr via API for automated music collection management via the search bar.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Screenshots

<a href="https://raw.githubusercontent.com/rinderhackzilla/sona/refs/heads/main/public/screenshots/start.jpg"><img src="https://raw.githubusercontent.com/rinderhackzilla/sona/refs/heads/main/public/screenshots/start.jpg" width="49.5%"/></a> <a href="https://raw.githubusercontent.com/rinderhackzilla/sona/refs/heads/main/public/screenshots/top50.jpg"><img src="https://raw.githubusercontent.com/rinderhackzilla/sona/refs/heads/main/public/screenshots/top50.jpg" width="49.5%"/></a>

<a href="https://raw.githubusercontent.com/rinderhackzilla/sona/refs/heads/main/public/screenshots/discover.jpg"><img src="https://raw.githubusercontent.com/rinderhackzilla/sona/refs/heads/main/public/screenshots/discover.jpg" width="49.5%"/></a> <a href="https://raw.githubusercontent.com/rinderhackzilla/sona/refs/heads/main/public/screenshots/lyrics.jpg"><img src="https://raw.githubusercontent.com/rinderhackzilla/sona/refs/heads/main/public/screenshots/lyrics.jpg" width="49.5%"/></a>

<a href="https://raw.githubusercontent.com/rinderhackzilla/sona/refs/heads/main/public/screenshots/visualizer.jpg"><img src="https://raw.githubusercontent.com/rinderhackzilla/sona/refs/heads/main/public/screenshots/visualizer.jpg" width="49.5%"/></a> <a href="https://raw.githubusercontent.com/rinderhackzilla/sona/refs/heads/main/public/screenshots/eq.jpg"><img src="https://raw.githubusercontent.com/rinderhackzilla/sona/refs/heads/main/public/screenshots/eq.jpg" width="49.5%"/></a>


## Planned Features

Sona will continue to evolve with new features on the go. Right now, the roadmap with planned enhancements is complete.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

### Prerequisites

- Node.js
- pnpm, npm or yarn
- cargo

### Installation

1. Clone the repo
```sh
git clone https://github.com/rinderhackzilla/sona.git
```
2. Install NPM packages
```sh
pnpm install
```

### Running

- Desktop App
```sh
pnpm run electron:dev
```

### Building Windows Executable

To build the Windows .exe installer:

```sh
npm run build:win
```

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Biome.js](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Setup Guides


### Lidarr Integration Setup

Connect Sona directly to your Lidarr instance via API to request and download missing albums/artists.

#### Requirements
- **Lidarr Instance:** Running Lidarr server (v1.0.0 or higher)
- **API Key:** Lidarr API key with write permissions
- **Network Access:** Sona must be able to reach Lidarr (same network or via reverse proxy)

#### Configuration Steps

1. **Get Your Lidarr API Key:**
   - Open Lidarr web interface
   - Go to **Settings → General**
   - Scroll to **Security** section
   - Copy your **API Key**

2. **Configure Sona:**
   - Open Sona settings (⚙️ icon in sidebar)
   - Navigate to **Integrations** tab
   - Find the **Lidarr** section
   - Enter:
     - **Lidarr URL:** `http://192.168.0.163:8686` (or your Lidarr address)
     - **API Key:** Paste your API key
   - Click **Test Connection** to verify

3. **Using Lidarr Integration:**
   - Browse to any artist in Sona
   - If artist is not in your Lidarr library, you'll see **"Request via Lidarr"** button
   - Click to:
     - Add artist to Lidarr
     - Monitor for new releases
     - Trigger search for missing albums
   - Check Lidarr for download progress

4. **Lidarr Prerequisites:**
   
   Ensure Lidarr is properly configured:
   - **Quality Profiles:** At least one configured
   - **Root Folder:** Music library path set
   - **Indexers:** Configured for searching
   - **Download Client:** qBittorrent, Transmission, etc. set up

#### Troubleshooting

- **Connection Failed:**
  - Verify Lidarr URL includes protocol (`http://` or `https://`) and port
  - Test access: `curl http://YOUR_LIDARR_IP:8686/api/v1/system/status -H "X-Api-Key: YOUR_API_KEY"`
  - Check firewall/network settings
  - For HTTPS, ensure valid SSL certificate

- **API Errors:**
  - Regenerate API key in Lidarr if authentication fails
  - Check Lidarr logs: **System → Logs**
  - Ensure API key has not been revoked

- **Request Not Working:**
  - Verify quality profiles exist: **Settings → Profiles**
  - Check indexers are configured: **Settings → Indexers**
  - Ensure download client is set up: **Settings → Download Clients**
  - Review Lidarr activity: **Activity → Queue**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Developer Notes

- Storage conventions and key ownership:
  - [`docs/architecture/storage.md`](docs/architecture/storage.md)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

Original Aonsoku project by victoralvesf: https://github.com/victoralvesf/aonsoku

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[React.js]: https://img.shields.io/badge/React-000000?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Electron]: https://img.shields.io/badge/Electron-000000?style=for-the-badge&logo=electron&logoColor=9FEAF9
[Electron-url]: https://www.electronjs.org/
