import {
  users,
  events,
  eventRsvps,
  userSwipes,
  verificationDocuments,
  type User,
  type UpsertUser,
  type Event,
  type InsertEvent,
  type EventRsvp,
  type InsertRsvp,
  type UserSwipe,
  type InsertUserPreferences,
  type InsertVerificationDocument,
  type VerificationDocument,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, inArray, notInArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User preferences
  updateUserPreferences(userId: string, preferences: InsertUserPreferences): Promise<User>;
  
  // Event operations
  createEvent(event: InsertEvent): Promise<Event>;
  getEvents(filters?: {
    sportType?: string;
    skillLevel?: string;
    userId?: string;
    excludeSwipedByUser?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<Event[]>;
  getEventById(id: number): Promise<Event | undefined>;
  getEventsByHost(hostId: string): Promise<Event[]>;
  updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
  
  // RSVP operations
  createRsvp(rsvp: InsertRsvp): Promise<EventRsvp>;
  getRsvpsByEvent(eventId: number): Promise<EventRsvp[]>;
  getRsvpsByUser(userId: string): Promise<EventRsvp[]>;
  updateRsvp(eventId: number, userId: string, status: string): Promise<EventRsvp>;
  deleteRsvp(eventId: number, userId: string): Promise<void>;
  
  // Swipe operations
  recordSwipe(userId: string, eventId: number, direction: string): Promise<UserSwipe>;
  getUserSwipes(userId: string): Promise<UserSwipe[]>;
  
  // Identity verification operations
  uploadVerificationDocument(document: InsertVerificationDocument): Promise<VerificationDocument>;
  getUserVerificationDocuments(userId: string): Promise<VerificationDocument[]>;
  updateVerificationStatus(userId: string, status: string, reviewNotes?: string, reviewedBy?: string): Promise<User>;
  getVerificationDocumentsByType(userId: string, documentType: string): Promise<VerificationDocument[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPreferences(userId: string, preferences: InsertUserPreferences): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...preferences,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Event operations
  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db
      .insert(events)
      .values(event)
      .returning();
    return newEvent;
  }

  async getEvents(filters?: {
    sportType?: string;
    skillLevel?: string;
    userId?: string;
    excludeSwipedByUser?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<Event[]> {
    let query = db.select().from(events);
    
    const conditions = [];
    
    if (filters?.sportType) {
      conditions.push(eq(events.sportType, filters.sportType));
    }
    
    if (filters?.skillLevel) {
      conditions.push(eq(events.skillLevel, filters.skillLevel));
    }
    
    if (filters?.userId) {
      conditions.push(eq(events.hostId, filters.userId));
    }
    
    // Exclude canceled events
    conditions.push(eq(events.isCanceled, false));
    
    // Only show approved events
    conditions.push(eq(events.isApproved, true));
    
    // Only show future events
    conditions.push(sql`${events.eventDate} >= NOW()`);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // If excluding swiped events, we need a subquery
    if (filters?.excludeSwipedByUser) {
      const swipedEventIds = await db
        .select({ eventId: userSwipes.eventId })
        .from(userSwipes)
        .where(eq(userSwipes.userId, filters.excludeSwipedByUser));
      
      const swipedIds = swipedEventIds.map(s => s.eventId);
      if (swipedIds.length > 0) {
        query = query.where(notInArray(events.id, swipedIds));
      }
    }
    
    return await query.orderBy(asc(events.eventDate));
  }

  async getEventById(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventsByHost(hostId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.hostId, hostId))
      .orderBy(desc(events.createdAt));
  }

  async updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // RSVP operations
  async createRsvp(rsvp: InsertRsvp): Promise<EventRsvp> {
    const [newRsvp] = await db
      .insert(eventRsvps)
      .values(rsvp)
      .returning();
    
    // Update event current players count
    await db
      .update(events)
      .set({
        currentPlayers: sql`${events.currentPlayers} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(events.id, rsvp.eventId));
    
    return newRsvp;
  }

  async getRsvpsByEvent(eventId: number): Promise<EventRsvp[]> {
    return await db
      .select()
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, eventId))
      .orderBy(desc(eventRsvps.joinedAt));
  }

  async getRsvpsByUser(userId: string): Promise<EventRsvp[]> {
    return await db
      .select()
      .from(eventRsvps)
      .where(eq(eventRsvps.userId, userId))
      .orderBy(desc(eventRsvps.joinedAt));
  }

  async updateRsvp(eventId: number, userId: string, status: string): Promise<EventRsvp> {
    const [rsvp] = await db
      .update(eventRsvps)
      .set({ status })
      .where(
        and(
          eq(eventRsvps.eventId, eventId),
          eq(eventRsvps.userId, userId)
        )
      )
      .returning();
    return rsvp;
  }

  async deleteRsvp(eventId: number, userId: string): Promise<void> {
    await db
      .delete(eventRsvps)
      .where(
        and(
          eq(eventRsvps.eventId, eventId),
          eq(eventRsvps.userId, userId)
        )
      );
    
    // Update event current players count
    await db
      .update(events)
      .set({
        currentPlayers: sql`${events.currentPlayers} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId));
  }

  // Swipe operations
  async recordSwipe(userId: string, eventId: number, direction: string): Promise<UserSwipe> {
    const [swipe] = await db
      .insert(userSwipes)
      .values({
        userId,
        eventId,
        direction,
      })
      .returning();
    
    // If swiping right (interested), create an RSVP
    if (direction === 'right') {
      await this.createRsvp({
        eventId,
        userId,
        status: 'interested',
      });
    }
    
    return swipe;
  }

  async getUserSwipes(userId: string): Promise<UserSwipe[]> {
    return await db
      .select()
      .from(userSwipes)
      .where(eq(userSwipes.userId, userId))
      .orderBy(desc(userSwipes.swipedAt));
  }

  // Identity verification operations
  async uploadVerificationDocument(document: InsertVerificationDocument): Promise<VerificationDocument> {
    const [newDocument] = await db
      .insert(verificationDocuments)
      .values(document)
      .returning();
    return newDocument;
  }

  async getUserVerificationDocuments(userId: string): Promise<VerificationDocument[]> {
    return await db
      .select()
      .from(verificationDocuments)
      .where(eq(verificationDocuments.userId, userId))
      .orderBy(desc(verificationDocuments.uploadedAt));
  }

  async updateVerificationStatus(userId: string, status: string, reviewNotes?: string, reviewedBy?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        verificationStatus: status,
        isVerified: status === "verified",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // If review notes are provided, update the documents
    if (reviewNotes || reviewedBy) {
      await db
        .update(verificationDocuments)
        .set({
          reviewStatus: status === "verified" ? "approved" : "rejected",
          reviewNotes,
          reviewedBy,
          verifiedAt: status === "verified" ? new Date() : null,
        })
        .where(eq(verificationDocuments.userId, userId));
    }

    return user;
  }

  async getVerificationDocumentsByType(userId: string, documentType: string): Promise<VerificationDocument[]> {
    return await db
      .select()
      .from(verificationDocuments)
      .where(
        and(
          eq(verificationDocuments.userId, userId),
          eq(verificationDocuments.documentType, documentType)
        )
      )
      .orderBy(desc(verificationDocuments.uploadedAt));
  }
}

export const storage = new DatabaseStorage();
