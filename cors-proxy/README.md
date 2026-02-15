# Navidrome CORS Proxy

A simple CORS proxy to enable Web Audio API visualizers with Navidrome.

## Why?

Navidrome doesn't send the correct CORS headers for Web Audio API to access audio streams. This proxy sits between your app and Navidrome, adding the necessary headers.

## Quick Start

### 1. Configure the Proxy

Copy the example configuration:
```bash
cd cors-proxy
cp .env.example .env
```

Edit `.env` with your settings:
```bash
# Proxy Server Settings
PROXY_PORT=4534
LISTEN_HOST=0.0.0.0

# Navidrome Target Settings
NAVIDROME_HOST=192.168.0.163
NAVIDROME_PORT=4533
NAVIDROME_PROTOCOL=http
```

### 2. Start the Proxy

```bash
node server.js
```

The proxy will:
- Start on the configured `PROXY_PORT` (default: 4534)
- Forward all requests to your Navidrome server
- Add necessary CORS headers automatically

### 3. Update Your App

Change your Navidrome server URL in Sona from:
```
http://192.168.0.163:4533
```

To:
```
http://localhost:4534
```

## Configuration Options

### Using `.env` File (Recommended)

Create a `.env` file in the `cors-proxy/` directory:

```bash
# Proxy server configuration
PROXY_PORT=4534              # Port the proxy listens on
LISTEN_HOST=0.0.0.0          # Interface to bind (0.0.0.0 = all interfaces)

# Navidrome target configuration
NAVIDROME_HOST=192.168.0.163 # Your Navidrome server IP/hostname
NAVIDROME_PORT=4533          # Your Navidrome port
NAVIDROME_PROTOCOL=http      # http or https
```

### Using Environment Variables

You can also set configuration via environment variables (overrides `.env` file):

```bash
PROXY_PORT=4535 \
LISTEN_HOST=127.0.0.1 \
NAVIDROME_HOST=192.168.1.100 \
NAVIDROME_PORT=4533 \
NAVIDROME_PROTOCOL=https \
node server.js
```

## Running as a Service

### Linux (systemd)

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/navidrome-cors-proxy.service
```

Add the following (adjust paths to your setup):

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

# Load configuration from .env file in WorkingDirectory
# No need to specify environment variables if using .env

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable navidrome-cors-proxy
sudo systemctl start navidrome-cors-proxy
sudo systemctl status navidrome-cors-proxy
```

View logs:
```bash
sudo journalctl -u navidrome-cors-proxy -f
```

### Windows (NSSM)

Using [NSSM (Non-Sucking Service Manager)](https://nssm.cc/):

1. Download and extract NSSM
2. Open Command Prompt as Administrator
3. Install the service:

```cmd
cd C:\path\to\nssm\win64
nssm install NavidromeCORSProxy
```

4. In the NSSM GUI:
   - **Path**: `C:\Program Files\nodejs\node.exe`
   - **Startup directory**: `C:\path\to\sona\cors-proxy`
   - **Arguments**: `server.js`
   - Click "Install service"

5. Start the service:
```cmd
nssm start NavidromeCORSProxy
```

## How It Works

1. Your app connects to `localhost:PROXY_PORT`
2. Proxy forwards requests to `NAVIDROME_HOST:NAVIDROME_PORT`
3. Proxy adds CORS headers to all responses:
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Headers: Content-Type, Range, Authorization`
   - `Access-Control-Expose-Headers: Content-Length, Content-Range, Content-Type`
4. Your app receives responses with proper CORS headers
5. Web Audio API can now access the audio stream! 🎵

## Troubleshooting

### Port Already in Use

Change `PROXY_PORT` in your `.env` file:
```bash
PROXY_PORT=4535
```

Or check what's using the port:
```bash
# Linux/macOS
sudo lsof -i :4534

# Windows
netstat -ano | findstr :4534
```

### Connection Refused

1. Verify Navidrome is running:
   ```bash
   curl http://YOUR_NAVIDROME_HOST:YOUR_NAVIDROME_PORT/rest/ping
   ```

2. Check your `.env` configuration:
   - Is `NAVIDROME_HOST` correct?
   - Is `NAVIDROME_PORT` correct?
   - Is `NAVIDROME_PROTOCOL` set to `http` or `https` correctly?

3. Check firewall settings

### Proxy Not Loading Config

- Ensure `.env` file is in the same directory as `server.js`
- Check file permissions: `chmod 644 .env`
- Verify file encoding is UTF-8
- Look for syntax errors in `.env` (no spaces around `=`)

### Remote Access

To access the proxy from other devices on your network:

1. Set `LISTEN_HOST=0.0.0.0` in `.env`
2. Use your server's IP in Sona: `http://192.168.0.XXX:4534`
3. Ensure firewall allows incoming connections on `PROXY_PORT`

## Alternative: Caddy Reverse Proxy

If you already use Caddy, you can add CORS headers directly without a separate proxy:

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

## License

MIT
