import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { users, userCommunities, communities } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (!settings.enableRegistration) {
        return res.status(403).json({ message: "Registration is currently disabled by the administrator." });
      }

      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: "Email already exists", field: "email" });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(input.password, salt);

      const user = await storage.createUser({
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "RESIDENT", // Enforce RESIDENT role by default for all new accounts
        status: "ACTIVE",
        isSeller: input.isSeller || false,
        communityId: input.communityId,
        sellerDisplayName: input.sellerDisplayName,
        sellerDescription: input.sellerDescription,
        locality: input.locality,
        postalCode: input.postalCode,
        address: input.address,
        bio: input.bio,
      });

      await storage.createAuditLog({
        actorId: user.id,
        action: "USER_REGISTERED",
        targetType: "USER",
        targetId: user.id
      });

      // Auto-login after registration by setting JWT cookie
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/" });

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
      console.error("Login Error:", err);
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

      const settings = await storage.getSettings();
      if (settings.maintenanceMode && user.role !== "ADMIN") {
        return res.status(503).json({ message: "Platform is currently undergoing maintenance. Please try again later." });
      }

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

  app.post(api.communities.join.path, authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      const communityId = req.params.id;

      // Check if the community exists
      const community = await storage.getCommunity(communityId);
      if (!community) return res.status(404).json({ message: "Community not found" });

      // Check if user already requested or joined this community
      const existing = await storage.getUserCommunity(user.id, communityId);
      if (!existing) {
        await storage.createUserCommunity({ userId: user.id, communityId, status: "PENDING" });
      }

      // If user has no context, optionally set this as their primary pending context
      if (!user.communityId) {
        await storage.updateUser(user.id, { communityId, status: "PENDING", version: user.version });
      }

      const updatedUser = await storage.getUser(user.id);
      res.status(200).json(updatedUser);
    } catch (err) {
      res.status(500).json({ message: "Error joining community" });
    }
  });

  app.delete(api.communities.delete.path, authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const success = await storage.deleteCommunity(req.params.id);
      if (!success) return res.status(404).json({ message: "Not found" });

      await storage.createAuditLog({
        actorId: user.id,
        action: "COMMUNITY_DELETED",
        targetType: "COMMUNITY",
        targetId: req.params.id
      });

      res.status(200).json({ message: "Community deleted" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting community" });
    }
  });

  app.get(api.listings.list.path, authMiddleware, async (req: any, res) => {
    const listings = await storage.getListings();
    // Filter listings based on visibility and user's community
    const user = req.user;
    const settings = await storage.getSettings();

    let filtered = listings;

    if (user.role === "RESIDENT") {
      filtered = listings.filter(l => {
        if (l.visibility === "COMMUNITY_ONLY" && l.communityId === user.communityId) return true;
        if (l.visibility === "GLOBAL" && settings.enableGlobalMarketplace) return true;
        return false;
      });
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
      const currentUserId = req.user.id;
      const currentUserRole = req.user.role;
      const targetUserId = req.params.id;
      const input = api.users.update.input.parse(req.body);

      // Restriction: Only ADMIN can change roles
      if (input.role && currentUserRole !== "ADMIN") {
        return res.status(403).json({ message: "Only administrators can change user roles" });
      }

      // Restriction: Users can only update themselves unless they are ADMIN
      if (currentUserId !== targetUserId && currentUserRole !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const user = await storage.updateUser(targetUserId, input as any);
      if (!user) return res.status(409).json({ message: "Conflict" });

      await storage.createAuditLog({
        actorId: currentUserId,
        action: "USER_UPDATED",
        targetType: "USER",
        targetId: user.id
      });

      res.status(200).json(user);
    } catch (err) {
      res.status(400).json({ message: "Error" });
    }
  });

  app.delete(api.users.delete.path, authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Only administrators can remove users" });
      }

      const success = await storage.deleteUser(req.params.id);
      if (!success) return res.status(404).json({ message: "User not found" });

      await storage.createAuditLog({
        actorId: req.user.id,
        action: "USER_DELETED",
        targetType: "USER",
        targetId: req.params.id
      });

      res.status(200).json({ message: "User successfully removed" });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.auditLogs.list.path, authMiddleware, async (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
    const logs = await storage.getAuditLogs();
    res.status(200).json(logs);
  });

  // Marketplace: Bookings & Orders
  app.get(api.bookings.list.path, authMiddleware, async (req: any, res) => {
    const user = req.user;
    const bookings = user.role === "RESIDENT"
      ? await storage.getBookingsByUser(user.id)
      : await storage.getBookingsBySeller(user.id);
    res.status(200).json(bookings);
  });

  app.post(api.bookings.create.path, authMiddleware, async (req: any, res) => {
    try {
      const input = api.bookings.create.input.parse(req.body);
      const listing = await storage.getListing(input.listingId);
      if (!listing) return res.status(404).json({ message: "Listing not found" });

      const booking = await storage.createBooking({
        listingId: listing.id,
        userId: req.user.id,
        sellerId: listing.sellerId,
        bookingDate: new Date(input.bookingDate),
        status: "PENDING",
        priceSnapshot: listing.price,
      });

      res.status(201).json(booking);
    } catch (err) {
      res.status(400).json({ message: "Error creating booking" });
    }
  });

  app.get(api.orders.list.path, authMiddleware, async (req: any, res) => {
    const user = req.user;
    const orders = await storage.getOrdersByUser(user.id);
    res.status(200).json(orders);
  });

  app.post(api.orders.create.path, authMiddleware, async (req: any, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const listing = await storage.getListing(input.listingId);
      if (!listing) return res.status(404).json({ message: "Listing not found" });

      const order = await storage.createOrder({
        listingId: listing.id,
        userId: req.user.id,
        sellerId: listing.sellerId,
        status: "PENDING",
        priceSnapshot: listing.price,
      });

      res.status(201).json(order);
    } catch (err) {
      res.status(400).json({ message: "Error creating order" });
    }
  });

  app.get("/api/my-listings", authMiddleware, async (req: any, res) => {
    const listings = await storage.getListingsBySeller(req.user.id);
    res.status(200).json(listings);
  });

  app.get(api.admin.analytics.path, authMiddleware, async (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });

    const [communities, users, listings, bookings, orders] = await Promise.all([
      storage.getCommunities(),
      storage.getUsers(),
      storage.getListings(),
      storage.getBookings(),
      storage.getOrders()
    ]);

    const activeServices = listings.filter(l => l.listingType === 'SERVICE' && l.status === 'ACTIVE').length;

    // Calculate Total Revenue (Sum of all completed/pending orders & bookings for simplicity here)
    // In a real app, you'd filter by 'COMPLETED' status
    const bookingRevenue = bookings.reduce((sum, b) => sum + b.priceSnapshot, 0);
    const orderRevenue = orders.reduce((sum, o) => sum + o.priceSnapshot, 0);
    const totalRevenue = bookingRevenue + orderRevenue;

    const settings = await storage.getSettings();
    const commissionRate = settings.commissionRate / 100;
    const commission = Math.round(totalRevenue * commissionRate);

    const monthsStr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const last6Months: { name: string, month: number, year: number, revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      last6Months.push({
        name: monthsStr[d.getMonth()],
        month: d.getMonth(),
        year: d.getFullYear(),
        revenue: 0,
      });
    }

    bookings.forEach(b => {
      if (!b.createdAt) return;
      const d = new Date(b.createdAt);
      const monthData = last6Months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (monthData) monthData.revenue += (b.priceSnapshot / 100);
    });
    orders.forEach(o => {
      if (!o.createdAt) return;
      const d = new Date(o.createdAt);
      const monthData = last6Months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (monthData) monthData.revenue += (o.priceSnapshot / 100);
    });

    const revenueTrend = last6Months.map(m => ({ name: m.name, revenue: m.revenue }));

    // Service Categories breakdown
    const categoriesMap: Record<string, number> = {};
    listings.filter(l => l.listingType === 'SERVICE').forEach(l => {
      const cat = l.category || 'Other';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
    });

    const totalServices = listings.filter(l => l.listingType === 'SERVICE').length || 1;
    const colors = ['#1e3a8a', '#2563eb', '#3b82f6', '#94a3b8', '#cbd5e1'];
    const serviceCategories = Object.entries(categoriesMap).map(([name, count], idx) => ({
      name,
      value: Math.round((count / totalServices) * 100),
      color: colors[idx % colors.length]
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    const userGrowth = last6Months.map(m => {
      const endOfMonth = new Date(m.year, m.month + 1, 0, 23, 59, 59);
      const usersUntilMonth = users.filter((u: any) => u.createdAt && new Date(u.createdAt) <= endOfMonth).length;
      return { name: m.name, users: usersUntilMonth };
    });

    res.status(200).json({
      metrics: {
        communities: communities.length,
        totalUsers: users.length,
        activeServices,
        totalRevenue: totalRevenue / 100, // Assuming price is in cents
        commission: commission / 100,
      },
      revenueTrend,
      userGrowth,
      serviceCategories
    });
  });

  app.get(api.manager.analytics.path, authMiddleware, async (req: any, res) => {
    if (req.user.role !== "COMMUNITY_MANAGER") return res.status(403).json({ message: "Forbidden" });
    const communityId = req.user.communityId;
    if (!communityId) return res.status(400).json({ message: "No community assigned" });

    const [users, listings, bookings, orders] = await Promise.all([
      storage.getUsers(),
      storage.getListings(),
      storage.getBookings(),
      storage.getOrders()
    ]);

    const communityUsers = users.filter(u => u.communityId === communityId);
    const pendingApprovals = communityUsers.filter(u => u.status === 'PENDING').length;

    const communityListings = listings.filter(l => l.communityId === communityId);
    const activeSellers = new Set(communityListings.map(l => l.sellerId)).size;
    const totalListings = communityListings.length;

    // We don't have reported listings or low-rated services in schema right now, so dummy data
    const reportedListings = 0;
    const lowRatedServices = 0;
    const disputedBookings = 0;

    const communityBookings = bookings.filter(b => communityListings.some(l => l.id === b.listingId));
    const communityOrders = orders.filter(o => communityListings.some(l => l.id === o.listingId));

    // Monthly GMV and weekly growth
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    let monthlyGmv = 0;
    let thisWeekGmv = 0;
    let lastWeekGmv = 0;

    const processTransaction = (t: any, dateField: Date | null | undefined, price: number) => {
      if (!dateField) return;
      const d = new Date(dateField);
      if (d >= thirtyDaysAgo) monthlyGmv += price;
      if (d >= sevenDaysAgo) thisWeekGmv += price;
      else if (d >= fourteenDaysAgo) lastWeekGmv += price;
    };

    communityBookings.forEach(b => processTransaction(b, b.createdAt, b.priceSnapshot));
    communityOrders.forEach(o => processTransaction(o, o.createdAt, o.priceSnapshot));

    const weeklyGrowth = lastWeekGmv === 0 ? (thisWeekGmv > 0 ? 100 : 0) : Math.round(((thisWeekGmv - lastWeekGmv) / lastWeekGmv) * 100);

    const settings = await storage.getSettings();
    const commissionRate = settings.commissionRate / 100;
    const platformCommission = Math.round(monthlyGmv * commissionRate);

    // Trend charts
    const monthsStr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const monthlyRevenueTrend: { name: string, month: number, year: number, revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      monthlyRevenueTrend.push({
        name: monthsStr[d.getMonth()],
        month: d.getMonth(),
        year: d.getFullYear(),
        revenue: 0,
      });
    }

    const processTrend = (t: any, dateField: Date | null | undefined, price: number) => {
      if (!dateField) return;
      const d = new Date(dateField);
      const monthData = monthlyRevenueTrend.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (monthData) monthData.revenue += (price / 100);
    };

    communityBookings.forEach(b => processTrend(b, b.createdAt, b.priceSnapshot));
    communityOrders.forEach(o => processTrend(o, o.createdAt, o.priceSnapshot));

    // Weekly bookings trend
    const weeklyBookingsTrend: { name: string, bookings: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      weeklyBookingsTrend.push({ name: `W${6 - i}`, bookings: 0 }); // W1 to W6
    }

    communityBookings.forEach(b => {
      if (!b.createdAt) return;
      const daysAgo = Math.floor((currentDate.getTime() - new Date(b.createdAt).getTime()) / (1000 * 3600 * 24));
      const weekIdx = Math.floor(daysAgo / 7);
      if (weekIdx >= 0 && weekIdx < 6) {
        weeklyBookingsTrend[5 - weekIdx].bookings += 1;
      }
    });

    res.status(200).json({
      actionCenter: {
        pendingApprovals,
        reportedListings,
        disputedBookings,
        lowRatedServices,
      },
      snapshot: {
        totalMembers: communityUsers.length,
        activeSellers,
        totalListings,
        weeklyGrowth,
        monthlyGmv: monthlyGmv / 100,
        platformCommission: platformCommission / 100,
      },
      weeklyBookingsTrend,
      monthlyRevenueTrend: monthlyRevenueTrend.map(m => ({ name: m.name, revenue: m.revenue }))
    });
  });

  app.get('/api/users/:id/communities', authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.id !== req.params.id && user.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const memberships = await db.select({
        community: communities,
        joinStatus: userCommunities.status,
      })
        .from(userCommunities)
        .innerJoin(communities, eq(userCommunities.communityId, communities.id))
        .where(eq(userCommunities.userId, req.params.id));

      res.status(200).json(memberships);
    } catch (err) {
      res.status(500).json({ message: "Error fetching user communities" });
    }
  });

  app.get('/api/manager/approvals', authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== "COMMUNITY_MANAGER" || !user.communityId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Fetch users who have requested to join this community
      const pendingRequests = await db.select({
        user: users,
        userCommunityId: userCommunities.id,
        joinStatus: userCommunities.status,
      })
        .from(userCommunities)
        .innerJoin(users, eq(userCommunities.userId, users.id))
        .where(and(eq(userCommunities.communityId, user.communityId), eq(userCommunities.status, 'PENDING')));

      // Format response to match expected frontend structure but include join mapping
      const formattedUsers = pendingRequests.map(r => ({
        ...r.user,
        userCommunityId: r.userCommunityId,
        joinStatus: r.joinStatus,
      }));

      res.status(200).json(formattedUsers);
    } catch (err) {
      res.status(500).json({ message: "Error fetching approvals" });
    }
  });

  app.post('/api/manager/approvals/:id/approve', authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== "COMMUNITY_MANAGER" || !user.communityId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const userCommunityId = req.params.id;
      const [uc] = await db.select().from(userCommunities).where(eq(userCommunities.id, userCommunityId));
      if (!uc || uc.communityId !== user.communityId) {
        return res.status(404).json({ message: "Record not found" });
      }

      await storage.updateUserCommunity(userCommunityId, 'ACTIVE');

      const targetUser = await storage.getUser(uc.userId);
      if (targetUser && targetUser.communityId === uc.communityId) {
        await storage.updateUser(targetUser.id, { status: 'ACTIVE', version: targetUser.version });
      }

      res.status(200).json({ message: "Approved successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error approving member" });
    }
  });

  app.post('/api/manager/approvals/:id/reject', authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== "COMMUNITY_MANAGER" || !user.communityId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const userCommunityId = req.params.id;
      const [uc] = await db.select().from(userCommunities).where(eq(userCommunities.id, userCommunityId));
      if (!uc || uc.communityId !== user.communityId) {
        return res.status(404).json({ message: "Record not found" });
      }

      await storage.updateUserCommunity(userCommunityId, 'REMOVED');

      const targetUser = await storage.getUser(uc.userId);
      if (targetUser && targetUser.communityId === uc.communityId) {
        await storage.updateUser(targetUser.id, { status: 'REMOVED', version: targetUser.version, communityId: null });
      }

      res.status(200).json({ message: "Rejected successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error rejecting member" });
    }
  });

  app.get(api.admin.settings.get.path, authMiddleware, async (req: any, res) => {
    const settings = await storage.getSettings();
    res.status(200).json(settings);
  });

  app.put(api.admin.settings.update.path, authMiddleware, async (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
    try {
      const input = api.admin.settings.update.input.parse(req.body);
      const updated = await storage.updateSettings(input);
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid settings data" });
    }
  });

  return httpServer;
}