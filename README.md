<a id="readme-top"></a>

<br />
<div align="center">
  <a href="https://github.com/sgtspeerock/sona">
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
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

## About Sona

Sona is a fork of Aonsoku, customized and enhanced for Windows desktop use. This project focuses on delivering a powerful music client experience with advanced audio features and music discovery capabilities.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Features

- **Subsonic Integration:** Sona integrates with your Navidrome or Subsonic server, providing you with easy access to your music collection.
- **Intuitive UI:** Modern, clean and user-friendly interface designed to enhance your music listening experience.
- **Podcast Support:** Easily access, manage, and listen to your favorite podcasts directly within the app.
- **Synchronized Lyrics:** Automatically find synced lyrics from LRCLIB if none is provided by the server.
- **Unsynchronized Lyrics:** Display embedded unsynchronized lyrics from your songs.
- **Radio:** Listen to radio shows directly within Sona if your server supports it.
- **Scrobble:** Sync played songs with your server.
- **Audio Visualizer:** Real-time audio visualization with multiple visual styles for an immersive listening experience.
- **Equalizer:** Built-in 10-band equalizer with presets and custom settings for personalized sound control.
- **Discover Weekly:** Personalized weekly playlists powered by Last.fm integration, automatically generated every Monday with ~50 songs from similar artists.
- **Your Top 50:** Your top 50 most played tracks from the last 12 months, synced from Last.fm listening history.
- **Lidarr Integration:** Send music requests directly to Lidarr via API for automated music collection management.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Planned Features

Sona continues to evolve with the following enhancements on the roadmap:

- [ ] Discord Rich Presence integration
- [ ] Custom app icon design
- [ ] **Smart Playlists:** Dynamic playlists based on custom rules and filters
- [ ] **Enhanced Quality of Life Features:** Additional UI/UX improvements and convenience features

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

### Prerequisites

- Node.js
- pnpm, npm or yarn
- cargo

### Installation

1. Clone the repo
```sh
git clone https://github.com/sgtspeerock/sona.git
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
pnpm run electron:build:win
```

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Biome.js](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Setup Guides

### Audio Visualizer Setup

The audio visualizer requires access to your system's audio output to display real-time visualizations.

#### Requirements
- **Windows:** Windows 10/11 with audio loopback support
- **Audio Driver:** WASAPI-compatible audio device (most modern audio devices support this)

#### Configuration Steps

1. **Enable Visualizer:**
   - Open Sona settings (⚙️ icon in sidebar)
   - Navigate to **Player** settings
   - Enable **"Audio Visualizer"** toggle

2. **Select Visualization Style:**
   - Choose from multiple visualization presets:
     - Bars
     - Waveform
     - Circular
     - Spectrum
   - Adjust visualization sensitivity if needed

3. **Audio Permissions:**
   - Windows may prompt for audio access permissions
   - Grant Sona permission to access audio loopback
   - If visualizer doesn't work, check Windows Privacy settings:
     - Go to **Settings → Privacy → Microphone**
     - Ensure desktop apps can access audio

4. **Troubleshooting:**
   - If visualizer shows no activity:
     - Ensure audio is actually playing
     - Try restarting the app
     - Check that your audio device is set as default in Windows
     - Update audio drivers if issues persist

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Lidarr Integration Setup

Connect Sona to your Lidarr instance to request and download missing albums/artists directly from the player.

#### Requirements
- **Lidarr Instance:** A running Lidarr server (v1.0.0 or higher recommended)
- **API Access:** Lidarr API key with write permissions
- **Network Access:** Sona must be able to reach your Lidarr instance (same network or via reverse proxy)

#### Configuration Steps

1. **Get Your Lidarr API Key:**
   - Open your Lidarr web interface
   - Go to **Settings → General**
   - Scroll to **Security** section
   - Copy your **API Key**

2. **Configure Sona:**
   - Open Sona settings (⚙️ icon in sidebar)
   - Navigate to **Integrations** tab
   - Find the **Lidarr** section
   - Enter the following information:
     - **Lidarr URL:** Your Lidarr instance URL (e.g., `http://192.168.1.100:8686` or `https://lidarr.yourdomain.com`)
     - **API Key:** Paste the API key from step 1
   - Click **Save** or **Test Connection** to verify

3. **Using Lidarr Integration:**
   - Browse to any artist in Sona
   - If the artist is not in your Lidarr library, you'll see a **"Request via Lidarr"** button
   - Click the button to:
     - Add the artist to Lidarr
     - Automatically monitor for new releases
     - Trigger search for missing albums (based on your Lidarr configuration)
   - Check Lidarr for download progress

4. **Troubleshooting:**
   - **Connection Failed:**
     - Verify Lidarr URL is correct and includes port number
     - Ensure Lidarr is accessible from Sona's machine
     - Check firewall settings
     - For HTTPS connections, ensure SSL certificate is valid
   
   - **API Errors:**
     - Regenerate API key in Lidarr if connection keeps failing
     - Check Lidarr logs for authentication errors
     - Ensure API key has not been revoked
   
   - **Request Not Working:**
     - Verify Lidarr quality profiles are configured
     - Check that Lidarr has indexers configured
     - Ensure download client is set up in Lidarr

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Roadmap

- [x] Core music playback features
- [x] Queue page
- [x] Synced lyrics
- [x] Podcast support
- [x] Audio Visualizer
- [x] Equalizer
- [x] Discover Weekly (Last.fm Integration)
- [x] Your Top 50 (Last.fm Integration)
- [x] Lidarr API Integration
- [x] Quality of Life Features
- [ ] Discord Rich Presence
- [ ] Custom App Icon
- [ ] Smart Playlists
- [ ] More Quality of Life Features

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

Original Aonsoku project by victoralvesf: https://github.com/victoralvesf/aonsoku

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[React.js]: https://img.shields.io/badge/React-000000?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Electron]: https://img.shields.io/badge/Electron-000000?style=for-the-badge&logo=electron&logoColor=9FEAF9
[Electron-url]: https://www.electronjs.org/
