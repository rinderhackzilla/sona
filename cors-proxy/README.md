# Navidrome CORS Proxy

A simple CORS proxy to enable Web Audio API visualizers with Navidrome.

## Why?

Navidrome doesn't send the correct CORS headers for Web Audio API to access audio streams. This proxy sits between your app and Navidrome, adding the necessary headers.

## Usage

### Quick Start

```bash
cd cors-proxy
node server.js
```

The proxy will start on `http://localhost:4534` and forward to `http://192.168.0.163:4533`.

### Configuration

You can customize the target using environment variables:

```bash
NAVIDROME_HOST=192.168.0.163 \
NAVIDROME_PORT=4533 \
NAVIDROME_PROTOCOL=http \
node server.js
```

### Update Your App

Change your Navidrome server URL from:
```
http://192.168.0.163:4533
```

To:
```
http://localhost:4534
```

### Run as Background Service (Linux)

Create a systemd service:

```bash
sudo nano /etc/systemd/system/navidrome-cors-proxy.service
```

Add:
```ini
[Unit]
Description=Navidrome CORS Proxy
After=network.target

[Service]
Type=simple
User=joe
WorkingDirectory=/home/joe/sona/cors-proxy
ExecStart=/usr/bin/node /home/joe/sona/cors-proxy/server.js
Restart=always
Environment="NAVIDROME_HOST=192.168.0.163"
Environment="NAVIDROME_PORT=4533"

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable navidrome-cors-proxy
sudo systemctl start navidrome-cors-proxy
sudo systemctl status navidrome-cors-proxy
```

## How It Works

1. Your app connects to `localhost:4534`
2. Proxy forwards requests to Navidrome at `192.168.0.163:4533`
3. Proxy adds CORS headers to all responses:
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Headers: range, content-type`
   - `Access-Control-Expose-Headers: Content-Length, Content-Range`
4. Your app receives responses with proper CORS headers
5. Web Audio API can now access the audio stream! 🎵

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 4534
sudo lsof -i :4534

# Or use a different port
PROXY_PORT=4535 node server.js
```

### Connection Refused

Make sure Navidrome is running and accessible:
```bash
curl http://192.168.0.163:4533
```

## License

MIT
