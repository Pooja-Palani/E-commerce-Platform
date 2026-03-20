import { db, pool } from "./db";
import {
  users, communities, listings, listingSlots, auditLogs, bookings, orders, productInterests, reports,
  type User, type InsertUser, type UpdateUserRequest,
  type Community, type InsertCommunity, type UpdateCommunityRequest,
  type Listing, type InsertListing, type UpdateListingRequest,
  type AuditLog, type Booking, type Order,
  type PlatformSettings, type UpdatePlatformSettingsRequest,
  platformSettings,
  userCommunities, type UserCommunity, type InsertUserCommunity,
  communityInvites, type CommunityInvite, type InsertCommunityInvite,
  posts, type Post, type InsertPost,
  comments, type Comment, type InsertComment,
  type Report, type InsertReport
} from "@shared/schema";
import { eq, and, or, inArray, sql } from "drizzle-orm";

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
  getCommunityManager(communityId: string): Promise<{ id: string; fullName: string } | undefined>;
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

  // Reports
  createReport(report: InsertReport): Promise<Report>;
  getReportsByCommunity(communityId: string): Promise<(Report & { listingTitle?: string; reporterName?: string; sellerName?: string })[]>;

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
    const normalized = email.trim().toLowerCase();
    const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${normalized}`);
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

  async getCommunityManager(communityId: string): Promise<{ id: string; fullName: string } | undefined> {
    const [u] = await db.select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(and(eq(users.communityId, communityId), eq(users.role, "COMMUNITY_MANAGER")))
      .limit(1);
    return u;
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
    // Cascade-delete related data to ensure no orphaned listings, memberships, or posts remain.
    try {
      // 1) Find listings for this community
      const communityListings = await db.select({ id: listings.id }).from(listings).where(eq(listings.communityId, id));
      const listingIds = communityListings.map((l: any) => l.id as string);

      // 2) Delete listing slots, product interests, bookings, orders related to these listings
      if (listingIds.length) {
        await db.delete(listingSlots).where(inArray(listingSlots.listingId, listingIds));
        await db.delete(productInterests).where(inArray(productInterests.listingId, listingIds));
        await db.delete(bookings).where(inArray(bookings.listingId, listingIds));
        await db.delete(orders).where(inArray(orders.listingId, listingIds));
      }

      // 3) Delete listings
      await db.delete(listings).where(eq(listings.communityId, id));

      // 4) Delete forum posts and their comments for this community
      const commPosts = await db.select({ id: posts.id }).from(posts).where(eq(posts.communityId, id));
      const postIds = commPosts.map((p: any) => p.id as string);
      if (postIds.length) {
        await db.delete(comments).where(inArray(comments.postId, postIds));
      }
      await db.delete(posts).where(eq(posts.communityId, id));

      // 5) Delete reports for this community
      await db.delete(reports).where(eq(reports.communityId, id));

      // 6) Delete community invites
      await db.delete(communityInvites).where(eq(communityInvites.communityId, id));

      // 7) Remove user-community memberships for this community
      await db.delete(userCommunities).where(eq(userCommunities.communityId, id));

      // 8) Unset primary community for users whose primary was this community
      await db.update(users).set({ communityId: null }).where(eq(users.communityId, id));

      // 9) Finally delete the community
      const [deleted] = await db.delete(communities).where(eq(communities.id, id)).returning();
      return !!deleted;
    } catch (err) {
      console.error("deleteCommunity cascade error:", err);
      return false;
    }
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

  async getPendingInvitesByPhone(phone: string): Promise<(CommunityInvite & { community?: Community })[]> {
    const normalized = String(phone).trim().replace(/\D/g, "").slice(-10);
    if (!normalized) return [];
    const rows = await db.select().from(communityInvites)
      .where(and(eq(communityInvites.status, "PENDING")));
    const filtered = rows.filter((r) => {
      const stored = String(r.inviteeEmail).replace(/\D/g, "").slice(-10);
      return stored && stored === normalized;
    });
    const result: (CommunityInvite & { community?: Community })[] = [];
    for (const r of filtered) {
      const [comm] = await db.select().from(communities).where(eq(communities.id, r.communityId));
      result.push({ ...r, community: comm });
    }
    return result;
  }

  async getPendingInvitesByUserId(userId: string): Promise<(CommunityInvite & { community?: Community })[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    const byEmail = user.email ? await this.getPendingInvitesByEmail(user.email) : [];
    const byPhone = user.phone ? await this.getPendingInvitesByPhone(user.phone) : [];
    const seen = new Set<string>();
    const merged: (CommunityInvite & { community?: Community })[] = [];
    for (const inv of [...byEmail, ...byPhone]) {
      if (!seen.has(inv.id)) { seen.add(inv.id); merged.push(inv); }
    }
    return merged;
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

  // Compatibility helper: pending listings concept removed, return empty array
  async getPendingListings(communityId: string): Promise<Listing[]> {
    return [];
  }

  async getListingsBySeller(sellerId: string): Promise<Listing[]> {
    return await db.select().from(listings).where(eq(listings.sellerId, sellerId));
  }

  // getPendingListings removed — listing approval flow disabled

  async createListing(listing: InsertListing): Promise<Listing> {
    const { status: _dropped, ...rest } = listing as InsertListing & { status?: string };
    // Listings are created ACTIVE immediately — approval flow removed
    const values = { ...rest, status: "ACTIVE" as const };
    const [inserted] = await db.insert(listings).values(values).returning();
    if (!inserted) throw new Error("Insert failed");
    // No forced enum update required when creating ACTIVE listings
    const [updated] = await db.select().from(listings).where(eq(listings.id, inserted.id));
    return updated ?? inserted;
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

  // Reports
  async createReport(report: InsertReport): Promise<Report> {
    const [r] = await db.insert(reports).values(report).returning();
    return r;
  }

  async getReportsByCommunity(communityId: string): Promise<(Report & { listingTitle?: string; reporterName?: string; sellerName?: string })[]> {
    const rows = await db.select().from(reports).where(eq(reports.communityId, communityId));
    const listingIds = [...new Set(rows.map(r => r.listingId))];
    const userIds = [...new Set(rows.map(r => r.reporterId))];
    const listingsArr = listingIds.length ? await db.select().from(listings).where(inArray(listings.id, listingIds)) : [];
    const usersArr = userIds.length ? await db.select().from(users).where(inArray(users.id, userIds)) : [];
    const listingsMap: Record<string, any> = {};
    listingsArr.forEach(l => { listingsMap[l.id] = l; });
    const usersMap: Record<string, any> = {};
    usersArr.forEach(u => { usersMap[u.id] = u.fullName; });
    return rows.map(r => ({
      ...r,
      listingTitle: listingsMap[r.listingId]?.title,
      reporterName: usersMap[r.reporterId],
      sellerName: listingsMap[r.listingId]?.sellerNameSnapshot,
    }));
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

  async updateBooking(id: string, updates: { status?: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" }): Promise<Booking | undefined> {
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

  async updateOrder(id: string, updates: { status?: "PENDING" | "QUOTATION_PROVIDED" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED"; priceSnapshot?: number }): Promise<Order | undefined> {
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