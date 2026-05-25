# Deployment Guide

---

## Railway (Recommended)

Railway auto-detects the `Dockerfile` and `railway.toml`.

### Steps

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Add a Redis service: **New** → **Database** → **Redis**
4. Set environment variables in the Railway dashboard:

```
NODE_ENV=production
JWT_SECRET=<64-char random string>
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
CORS_ORIGINS=https://your-frontend.vercel.app
LOG_LEVEL=info
```

5. Deploy — Railway builds the Docker image and starts the container
6. The `/health` endpoint is used as the health check

### Generate a secure JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Docker (Self-hosted)

### Production build

```bash
# Build image
docker build -t signaling-server:latest .

# Run with environment variables
docker run -d \
  --name signaling-server \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  -e REDIS_HOST=your-redis-host \
  -e REDIS_PORT=6379 \
  -e CORS_ORIGINS=https://your-frontend.com \
  signaling-server:latest
```

### Docker Compose (development)

```bash
cp .env.example .env
docker-compose up --build
```

---

## VPS (Ubuntu/Debian)

### 1. Install dependencies

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y redis-server
```

### 2. Configure Redis

```bash
sudo nano /etc/redis/redis.conf
# Set: requirepass your-redis-password
# Set: bind 127.0.0.1
sudo systemctl restart redis
```

### 3. Deploy app

```bash
git clone <repo-url> /opt/signaling-server
cd /opt/signaling-server
npm ci
cp .env.example .env
# Edit .env with production values
npm run build
```

### 4. Process manager (PM2)

```bash
npm install -g pm2
pm2 start dist/server.js --name signaling-server
pm2 save
pm2 startup
```

### 5. Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable HTTPS with Certbot:
```bash
sudo certbot --nginx -d your-domain.com
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Runtime environment |
| `PORT` | No | `3000` | HTTP port |
| `JWT_SECRET` | **Yes** | — | Min 16 chars |
| `JWT_EXPIRES_IN` | No | `7d` | Token TTL |
| `REDIS_HOST` | No | `127.0.0.1` | Redis hostname |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_PASSWORD` | No | — | Redis AUTH password |
| `REDIS_TLS` | No | `false` | Set to `"true"` to enable TLS — must be the string `true`, not `1` |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated allowed origins |
| `RATE_LIMIT_MAX` | No | `100` | Requests per window |
| `ROOM_MAX_PARTICIPANTS` | No | `10` | Default room capacity |
| `LOG_LEVEL` | No | `info` | `error\|warn\|info\|debug` |

> **Windows + WSL2 note:** Docker Desktop on Windows uses a WSL relay that intercepts loopback ports, causing ioredis to get `ETIMEDOUT` or `ECONNRESET` even when Redis appears to be running. The server starts in single-instance mode (no Redis adapter) automatically in development. For a working local Redis, install it inside WSL (`wsl sudo apt-get install -y redis-server`) and point `REDIS_HOST` at the WSL IP (`wsl hostname -I`).

---

## Scaling Recommendations

- **2–10 instances**: Deploy behind a load balancer with sticky sessions. Redis adapter handles cross-instance socket events automatically.
- **10+ instances**: Move room state from in-memory `Map` to Redis hashes. Use Redis Cluster for Redis HA.
- **Global**: Deploy instances in multiple regions. Use a global load balancer (Cloudflare, AWS Global Accelerator). Each region has its own Redis cluster; use Redis replication for room state sync.

---

## Production Checklist

- [ ] `JWT_SECRET` is a random 64-byte hex string
- [ ] `NODE_ENV=production`
- [ ] Redis has AUTH password set
- [ ] Redis TLS enabled (if Redis is not on localhost)
- [ ] CORS origins restricted to your actual frontend domains
- [ ] HTTPS/WSS enabled (TLS termination at proxy or load balancer)
- [ ] Health check endpoint monitored
- [ ] Log shipping configured (Datadog, Loki, CloudWatch)
- [ ] Rate limiting tuned for your traffic
- [ ] Docker resource limits set (`--memory`, `--cpus`)
