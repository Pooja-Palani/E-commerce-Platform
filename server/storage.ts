import { db } from "./db";
import {
  users, communities, listings, auditLogs, bookings, orders,
  type User, type InsertUser, type UpdateUserRequest,
  type Community, type InsertCommunity, type UpdateCommunityRequest,
  type Listing, type InsertListing, type UpdateListingRequest,
  type AuditLog, type Booking, type Order,
  type PlatformSettings, type UpdatePlatformSettingsRequest,
  platformSettings,
  userCommunities, type UserCommunity, type InsertUserCommunity,
  posts, type Post, type InsertPost,
  comments, type Comment, type InsertComment
} from "@shared/schema";
import { eq, and, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: UpdateUserRequest): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Communities
  getCommunity(id: string): Promise<Community | undefined>;
  getCommunities(parentId?: string): Promise<Community[]>;
  getCommunityMembers(communityId: string): Promise<User[]>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  updateCommunity(id: string, updates: UpdateCommunityRequest): Promise<Community | undefined>;
  deleteCommunity(id: string): Promise<boolean>;

  createUserCommunity(data: InsertUserCommunity): Promise<UserCommunity>;
  getUserCommunities(userId: string): Promise<UserCommunity[]>;
  getUserCommunity(userId: string, communityId: string): Promise<UserCommunity | undefined>;
  updateUserCommunity(id: string, status: string): Promise<UserCommunity | undefined>;

  // Listings
  getListing(id: string): Promise<Listing | undefined>;
  getListings(): Promise<Listing[]>;
  getListingsBySeller(sellerId: string): Promise<Listing[]>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: string, updates: UpdateListingRequest): Promise<Listing | undefined>;

  // Bookings
  createBooking(booking: any): Promise<Booking>;
  getBookings(): Promise<Booking[]>;

  // Orders
  createOrder(order: any): Promise<Order>;
  getOrders(): Promise<Order[]>;

  // Audit Logs
  getAuditLogs(): Promise<AuditLog[]>;
  createAuditLog(log: Omit<AuditLog, "id" | "timestamp">): Promise<AuditLog>;

  // Settings
  getSettings(): Promise<PlatformSettings>;
  updateSettings(updates: UpdatePlatformSettingsRequest): Promise<PlatformSettings>;

  // Forums
  getPosts(communityId: string): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  getComments(postId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: UpdateUserRequest): Promise<User | undefined> {
    const { version, ...rest } = updates;
    const [updatedUser] = await db.update(users)
      .set({ ...rest, version: version + 1, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.version, version)))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();
    return !!deleted;
  }

  // Communities
  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }

  async getCommunities(parentId?: string): Promise<Community[]> {
    if (parentId) {
      return await db.select().from(communities).where(eq(communities.parentId, parentId));
    }
    return await db.select().from(communities);
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    const [newCommunity] = await db.insert(communities).values(community).returning();
    return newCommunity;
  }

  async updateCommunity(id: string, updates: UpdateCommunityRequest): Promise<Community | undefined> {
    const { version, ...rest } = updates;
    const [updatedCommunity] = await db.update(communities)
      .set({ ...rest, version: version + 1 })
      .where(and(eq(communities.id, id), eq(communities.version, version)))
      .returning();
    return updatedCommunity;
  }

  async deleteCommunity(id: string): Promise<boolean> {
    const [deleted] = await db.delete(communities).where(eq(communities.id, id)).returning();
    return !!deleted;
  }

  async getCommunityMembers(communityId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.communityId, communityId));
  }

  async createUserCommunity(data: InsertUserCommunity): Promise<UserCommunity> {
    const [uc] = await db.insert(userCommunities).values(data).returning();
    return uc;
  }

  async getUserCommunities(userId: string): Promise<UserCommunity[]> {
    return await db.select().from(userCommunities).where(eq(userCommunities.userId, userId));
  }

  async getUserCommunity(userId: string, communityId: string): Promise<UserCommunity | undefined> {
    const [uc] = await db.select().from(userCommunities).where(and(eq(userCommunities.userId, userId), eq(userCommunities.communityId, communityId)));
    return uc;
  }

  async updateUserCommunity(id: string, status: string): Promise<UserCommunity | undefined> {
    const [uc] = await db.update(userCommunities).set({ status: status as any }).where(eq(userCommunities.id, id)).returning();
    return uc;
  }

  // Listings
  async getListing(id: string): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing;
  }

  async getListings(): Promise<Listing[]> {
    return await db.select().from(listings);
  }

  async getListingsBySeller(sellerId: string): Promise<Listing[]> {
    return await db.select().from(listings).where(eq(listings.sellerId, sellerId));
  }

  async createListing(listing: InsertListing): Promise<Listing> {
    const [newListing] = await db.insert(listings).values(listing).returning();
    return newListing;
  }

  async updateListing(id: string, updates: UpdateListingRequest): Promise<Listing | undefined> {
    const { version, ...rest } = updates;
    const [updatedListing] = await db.update(listings)
      .set({ ...rest, version: version + 1 })
      .where(and(eq(listings.id, id), eq(listings.version, version)))
      .returning();
    return updatedListing;
  }

  // Bookings
  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async getBookingsBySeller(sellerId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.sellerId, sellerId));
  }

  async createBooking(booking: any): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async getBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  // Orders
  async getOrdersByUser(userId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }

  async getOrdersBySeller(sellerId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.sellerId, sellerId));
  }

  async createOrder(order: any): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(auditLogs.timestamp);
  }

  async createAuditLog(log: Omit<AuditLog, "id" | "timestamp">): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  // Settings
  async getSettings(): Promise<PlatformSettings> {
    let [settings] = await db.select().from(platformSettings);
    if (!settings) {
      [settings] = await db.insert(platformSettings).values({}).returning();
    }
    return settings;
  }

  async updateSettings(updates: UpdatePlatformSettingsRequest): Promise<PlatformSettings> {
    const settings = await this.getSettings();
    const [updated] = await db.update(platformSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(platformSettings.id, settings.id))
      .returning();
    return updated;
  }

  // Forums
  async getPosts(communityId: string): Promise<Post[]> {
    return await db.select().from(posts).where(eq(posts.communityId, communityId)).orderBy(posts.createdAt);
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async getComments(postId: string): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.postId, postId)).orderBy(comments.createdAt);
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }
}

export const storage = new DatabaseStorage();