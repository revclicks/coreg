# Railway Deployment Guide for CoReg Platform

## Railway vs Render Advantages
✅ Better port detection and binding
✅ More reliable PostgreSQL integration
✅ Simpler deployment process
✅ Better environment variable management
✅ Auto-scaling and better performance

## Deployment Steps

### 1. Create Railway Project
```bash
# Connect your GitHub repository to Railway
# Railway will automatically detect Node.js project
```

### 2. Build and Start Commands
Railway auto-detects from package.json, but you can override:
- **Build Command**: `npm run build && npm run db:push`
- **Start Command**: `npm start`

### 3. Environment Variables Setup
In Railway dashboard, add these variables:
- `DATABASE_URL` - Railway PostgreSQL connection string (auto-provided if you add PostgreSQL service)
- `SESSION_SECRET` - Generate a secure random string (32+ characters)
- `NODE_ENV` - Set to `production`

### 4. PostgreSQL Database
Railway option 1 (Recommended):
- Add PostgreSQL service in Railway dashboard
- DATABASE_URL will be automatically provided

Railway option 2 (External):
- Use your existing database
- Set DATABASE_URL manually

### 5. Domain Configuration
Railway provides:
- Automatic subdomain: `your-app.up.railway.app`
- Custom domain support available

## Current Server Configuration
Your server is already optimized for Railway:
- ✅ IPv6 binding (`:::PORT`) for Railway compatibility
- ✅ PORT environment variable detection
- ✅ Health endpoints for monitoring
- ✅ Production build configuration

## Railway-Specific Features Ready
- **Auto-scaling**: Traffic-based scaling
- **Monitoring**: Built-in metrics and logging
- **PostgreSQL**: Managed database with backups
- **SSL**: Automatic HTTPS certificates
- **Environment**: Production-ready hosting

## Expected Deployment Process
1. Push code to GitHub
2. Connect repository to Railway
3. Add PostgreSQL service (if needed)
4. Set SESSION_SECRET environment variable
5. Deploy automatically triggers
6. Health checks confirm service is live

## Post-Deployment Verification
```bash
# Test your deployed application
curl https://your-app.up.railway.app/health
curl https://your-app.up.railway.app/status
```

## Railway Advantages for CoReg Platform
- **Database**: Managed PostgreSQL with automatic backups
- **Performance**: Better for real-time analytics and widget serving
- **Reliability**: 99.9% uptime SLA
- **Scaling**: Automatic scaling for traffic spikes during campaigns
- **Monitoring**: Built-in application and database monitoring