# CoReg Marketing Platform

## Overview

This is a full-stack Co-Registration marketing platform built with Node.js, React, TypeScript, and PostgreSQL. The platform enables publishers to embed questionnaire widgets on their websites and monetize user responses through targeted advertising campaigns. It features real-time analytics, A/B testing, audience segmentation, and lead generation capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Components**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful APIs with structured JSON responses
- **Session Management**: Express sessions with PostgreSQL storage
- **Authentication**: Cookie-based authentication with bcrypt password hashing
- **File Structure**: Monorepo with shared schema and types

### Database Layer
- **Primary Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM with schema-first approach
- **Migrations**: Drizzle Kit for database migrations
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Widget System
- **Embedded Widgets**: JavaScript widgets for external site integration
- **Flow Management**: Progressive, minimal, and front-loaded question flows
- **Lead Collection**: Specialized lead generation widgets
- **Real-time Tracking**: User interaction and behavior analytics

### Campaign Management
- **Campaign Types**: Standard advertising and lead generation campaigns
- **Targeting**: Demographic, behavioral, and question-based targeting
- **RTB Integration**: Real-time bidding engine for ad placements
- **Performance Tracking**: Click-through rates, conversion tracking, and revenue metrics

### Analytics Engine
- **Real-time Analytics**: Live campaign and question performance monitoring
- **A/B Testing**: Split testing for campaigns and question flows
- **Audience Segmentation**: Behavioral and demographic user segmentation
- **Personalization**: AI-driven content optimization

### Admin Dashboard
- **Campaign Management**: Create, edit, and monitor advertising campaigns
- **Question Optimization**: Auto-optimization based on performance metrics
- **Site Management**: Publisher site configuration and widget generation
- **Data Export**: User data collection and export capabilities

## Data Flow

1. **Widget Initialization**: External sites load JavaScript widgets
2. **Session Creation**: User sessions tracked with unique identifiers
3. **Question Flow**: Users answer targeted questions based on flow configuration
4. **Ad Serving**: RTB engine serves relevant campaigns based on responses
5. **Conversion Tracking**: Click and conversion events tracked for analytics
6. **Data Processing**: Real-time analytics and optimization algorithms
7. **Lead Delivery**: Qualified leads delivered via webhooks to campaign partners

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: TypeScript ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **bcryptjs**: Password hashing and validation
- **nanoid**: Unique identifier generation

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **tailwindcss**: Utility-first CSS framework
- **@hookform/resolvers**: Form validation with Zod schemas

### Analytics & Tracking
- **recharts**: Data visualization components
- **date-fns**: Date manipulation utilities
- **ws**: WebSocket support for real-time features

## Deployment Strategy

### Development Environment
- **Runtime**: Replit with Node.js 20 module
- **Database**: PostgreSQL 16 module with automatic provisioning
- **Development Server**: Vite dev server on port 5000
- **Hot Reload**: Automatic code reloading during development

### Production Build
- **Build Process**: Vite builds client, esbuild bundles server
- **Output**: Static assets in `dist/public`, server bundle in `dist/`
- **Deployment**: Autoscale deployment target with external port 80
- **Environment**: Production Node.js runtime with optimized builds

### Database Management
- **Schema**: Shared schema definitions in TypeScript
- **Migrations**: Automated migrations via Drizzle Kit
- **Connection**: Environment-based DATABASE_URL configuration

## Deployment Strategy

### Automated DigitalOcean Setup
- **Complete automation**: One-command installer handles entire server setup
- **Installation script**: `setup-digitalocean.sh` - fully automated deployment
- **Quick installer**: `install.sh` - downloads and runs main setup script
- **GitHub Actions**: Automated deployment on push to main branch
- **SSL/Security**: Automatic Let's Encrypt certificates and security headers
- **Monitoring**: Built-in health checks and log rotation

### Production Configuration
- **Server Requirements**: Ubuntu 22.04 LTS (minimum 2GB RAM, 1 CPU)
- **Tech Stack**: Node.js 20, PostgreSQL, Nginx, PM2, Certbot
- **Security**: Firewall, SSL certificates, security headers, rate limiting
- **Monitoring**: PM2 process management, log rotation, health checks

### Deployment Commands
- **Initial setup**: `curl -sSL https://raw.githubusercontent.com/user/repo/main/install.sh | bash`
- **Updates**: `cd /var/www/coreg-platform && ./deploy.sh`
- **Monitoring**: `pm2 logs coreg-platform`, `./monitor.sh`
- **Management**: `pm2 restart coreg-platform`, `sudo systemctl status nginx`

## Deployment Strategy

### Railway Deployment (Recommended)
- **Platform**: Railway.app for production hosting
- **Configuration**: Optimized server binding with IPv6 support (`:::PORT`)
- **Health Checks**: `/health` and `/status` endpoints for monitoring
- **Database**: Railway PostgreSQL service with automatic connection
- **Build Process**: `npm run build && npm run db:push`
- **Environment**: Production Node.js with automatic scaling

### Railway Configuration Files
- `railway.json` - Deployment configuration with health checks
- `railway-deploy.md` - Complete deployment guide
- Environment variables: `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`

## Changelog

- January 7, 2025. Added Railway deployment configuration with optimized health checks and build process
- January 7, 2025. Created railway.json configuration file for automated deployment
- January 7, 2025. Fixed port binding architecture - properly create HTTP server with Express app binding for external accessibility
- January 7, 2025. Updated Express server to use environment PORT variable with 0.0.0.0 binding for deployment compatibility
- January 7, 2025. Added HTTP routes for web service detection by hosting platforms (Render, Cloudways, etc.)
- January 7, 2025. Fixed admin seeding logic to handle existing admins gracefully
- January 7, 2025. Added health check endpoint (/health) for deployment monitoring
- January 7, 2025. Improved error handling to prevent deployment failures on duplicate admin creation
- January 2, 2025. Fixed progressive flow logic to show all 5 ads properly
- January 2, 2025. Fixed site manager page JavaScript error with null safety
- January 2, 2025. Created automated DigitalOcean deployment scripts
- June 12, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.