# Baller - Sports Event Discovery Platform
## Complete Codebase Documentation

A dynamic sports event discovery and management platform that empowers users to create, join, and interact with local sporting events through an intelligent, user-friendly interface.

## Tech Stack
- React frontend with TypeScript
- Express backend with robust API routes
- WebSocket for real-time interactions
- PostgreSQL with Drizzle ORM
- Shadcn UI components
- Responsive mobile-first design
- Advanced user verification system with admin panel

## Project Structure

```
baller/
├── client/src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── bottom-navigation.tsx
│   │   ├── event-card.tsx
│   │   ├── grid-view.tsx
│   │   ├── location-picker.tsx
│   │   ├── premium-pathway-popup.tsx
│   │   ├── skill-badge.tsx
│   │   └── swipe-view.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   └── useAuth.ts
│   ├── lib/
│   │   ├── queryClient.ts
│   │   ├── swipe-utils.ts
│   │   └── utils.ts
│   └── pages/
│       ├── admin-panel.tsx
│       ├── create-event.tsx
│       ├── event-chat.tsx
│       ├── event-created.tsx
│       ├── home.tsx
│       ├── identity-verification.tsx
│       ├── landing.tsx
│       ├── my-events.tsx
│       ├── not-found.tsx
│       ├── preferences.tsx
│       ├── profile.tsx
│       ├── submit-location.tsx
│       ├── terms-of-use.tsx
│       └── verify-identity.tsx
├── server/
│   ├── index.ts
│   ├── db.ts
│   ├── routes.ts
│   ├── storage.ts
│   ├── replitAuth.ts
│   └── vite.ts
├── shared/
│   └── schema.ts
├── package.json
├── tailwind.config.ts
├── vite.config.ts
├── drizzle.config.ts
└── components.json
```

## Core Features

### Authentication & Authorization
- Replit OpenID Connect integration
- Session-based authentication
- Admin role protection
- Automatic session refresh

### Identity Verification System
- Document upload (selfie + government ID)
- Manual admin review process
- Status tracking (pending, approved, rejected)
- Premium pathway unlock system

### Event Management
- Create/join/manage sporting events
- Tinder-style swipe discovery
- Real-time event chat via WebSocket
- Location-based event filtering
- RSVP system with status tracking

### Premium System
- Rep points for user activities
- Tier progression (free → premium → pro)
- Premium pathway: verification + create event + join event
- Feature gating based on user tier

### Admin Panel
- User verification review
- Event moderation
- Location approval
- User management

### Location System
- Manual location submission
- Admin curation for beta launch
- Location type categorization
- Public space verification

## Database Schema

The application uses PostgreSQL with Drizzle ORM. Key tables:

- **users**: User profiles, preferences, verification status
- **events**: Sports events with location and timing
- **event_rsvps**: User event participation
- **user_swipes**: Swipe history for discovery
- **verification_documents**: Identity verification files
- **locations**: Venue submissions and approvals
- **event_messages**: Real-time chat messages
- **rep_activities**: Point tracking for user engagement
- **sessions**: Authentication session storage

## Getting Started

1. **Environment Setup**
   - Set up PostgreSQL database
   - Configure Replit authentication
   - Set required environment variables

2. **Database Migration**
   ```bash
   npm run db:push
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```

4. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## Key Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit application ID
- `REPLIT_DOMAINS`: Allowed domains for auth

## Security Features
- Identity verification requirement
- Admin-only routes protection
- CSRF protection via sessions
- Secure file upload handling
- XSS prevention

## Real-Time Features
- WebSocket chat in events
- Live user activity updates
- Real-time RSVP notifications

## Mobile-First Design
- Progressive Web App capabilities
- Touch-optimized swipe gestures
- Responsive layout for all screen sizes
- Bottom navigation for mobile UX

This codebase represents a production-ready sports event platform with comprehensive user management, real-time features, and robust security measures.