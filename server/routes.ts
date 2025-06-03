import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertEventSchema, insertUserPreferencesSchema, insertRsvpSchema } from "@shared/schema";
import { db } from "./db";
import { users, verificationDocuments, events, eventRsvps, eventMessages, userSwipes } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import { z } from "zod";
import multer from "multer";
import { promises as fs } from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Configure multer for file uploads
  const storage_config = multer.memoryStorage();
  const upload = multer({ 
    storage: storage_config,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Manual session deserialization middleware for multipart requests
  app.use(async (req: any, res, next) => {
    if (req.session?.passport?.user && !req.user) {
      try {
        const userId = req.session.passport.user.claims?.sub || req.session.passport.user;
        const user = await storage.getUser(userId);
        if (user) {
          req.user = {
            claims: { sub: user.id, email: user.email },
            expires_at: req.session.passport.user.expires_at
          };
        }
      } catch (err) {
        console.error("Manual deserialization failed", err);
      }
    }
    next();
  });

  // Development verification upload endpoint (bypasses auth for testing)
  app.post('/api/verification/upload-dev', upload.fields([
    { name: 'selfie', maxCount: 1 },
    { name: 'governmentId', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const userId = "43019661"; // Test user ID for development
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      console.log("Dev upload received:", { userId, files: Object.keys(files) });
      
      if (!files.selfie || !files.governmentId) {
        return res.status(400).json({ message: "Both selfie and government ID files are required" });
      }

      const selfieFile = files.selfie[0];
      const idFile = files.governmentId[0];

      // Create upload directories
      const uploadDir = path.join(process.cwd(), 'uploads', 'verification');
      const selfieDir = path.join(uploadDir, 'selfie');
      const idDir = path.join(uploadDir, 'id');
      
      await fs.mkdir(selfieDir, { recursive: true });
      await fs.mkdir(idDir, { recursive: true });

      // Generate unique filenames
      const timestamp = Date.now();
      const selfieFilename = `${userId}_${timestamp}_${selfieFile.originalname}`;
      const idFilename = `${userId}_${timestamp}_${idFile.originalname}`;
      
      const selfiePath = path.join(selfieDir, selfieFilename);
      const idPath = path.join(idDir, idFilename);

      // Save files
      await fs.writeFile(selfiePath, selfieFile.buffer);
      await fs.writeFile(idPath, idFile.buffer);

      // Store in database
      const selfieDoc = await storage.uploadVerificationDocument({
        userId,
        documentType: "selfie",
        fileName: selfieFile.originalname,
        fileUrl: `/uploads/verification/selfie/${selfieFilename}`
      });

      const idDoc = await storage.uploadVerificationDocument({
        userId,
        documentType: "government_id", 
        fileName: idFile.originalname,
        fileUrl: `/uploads/verification/id/${idFilename}`
      });

      // Update user verification status
      await storage.updateVerificationStatus(userId, "pending");

      res.status(201).json({
        selfie: selfieDoc,
        governmentId: idDoc,
        message: "Verification documents uploaded successfully"
      });

    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed. Please try again." });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        // Create user if doesn't exist
        const newUser = await storage.upsertUser({
          id: userId,
          email: req.user.claims.email,
          firstName: req.user.claims.first_name,
          lastName: req.user.claims.last_name,
          profileImageUrl: req.user.claims.profile_image_url,
        });
        return res.json(newUser);
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin access verification route
  app.get('/api/auth/admin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isUserAdmin = await storage.isUserAdmin(userId);
      
      if (!isUserAdmin) {
        return res.status(403).json({ message: "Admin access denied" });
      }
      
      res.json({ isAdmin: true, email: req.user.claims.email });
    } catch (error) {
      console.error("Error verifying admin status:", error);
      res.status(500).json({ message: "Failed to verify admin status" });
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

  // Verification routes - development mode with authentication bypass
  app.post('/api/verification/upload', upload.fields([
    { name: 'selfie', maxCount: 1 },
    { name: 'governmentId', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      // Development mode: Allow uploads without authentication for testing
      const userId = "43019661"; // Test user ID
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      console.log("Received verification upload:", { userId, files: Object.keys(files) });
      
      if (!files.selfie || !files.governmentId) {
        return res.status(400).json({ message: "Both selfie and government ID files are required" });
      }
      
      const selfieFile = files.selfie[0];
      const idFile = files.governmentId[0];
      
      // Create selfie document
      const selfieDoc = await storage.uploadVerificationDocument({
        userId,
        documentType: "selfie",
        fileName: selfieFile.originalname,
        fileUrl: `/uploads/verification/selfie/${userId}_${Date.now()}_${selfieFile.originalname}`,
        reviewStatus: "pending",
      });
      
      // Create government ID document
      const idDoc = await storage.uploadVerificationDocument({
        userId,
        documentType: "government_id",
        fileName: idFile.originalname,
        fileUrl: `/uploads/verification/id/${userId}_${Date.now()}_${idFile.originalname}`,
        reviewStatus: "pending",
      });
      
      // Update user verification status to pending
      await storage.updateVerificationStatus(userId, "pending");
      
      res.status(201).json({ 
        selfie: selfieDoc, 
        governmentId: idDoc,
        message: "Verification documents uploaded successfully"
      });
    } catch (error) {
      console.error("Error uploading verification documents:", error);
      res.status(500).json({ message: "Failed to upload verification documents" });
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
      
      // Check if user is verified before allowing event creation
      const user = await storage.getUser(userId);
      if (!user || user.verificationStatus !== 'approved') {
        return res.status(403).json({ 
          message: "You must complete identity verification before creating events. Please submit your documents for review.",
          type: "verification_required"
        });
      }
      
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

  // Test route to create verification documents for demo
  app.post("/api/test/create-verification", async (req: any, res) => {
    try {
      const testUserId = req.body.userId || "demo_user_" + Date.now();
      
      // Create test user
      await storage.upsertUser({
        id: testUserId,
        email: `demo${Date.now()}@example.com`,
        firstName: "Demo",
        lastName: "User",
        verificationStatus: "pending"
      });

      // Create verification documents
      const selfieDoc = await storage.uploadVerificationDocument({
        userId: testUserId,
        documentType: "selfie",
        fileName: `selfie_${testUserId}.jpg`,
        fileUrl: `/uploads/verification/selfie/${testUserId}.jpg`,
        reviewStatus: "pending",
      });
      
      const idDoc = await storage.uploadVerificationDocument({
        userId: testUserId,
        documentType: "government_id", 
        fileName: `id_${testUserId}.jpg`,
        fileUrl: `/uploads/verification/id/${testUserId}.jpg`,
        reviewStatus: "pending",
      });
      
      res.status(201).json({ selfie: selfieDoc, governmentId: idDoc, userId: testUserId });
    } catch (error) {
      console.error("Error creating test verification:", error);
      res.status(500).json({ message: "Failed to create test verification" });
    }
  });

  // Identity verification file upload route
  app.post("/api/verification/upload", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // For beta launch, we'll store file references without actual file upload
      // In production, you would integrate with a file storage service
      const selfieDoc = await storage.uploadVerificationDocument({
        userId,
        documentType: "selfie",
        fileName: `selfie_${userId}_${Date.now()}`,
        fileUrl: `/uploads/verification/selfie/${userId}_${Date.now()}`,
        reviewStatus: "pending",
      });
      
      const idDoc = await storage.uploadVerificationDocument({
        userId,
        documentType: "government_id", 
        fileName: `id_${userId}_${Date.now()}`,
        fileUrl: `/uploads/verification/id/${userId}_${Date.now()}`,
        reviewStatus: "pending",
      });
      
      // Update user verification status to pending
      await storage.updateVerificationStatus(userId, "pending");
      
      res.status(201).json({ selfie: selfieDoc, governmentId: idDoc });
    } catch (error) {
      console.error("Error uploading verification documents:", error);
      res.status(500).json({ message: "Failed to upload verification documents" });
    }
  });

  // Admin check middleware
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      console.log('Admin check for user:', userId);
      const isUserAdmin = await storage.isUserAdmin(userId);
      console.log('Is user admin:', isUserAdmin);
      
      if (!isUserAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      next();
    } catch (error) {
      console.error('Admin middleware error:', error);
      res.status(500).json({ message: "Failed to verify admin status" });
    }
  };

  // Admin routes
  app.get("/api/admin/locations", isAuthenticated, isAdmin, async (req: any, res) => {
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

  app.post("/api/admin/locations/:id/review", isAuthenticated, isAdmin, async (req: any, res) => {
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

  app.get("/api/admin/verification-documents", async (req: any, res) => {
    try {
      console.log('Fetching verification documents for admin...');
      console.log('User ID:', req.user?.claims?.sub);
      console.log('Request headers:', req.headers.cookie ? 'Has cookies' : 'No cookies');
      // Get all pending verification documents with user info for admin review
      const documents = await db.select({
        id: verificationDocuments.id,
        userId: verificationDocuments.userId,
        documentType: verificationDocuments.documentType,
        fileName: verificationDocuments.fileName,
        fileUrl: verificationDocuments.fileUrl,
        reviewStatus: verificationDocuments.reviewStatus,
        uploadedAt: verificationDocuments.uploadedAt,
        reviewNotes: verificationDocuments.reviewNotes,
        reviewedBy: verificationDocuments.reviewedBy,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userProfileImage: users.profileImageUrl
      })
      .from(verificationDocuments)
      .leftJoin(users, eq(verificationDocuments.userId, users.id))
      .where(eq(verificationDocuments.reviewStatus, 'pending'))
      .orderBy(verificationDocuments.uploadedAt);
      
      console.log('Found documents:', documents.length);
      
      // Group documents by user for easier admin review
      const userVerifications = new Map();
      documents.forEach(doc => {
        if (!userVerifications.has(doc.userId)) {
          userVerifications.set(doc.userId, {
            userId: doc.userId,
            userEmail: doc.userEmail,
            userFirstName: doc.userFirstName,
            userLastName: doc.userLastName,
            userProfileImage: doc.userProfileImage,
            documents: []
          });
        }
        userVerifications.get(doc.userId).documents.push(doc);
      });
      
      res.json(Array.from(userVerifications.values()));
    } catch (error) {
      console.error("Error fetching verification documents:", error);
      res.status(500).json({ message: "Failed to fetch verification documents" });
    }
  });

  app.post("/api/admin/users/:userId/verification", async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { status, reviewNotes } = req.body;
      const reviewerId = "admin"; // Temporary admin ID for testing

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

      // Get messages from database
      const messages = await storage.getEventMessages(eventId);
      res.json(messages);
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

      // Basic hate speech filter for beta launch
      const bannedTerms = [
        'hate', 'racist', 'violence', 'threat', 'kill', 'die', 'stupid', 'idiot', 
        'fuck', 'shit', 'damn', 'bitch', 'asshole', 'loser', 'retard', 'gay',
        'nazi', 'terror', 'bomb', 'weapon', 'drug', 'illegal'
      ];
      
      const messageText = message.toLowerCase();
      const containsBannedTerm = bannedTerms.some(term => messageText.includes(term));
      
      if (containsBannedTerm) {
        return res.status(400).json({ 
          message: "Message contains inappropriate content and was blocked",
          type: "content_filter"
        });
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
  
  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections by event ID
  const eventConnections = new Map<number, Set<{ ws: WebSocket; userId: string; user: any }>>();
  
  wss.on('connection', (ws: WebSocket, request) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join-event') {
          const { eventId, userId } = data;
          
          // Validate event access
          const event = await storage.getEventById(eventId);
          if (!event) {
            ws.send(JSON.stringify({ type: 'error', message: 'Event not found' }));
            return;
          }
          
          const userRsvps = await storage.getRsvpsByUser(userId);
          const isHost = event.hostId === userId;
          const hasRsvp = userRsvps.some(rsvp => rsvp.eventId === eventId);
          
          if (!isHost && !hasRsvp) {
            ws.send(JSON.stringify({ type: 'error', message: 'Access denied to event chat' }));
            return;
          }
          
          // Get user info
          const user = await storage.getUser(userId);
          
          // Add to event connections
          if (!eventConnections.has(eventId)) {
            eventConnections.set(eventId, new Set());
          }
          eventConnections.get(eventId)!.add({ ws, userId, user });
          
          ws.send(JSON.stringify({ type: 'joined', eventId }));
          
          // Notify other participants
          const joinMessage = {
            type: 'user-joined',
            user: {
              id: user?.id,
              firstName: user?.firstName,
              lastName: user?.lastName
            }
          };
          
          eventConnections.get(eventId)!.forEach(({ ws: clientWs }) => {
            if (clientWs !== ws && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify(joinMessage));
            }
          });
        }
        
        if (data.type === 'send-message') {
          const { eventId, message: messageText } = data;
          
          // Find the user's connection
          const connections = eventConnections.get(eventId);
          if (!connections) return;
          
          const userConnection = Array.from(connections).find(conn => conn.ws === ws);
          if (!userConnection) return;
          
          try {
            // Store message in database
            console.log('Saving message to database:', { eventId, userId: userConnection.userId, message: messageText });
            const savedMessage = await storage.createEventMessage({
              eventId,
              userId: userConnection.userId,
              message: messageText,
            });
            console.log('Message saved successfully:', savedMessage);

            // Create message object with user info
            const messageObj = {
              type: 'new-message',
              ...savedMessage,
              user: {
                id: userConnection.user?.id,
                firstName: userConnection.user?.firstName,
                lastName: userConnection.user?.lastName,
                profileImageUrl: userConnection.user?.profileImageUrl
              }
            };

            // Broadcast to all participants in the event
            connections.forEach(({ ws: clientWs }) => {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify(messageObj));
              }
            });
          } catch (error) {
            console.error('Error saving message to database:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to save message'
            }));
          }
        }
        
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });
    
    ws.on('close', () => {
      // Remove from all event connections
      eventConnections.forEach((connections, eventId) => {
        const toRemove = Array.from(connections).find(conn => conn.ws === ws);
        if (toRemove) {
          connections.delete(toRemove);
          
          // Notify other participants
          const leaveMessage = {
            type: 'user-left',
            user: {
              id: toRemove.user?.id,
              firstName: toRemove.user?.firstName,
              lastName: toRemove.user?.lastName
            }
          };
          
          connections.forEach(({ ws: clientWs }) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify(leaveMessage));
            }
          });
          
          if (connections.size === 0) {
            eventConnections.delete(eventId);
          }
        }
      });
    });
  });

  return httpServer;
}
