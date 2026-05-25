# Frontend Deployment Guide

## Vercel (Recommended)

1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Set root directory to `frontend`
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
   ```
5. Deploy

## Local Production Build

```bash
npm run build
npm start
```

## Production Recommendations

- Backend must have `CORS_ORIGINS` set to your Vercel domain
- Use `wss://` (WebSocket Secure) in production — Socket.IO handles this automatically when the server URL is `https://`
- Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to the same Railway/backend URL
