import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertEventSchema, insertUserPreferencesSchema, insertRsvpSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Rep point routes
  app.get('/api/user/rep-points', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const repPoints = await storage.getUserRepPoints(userId);
      res.json({ repPoints });
    } catch (error) {
      console.error("Error fetching rep points:", error);
      res.status(500).json({ message: "Failed to fetch rep points" });
    }
  });

  app.get('/api/user/premium-access/:feature', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const feature = req.params.feature;
      const hasAccess = await storage.checkPremiumAccess(userId, feature);
      res.json({ hasAccess });
    } catch (error) {
      console.error("Error checking premium access:", error);
      res.status(500).json({ message: "Failed to check premium access" });
    }
  });

  // Mapbox token endpoint
  app.get('/api/mapbox-token', async (req, res) => {
    try {
      res.json({ token: process.env.MAPBOX_ACCESS_TOKEN || "" });
    } catch (error) {
      console.error("Error fetching Mapbox token:", error);
      res.status(500).json({ message: "Failed to fetch Mapbox token" });
    }
  });

  // User stats route for rep dashboard
  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const repPoints = await storage.getUserRepPoints(userId);
      res.json({ repPoints });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // User hosted events route
  app.get('/api/events/host/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const events = await storage.getEventsByHost(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching hosted events:", error);
      res.status(500).json({ message: "Failed to fetch hosted events" });
    }
  });

  // User RSVP route
  app.get('/api/user/rsvps', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rsvps = await storage.getRsvpsByUser(userId);
      res.json(rsvps);
    } catch (error) {
      console.error("Error fetching user RSVPs:", error);
      res.status(500).json({ message: "Failed to fetch user RSVPs" });
    }
  });

  // User preferences routes
  app.put('/api/user/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = insertUserPreferencesSchema.parse(req.body);
      
      const user = await storage.updateUserPreferences(userId, preferences);
      res.json(user);
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(400).json({ message: "Invalid preferences data" });
    }
  });

  // Verification routes
  app.post('/api/verification/upload', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { documentType, fileName, fileUrl } = req.body;
      
      const document = await storage.uploadVerificationDocument({
        userId,
        documentType,
        fileName,
        fileUrl,
      });
      
      res.json(document);
    } catch (error) {
      console.error("Error uploading verification document:", error);
      res.status(500).json({ message: "Failed to upload verification document" });
    }
  });

  app.get('/api/verification/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getUserVerificationDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching verification documents:", error);
      res.status(500).json({ message: "Failed to fetch verification documents" });
    }
  });

  app.patch('/api/verification/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status } = req.body;
      
      const user = await storage.updateVerificationStatus(userId, status);
      res.json(user);
    } catch (error) {
      console.error("Error updating verification status:", error);
      res.status(500).json({ message: "Failed to update verification status" });
    }
  });

  // Event routes
  app.get('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sport, skill, view, latitude, longitude, radius } = req.query;
      
      const filters = {
        sportType: sport || undefined,
        skillLevel: skill || undefined,
        excludeSwipedByUser: view === 'swipe' ? userId : undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        radius: radius ? parseFloat(radius) : undefined,
      };
      
      const events = await storage.getEvents(filters);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const event = await storage.getEventById(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user has premium access for same-day events
      const eventDate = new Date(req.body.eventDate);
      const today = new Date();
      const isSameDay = eventDate.toDateString() === today.toDateString();
      
      if (isSameDay) {
        const hasAccess = await storage.checkPremiumAccess(userId, 'same_day_events');
        if (!hasAccess) {
          return res.status(403).json({ 
            message: "Events for today require Premium access. Try scheduling for tomorrow or earn more rep points to upgrade your account.",
            type: "premium_required",
            feature: "same_day_events"
          });
        }
      }
      
      const eventData = insertEventSchema.parse({
        ...req.body,
        hostId: userId,
      });
      
      const event = await storage.createEvent(eventData);
      
      // Award rep points for hosting an event
      await storage.addRepPoints(
        userId, 
        'event_hosted', 
        15, 
        event.id, 
        `Hosted event: ${event.title}`
      );
      
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.get('/api/events/host/:hostId', isAuthenticated, async (req: any, res) => {
    try {
      const hostId = req.params.hostId;
      const events = await storage.getEventsByHost(hostId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching host events:", error);
      res.status(500).json({ message: "Failed to fetch host events" });
    }
  });

  app.put('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if user is the host
      const event = await storage.getEventById(eventId);
      if (!event || event.hostId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this event" });
      }
      
      const updates = req.body;
      const updatedEvent = await storage.updateEvent(eventId, updates);
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(400).json({ message: "Failed to update event" });
    }
  });

  app.delete('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if user is the host
      const event = await storage.getEventById(eventId);
      if (!event || event.hostId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this event" });
      }
      
      await storage.deleteEvent(eventId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // RSVP routes
  app.post('/api/events/:id/rsvp', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { status } = req.body;
      
      const rsvp = await storage.createRsvp({
        eventId,
        userId,
        status: status || 'interested',
      });
      
      // Award rep points for joining an event
      if (status === 'going') {
        const event = await storage.getEventById(eventId);
        await storage.addRepPoints(
          userId, 
          'event_joined', 
          5, 
          eventId, 
          `Joined event: ${event?.title || 'Unknown'}`
        );
      }
      
      res.status(201).json(rsvp);
    } catch (error) {
      console.error("Error creating RSVP:", error);
      res.status(400).json({ message: "Failed to create RSVP" });
    }
  });

  app.get('/api/events/:id/rsvps', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const rsvps = await storage.getRsvpsByEvent(eventId);
      res.json(rsvps);
    } catch (error) {
      console.error("Error fetching RSVPs:", error);
      res.status(500).json({ message: "Failed to fetch RSVPs" });
    }
  });

  app.get('/api/user/rsvps', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rsvps = await storage.getRsvpsByUser(userId);
      res.json(rsvps);
    } catch (error) {
      console.error("Error fetching user RSVPs:", error);
      res.status(500).json({ message: "Failed to fetch user RSVPs" });
    }
  });

  app.delete('/api/events/:id/rsvp', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      await storage.deleteRsvp(eventId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting RSVP:", error);
      res.status(500).json({ message: "Failed to delete RSVP" });
    }
  });

  // Swipe routes
  app.post('/api/events/:id/swipe', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { direction } = req.body;
      
      if (!['left', 'right'].includes(direction)) {
        return res.status(400).json({ message: "Invalid swipe direction" });
      }
      
      const swipe = await storage.recordSwipe(userId, eventId, direction);
      res.status(201).json(swipe);
    } catch (error) {
      console.error("Error recording swipe:", error);
      res.status(400).json({ message: "Failed to record swipe" });
    }
  });

  app.get('/api/user/swipes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const swipes = await storage.getUserSwipes(userId);
      res.json(swipes);
    } catch (error) {
      console.error("Error fetching swipes:", error);
      res.status(500).json({ message: "Failed to fetch swipes" });
    }
  });

  // Location submission routes
  app.post("/api/locations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const locationData = { ...req.body, submittedBy: userId };

      const location = await storage.submitLocation(locationData);
      res.json(location);
    } catch (error) {
      console.error("Error submitting location:", error);
      res.status(500).json({ message: "Failed to submit location" });
    }
  });

  app.get("/api/locations", isAuthenticated, async (req: any, res) => {
    try {
      const { status, locationType, submittedBy } = req.query;
      const locations = await storage.getLocations({
        status: status as string,
        locationType: locationType as string,
        submittedBy: submittedBy as string,
      });
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  // Admin routes
  app.get("/api/admin/locations", isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.query;
      const locations = await storage.getLocations({ 
        status: status as string || "pending" 
      });
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations for admin:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.post("/api/admin/locations/:id/review", isAuthenticated, async (req: any, res) => {
    try {
      const locationId = parseInt(req.params.id);
      const { status, reviewNotes } = req.body;
      const reviewerId = req.user.claims.sub;

      const location = await storage.updateLocationStatus(
        locationId, 
        status, 
        reviewNotes, 
        reviewerId
      );
      
      res.json(location);
    } catch (error) {
      console.error("Error reviewing location:", error);
      res.status(500).json({ message: "Failed to review location" });
    }
  });

  app.get("/api/admin/verification-documents", isAuthenticated, async (req: any, res) => {
    try {
      // Get all pending verification documents - we'll need to enhance storage method
      const documents: any[] = []; // Placeholder for now
      res.json(documents);
    } catch (error) {
      console.error("Error fetching verification documents:", error);
      res.status(500).json({ message: "Failed to fetch verification documents" });
    }
  });

  app.post("/api/admin/users/:userId/verification", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { status, reviewNotes } = req.body;
      const reviewerId = req.user.claims.sub;

      const user = await storage.updateVerificationStatus(
        userId, 
        status, 
        reviewNotes, 
        reviewerId
      );
      
      res.json(user);
    } catch (error) {
      console.error("Error updating verification status:", error);
      res.status(500).json({ message: "Failed to update verification status" });
    }
  });

  // Event Messages/Chat routes
  app.get('/api/events/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      // Check if event exists and user has access (is host or has RSVP)
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const userId = req.user.claims.sub;
      const userRsvps = await storage.getRsvpsByUser(userId);
      const isHost = event.hostId === userId;
      const hasRsvp = userRsvps.some(rsvp => rsvp.eventId === eventId);

      if (!isHost && !hasRsvp) {
        return res.status(403).json({ message: "Access denied to event chat" });
      }

      // Return empty array for now - will implement database storage
      res.json([]);
    } catch (error) {
      console.error("Error fetching event messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/events/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { message } = req.body;
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Check if event exists and user has access
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const userRsvps = await storage.getRsvpsByUser(userId);
      const isHost = event.hostId === userId;
      const hasRsvp = userRsvps.some(rsvp => rsvp.eventId === eventId);

      if (!isHost && !hasRsvp) {
        return res.status(403).json({ message: "Access denied to event chat" });
      }

      // Get user info for the message
      const user = await storage.getUser(userId);
      
      // Return message with user info
      const messageResponse = {
        id: Date.now(),
        eventId,
        userId,
        message: message.trim(),
        createdAt: new Date(),
        user: {
          id: user?.id,
          firstName: user?.firstName,
          lastName: user?.lastName,
          profileImageUrl: user?.profileImageUrl
        }
      };

      res.status(201).json(messageResponse);
    } catch (error) {
      console.error("Error posting message:", error);
      res.status(500).json({ message: "Failed to post message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
