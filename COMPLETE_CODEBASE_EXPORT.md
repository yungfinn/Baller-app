# Baller - Complete Codebase Export

## Project Overview
A sports event discovery platform with identity verification, real-time chat, and community safety features.

## Tech Stack
- **Frontend**: React + TypeScript, Wouter routing, TanStack Query
- **Backend**: Express.js, WebSocket, Multer file uploads
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit OpenID Connect
- **UI**: Shadcn components, Tailwind CSS

## Core Features Implemented
- Identity verification with document upload
- Event creation and management
- Real-time chat with content moderation
- Rep point system and premium features
- Admin panel for verification review
- Mobile-responsive design

## Key Files Structure

### Database Schema
- `shared/schema.ts` - Complete database schema with relations
- `server/db.ts` - Database connection configuration
- `drizzle.config.ts` - ORM configuration

### Authentication System
- `server/replitAuth.ts` - OpenID Connect setup
- `client/src/hooks/useAuth.ts` - Authentication hook
- `server/storage.ts` - User management and data operations

### Frontend Pages
- `client/src/pages/home.tsx` - Main event feed
- `client/src/pages/create-event.tsx` - Event creation with verification gate
- `client/src/pages/identity-verification.tsx` - Document upload system
- `client/src/pages/admin-panel.tsx` - Admin verification review
- `client/src/pages/event-chat.tsx` - Real-time messaging
- `client/src/pages/terms-of-use.tsx` - Legal framework

### Backend API
- `server/routes.ts` - Complete API endpoints
- `server/index.ts` - Server configuration
- File upload handling with multer middleware
- WebSocket chat implementation

### Components
- `client/src/components/event-card.tsx` - Event display
- `client/src/components/location-picker.tsx` - Location selection
- `client/src/components/bottom-navigation.tsx` - Mobile navigation
- `client/src/components/premium-pathway-popup.tsx` - User engagement

## Security Features
- Identity verification requirement for event creation
- File upload validation and processing
- Chat content moderation with banned terms
- Admin-only access controls
- Session management with PostgreSQL

## Deployment Ready
- All environment variables configured
- Database schema migrations ready
- Production error handling
- Legal disclaimers and terms of use

The complete codebase implements a production-ready sports event platform with comprehensive safety measures and verification workflows.