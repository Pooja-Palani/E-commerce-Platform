import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Basic middleware to parse cookies
  app.use((req: any, res, next) => {
    if (!req.cookies && req.headers.cookie) {
      req.cookies = req.headers.cookie.split(';').reduce((acc: any, cookie: string) => {
        const [key, val] = cookie.trim().split('=');
        acc[key] = val;
        return acc;
      }, {});
    }
    next();
  });
  
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: "Email already exists", field: "email" });
      }
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(input.password, salt);
      
      // Determine initial role if it's the very first user
      const usersCount = (await storage.getUsers()).length;
      let role = input.role || "RESIDENT";
      if (usersCount === 0) {
        role = "ADMIN"; // First user is admin
      }
      
      const user = await storage.createUser({
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: role as any,
        status: "ACTIVE", // Active by default for now
        isSeller: input.isSeller || false,
        communityId: input.communityId,
        sellerDisplayName: input.sellerDisplayName,
        sellerDescription: input.sellerDescription,
      });
      
      await storage.createAuditLog({
        actorId: user.id,
        action: "USER_REGISTERED",
        targetType: "USER",
        targetId: user.id
      });
      
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByEmail(input.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isMatch = await bcrypt.compare(input.password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (user.status !== "ACTIVE") {
        return res.status(401).json({ message: "User account is not active" });
      }
      
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/" });
      
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.auth.me.path, async (req: any, res) => {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await storage.getUser(decoded.userId);
      if (!user) return res.status(401).json({ message: "User not found" });
      res.status(200).json(user);
    } catch {
      res.status(401).json({ message: "Invalid token" });
    }
  });
  
  app.post(api.auth.logout.path, (req, res) => {
    res.clearCookie("token", { path: "/" });
    res.status(200).json({ message: "Logged out" });
  });
  
  // Auth middleware to inject req.user
  const authMiddleware = async (req: any, res: any, next: any) => {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await storage.getUser(decoded.userId);
      if (!user) return res.status(401).json({ message: "User not found" });
      req.user = user;
      next();
    } catch {
      res.status(401).json({ message: "Invalid token" });
    }
  };

  app.get(api.communities.list.path, authMiddleware, async (req, res) => {
    const communities = await storage.getCommunities();
    res.status(200).json(communities);
  });
  
  app.post(api.communities.create.path, authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== "ADMIN" && user.role !== "COMMUNITY_MANAGER") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const input = api.communities.create.input.parse(req.body);
      const community = await storage.createCommunity({
        ...input,
        createdById: user.id,
        ownerId: user.id
      });
      
      await storage.createAuditLog({
        actorId: user.id,
        action: "COMMUNITY_CREATED",
        targetType: "COMMUNITY",
        targetId: community.id
      });
      
      res.status(201).json(community);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Error" });
    }
  });
  
  app.get(api.communities.get.path, authMiddleware, async (req, res) => {
    const comm = await storage.getCommunity(req.params.id);
    if (!comm) return res.status(404).json({ message: "Not found" });
    res.status(200).json(comm);
  });
  
  app.put(api.communities.update.path, authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== "ADMIN" && user.role !== "COMMUNITY_MANAGER") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const input = api.communities.update.input.parse(req.body);
      const comm = await storage.updateCommunity(req.params.id, input as any);
      if (!comm) return res.status(409).json({ message: "Conflict or not found" });
      
      await storage.createAuditLog({
        actorId: user.id,
        action: "COMMUNITY_UPDATED",
        targetType: "COMMUNITY",
        targetId: comm.id
      });
      
      res.status(200).json(comm);
    } catch (err) {
      res.status(400).json({ message: "Error updating" });
    }
  });
  
  app.get(api.listings.list.path, authMiddleware, async (req: any, res) => {
    const listings = await storage.getListings();
    // Filter listings based on visibility and user's community
    const user = req.user;
    let filtered = listings;
    if (user.role === "RESIDENT") {
      filtered = listings.filter(l => 
        (l.visibility === "GLOBAL") || 
        (l.visibility === "COMMUNITY_ONLY" && l.communityId === user.communityId)
      );
    }
    res.status(200).json(filtered);
  });
  
  app.post(api.listings.create.path, authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user.isSeller) {
        return res.status(403).json({ message: "User is not a seller" });
      }
      const input = api.listings.create.input.parse(req.body);
      const comm = await storage.getCommunity(input.communityId);
      if (!comm) return res.status(400).json({ message: "Invalid community" });
      
      const listing = await storage.createListing({
        ...input,
        sellerId: user.id,
        sellerNameSnapshot: user.sellerDisplayName || user.fullName,
        communityNameSnapshot: comm.name,
        visibility: comm.visibility === "PUBLIC" ? "GLOBAL" : "COMMUNITY_ONLY",
        status: "ACTIVE"
      });
      res.status(201).json(listing);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Error" });
    }
  });
  
  app.put(api.listings.update.path, authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      const input = api.listings.update.input.parse(req.body);
      const listing = await storage.getListing(req.params.id);
      if (!listing) return res.status(404).json({ message: "Not found" });
      if (listing.sellerId !== user.id && user.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updated = await storage.updateListing(req.params.id, input as any);
      if (!updated) return res.status(409).json({ message: "Conflict" });
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ message: "Error" });
    }
  });

  app.get(api.users.list.path, authMiddleware, async (req: any, res) => {
    if (req.user.role === "RESIDENT") return res.status(403).json({ message: "Forbidden" });
    const users = await storage.getUsers();
    res.status(200).json(users);
  });
  
  app.put(api.users.update.path, authMiddleware, async (req: any, res) => {
    try {
      const input = api.users.update.input.parse(req.body);
      const user = await storage.updateUser(req.params.id, input as any);
      if (!user) return res.status(409).json({ message: "Conflict" });
      
      await storage.createAuditLog({
        actorId: req.user.id,
        action: "USER_UPDATED",
        targetType: "USER",
        targetId: user.id
      });
      
      res.status(200).json(user);
    } catch (err) {
      res.status(400).json({ message: "Error" });
    }
  });
  
  app.get(api.auditLogs.list.path, authMiddleware, async (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
    const logs = await storage.getAuditLogs();
    res.status(200).json(logs);
  });

  return httpServer;
}