# Render Deployment Guide for CoReg Platform

## Current Server Configuration Status
✅ Server binds to IPv6 (:::PORT) for maximum compatibility
✅ Environment PORT variable support (`process.env.PORT`)
✅ Health endpoints responding correctly at `/health` and `/status`
✅ Production mode root route configured
✅ Error handling and graceful startup

## Render Deployment Instructions

### 1. Build Command
```bash
npm run build && npm run db:push
```

### 2. Start Command
```bash
npm start
```

### 3. Environment Variables Required
- `DATABASE_URL` - Your PostgreSQL database connection string
- `SESSION_SECRET` - A secure session secret (generate a random string)
- `NODE_ENV=production` (will be set automatically by Render)

### 4. Health Check Endpoints
Render will automatically detect these endpoints:
- Primary: `/health` - Returns JSON with database status
- Secondary: `/status` - Returns application status

### 5. Expected Render Behavior
1. Render assigns dynamic PORT via environment variable
2. Server binds to `0.0.0.0:PORT` (all interfaces)
3. Health check confirms service is responding
4. Deployment marked as "live"

## Troubleshooting Port Detection Issues

If Render continues to show "No open ports detected":

1. **Check Build Process**: Ensure `npm run build` completes successfully
2. **Verify Start Script**: Make sure `npm start` runs without errors
3. **Database Connection**: Confirm DATABASE_URL is properly set
4. **Port Binding**: Server automatically uses Render's assigned PORT

## Manual Testing Commands
```bash
# Test health endpoint
curl https://your-app.onrender.com/health

# Test status endpoint  
curl https://your-app.onrender.com/status

# Test root endpoint (production only)
curl https://your-app.onrender.com/
```

## Current Server Features Ready for Production
- Campaign management system
- Real-time analytics dashboard
- Widget embedding system
- Lead generation and webhook delivery
- A/B testing engine
- Admin authentication system
- PostgreSQL database integration
- Revenue tracking and reporting