<a id="readme-top"></a>

<br />
<div align="center">
  <a href="https://github.com/sgtspeerock/sona">
    <img src="./resources/icons/icon.png" alt="Sona" width="80" height="80">
  </a>

  <h3 align="center">Sona</h3>
  <p align="center">
    A modern Windows desktop music client for Navidrome/Subsonic servers built with React and Electron.
    <br />
    <br />
    Forked from <a href="https://github.com/victoralvesf/aonsoku">Aonsoku</a>
    <br />
    <br />
    <a href="https://github.com/sgtspeerock/sona/issues/new?labels=bug">Report Bug</a>
    ·
    <a href="https://github.com/sgtspeerock/sona/issues/new?labels=enhancement">Request Feature</a>
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
      <a href="#screenshots">Screenshots</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#running">Running</a></li>
        <li><a href="#recommended-ide-setup">Recommended IDE Setup</a></li>
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

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Planned Features

Sona aims to extend beyond the original Aonsoku with the following enhancements:

- **Audio Visualizer:** Real-time audio visualization for an immersive listening experience
- **Equalizer:** Built-in equalizer with presets and custom settings for personalized sound
- **Music Discovery:** Enhanced music discovery features to explore new artists and albums
- **Lidarr Integration:** Send music requests directly to Lidarr via API for automated music collection management

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Screenshots

<a href="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/home.png"><img src="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/home.png" width="49.5%"/></a> <a href="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/album.png"><img src="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/album.png" width="49.5%"/></a>

<a href="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/playlist.png"><img src="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/playlist.png" width="49.5%"/></a> <a href="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/albums.png"><img src="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/albums.png" width="49.5%"/></a>

<a href="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/albumsByArtist.png"><img src="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/albumsByArtist.png" width="49.5%"/></a> <a href="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/artist.png"><img src="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/artist.png" width="49.5%"/></a>

<a href="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/player.png"><img src="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/player.png" width="49.5%"/></a> <a href="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/lyrics.png"><img src="https://raw.githubusercontent.com/victoralvesf/aonsoku/main/media/lyrics.png" width="49.5%"/></a>

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

## Roadmap

- [x] Core music playback features
- [x] Queue page
- [x] Synced lyrics
- [x] Podcast support
- [ ] Audio Visualizer
- [ ] Equalizer
- [ ] Enhanced Music Discovery
- [ ] Lidarr API Integration

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

Original Aonsoku project by victoralvesf: https://github.com/victoralvesf/aonsoku

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[React.js]: https://img.shields.io/badge/React-000000?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Electron]: https://img.shields.io/badge/Electron-000000?style=for-the-badge&logo=electron&logoColor=9FEAF9
[Electron-url]: https://www.electronjs.org/