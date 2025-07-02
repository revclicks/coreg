# CoReg Marketing Platform

A comprehensive co-registration advertising platform that enables advanced campaign management, precise audience targeting, and real-time performance tracking.

## Features

- **Multi-Role Access**: Advertisers, Publishers, and Admin dashboards
- **Campaign Management**: Create and manage advertising campaigns with targeting
- **Widget System**: Embeddable questionnaire widgets for external sites
- **Real-Time Analytics**: Live performance monitoring and optimization
- **A/B Testing**: Split testing for campaigns and question flows
- **Lead Generation**: Specialized lead capture and delivery system
- **Revenue Sharing**: Automated revenue tracking and distribution

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Cookie-based sessions with bcrypt
- **Build Tools**: Vite for frontend, esbuild for backend

## Quick Start (Development)

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up PostgreSQL database
4. Configure environment variables
5. Run migrations: `npm run db:push`
6. Start development server: `npm run dev`

## Production Deployment

### Automated DigitalOcean Deployment

For a completely automated setup on DigitalOcean, use our one-command installer:

```bash
curl -sSL https://raw.githubusercontent.com/yourusername/coreg-platform/main/install.sh | bash
```

This will:
- Install all dependencies (Node.js, PostgreSQL, Nginx, PM2)
- Configure the database and environment
- Set up SSL certificates with Let's Encrypt
- Configure reverse proxy and security headers
- Set up automated deployments with GitHub Actions
- Configure monitoring and log rotation

### Manual Deployment Steps

If you prefer manual setup, use the detailed setup script:

```bash
# Download the setup script
wget https://raw.githubusercontent.com/yourusername/coreg-platform/main/setup-digitalocean.sh
chmod +x setup-digitalocean.sh

# Run the setup (will prompt for configuration)
./setup-digitalocean.sh
```

### Required Information

During setup, you'll need to provide:
- Domain name (e.g., yourdomain.com)
- Email address for SSL certificate
- GitHub repository URL
- Database password (secure)
- Session secret (32+ characters)

## Post-Deployment Setup

After deployment completes:

1. **Configure GitHub Secrets** (for auto-deployment):
   - `HOST`: Your server IP address
   - `USERNAME`: Your server username  
   - `SSH_KEY`: Your private SSH key

2. **Access Your Platform**:
   - Navigate to `https://yourdomain.com`
   - Login with admin credentials
   - Configure your first campaigns and sites

3. **Update DNS Records**:
   - Point your domain to the server IP
   - Ensure both `yourdomain.com` and `www.yourdomain.com` resolve

## Management Commands

Once deployed, use these commands for management:

```bash
# Deploy updates
cd /var/www/coreg-platform && ./deploy.sh

# View application logs
pm2 logs coreg-platform

# Restart application
pm2 restart coreg-platform

# Monitor system health
cd /var/www/coreg-platform && ./monitor.sh

# Check service status
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
```

## Environment Variables

Required environment variables for production:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/database
SESSION_SECRET=your_super_secure_session_secret_here
PORT=3000
DOMAIN=yourdomain.com
```

## Widget Integration

To embed widgets on external sites:

1. Navigate to Site Manager in the admin dashboard
2. Create a new site configuration
3. Generate widget code
4. Copy the provided embed code to your website

Example widget embed:
```html
<script src="https://yourdomain.com/widget.js" 
        data-site="your-site-code"></script>
```

## API Documentation

The platform provides RESTful APIs for:
- Campaign management
- Site configuration
- Analytics and reporting
- User management
- Widget integration

## Security Features

- SSL/TLS encryption with automatic renewal
- Security headers (XSS, CSRF protection)
- Rate limiting on API endpoints
- Input validation and sanitization
- Role-based access control
- Secure session management

## Monitoring and Maintenance

The automated setup includes:
- Health monitoring every 5 minutes
- Automatic log rotation
- Process restart on failures
- SSL certificate auto-renewal
- System resource monitoring

## Support and Contributing

For issues or feature requests, please create an issue in the GitHub repository.

## License

[Add your license information here]