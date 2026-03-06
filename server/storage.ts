import { db } from "./db";
import {
  users, communities, listings, listingSlots, auditLogs, bookings, orders, productInterests,
  type User, type InsertUser, type UpdateUserRequest,
  type Community, type InsertCommunity, type UpdateCommunityRequest,
  type Listing, type InsertListing, type UpdateListingRequest,
  type AuditLog, type Booking, type Order,
  type PlatformSettings, type UpdatePlatformSettingsRequest,
  platformSettings,
  userCommunities, type UserCommunity, type InsertUserCommunity,
  communityInvites, type CommunityInvite, type InsertCommunityInvite,
  posts, type Post, type InsertPost,
  comments, type Comment, type InsertComment
} from "@shared/schema";
import { eq, and, or, inArray } from "drizzle-orm";

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

  createCommunityInvite(data: InsertCommunityInvite): Promise<CommunityInvite>;
  getCommunityInvite(id: string): Promise<CommunityInvite | undefined>;
  getPendingInvitesByEmail(email: string): Promise<(CommunityInvite & { community?: Community })[]>;
  getPendingInvitesByUserId(userId: string): Promise<(CommunityInvite & { community?: Community })[]>;
  updateCommunityInvite(id: string, status: "PENDING" | "ACCEPTED" | "REJECTED", inviteeId?: string): Promise<CommunityInvite | undefined>;

  // Listings
  getListing(id: string): Promise<Listing | undefined>;
  getListingsByIds(ids: string[]): Promise<Listing[]>;
  getListings(): Promise<Listing[]>;
  getListingsBySeller(sellerId: string): Promise<Listing[]>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: string, updates: UpdateListingRequest): Promise<Listing | undefined>;
  updateListingStock(id: string, stockQuantity: number): Promise<Listing | undefined>;

  // Product Interests (when stock is 0)
  createProductInterest(listingId: string, userId: string): Promise<{ id: string; listingId: string; userId: string; createdAt: Date }>;
  getProductInterestsCount(listingId: string): Promise<number>;
  getProductInterestsByListing(listingId: string): Promise<{ id: string; listingId: string; userId: string; createdAt: Date }[]>;
  hasUserExpressedInterest(listingId: string, userId: string): Promise<boolean>;

  // Listing Slots (for services)
  getListingSlots(listingId: string): Promise<{ id: string; listingId: string; startTime: string; endTime: string }[]>;
  createListingSlot(slot: { listingId: string; startTime: string; endTime: string }): Promise<{ id: string; listingId: string; startTime: string; endTime: string }>;
  deleteListingSlots(listingId: string): Promise<void>;
  getBookingsForListingOnDate(listingId: string, dateStr: string): Promise<Booking[]>;

  // Bookings
  createBooking(booking: any): Promise<Booking>;
  getBookings(): Promise<Booking[]>;
  updateBooking(id: string, updates: { status?: string }): Promise<Booking | undefined>;
  getBooking(id: string): Promise<Booking | undefined>;

  // Orders
  createOrder(order: any): Promise<Order>;
  getOrders(): Promise<Order[]>;
  updateOrder(id: string, updates: { status?: string; priceSnapshot?: number }): Promise<Order | undefined>;
  getOrder(id: string): Promise<Order | undefined>;

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
    const fromUserCommunities = await db.select({ user: users })
      .from(userCommunities)
      .innerJoin(users, eq(userCommunities.userId, users.id))
      .where(and(eq(userCommunities.communityId, communityId), eq(userCommunities.status, "ACTIVE")));
    const fromPrimary = await db.select().from(users)
      .where(eq(users.communityId, communityId));
    const seen = new Set<string>();
    const result: User[] = [];
    for (const { user } of fromUserCommunities) {
      if (!seen.has(user.id)) {
        seen.add(user.id);
        result.push(user);
      }
    }
    for (const user of fromPrimary) {
      if (!seen.has(user.id)) {
        seen.add(user.id);
        result.push(user);
      }
    }
    return result;
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

  async createCommunityInvite(data: InsertCommunityInvite): Promise<CommunityInvite> {
    const [inv] = await db.insert(communityInvites).values(data).returning();
    return inv;
  }

  async getCommunityInvite(id: string): Promise<CommunityInvite | undefined> {
    const [inv] = await db.select().from(communityInvites).where(eq(communityInvites.id, id));
    return inv;
  }

  async getPendingInvitesByEmail(email: string): Promise<(CommunityInvite & { community?: Community })[]> {
    const rows = await db.select().from(communityInvites)
      .where(and(eq(communityInvites.inviteeEmail, email.toLowerCase().trim()), eq(communityInvites.status, "PENDING")));
    const result: (CommunityInvite & { community?: Community })[] = [];
    for (const r of rows) {
      const [comm] = await db.select().from(communities).where(eq(communities.id, r.communityId));
      result.push({ ...r, community: comm });
    }
    return result;
  }

  async getPendingInvitesByUserId(userId: string): Promise<(CommunityInvite & { community?: Community })[]> {
    const user = await this.getUser(userId);
    if (!user?.email) return [];
    return this.getPendingInvitesByEmail(user.email);
  }

  async updateCommunityInvite(id: string, status: "PENDING" | "ACCEPTED" | "REJECTED", inviteeId?: string): Promise<CommunityInvite | undefined> {
    const updates: Partial<CommunityInvite> = { status };
    if (inviteeId) updates.inviteeId = inviteeId;
    const [inv] = await db.update(communityInvites).set(updates).where(eq(communityInvites.id, id)).returning();
    return inv;
  }

  // Listings
  async getListing(id: string): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing;
  }

  async getListingsByIds(ids: string[]): Promise<Listing[]> {
    if (ids.length === 0) return [];
    return await db.select().from(listings).where(inArray(listings.id, ids));
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

  async updateListingStock(id: string, stockQuantity: number): Promise<Listing | undefined> {
    const [updated] = await db.update(listings)
      .set({ stockQuantity: Math.max(0, stockQuantity) })
      .where(eq(listings.id, id))
      .returning();
    return updated;
  }

  async createProductInterest(listingId: string, userId: string) {
    const [interest] = await db.insert(productInterests).values({ listingId, userId }).returning();
    return interest;
  }

  async getProductInterestsCount(listingId: string): Promise<number> {
    const rows = await db.select().from(productInterests).where(eq(productInterests.listingId, listingId));
    return rows.length;
  }

  async getProductInterestsByListing(listingId: string) {
    return await db.select().from(productInterests).where(eq(productInterests.listingId, listingId));
  }

  async hasUserExpressedInterest(listingId: string, userId: string): Promise<boolean> {
    const rows = await db.select().from(productInterests).where(
      and(eq(productInterests.listingId, listingId), eq(productInterests.userId, userId))
    );
    return rows.length > 0;
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

  async updateBooking(id: string, updates: { status?: string }): Promise<Booking | undefined> {
    const [updated] = await db.update(bookings).set(updates).where(eq(bookings.id, id)).returning();
    return updated;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async getListingSlots(listingId: string) {
    return await db.select().from(listingSlots).where(eq(listingSlots.listingId, listingId));
  }

  async createListingSlot(slot: { listingId: string; startTime: string; endTime: string }) {
    const [newSlot] = await db.insert(listingSlots).values(slot).returning();
    return newSlot;
  }

  async deleteListingSlots(listingId: string) {
    await db.delete(listingSlots).where(eq(listingSlots.listingId, listingId));
  }

  async getBookingsForListingOnDate(listingId: string, dateStr: string): Promise<Booking[]> {
    const all = await db.select().from(bookings).where(eq(bookings.listingId, listingId));
    return all.filter((b) => {
      const d = new Date(b.bookingDate);
      const bookingDateStr = d.toISOString().split("T")[0];
      return bookingDateStr === dateStr && b.status !== "CANCELLED";
    });
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

  async updateOrder(id: string, updates: { status?: string; priceSnapshot?: number }): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set(updates).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
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

  async getPostsWithAuthors(communityId: string): Promise<(Post & { author: { fullName: string; email: string | null; phone: string | null }; listing: Listing | null })[]> {
    const allPosts = await db.select().from(posts).where(eq(posts.communityId, communityId)).orderBy(posts.createdAt);
    const authorIds = [...new Set(allPosts.map(p => p.authorId))];
    const listingIds = [...new Set(allPosts.map(p => p.listingId).filter(Boolean) as string[])];
    const [authorsList, listingsList] = await Promise.all([
      authorIds.length ? db.select({ id: users.id, fullName: users.fullName, email: users.email, phone: users.phone }).from(users).where(inArray(users.id, authorIds)) : [],
      listingIds.length ? db.select().from(listings).where(inArray(listings.id, listingIds)) : [],
    ]);
    const authorsMap = Object.fromEntries((authorsList as { id: string; fullName: string; email: string | null; phone: string | null }[]).map(a => [a.id, { fullName: a.fullName, email: a.email, phone: a.phone }]));
    const listingsMap = Object.fromEntries((listingsList as Listing[]).map(l => [l.id, l]));
    return allPosts.map(post => ({
      ...post,
      author: authorsMap[post.authorId] ?? { fullName: "Unknown", email: null, phone: null },
      listing: post.listingId ? (listingsMap[post.listingId] ?? null) : null,
    }));
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async createPost(post: InsertPost & { listingId?: string }): Promise<Post> {
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