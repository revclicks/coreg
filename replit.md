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

## Changelog

- June 12, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.