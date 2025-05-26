import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // User preferences
  genderIdentity: varchar("gender_identity"),
  sportsInterests: text("sports_interests").array(),
  skillLevel: varchar("skill_level"), // beginner, recreational, collegiate, professional
  searchRadius: integer("search_radius").default(25), // in miles
  isVerified: boolean("is_verified").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  hostId: varchar("host_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  sportType: varchar("sport_type").notNull(),
  skillLevel: varchar("skill_level").notNull(),
  maxPlayers: integer("max_players").notNull(),
  currentPlayers: integer("current_players").default(1),
  
  // Location details
  locationName: varchar("location_name").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  
  // Event timing
  eventDate: timestamp("event_date").notNull(),
  eventTime: varchar("event_time").notNull(),
  
  // Additional info
  notes: text("notes"),
  isApproved: boolean("is_approved").default(true),
  isCanceled: boolean("is_canceled").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventRsvps = pgTable("event_rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("interested"), // interested, joined, declined
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const userSwipes = pgTable("user_swipes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventId: integer("event_id").notNull().references(() => events.id),
  direction: varchar("direction").notNull(), // left, right
  swipedAt: timestamp("swiped_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  hostedEvents: many(events),
  rsvps: many(eventRsvps),
  swipes: many(userSwipes),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  host: one(users, {
    fields: [events.hostId],
    references: [users.id],
  }),
  rsvps: many(eventRsvps),
  swipes: many(userSwipes),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(events, {
    fields: [eventRsvps.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventRsvps.userId],
    references: [users.id],
  }),
}));

export const userSwipesRelations = relations(userSwipes, ({ one }) => ({
  user: one(users, {
    fields: [userSwipes.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [userSwipes.eventId],
    references: [events.id],
  }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  currentPlayers: true,
  isApproved: true,
  isCanceled: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  eventDate: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertUserPreferencesSchema = createInsertSchema(users).pick({
  genderIdentity: true,
  sportsInterests: true,
  skillLevel: true,
  searchRadius: true,
});

export const insertRsvpSchema = createInsertSchema(eventRsvps).omit({
  id: true,
  joinedAt: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type InsertRsvp = z.infer<typeof insertRsvpSchema>;
export type Event = typeof events.$inferSelect;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type UserSwipe = typeof userSwipes.$inferSelect;
