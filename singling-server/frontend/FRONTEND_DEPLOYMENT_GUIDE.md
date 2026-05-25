# Frontend Deployment Guide

## Vercel

1. Deploy `frontend` directory to Vercel.
2. Add env vars:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain
NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain
```

3. Ensure backend `CORS_ORIGINS` includes your Vercel URL.

## Local Production Build

```bash
npm run build
npm start
```

## Production Checklist

- Frontend and backend are both on HTTPS.
- Socket URL matches backend public domain.
- Browser permissions are enabled for camera/mic.
- TURN is configured for restrictive NAT networks.
