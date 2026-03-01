import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["RESIDENT", "COMMUNITY_MANAGER", "ADMIN"]);
export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "PENDING", "SUSPENDED", "REMOVED"]);

export const communityVisibilityEnum = pgEnum("community_visibility", ["PUBLIC", "PRIVATE"]);
export const communityStatusEnum = pgEnum("community_status", ["ACTIVE", "DISABLED"]);

export const listingVisibilityEnum = pgEnum("listing_visibility", ["GLOBAL", "COMMUNITY_ONLY"]);
export const listingStatusEnum = pgEnum("listing_status", ["ACTIVE", "INACTIVE", "REMOVED"]);

export const communities = pgTable("communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  visibility: communityVisibilityEnum("visibility").notNull().default("PUBLIC"),
  status: communityStatusEnum("status").notNull().default("ACTIVE"),
  createdById: varchar("created_by_id"),
  ownerId: varchar("owner_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("RESIDENT"),
  status: userStatusEnum("status").notNull().default("PENDING"),
  communityId: varchar("community_id"), // FK to communities
  isSeller: boolean("is_seller").default(false).notNull(),
  sellerDisplayName: text("seller_display_name"),
  sellerDescription: text("seller_description"),
  profilePhoto: text("profile_photo"), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
});

export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // stored in cents
  sellerId: varchar("seller_id").notNull(), // FK to users
  communityId: varchar("community_id").notNull(), // FK to communities
  sellerNameSnapshot: text("seller_name_snapshot").notNull(),
  communityNameSnapshot: text("community_name_snapshot").notNull(),
  visibility: listingVisibilityEnum("visibility").notNull().default("COMMUNITY_ONLY"),
  status: listingStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id"),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: varchar("target_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Zod Schemas
export const insertCommunitySchema = createInsertSchema(communities).omit({ id: true, createdAt: true, version: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, version: true, passwordHash: true });
export const insertListingSchema = createInsertSchema(listings).omit({ id: true, createdAt: true, version: true, sellerNameSnapshot: true, communityNameSnapshot: true, visibility: true });

export type Community = typeof communities.$inferSelect;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Listing = typeof listings.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
export type LoginRequest = z.infer<typeof loginSchema>;

export const registerSchema = insertUserSchema.extend({
  password: z.string()
});
export type RegisterRequest = z.infer<typeof registerSchema>;

export type UpdateUserRequest = Partial<InsertUser> & { version: number };
export type UpdateCommunityRequest = Partial<InsertCommunity> & { version: number };
export type UpdateListingRequest = Partial<InsertListing> & { version: number };
