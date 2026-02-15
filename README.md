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
- **Lidarr Integration:** Send music requests directly to Lidarr via API for automated music collection management via the search bar.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Planned Features

Sona continues to evolve with the following enhancements on the roadmap:

- [ ] Discord Rich Presence integration
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
npm run build:win
```

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Biome.js](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Setup Guides

### Audio Visualizer Setup

The audio visualizer requires a **CORS proxy** to access Navidrome's audio streams, as Navidrome doesn't send the necessary CORS headers for Web Audio API.

#### Requirements
- **Node.js** installed
- **Navidrome server** accessible on your network
- **CORS Proxy** (included in `cors-proxy/` directory)

#### Quick Setup

1. **Configure the Proxy:**
   ```bash
   cd cors-proxy
   cp .env.example .env
   ```
   
   Edit `.env` with your Navidrome settings:
   ```bash
   PROXY_PORT=4534
   LISTEN_HOST=0.0.0.0
   NAVIDROME_HOST=192.168.0.163
   NAVIDROME_PORT=4533
   NAVIDROME_PROTOCOL=http
   ```

2. **Start the Proxy:**
   ```bash
   node server.js
   ```
   
   The proxy will start on `http://localhost:4534` and forward to your Navidrome server.

3. **Update Sona Server URL:**
   - Open Sona settings (⚙️)
   - Change server URL from `http://192.168.0.163:4533` to `http://localhost:4534`
   - Save and reconnect

4. **Enable Visualizer in Sona:**
   - Go to **Settings → Player**
   - Enable **Audio Visualizer**
   - Select your preferred visualization style (Bars, Waveform, Circular, Spectrum)

#### Running as a Service

**Linux (systemd):**
```bash
sudo nano /etc/systemd/system/navidrome-cors-proxy.service
```

Add:
```ini
[Unit]
Description=Navidrome CORS Proxy for Sona Audio Visualizer
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/path/to/sona/cors-proxy
ExecStart=/usr/bin/node /path/to/sona/cors-proxy/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now navidrome-cors-proxy
```

**Windows (NSSM):**

See [`cors-proxy/README.md`](cors-proxy/README.md) for Windows service setup.

#### Alternative: Caddy Reverse Proxy
   
If you use Caddy, add CORS headers directly (no separate proxy needed):

```caddyfile
navidrome.yourdomain.com {
    reverse_proxy localhost:4533 {
        header_up Host {upstream_hostport}
    }
    
    @audio {
        path /rest/stream*
        path /rest/download*
    }
    
    header @audio {
        Access-Control-Allow-Origin *
        Access-Control-Allow-Headers "range, content-type, authorization"
        Access-Control-Expose-Headers "Content-Length, Content-Range"
    }
}
```

Then use `https://navidrome.yourdomain.com` directly in Sona.

#### Troubleshooting

- **Visualizer Not Working:**
  - Ensure CORS proxy is running: `curl http://localhost:4534/rest/ping`
  - Check Sona uses proxy URL, not direct Navidrome URL
  - Verify audio is playing
  
- **Configuration Issues:**
  - Check `.env` file exists in `cors-proxy/` directory
  - Verify `NAVIDROME_HOST` and `NAVIDROME_PORT` are correct
  - Test Navidrome directly: `curl http://YOUR_NAVIDROME_IP:4533/rest/ping`

For detailed configuration options, see [`cors-proxy/README.md`](cors-proxy/README.md).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

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

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

Original Aonsoku project by victoralvesf: https://github.com/victoralvesf/aonsoku

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[React.js]: https://img.shields.io/badge/React-000000?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Electron]: https://img.shields.io/badge/Electron-000000?style=for-the-badge&logo=electron&logoColor=9FEAF9
[Electron-url]: https://www.electronjs.org/
