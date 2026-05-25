# Deployment Guide

## Railway

1. Deploy backend service.
2. Provision Redis.
3. Configure env vars.

Required:

```env
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
CORS_ORIGINS=https://your-frontend-domain
REDIS_HOST=<redis-host>
REDIS_PORT=<redis-port>
REDIS_PASSWORD=<redis-password-if-any>
```

## Docker

```bash
docker build -t signaling-server .
docker run -p 3000:3000 --env-file .env signaling-server
```

## Production Checklist

- HTTPS/WSS enabled
- CORS set to known frontend domains only
- Redis reachable from backend
- Health checks configured
- Log aggregation configured
