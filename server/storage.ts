import { db } from "./db";
import { 
  users, communities, listings, auditLogs,
  type User, type InsertUser, type UpdateUserRequest,
  type Community, type InsertCommunity, type UpdateCommunityRequest,
  type Listing, type InsertListing, type UpdateListingRequest,
  type AuditLog
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: UpdateUserRequest): Promise<User | undefined>;
  
  // Communities
  getCommunity(id: string): Promise<Community | undefined>;
  getCommunities(): Promise<Community[]>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  updateCommunity(id: string, updates: UpdateCommunityRequest): Promise<Community | undefined>;
  
  // Listings
  getListing(id: string): Promise<Listing | undefined>;
  getListings(): Promise<Listing[]>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: string, updates: UpdateListingRequest): Promise<Listing | undefined>;
  
  // Audit Logs
  getAuditLogs(): Promise<AuditLog[]>;
  createAuditLog(log: Omit<AuditLog, "id" | "timestamp">): Promise<AuditLog>;
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
  
  // Communities
  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }
  
  async getCommunities(): Promise<Community[]> {
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
  
  // Listings
  async getListing(id: string): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing;
  }
  
  async getListings(): Promise<Listing[]> {
    return await db.select().from(listings);
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
  
  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(auditLogs.timestamp);
  }
  
  async createAuditLog(log: Omit<AuditLog, "id" | "timestamp">): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }
}

export const storage = new DatabaseStorage();