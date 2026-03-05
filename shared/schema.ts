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
export const listingTypeEnum = pgEnum("listing_type", ["SERVICE", "PRODUCT"]);

export const bookingStatusEnum = pgEnum("booking_status", ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]);
export const orderStatusEnum = pgEnum("order_status", ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]);
export const availabilityBasisEnum = pgEnum("availability_basis", ["FOREVER", "TIMELINE", "STOCK"]);
export const paymentPreferenceEnum = pgEnum("payment_preference", ["IN_APP", "DIRECT"]);
export const logisticsPreferenceEnum = pgEnum("logistics_preference", ["PICKUP", "DELIVERY_SUPPORT"]);

export const communities = pgTable("communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id"), // Support for sub-communities
  name: text("name").notNull(),
  visibility: communityVisibilityEnum("visibility").notNull().default("PUBLIC"),
  status: communityStatusEnum("status").notNull().default("ACTIVE"),
  locality: text("locality"),
  address: text("address"),
  description: text("description"),
  totalUnits: integer("total_units"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  facilities: text("facilities"),
  rules: text("rules"),
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
  locality: text("locality"),
  postalCode: text("postal_code"),
  address: text("address"),
  bio: text("bio"),
  profilePhoto: text("profile_photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
});

export const userCommunities = pgTable("user_communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  communityId: varchar("community_id").notNull(),
  status: userStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // stored in cents
  listingType: listingTypeEnum("listing_type").notNull().default("SERVICE"),
  category: text("category"),
  condition: text("condition"),
  availability: text("availability"),
  duration: text("duration"),
  mode: text("mode"),
  sellerId: varchar("seller_id").notNull(), // FK to users
  communityId: varchar("community_id").notNull(), // FK to communities
  sellerNameSnapshot: text("seller_name_snapshot").notNull(),
  communityNameSnapshot: text("community_name_snapshot").notNull(),
  availabilityBasis: availabilityBasisEnum("availability_basis").notNull().default("FOREVER"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  stockQuantity: integer("stock_quantity"),
  buyNowEnabled: boolean("buy_now_enabled").notNull().default(true),
  contactSellerEnabled: boolean("contact_seller_enabled").notNull().default(true),
  paymentPreference: paymentPreferenceEnum("payment_preference").notNull().default("DIRECT"),
  sellerContactSnapshot: text("seller_contact_snapshot"),
  visibility: listingVisibilityEnum("visibility").notNull().default("COMMUNITY_ONLY"),
  status: listingStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull(),
  userId: varchar("user_id").notNull(),
  sellerId: varchar("seller_id").notNull(),
  bookingDate: timestamp("booking_date").notNull(),
  status: bookingStatusEnum("status").notNull().default("PENDING"),
  priceSnapshot: integer("price_snapshot").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull(),
  userId: varchar("user_id").notNull(),
  sellerId: varchar("seller_id").notNull(),
  status: orderStatusEnum("status").notNull().default("PENDING"),
  priceSnapshot: integer("price_snapshot").notNull(),
  logisticsPreference: logisticsPreferenceEnum("logistics_preference").notNull().default("PICKUP"),
  deliveryAddress: text("delivery_address"),
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

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull(),
  authorId: varchar("author_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  authorId: varchar("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformName: text("platform_name").notNull().default("Nexus Market"),
  supportEmail: text("support_email").notNull().default("support@nexusmarket.com"),
  commissionRate: integer("commission_rate").notNull().default(5),
  enableRegistration: boolean("enable_registration").notNull().default(true),
  enableGlobalMarketplace: boolean("enable_global_marketplace").notNull().default(true),
  enableCommunityForums: boolean("enable_community_forums").notNull().default(true),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  require2FA: boolean("require_2fa").notNull().default(false),
  sessionTimeout: integer("session_timeout").notNull().default(24),
  emailAlerts: boolean("email_alerts").notNull().default(true),
  welcomeEmailSubject: text("welcome_email_subject").notNull().default("Welcome to Nexus Market!"),
  autoBackupFrequency: text("auto_backup_frequency").notNull().default("daily"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas
export const insertCommunitySchema = createInsertSchema(communities).omit({ id: true, createdAt: true, version: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, version: true, passwordHash: true });
export const insertListingSchema = createInsertSchema(listings, {
  startDate: z.string().optional().nullable().transform(v => v ? new Date(v) : null),
  endDate: z.string().optional().nullable().transform(v => v ? new Date(v) : null),
  stockQuantity: z.number().min(0).optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  version: true,
  sellerNameSnapshot: true,
  communityNameSnapshot: true,
  visibility: true
});
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, version: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, version: true });
export const insertPlatformSettingsSchema = createInsertSchema(platformSettings).omit({ id: true, updatedAt: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });

export type Community = typeof communities.$inferSelect;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const insertUserCommunitySchema = createInsertSchema(userCommunities).omit({ id: true, createdAt: true });
export type UserCommunity = typeof userCommunities.$inferSelect;
export type InsertUserCommunity = z.infer<typeof insertUserCommunitySchema>;

export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export type PlatformSettings = typeof platformSettings.$inferSelect;
export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;
export type UpdatePlatformSettingsRequest = Partial<InsertPlatformSettings>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

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
