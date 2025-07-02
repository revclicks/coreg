#!/bin/bash

# CoReg Platform - Automated DigitalOcean Setup Script
# This script fully automates the deployment to a fresh Ubuntu 22.04 server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="coreg-platform"
APP_DIR="/var/www/$APP_NAME"
DB_NAME="coreg_platform"
DB_USER="coreg_user"
NGINX_AVAILABLE="/etc/nginx/sites-available/$APP_NAME"
NGINX_ENABLED="/etc/nginx/sites-enabled/$APP_NAME"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Get configuration from user
get_configuration() {
    print_status "=== CoReg Platform Setup Configuration ==="
    
    read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN_NAME
    read -p "Enter your email for SSL certificate: " SSL_EMAIL
    read -p "Enter GitHub repository URL (https://github.com/user/repo.git): " GITHUB_REPO
    read -s -p "Enter database password: " DB_PASSWORD
    echo
    read -s -p "Enter session secret (32+ characters): " SESSION_SECRET
    echo
    
    # Validate inputs
    if [[ -z "$DOMAIN_NAME" || -z "$SSL_EMAIL" || -z "$GITHUB_REPO" || -z "$DB_PASSWORD" || -z "$SESSION_SECRET" ]]; then
        print_error "All fields are required!"
        exit 1
    fi
    
    if [[ ${#SESSION_SECRET} -lt 32 ]]; then
        print_error "Session secret must be at least 32 characters long!"
        exit 1
    fi
    
    print_success "Configuration collected successfully!"
}

# Update system packages
update_system() {
    print_status "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    print_success "System updated successfully!"
}

# Install Node.js 20
install_nodejs() {
    print_status "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    print_success "Node.js $node_version and npm $npm_version installed!"
}

# Install and configure PostgreSQL
setup_postgresql() {
    print_status "Installing and configuring PostgreSQL..."
    sudo apt install postgresql postgresql-contrib -y
    
    # Start and enable PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"
    
    print_success "PostgreSQL configured with database: $DB_NAME"
}

# Install additional tools
install_tools() {
    print_status "Installing additional tools..."
    
    # PM2 for process management
    sudo npm install -g pm2
    
    # Nginx for reverse proxy
    sudo apt install nginx -y
    
    # Git
    sudo apt install git -y
    
    # Certbot for SSL
    sudo apt install certbot python3-certbot-nginx -y
    
    print_success "Tools installed successfully!"
}

# Setup application directory and clone repository
setup_application() {
    print_status "Setting up application..."
    
    # Create app directory
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
    
    # Clone repository
    git clone $GITHUB_REPO $APP_DIR
    cd $APP_DIR
    
    # Install dependencies
    npm install
    
    print_success "Application cloned and dependencies installed!"
}

# Create environment configuration
create_environment() {
    print_status "Creating environment configuration..."
    
    cat > $APP_DIR/.env.production << EOF
NODE_ENV=production
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
SESSION_SECRET=$SESSION_SECRET
PORT=3000
DOMAIN=$DOMAIN_NAME
EOF
    
    print_success "Environment configuration created!"
}

# Create PM2 ecosystem file
create_pm2_config() {
    print_status "Creating PM2 configuration..."
    
    cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: './dist/server/index.js',
    cwd: '$APP_DIR',
    env_file: '.env.production',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
    
    # Create logs directory
    mkdir -p $APP_DIR/logs
    
    print_success "PM2 configuration created!"
}

# Build and start application
build_and_start() {
    print_status "Building and starting application..."
    
    cd $APP_DIR
    
    # Build the application
    npm run build
    
    # Run database migrations
    npm run db:push
    
    # Start with PM2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup ubuntu -u $USER --hp /home/$USER
    
    print_success "Application built and started!"
}

# Configure Nginx
configure_nginx() {
    print_status "Configuring Nginx..."
    
    sudo tee $NGINX_AVAILABLE > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Static files
    location /static/ {
        alias $APP_DIR/dist/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }

    # Widget files with CORS
    location ~* \.(js|css)$ {
        root $APP_DIR/public;
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type";
        expires 1d;
        add_header Cache-Control "public";
    }

    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
EOF

    # Enable site
    sudo ln -sf $NGINX_AVAILABLE $NGINX_ENABLED
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and restart Nginx
    sudo nginx -t
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    print_success "Nginx configured successfully!"
}

# Setup SSL certificate
setup_ssl() {
    print_status "Setting up SSL certificate..."
    
    # Get SSL certificate
    sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --email $SSL_EMAIL --agree-tos --non-interactive --redirect
    
    # Setup auto-renewal
    sudo systemctl enable certbot.timer
    
    print_success "SSL certificate configured!"
}

# Create deployment script
create_deploy_script() {
    print_status "Creating deployment script..."
    
    cat > $APP_DIR/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Navigate to app directory
cd /var/www/coreg-platform

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run database migrations
npm run db:push

# Build application
npm run build

# Restart PM2
pm2 restart coreg-platform

# Reload Nginx
sudo nginx -s reload

echo "✅ Deployment completed successfully!"
EOF

    chmod +x $APP_DIR/deploy.sh
    
    print_success "Deployment script created!"
}

# Setup log rotation
setup_log_rotation() {
    print_status "Setting up log rotation..."
    
    sudo tee /etc/logrotate.d/$APP_NAME > /dev/null << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    print_success "Log rotation configured!"
}

# Setup firewall
setup_firewall() {
    print_status "Configuring firewall..."
    
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    sudo ufw --force enable
    
    print_success "Firewall configured!"
}

# Create monitoring script
create_monitoring() {
    print_status "Setting up monitoring..."
    
    cat > $APP_DIR/monitor.sh << 'EOF'
#!/bin/bash

# Check if PM2 process is running
if ! pm2 list | grep -q "coreg-platform"; then
    echo "⚠️  PM2 process not found, restarting..."
    cd /var/www/coreg-platform
    pm2 start ecosystem.config.js
fi

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "⚠️  Nginx is down, restarting..."
    sudo systemctl restart nginx
fi

# Check disk space
disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $disk_usage -gt 85 ]; then
    echo "⚠️  Disk usage is at ${disk_usage}%"
fi

# Check memory usage
memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $memory_usage -gt 85 ]; then
    echo "⚠️  Memory usage is at ${memory_usage}%"
fi

echo "✅ System health check completed"
EOF

    chmod +x $APP_DIR/monitor.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * $APP_DIR/monitor.sh >> $APP_DIR/logs/monitor.log 2>&1") | crontab -
    
    print_success "Monitoring setup completed!"
}

# Create GitHub Actions workflow
create_github_actions() {
    print_status "Creating GitHub Actions workflow..."
    
    mkdir -p $APP_DIR/.github/workflows
    
    cat > $APP_DIR/.github/workflows/deploy.yml << EOF
name: Deploy to DigitalOcean

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.8
      with:
        host: \${{ secrets.HOST }}
        username: \${{ secrets.USERNAME }}
        key: \${{ secrets.SSH_KEY }}
        script: |
          cd $APP_DIR
          ./deploy.sh
EOF
    
    print_success "GitHub Actions workflow created!"
}

# Final setup and verification
final_setup() {
    print_status "Performing final setup..."
    
    # Verify services
    if pm2 list | grep -q "$APP_NAME"; then
        print_success "PM2 process is running"
    else
        print_warning "PM2 process may not be running correctly"
    fi
    
    if systemctl is-active --quiet nginx; then
        print_success "Nginx is running"
    else
        print_warning "Nginx may not be running correctly"
    fi
    
    if systemctl is-active --quiet postgresql; then
        print_success "PostgreSQL is running"
    else
        print_warning "PostgreSQL may not be running correctly"
    fi
    
    print_success "Final setup completed!"
}

# Main execution
main() {
    echo -e "${GREEN}"
    echo "================================================================"
    echo "    CoReg Platform - Automated DigitalOcean Setup"
    echo "================================================================"
    echo -e "${NC}"
    
    get_configuration
    update_system
    install_nodejs
    setup_postgresql
    install_tools
    setup_application
    create_environment
    create_pm2_config
    build_and_start
    configure_nginx
    setup_ssl
    create_deploy_script
    setup_log_rotation
    setup_firewall
    create_monitoring
    create_github_actions
    final_setup
    
    echo -e "${GREEN}"
    echo "================================================================"
    echo "🎉 SETUP COMPLETED SUCCESSFULLY! 🎉"
    echo "================================================================"
    echo -e "${NC}"
    echo
    echo "Your CoReg Platform is now running at:"
    echo "🌐 https://$DOMAIN_NAME"
    echo
    echo "Useful commands:"
    echo "• View logs: pm2 logs $APP_NAME"
    echo "• Restart app: pm2 restart $APP_NAME"
    echo "• Deploy updates: cd $APP_DIR && ./deploy.sh"
    echo "• Monitor system: cd $APP_DIR && ./monitor.sh"
    echo
    echo "Next steps:"
    echo "1. Add these secrets to your GitHub repository:"
    echo "   - HOST: $(curl -s ifconfig.me)"
    echo "   - USERNAME: $USER"
    echo "   - SSH_KEY: (your private SSH key)"
    echo "2. Push to main branch to trigger auto-deployment"
    echo "3. Access your platform at https://$DOMAIN_NAME"
    echo
    print_success "Setup completed! Your platform is ready for production use."
}

# Run main function
main "$@"