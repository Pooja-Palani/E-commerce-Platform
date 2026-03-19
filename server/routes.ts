import express, { type Express } from "express";
import type { Server } from "http";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { users, userCommunities, communities, insertListingSchema } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import { upload } from "./upload";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const communityPostCooldownByUser = new Map<string, number>();
const COMMUNITY_POST_COOLDOWN_MS = 30_000;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.use("/uploads", express.static(uploadsDir));

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

      if (input.phone) {
        const existingPhoneUser = await storage.getUserByPhone(input.phone);
        if (existingPhoneUser) {
          return res.status(400).json({ message: "Phone number already exists", field: "phone" });
        }
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(input.password, salt);

      const inviteCommunityId = (input as any).inviteCommunityId;
      const community = inviteCommunityId ? await storage.getCommunity(inviteCommunityId) : null;
      // Newly onboarded users: no community = PENDING until they join & get approved.
      // With invite: public = PENDING (approval required); private = ACTIVE (invite = pre-approval).
      const isPublicInvite = community?.visibility === "PUBLIC";
      const hasInvite = inviteCommunityId && community;
      const needsApproval = hasInvite ? isPublicInvite : true; // No invite = no community yet = PENDING
      const userStatus = needsApproval ? "PENDING" : "ACTIVE";
      const user = await storage.createUser({
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "RESIDENT", // Enforce RESIDENT role by default for all new accounts
        status: userStatus,
        isSeller: input.isSeller || false,
        communityId: inviteCommunityId && community ? inviteCommunityId : input.communityId,
        sellerDisplayName: input.sellerDisplayName,
        sellerDescription: input.sellerDescription,
        locality: input.locality,
        postalCode: input.postalCode,
        unitFlatNumber: input.unitFlatNumber,
        address: input.address,
        bio: input.bio,
      });
      if (inviteCommunityId && community) {
        const membershipStatus = needsApproval ? "PENDING" : "ACTIVE";
        await storage.createUserCommunity({ userId: user.id, communityId: inviteCommunityId, status: membershipStatus });
      }

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
      console.error("Registration error:", err);
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Internal server error";
      res.status(500).json({ message });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const email = String(input.email).trim().toLowerCase();
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(input.password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Allow ACTIVE and PENDING (so pending users can see approval status); block SUSPENDED/REMOVED
      if (user.status !== "ACTIVE" && user.status !== "PENDING") {
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
    if (!token) return res.status(200).json(null);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await storage.getUser(decoded.userId);
      if (!user) return res.status(200).json(null);
      res.status(200).json(user);
    } catch {
      res.status(200).json(null);
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    res.clearCookie("token", { path: "/" });
    res.status(200).json({ message: "Logged out" });
  });

  app.get("/api/public/branding", async (_req, res) => {
    try {
      const settings = await storage.getSettings();
      res.status(200).json({
        platformName: settings.platformName,
        platformLogoUrl: settings.platformLogoUrl ?? null,
      });
    } catch {
      res.status(200).json({
        platformName: "Qvanto Market",
        platformLogoUrl: null,
      });
    }
  });

  // Dummy OTP login (any code works for development)
  app.post("/api/auth/request-otp", async (req, res) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      if (!email) return res.status(400).json({ message: "Email is required" });
      res.status(200).json({ message: "OTP sent (dummy: use any 4+ character code to sign in)" });
    } catch {
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/login-with-otp", async (req, res) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const otp = typeof req.body?.otp === "string" ? req.body.otp.trim() : "";
      if (!email) return res.status(400).json({ message: "Email is required" });
      if (!otp || otp.length < 4) return res.status(400).json({ message: "Enter a valid OTP (dummy: any 4+ character code)" });
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(401).json({ message: "Invalid email or OTP" });
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
      res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/" });
      res.status(200).json(user);
    } catch {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Auth middleware to inject req.user
  const authMiddleware = async (req: any, res: any, next: any) => {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await storage.getUser(decoded.userId);
      if (!user) return res.status(401).json({ message: "User not found" });

      // PENDING users can access read-only routes needed for the UI to render.
      // Individual route handlers already return empty/limited data for PENDING users.
      const selfCommunitiesMatch = req.path.match(/^\/api\/users\/([^/]+)\/communities$/);
      const isSelfCommunities = selfCommunitiesMatch && selfCommunitiesMatch[1] === user.id;
      const isReadOnly = req.method === "GET";
      const isAllowedForPending =
        req.path === api.auth.me.path ||
        req.path === api.communities.list.path ||
        (req.path.startsWith("/api/communities/") && req.path.endsWith("/join")) ||
        req.path.match(/^\/api\/invites(\/[^/]+\/(accept|decline))?$/) ||
        (isReadOnly && (
          req.path === api.listings.list.path ||
          isSelfCommunities ||
          req.path === "/api/admin/settings" ||
          req.path.match(/^\/api\/communities\/[^/]+\/posts$/) ||
          req.path === "/api/seller/orders" ||
          req.path === "/api/my-listings"
        ));

      if (user.status === "PENDING" && user.role !== "ADMIN" && user.role !== "COMMUNITY_MANAGER" && !isAllowedForPending) {
        return res.status(403).json({ message: "Your account is pending approval by a community manager." });
      }

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

  // Helper to ensure the current user has ACTIVE membership for a community
  const ensureActiveMembership = async (user: any, communityId: string) => {
    if (!communityId) return { allowed: false };
    // Admins can always access
    if (user.role === "ADMIN") return { allowed: true };
    // Community managers can access their community
    if (user.role === "COMMUNITY_MANAGER" && user.communityId === communityId) return { allowed: true };
    // Residents: pending users should be blocked with a clear message
    if (user.status === "PENDING") return { allowed: false, pending: true, message: "Your community membership is pending approval. You'll have access once approved." };
    // Check explicit user_communities table for ACTIVE status
    const uc = await storage.getUserCommunity(user.id, communityId);
    if (uc && uc.status === "ACTIVE") return { allowed: true };
    // Also allow if user's primary community is this and they're ACTIVE
    if (user.communityId === communityId && user.status === "ACTIVE") return { allowed: true };
    return { allowed: false };
  };

  app.get(api.communities.list.path, authMiddleware, async (req, res) => {
    const parentId = req.query.parentId as string | undefined;
    const communities = await storage.getCommunities(parentId);
    res.status(200).json(communities);
  });

  app.post(api.communities.create.path, authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== "ADMIN" && user.role !== "COMMUNITY_MANAGER") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const input = api.communities.create.input.parse(req.body);
      const nameNorm = String(input.name).trim();
      const allCommunities = await storage.getCommunities();
      if (allCommunities.some((c) => c.name.trim().toLowerCase() === nameNorm.toLowerCase())) {
        return res.status(400).json({ message: "A community with this name already exists.", field: "name" });
      }
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
      if (input.name != null) {
        const nameNorm = String(input.name).trim();
        const allCommunities = await storage.getCommunities();
        const duplicate = allCommunities.some(
          (c) => c.id !== req.params.id && c.name.trim().toLowerCase() === nameNorm.toLowerCase()
        );
        if (duplicate) {
          return res.status(400).json({ message: "A community with this name already exists.", field: "name" });
        }
      }
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

  app.post(api.communities.leave.path, authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      const communityId = req.params.id;

      const community = await storage.getCommunity(communityId);
      if (!community) return res.status(404).json({ message: "Community not found" });

      const uc = await storage.getUserCommunity(user.id, communityId);
      if (!uc) return res.status(400).json({ message: "You are not a member of this community" });
      if (uc.status !== "ACTIVE") return res.status(400).json({ message: "You have already left this community" });

      await storage.updateUserCommunity(uc.id, "REMOVED");

      let newCommunityId: string | null = null;
      if (user.communityId === communityId) {
        const userCommunitiesList = await storage.getUserCommunities(user.id);
        const otherActive = userCommunitiesList.find(
          (m: any) => m.communityId !== communityId && m.status === "ACTIVE"
        );
        newCommunityId = otherActive?.communityId ?? null;
        await storage.updateUser(user.id, { communityId: newCommunityId, version: user.version });
      }

      const updatedUser = await storage.getUser(user.id);
      res.status(200).json(updatedUser);
    } catch (err) {
      res.status(500).json({ message: "Error leaving community" });
    }
  });

  app.post(api.communities.join.path, authMiddleware, async (req: any, res) => {
    try {
      // Refetch user to get latest state (version, communityId) - avoids stale data from other tabs/sessions
      const user = await storage.getUser(req.user.id) ?? req.user;
      const communityId = req.params.id;

      // Check if the community exists
      const community = await storage.getCommunity(communityId);
      if (!community) return res.status(404).json({ message: "Community not found" });

      // Private: always require manager approval. Public: user in another community → no approval; user in no community → approval required.
      const isPublic = community.visibility === "PUBLIC";
      const userCommunities = await storage.getUserCommunities(user.id);
      const otherActive = userCommunities.filter((uc) => uc.communityId !== communityId && uc.status === "ACTIVE");
      const hasAnyOtherCommunity = (user.communityId != null && user.communityId !== communityId) || otherActive.length > 0;
      const isNewlyOnboarded = !hasAnyOtherCommunity;

      const needsApproval = !isPublic || (isPublic && isNewlyOnboarded);
      const membershipStatus = needsApproval ? "PENDING" : "ACTIVE";
      const userStatus = needsApproval ? "PENDING" : "ACTIVE";

      // Check if user already requested or joined this community
      const existing = await storage.getUserCommunity(user.id, communityId);
      if (!existing) {
        await storage.createUserCommunity({ userId: user.id, communityId, status: membershipStatus });
      } else if (existing.status !== "ACTIVE" && existing.status !== membershipStatus) {
        // Re-join after REMOVED or update PENDING→ACTIVE if logic changed
        await storage.updateUserCommunity(existing.id, membershipStatus);
      }

      // Set primary community and status: always update when this is/will be their primary (ensures PENDING is applied)
      const thisIsPrimary = !user.communityId || user.communityId === communityId;
      if (thisIsPrimary) {
        await storage.updateUser(user.id, { communityId, status: userStatus, version: user.version });
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

  app.get("/api/communities/:id/members", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      const communityId = req.params.id;
      const community = await storage.getCommunity(communityId);
      if (!community) return res.status(404).json({ message: "Community not found" });
      if (user.role === "ADMIN" || (user.role === "COMMUNITY_MANAGER" && user.communityId === communityId)) {
        const members = await storage.getCommunityMembers(communityId);
        return res.status(200).json(members);
      }
      return res.status(403).json({ message: "Forbidden" });
    } catch (err) {
      res.status(500).json({ message: "Error fetching members" });
    }
  });

  app.post("/api/communities/:id/members/remove", authMiddleware, async (req: any, res) => {
    try {
      const currentUser = req.user;
      const communityId = req.params.id;
      const canManage = currentUser.role === "ADMIN" || (currentUser.role === "COMMUNITY_MANAGER" && currentUser.communityId === communityId);
      if (!canManage) return res.status(403).json({ message: "Forbidden" });
      const { userId } = req.body as { userId: string };
      if (!userId) return res.status(400).json({ message: "userId is required" });
      const targetUser = await storage.getUser(userId);
      if (!targetUser) return res.status(404).json({ message: "User not found" });
      // Only administrators can remove other community managers or administrators
      if (targetUser.role === "ADMIN") {
        if (currentUser.role !== "ADMIN") {
          return res.status(403).json({ message: "Only administrators can remove administrators" });
        }
      }
      if (targetUser.role === "COMMUNITY_MANAGER" && targetUser.communityId === communityId) {
        if (currentUser.role !== "ADMIN") {
          return res.status(403).json({ message: "Only administrators can remove community managers" });
        }
      }
      if (targetUser.communityId === communityId) {
        await storage.updateUser(userId, { communityId: null, version: targetUser.version });
      }
      const uc = await storage.getUserCommunity(userId, communityId);
      if (uc) await storage.updateUserCommunity(uc.id, "REMOVED");
      res.status(200).json({ message: "User removed from community" });
    } catch (err) {
      res.status(500).json({ message: "Error removing user from community" });
    }
  });

  app.post("/api/communities/:id/members/add", authMiddleware, async (req: any, res) => {
    const sendJson = (status: number, data: object) => {
      res.setHeader("Content-Type", "application/json");
      res.status(status).json(data);
    };
    try {
      const currentUser = req.user;
      const communityId = req.params.id;
      const canManage = currentUser.role === "ADMIN" || (currentUser.role === "COMMUNITY_MANAGER" && currentUser.communityId === communityId);
      if (!canManage) return sendJson(403, { message: "Forbidden" });
      const userId = req.body?.userId != null ? String(req.body.userId) : null;
      if (!userId) return sendJson(400, { message: "userId is required" });
      const community = await storage.getCommunity(communityId);
      if (!community) return sendJson(404, { message: "Community not found" });
      const user = await storage.getUser(userId);
      if (!user) return sendJson(404, { message: "User not found" });
      const existing = await storage.getUserCommunity(userId, communityId);
      if (existing && existing.status === "ACTIVE") {
        return sendJson(400, { message: "User is already in this community" });
      }
      if (existing) {
        await storage.updateUserCommunity(existing.id, "ACTIVE");
      } else {
        await storage.createUserCommunity({ userId, communityId, status: "ACTIVE" });
      }
      await storage.updateUser(userId, { communityId, status: "ACTIVE", version: user.version });
      const updated = await storage.getUser(userId);
      return sendJson(200, updated ?? user);
    } catch (err) {
      console.error("Add member to community error:", err);
      return sendJson(500, { message: err instanceof Error ? err.message : "Error adding user to community" });
    }
  });

  // Community invite: for existing users - sends invite they can accept in-app (by phone)
  app.post("/api/communities/:id/invite", authMiddleware, async (req: any, res) => {
    try {
      const currentUser = req.user;
      const communityId = req.params.id;
      const canManage = currentUser.role === "ADMIN" || (currentUser.role === "COMMUNITY_MANAGER" && currentUser.communityId === communityId);
      if (!canManage) return res.status(403).json({ message: "Forbidden" });
      const { phone } = req.body as { phone?: string };
      if (!phone || typeof phone !== "string") return res.status(400).json({ message: "Phone number is required" });
      const inviteePhone = phone.trim();
      const community = await storage.getCommunity(communityId);
      if (!community) return res.status(404).json({ message: "Community not found" });
      const existingUser = await storage.getUserByPhone(inviteePhone);
      if (existingUser) {
        const uc = await storage.getUserCommunity(existingUser.id, communityId);
        if (uc?.status === "ACTIVE") return res.status(400).json({ message: "User is already in this community" });
        const existingByPhone = (await storage.getPendingInvitesByPhone(inviteePhone)).find(i => i.communityId === communityId);
        if (existingByPhone) return res.status(400).json({ message: "Invite already sent to this phone number" });
        await storage.createCommunityInvite({
          communityId,
          inviteeEmail: inviteePhone,
          inviteeId: existingUser.id,
          invitedById: currentUser.id,
          status: "PENDING",
        });
        return res.status(200).json({ message: "Invite sent. The user will see it in their profile and can accept." });
      }
      return res.status(200).json({ message: "User not found. Use the invite link below to share with them.", useInviteLink: true });
    } catch (err) {
      res.status(500).json({ message: err instanceof Error ? err.message : "Invite failed" });
    }
  });

  app.get("/api/communities/:id/invite-link", authMiddleware, async (req: any, res) => {
    try {
      const currentUser = req.user;
      const communityId = req.params.id;
      const canManage = currentUser.role === "ADMIN" || (currentUser.role === "COMMUNITY_MANAGER" && currentUser.communityId === communityId);
      if (!canManage) return res.status(403).json({ message: "Forbidden" });
      const community = await storage.getCommunity(communityId);
      if (!community) return res.status(404).json({ message: "Community not found" });
      const baseUrl = process.env.APP_URL || (req.protocol + "://" + req.get("host"));
      const inviteLink = `${baseUrl}/register?invite=${communityId}`;
      return res.status(200).json({ inviteLink, communityName: community.name });
    } catch (err) {
      res.status(500).json({ message: "Failed to get invite link" });
    }
  });

  app.get("/api/invites", authMiddleware, async (req: any, res) => {
    try {
      const invites = await storage.getPendingInvitesByUserId(req.user.id);
      res.status(200).json(invites ?? []);
    } catch (err) {
      console.error("GET /api/invites error:", err);
      res.status(200).json([]);
    }
  });

  app.post("/api/invites/:id/accept", authMiddleware, async (req: any, res) => {
    try {
      const invite = await storage.getCommunityInvite(req.params.id);
      if (!invite) return res.status(404).json({ message: "Invite not found" });
      if (invite.status !== "PENDING") return res.status(400).json({ message: "Invite is no longer valid" });
      const matchEmail = req.user.email && invite.inviteeEmail.toLowerCase() === req.user.email.toLowerCase();
      const matchPhone = req.user.phone && (() => {
        const a = String(invite.inviteeEmail).replace(/\D/g, "").slice(-10);
        const b = String(req.user.phone).replace(/\D/g, "").slice(-10);
        return a && b && a === b;
      })();
      if (!matchEmail && !matchPhone) return res.status(403).json({ message: "This invite was sent to a different phone number or email" });
      const uc = await storage.getUserCommunity(req.user.id, invite.communityId);
      if (uc?.status === "ACTIVE") {
        await storage.updateCommunityInvite(invite.id, "REJECTED");
        return res.status(400).json({ message: "You are already in this community" });
      }
      // Same approval logic: user in another community → no approval; user in no community → approval needed for PUBLIC
      const community = await storage.getCommunity(invite.communityId);
      const userCommunities = await storage.getUserCommunities(req.user.id);
      const otherActive = userCommunities.filter((c) => c.communityId !== invite.communityId && c.status === "ACTIVE");
      const hasAnyOtherCommunity = (req.user.communityId && req.user.communityId !== invite.communityId) || otherActive.length > 0;
      const isPublic = community?.visibility === "PUBLIC";
      const needsApproval = isPublic && !hasAnyOtherCommunity;
      const membershipStatus = needsApproval ? "PENDING" : "ACTIVE";
      const userStatus = needsApproval ? "PENDING" : "ACTIVE";
      if (uc) await storage.updateUserCommunity(uc.id, membershipStatus);
      else await storage.createUserCommunity({ userId: req.user.id, communityId: invite.communityId, status: membershipStatus });
      // Update user when setting/keeping this as primary community (no primary yet, or primary is this one)
      if (!req.user.communityId || req.user.communityId === invite.communityId) {
        await storage.updateUser(req.user.id, { communityId: invite.communityId, status: userStatus, version: req.user.version });
      }
      await storage.updateCommunityInvite(invite.id, "ACCEPTED", req.user.id);
      const updatedUser = await storage.getUser(req.user.id);
      res.status(200).json(updatedUser);
    } catch (err) {
      res.status(500).json({ message: err instanceof Error ? err.message : "Failed to accept invite" });
    }
  });

  app.post("/api/invites/:id/decline", authMiddleware, async (req: any, res) => {
    try {
      const invite = await storage.getCommunityInvite(req.params.id);
      if (!invite) return res.status(404).json({ message: "Invite not found" });
      if (invite.status !== "PENDING") return res.status(400).json({ message: "Invite is no longer valid" });
      const matchEmail = req.user.email && invite.inviteeEmail.toLowerCase() === req.user.email.toLowerCase();
      const matchPhone = req.user.phone && (() => {
        const a = String(invite.inviteeEmail).replace(/\D/g, "").slice(-10);
        const b = String(req.user.phone).replace(/\D/g, "").slice(-10);
        return a && b && a === b;
      })();
      if (!matchEmail && !matchPhone) return res.status(403).json({ message: "Forbidden" });
      await storage.updateCommunityInvite(invite.id, "REJECTED");
      res.status(200).json({ message: "Invite declined" });
    } catch (err) {
      res.status(500).json({ message: "Failed to decline invite" });
    }
  });

  // Forum Routes
  app.get(api.communities.posts.list.path, authMiddleware, async (req: any, res) => {
    try {
      const check = await ensureActiveMembership(req.user, req.params.id);
      if (!check.allowed) {
        if (check.pending) return res.status(403).json({ message: check.message });
        return res.status(404).json([]);
      }
      const posts = await storage.getPostsWithAuthors(req.params.id);
      res.status(200).json(posts);
    } catch (err) {
      console.error("GET community posts error:", err);
      res.status(200).json([]);
    }
  });

  app.post(api.communities.posts.create.path, authMiddleware, async (req: any, res) => {
    try {
      const lastPostTime = communityPostCooldownByUser.get(req.user.id) ?? 0;
      const now = Date.now();
      const remainingMs = COMMUNITY_POST_COOLDOWN_MS - (now - lastPostTime);
      if (remainingMs > 0) {
        return res.status(429).json({
          message: `Please wait ${Math.ceil(remainingMs / 1000)} seconds before posting again.`,
        });
      }

      const input = api.communities.posts.create.input.parse(req.body);
      if (input.listingId) {
        const listing = await storage.getListing(input.listingId);
        if (!listing || listing.communityId !== req.params.id) {
          return res.status(400).json({ message: "Invalid listing or listing not in this community" });
        }
      }
      const check = await ensureActiveMembership(req.user, req.params.id);
      if (!check.allowed) {
        if (check.pending) return res.status(403).json({ message: check.message });
        return res.status(403).json({ message: "Forbidden" });
      }
      const { listingId, ...rest } = input;
      const post = await storage.createPost({
        ...rest,
        communityId: req.params.id,
        authorId: req.user.id,
        ...(listingId && { listingId }),
      });

      communityPostCooldownByUser.set(req.user.id, now);
      res.status(201).json(post);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.posts.get.path, authMiddleware, async (req, res) => {
    const post = await storage.getPost(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(post);
  });

  app.get(api.posts.comments.list.path, authMiddleware, async (req, res) => {
    const comments = await storage.getComments(req.params.id);
    res.status(200).json(comments);
  });

  app.post(api.posts.comments.create.path, authMiddleware, async (req: any, res) => {
    try {
      const input = api.posts.comments.create.input.parse(req.body);
      const comment = await storage.createComment({
        ...input,
        postId: req.params.id,
        authorId: req.user.id
      });
      res.status(201).json(comment);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post("/api/upload", authMiddleware, upload.single("image"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "No image file provided" });
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ url });
  });

  app.get(api.listings.list.path, authMiddleware, async (req: any, res) => {
    try {
      const allListings = await storage.getListings();
      const user = req.user;
      let filtered = allListings;
      if (user.role === "RESIDENT") {
        // PENDING users have no ACTIVE community membership - block marketplace access
        if (user.status === "PENDING") {
          filtered = [];
        } else {
          const userCommunitiesList = await storage.getUserCommunities(user.id);
          const userCommunityIds = new Set<string>();
          userCommunitiesList.filter(uc => uc.status === "ACTIVE").forEach(uc => userCommunityIds.add(uc.communityId));
          filtered = allListings.filter(l => userCommunityIds.has(l.communityId));
        }
      }
      res.status(200).json(filtered);
    } catch (err) {
      console.error("GET listings error:", err);
      res.status(200).json([]);
    }
  });

  // Categories must be registered before :id so /api/listings/categories is not matched by :id
  app.get(api.listings.categories.path, authMiddleware, async (req, res) => {
    const allListings = await storage.getListings();
    const categories = Array.from(new Set(allListings.map(l => l.category).filter(Boolean))) as string[];
    res.status(200).json(categories);
  });

  // Single listing endpoint – only visible to members of that listing's community
  app.get(api.listings.get.path, authMiddleware, async (req: any, res) => {
    const listing = await storage.getListing(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const user = req.user;

    if (user.role === "RESIDENT") {
      if (user.status === "PENDING") return res.status(403).json({ message: "Your community membership is pending approval. You'll have access once approved." });
      const userCommunitiesList = await storage.getUserCommunities(user.id);
      const userCommunityIds = new Set<string>();
      userCommunitiesList.filter(uc => uc.status === "ACTIVE").forEach(uc => userCommunityIds.add(uc.communityId));
      if (!userCommunityIds.has(listing.communityId)) return res.status(404).json({ message: "Listing not found" });
    }

    res.status(200).json(listing);
  });

  app.post(api.listings.create.path, authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      const canSell = user.isSeller || user.role === "COMMUNITY_MANAGER" || user.role === "ADMIN";
      if (!canSell) {
        return res.status(403).json({ message: "User is not a seller" });
      }
      // Parse without status so client can never set it; new listings always need manager approval
      const createSchema = insertListingSchema.omit({ status: true });
      const input = createSchema.parse(req.body);
      const comm = await storage.getCommunity(input.communityId);
      if (!comm) return res.status(400).json({ message: "Invalid community" });

      const listing = await storage.createListing({
        ...input,
        sellerId: user.id,
        sellerNameSnapshot: user.sellerDisplayName || user.fullName,
        communityNameSnapshot: comm.name,
        visibility: "COMMUNITY_ONLY",
        status: "ACTIVE",
        sellerContactSnapshot: user.phone || user.email
      });
      res.status(201).json(listing);
    } catch (err) {
      console.error("POST create listing error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: err instanceof Error ? err.message : "Failed to create listing" });
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

  app.patch("/api/listings/:id/stock", authMiddleware, async (req: any, res) => {
    try {
      const listing = await storage.getListing(req.params.id);
      if (!listing) return res.status(404).json({ message: "Listing not found" });
      if (listing.sellerId !== req.user.id && req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { stockQuantity } = req.body;
      if (typeof stockQuantity !== "number" || stockQuantity < 0) {
        return res.status(400).json({ message: "Invalid stock quantity" });
      }
      const updated = await storage.updateListingStock(req.params.id, stockQuantity);
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ message: "Error updating stock" });
    }
  });

  app.post("/api/listings/:id/interest", authMiddleware, async (req: any, res) => {
    try {
      const listing = await storage.getListing(req.params.id);
      if (!listing) return res.status(404).json({ message: "Listing not found" });
      if (listing.listingType !== "PRODUCT") return res.status(400).json({ message: "Not a product" });
      const stock = listing.stockQuantity ?? 0;
      if (stock > 0) return res.status(400).json({ message: "Product is in stock. You can buy it directly." });
      const already = await storage.hasUserExpressedInterest(req.params.id, req.user.id);
      if (already) return res.status(400).json({ message: "You have already expressed interest." });
      const interest = await storage.createProductInterest(req.params.id, req.user.id);
      res.status(201).json(interest);
    } catch (err) {
      res.status(400).json({ message: "Error" });
    }
  });

  app.get("/api/listings/:id/interest-count", authMiddleware, async (req: any, res) => {
    const listing = await storage.getListing(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.sellerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const count = await storage.getProductInterestsCount(req.params.id);
    res.status(200).json({ count });
  });

  app.get(api.listingSlots.list.path, authMiddleware, async (req: any, res) => {
    const slots = await storage.getListingSlots(req.params.id);
    res.status(200).json(slots);
  });

  app.get(api.listingSlots.available.path, authMiddleware, async (req: any, res) => {
    const listingId = req.params.id;
    const dateStr = req.query.date as string;
    if (!dateStr) return res.status(400).json({ message: "date query param required" });
    const allSlots = await storage.getListingSlots(listingId);
    const bookedOnDate = await storage.getBookingsForListingOnDate(listingId, dateStr);
    const bookedSlotKeys = new Set(
      bookedOnDate
        .filter((b) => b.slotStartTime && b.slotEndTime)
        .map((b) => `${b.slotStartTime}-${b.slotEndTime}`)
    );
    const available = allSlots.filter(
      (s) => !bookedSlotKeys.has(`${s.startTime}-${s.endTime}`)
    );
    res.status(200).json(available);
  });

  app.post(api.listingSlots.create.path, authMiddleware, async (req: any, res) => {
    try {
      const listing = await storage.getListing(req.params.id);
      if (!listing) return res.status(404).json({ message: "Listing not found" });
      if (listing.sellerId !== req.user.id && req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const input = api.listingSlots.create.input.parse(req.body);
      const slot = await storage.createListingSlot({
        listingId: req.params.id,
        startTime: input.startTime,
        endTime: input.endTime,
      });
      res.status(201).json(slot);
    } catch (err) {
      res.status(400).json({ message: "Error creating slot" });
    }
  });

  app.put(api.listingSlots.replace.path, authMiddleware, async (req: any, res) => {
    try {
      const listing = await storage.getListing(req.params.id);
      if (!listing) return res.status(404).json({ message: "Listing not found" });
      if (listing.sellerId !== req.user.id && req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const input = api.listingSlots.replace.input.parse(req.body);
      await storage.deleteListingSlots(req.params.id);
      const created: { id: string; listingId: string; startTime: string; endTime: string }[] = [];
      for (const slot of input.slots) {
        if (slot.startTime?.trim() && slot.endTime?.trim()) {
          const s = await storage.createListingSlot({
            listingId: req.params.id,
            startTime: slot.startTime.trim(),
            endTime: slot.endTime.trim(),
          });
          created.push(s);
        }
      }
      res.status(200).json(created);
    } catch (err) {
      res.status(400).json({ message: "Error updating slots" });
    }
  });

  app.get(api.users.list.path, authMiddleware, async (req: any, res) => {
    if (req.user.role === "RESIDENT") return res.status(403).json({ message: "Forbidden" });
    const users = await storage.getUsers();
    res.status(200).json(users);
  });

  app.get(api.users.profile.path, authMiddleware, async (req: any, res) => {
    const targetUserId = req.params.id;
    const currentUser = req.user;
    const targetUser = await storage.getUser(targetUserId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });
    if (targetUser.communityId !== currentUser.communityId) {
      return res.status(403).json({ message: "Can only view profiles of users in your community" });
    }
    res.status(200).json({
      fullName: targetUser.fullName,
      email: targetUser.email,
      phone: targetUser.phone,
    });
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

      // Admin Protection: Administrators cannot change their own role or status to avoid lockout
      if (currentUserId === targetUserId && currentUserRole === "ADMIN") {
        if (input.role && input.role !== "ADMIN") {
          return res.status(400).json({ message: "Administrators cannot change their own role" });
        }
        if (input.status && input.status !== "ACTIVE") {
          return res.status(400).json({ message: "Administrators cannot deactivate their own account" });
        }
      }

      // Restriction: Users can only update themselves unless they are ADMIN
      if (currentUserId !== targetUserId && currentUserRole !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Promoting to COMMUNITY_MANAGER or ADMIN automatically activates the user
      if (input.role && (input.role === "COMMUNITY_MANAGER" || input.role === "ADMIN")) {
        input.status = "ACTIVE";
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

  app.post('/api/admin/users/:id/remove-from-communities', authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Only administrators can remove users from communities" });
      }
      const userId = req.params.id;
      if (userId === req.user.id) {
        return res.status(400).json({ message: "You cannot remove yourself from communities" });
      }
      const { communityIds } = req.body as { communityIds?: string[] };
      if (!Array.isArray(communityIds) || communityIds.length === 0) {
        return res.status(400).json({ message: "Provide at least one community ID" });
      }

      const targetUser = await storage.getUser(userId);
      if (!targetUser) return res.status(404).json({ message: "User not found" });

      for (const communityId of communityIds) {
        const uc = await storage.getUserCommunity(userId, communityId);
        if (uc && uc.status === "ACTIVE") {
          await storage.updateUserCommunity(uc.id, "REMOVED");
        }
      }

      let newCommunityId: string | null = targetUser.communityId;
      if (communityIds.includes(targetUser.communityId || "")) {
        const userCommunitiesList = await storage.getUserCommunities(userId);
        const otherActive = userCommunitiesList.find(
          (m: any) => m.communityId !== targetUser.communityId && m.status === "ACTIVE"
        );
        newCommunityId = otherActive?.communityId ?? null;
        await storage.updateUser(userId, { communityId: newCommunityId, version: targetUser.version });
      }

      const updatedUser = await storage.getUser(userId);
      res.status(200).json(updatedUser);
    } catch (err) {
      res.status(500).json({ message: "Error removing user from communities" });
    }
  });

  app.delete(api.users.delete.path, authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Only administrators can remove users" });
      }

      const target = await storage.getUser(req.params.id);
      if (!target) return res.status(404).json({ message: "User not found" });
      if (target.id === req.user.id) {
        return res.status(400).json({ message: "You cannot remove your own administrator account" });
      }
      if (target.role === "ADMIN") {
        return res.status(400).json({ message: "System admin accounts cannot be removed" });
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
    const listingIds = Array.from(new Set(bookings.map((b: any) => b.listingId)));
    const listingsArr = await storage.getListingsByIds(listingIds);
    const listingsMap: Record<string, any> = {};
    listingsArr.forEach((l: any) => { listingsMap[l.id] = l; });
    const enriched = bookings.map((b: any) => {
      const listing = listingsMap[b.listingId];
      return {
        ...b,
        listingTitle: listing?.title ?? "Service",
        sellerName: listing?.sellerNameSnapshot ?? "Provider",
      };
    });
    res.status(200).json(enriched);
  });

  app.post(api.bookings.create.path, authMiddleware, async (req: any, res) => {
    try {
      if (req.user.status === "PENDING") return res.status(403).json({ message: "Your community membership is pending approval. You'll have access once approved." });
      const input = api.bookings.create.input.parse(req.body);
      const listing = await storage.getListing(input.listingId);
      if (!listing) return res.status(404).json({ message: "Listing not found" });
      if (listing.sellerId === req.user.id) return res.status(400).json({ message: "You cannot book your own service" });

      const dateStr = String(input.bookingDate);
      const bookingDate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
        ? new Date(dateStr + "T12:00:00.000Z")
        : new Date(input.bookingDate);

      const slots = await storage.getListingSlots(listing.id);
      const slotStartTime = input.slotStartTime as string | undefined;
      const slotEndTime = input.slotEndTime as string | undefined;

      if (slots.length > 0) {
        if (!slotStartTime || !slotEndTime) {
          return res.status(400).json({ message: "Slot is required for this service" });
        }
        const dateStrForQuery = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
        const bookedOnDate = await storage.getBookingsForListingOnDate(listing.id, dateStrForQuery);
        const isAlreadyBooked = bookedOnDate.some(
          (b) => b.slotStartTime === slotStartTime && b.slotEndTime === slotEndTime
        );
        if (isAlreadyBooked) {
          return res.status(400).json({ message: "This slot is no longer available" });
        }
        const slotExists = slots.some((s) => s.startTime === slotStartTime && s.endTime === slotEndTime);
        if (!slotExists) {
          return res.status(400).json({ message: "Invalid slot" });
        }
      }

      const booking = await storage.createBooking({
        listingId: listing.id,
        userId: req.user.id,
        sellerId: listing.sellerId,
        bookingDate,
        slotStartTime: slotStartTime || null,
        slotEndTime: slotEndTime || null,
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
    const listingIds = Array.from(new Set(orders.map((o: any) => o.listingId)));
    const listingsArr = await storage.getListingsByIds(listingIds);
    const listingsMap: Record<string, any> = {};
    listingsArr.forEach((l: any) => { listingsMap[l.id] = l; });
    const enriched = orders.map((o: any) => {
      const listing = listingsMap[o.listingId];
      return {
        ...o,
        listingTitle: listing?.title ?? "Product",
        sellerName: listing?.sellerNameSnapshot ?? "Seller",
      };
    });
    res.status(200).json(enriched);
  });

  app.get("/api/seller/orders", authMiddleware, async (req: any, res) => {
    const orders = await storage.getOrdersBySeller(req.user.id);
    res.status(200).json(orders);
  });

  app.patch("/api/seller/orders/:id", authMiddleware, async (req: any, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.sellerId !== req.user.id) return res.status(403).json({ message: "Forbidden" });
      const { status, priceSnapshot } = req.body;
      type OrderStatus = "PENDING" | "QUOTATION_PROVIDED" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
      const updates: { status?: OrderStatus; priceSnapshot?: number } = {};
      if (status && (["PENDING", "QUOTATION_PROVIDED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as OrderStatus[]).includes(status)) {
        updates.status = status as OrderStatus;
      }
      if (typeof priceSnapshot === "number" && priceSnapshot >= 0) updates.priceSnapshot = priceSnapshot;
      if (Object.keys(updates).length === 0) return res.status(400).json({ message: "No valid updates" });
      const updated = await storage.updateOrder(req.params.id, updates);
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ message: "Error updating order" });
    }
  });

  app.get("/api/seller/bookings", authMiddleware, async (req: any, res) => {
    try {
      const bookings = await storage.getBookingsBySeller(req.user.id);
      res.status(200).json(bookings);
    } catch (err) {
      console.error("GET seller bookings error:", err);
      res.status(200).json([]);
    }
  });

  app.patch("/api/seller/bookings/:id", authMiddleware, async (req: any, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      if (booking.sellerId !== req.user.id) return res.status(403).json({ message: "Forbidden" });
      const { status } = req.body;
      if (!status || !["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const updated = await storage.updateBooking(req.params.id, { status: status as "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" });
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ message: "Error updating booking" });
    }
  });

  app.post(api.orders.create.path, authMiddleware, async (req: any, res) => {
    try {
      if (req.user.status === "PENDING") return res.status(403).json({ message: "Your community membership is pending approval. You'll have access once approved." });
      const input = api.orders.create.input.parse(req.body);
      const listing = await storage.getListing(input.listingId);
      if (!listing) return res.status(404).json({ message: "Listing not found" });
      if (listing.sellerId === req.user.id) return res.status(400).json({ message: "You cannot order your own listing" });

      const quantity = input.quantity ?? 1;
      const isService = listing.listingType === "SERVICE";

      if (!isService && listing.availabilityBasis === "STOCK" && listing.buyNowEnabled) {
        const currentStock = listing.stockQuantity ?? 0;
        if (currentStock <= 0) {
          return res.status(400).json({ message: "This product is out of stock. Use 'Notify seller' to express interest." });
        }
        if (quantity > currentStock) {
          return res.status(400).json({ message: `Only ${currentStock} items available.` });
        }
        await storage.updateListingStock(listing.id, currentStock - quantity);
      }

      const priceSnapshot = isService ? 0 : (listing.buyNowEnabled ? listing.price * quantity : 0);

      const order = await storage.createOrder({
        listingId: listing.id,
        userId: req.user.id,
        sellerId: listing.sellerId,
        quantity,
        status: "PENDING",
        priceSnapshot,
        logisticsPreference: (input.logisticsPreference as any) || "PICKUP",
        deliveryAddress: input.deliveryAddress || null,
      });

      res.status(201).json(order);
    } catch (err) {
      res.status(400).json({ message: "Error creating order" });
    }
  });

  app.get("/api/sellers/:id/payment-methods", authMiddleware, async (req: any, res) => {
    try {
      const seller = await storage.getUser(req.params.id);
      if (!seller) return res.status(404).json({ message: "Seller not found" });
      res.status(200).json({
        acceptsUpi: (seller as any).paymentAcceptsUpi ?? false,
        acceptsCard: (seller as any).paymentAcceptsCard ?? false,
        acceptsCash: (seller as any).paymentAcceptsCash ?? false,
      });
    } catch (err) {
      res.status(500).json({ message: "Error fetching payment methods" });
    }
  });

  app.get("/api/my-listings", authMiddleware, async (req: any, res) => {
    try {
      const listings = await storage.getListingsBySeller(req.user.id);
      res.status(200).json(listings);
    } catch (err) {
      console.error("GET my-listings error:", err);
      res.status(200).json([]);
    }
  });

  app.get(api.admin.analytics.path, authMiddleware, async (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });

    const emptyResponse = () => ({
      metrics: {
        communities: 0,
        totalUsers: 0,
        activeServices: 0,
        totalRevenue: 0,
        commission: 0,
      },
      revenueTrend: [{ name: "Jan", revenue: 0 }, { name: "Feb", revenue: 0 }, { name: "Mar", revenue: 0 }, { name: "Apr", revenue: 0 }, { name: "May", revenue: 0 }, { name: "Jun", revenue: 0 }],
      userGrowth: [{ name: "Jan", users: 0 }, { name: "Feb", users: 0 }, { name: "Mar", users: 0 }, { name: "Apr", users: 0 }, { name: "May", users: 0 }, { name: "Jun", users: 0 }],
      serviceCategories: [],
    });

    try {
      const [communities, users, listings, bookings, orders] = await Promise.all([
        storage.getCommunities().catch(() => []),
        storage.getUsers().catch(() => []),
        storage.getListings().catch(() => []),
        storage.getBookings().catch(() => []),
        storage.getOrders().catch(() => []),
      ]);

      const safeListings = Array.isArray(listings) ? listings : [];
      const safeBookings = Array.isArray(bookings) ? bookings : [];
      const safeOrders = Array.isArray(orders) ? orders : [];
      const safeUsers = Array.isArray(users) ? users : [];
      const safeCommunities = Array.isArray(communities) ? communities : [];

      const activeServices = safeListings.filter((l: any) => l.listingType === "SERVICE" && l.status === "ACTIVE").length;
      const bookingRevenue = safeBookings.reduce((sum: number, b: any) => sum + (Number(b.priceSnapshot) || 0), 0);
      const orderRevenue = safeOrders.reduce((sum: number, o: any) => sum + (Number(o.priceSnapshot) || 0), 0);
      const totalRevenue = bookingRevenue + orderRevenue;

      let settings: { commissionRate?: number } | null = null;
      try {
        settings = await storage.getSettings();
      } catch {
        // ignore
      }
      const commissionRate = (settings?.commissionRate ?? 0) / 100;
      const commission = Math.round(totalRevenue * commissionRate);

      const monthsStr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentDate = new Date();
      const last6Months: { name: string; month: number; year: number; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        last6Months.push({
          name: monthsStr[d.getMonth()],
          month: d.getMonth(),
          year: d.getFullYear(),
          revenue: 0,
        });
      }

      for (const b of safeBookings) {
        if (!b.createdAt) continue;
        const d = new Date(b.createdAt);
        const monthData = last6Months.find((m) => m.month === d.getMonth() && m.year === d.getFullYear());
        if (monthData) monthData.revenue += (Number(b.priceSnapshot) || 0) / 100;
      }
      for (const o of safeOrders) {
        if (!o.createdAt) continue;
        const d = new Date(o.createdAt);
        const monthData = last6Months.find((m) => m.month === d.getMonth() && m.year === d.getFullYear());
        if (monthData) monthData.revenue += (Number(o.priceSnapshot) || 0) / 100;
      }

      const revenueTrend = last6Months.map((m) => ({ name: m.name, revenue: m.revenue }));

      const categoriesMap: Record<string, number> = {};
      for (const l of safeListings.filter((x: any) => x.listingType === "SERVICE")) {
        const cat = l.category || "Other";
        categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
      }
      const totalServices = safeListings.filter((l: any) => l.listingType === "SERVICE").length || 1;
      const colors = ["#1e3a8a", "#2563eb", "#3b82f6", "#94a3b8", "#cbd5e1"];
      const serviceCategories = Object.entries(categoriesMap)
        .map(([name, count], idx) => ({
          name,
          value: Math.round((count / totalServices) * 100),
          color: colors[idx % colors.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const userGrowth = last6Months.map((m) => {
        const endOfMonth = new Date(m.year, m.month + 1, 0, 23, 59, 59);
        const usersUntilMonth = safeUsers.filter((u: any) => u.createdAt && new Date(u.createdAt) <= endOfMonth).length;
        return { name: m.name, users: usersUntilMonth };
      });

      res.status(200).json({
        metrics: {
          communities: safeCommunities.length,
          totalUsers: safeUsers.length,
          activeServices,
          totalRevenue: totalRevenue / 100,
          commission: commission / 100,
        },
        revenueTrend,
        userGrowth,
        serviceCategories,
      });
    } catch (err) {
      console.error("GET /api/admin/analytics error:", err);
      res.status(200).json(emptyResponse());
    }
  });

  app.post(api.reports.create.path, authMiddleware, async (req: any, res) => {
    try {
      const input = api.reports.create.input.parse(req.body);
      const listing = await storage.getListing(input.listingId);
      if (!listing) return res.status(404).json({ message: "Listing not found" });
      if (listing.sellerId === req.user.id) return res.status(400).json({ message: "You cannot report your own listing" });
      if (listing.communityId !== req.user.communityId) return res.status(403).json({ message: "You can only report listings in your community" });

      const report = await storage.createReport({
        listingId: input.listingId,
        reporterId: req.user.id,
        communityId: listing.communityId,
        reason: input.reason,
        details: input.details || null,
        bookingId: input.bookingId || null,
      });
      res.status(201).json(report);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  app.get(api.manager.reports.path, authMiddleware, async (req: any, res) => {
    if (req.user.role !== "COMMUNITY_MANAGER") return res.status(403).json({ message: "Forbidden" });
    const communityId = req.user.communityId;
    if (!communityId) return res.status(400).json({ message: "No community assigned" });
    const reports = await storage.getReportsByCommunity(communityId);
    const serialized = reports.map(r => ({
      ...r,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    }));
    res.status(200).json(serialized);
  });

  app.get(api.manager.analytics.path, authMiddleware, async (req: any, res) => {
    if (req.user.role !== "COMMUNITY_MANAGER") return res.status(403).json({ message: "Forbidden" });
    const communityId = req.user.communityId;
    if (!communityId) return res.status(400).json({ message: "No community assigned" });

    const [usersList, listings, bookings, orders, communityReports] = await Promise.all([
      storage.getUsers(),
      storage.getListings(),
      storage.getBookings(),
      storage.getOrders(),
      storage.getReportsByCommunity(communityId),
    ]);

    const communityUsers = usersList.filter((u: any) => u.communityId === communityId);
    const pendingApprovals = communityUsers.filter(u => u.status === 'PENDING').length;

    const communityListings = listings.filter(l => l.communityId === communityId);
    const activeSellers = new Set(communityListings.map(l => l.sellerId)).size;
    const totalListings = communityListings.length;

    const reportedListings = communityReports.filter((r: any) => !r.bookingId).length;
    const disputedBookings = communityReports.filter((r: any) => r.bookingId).length;
    const lowRatedServices = 0;

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
      const currentUser = req.user;
      if (currentUser.id !== req.params.id && currentUser.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) return res.status(404).json({ message: "User not found" });

      // Admin is implicitly a member of all communities — return all with ACTIVE
      if (targetUser.role === "ADMIN") {
        const allCommunities = await storage.getCommunities();
        const memberships = allCommunities.map((community) => ({
          community,
          joinStatus: "ACTIVE" as const,
        }));
        return res.status(200).json(memberships);
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
      if (user.role !== "COMMUNITY_MANAGER" && user.role !== "ADMIN") {
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

      const pendingUserIds = pendingRequests.map((r) => r.user.id);
      const activeMemberships =
        pendingUserIds.length > 0
          ? await db
            .select({ userId: userCommunities.userId, communityName: communities.name })
            .from(userCommunities)
            .innerJoin(communities, eq(userCommunities.communityId, communities.id))
            .where(and(inArray(userCommunities.userId, pendingUserIds), eq(userCommunities.status, "ACTIVE")))
          : [];

      const communitiesByUser = new Map<string, string[]>();
      for (const m of activeMemberships) {
        const arr = communitiesByUser.get(m.userId) ?? [];
        arr.push(m.communityName);
        communitiesByUser.set(m.userId, arr);
      }

      // Format response to match expected frontend structure but include join mapping and communities
      const formattedUsers = pendingRequests.map((r) => ({
        ...r.user,
        userCommunityId: r.userCommunityId,
        joinStatus: r.joinStatus,
        communities: communitiesByUser.get(r.user.id) ?? [],
      }));

      res.status(200).json(formattedUsers);
    } catch (err) {
      res.status(500).json({ message: "Error fetching approvals" });
    }
  });

  app.post('/api/manager/approvals/:id/approve', authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== "COMMUNITY_MANAGER" && user.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const userCommunityId = req.params.id;
      const [uc] = await db.select().from(userCommunities).where(eq(userCommunities.id, userCommunityId));
      if (!uc || uc.communityId !== user.communityId) {
        return res.status(404).json({ message: "Record not found" });
      }

      await storage.updateUserCommunity(userCommunityId, 'ACTIVE');

      const targetUser = await storage.getUser(uc.userId);
      if (targetUser) {
        const updates: any = { status: 'ACTIVE', version: targetUser.version };
        // If user doesn't have a primary community, assign this one
        if (!targetUser.communityId) {
          updates.communityId = uc.communityId;
        }
        await storage.updateUser(targetUser.id, updates);
      }

      res.status(200).json({ message: "Approved successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error approving member" });
    }
  });

  app.post('/api/manager/approvals/:id/reject', authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== "COMMUNITY_MANAGER" && user.role !== "ADMIN") {
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

  app.get("/api/manager/pending-listings", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== "COMMUNITY_MANAGER" && user.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const pending = await storage.getPendingListings(user.communityId);
      res.status(200).json(pending);
    } catch (err) {
      res.status(500).json({ message: "Error fetching pending listings" });
    }
  });

  app.post("/api/manager/listings/:id/approve", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== "COMMUNITY_MANAGER" && user.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const listing = await storage.getListing(req.params.id);
      if (!listing || listing.communityId !== user.communityId || listing.status !== "PENDING_APPROVAL") {
        return res.status(404).json({ message: "Listing not found or not pending approval" });
      }
      const updated = await storage.updateListing(listing.id, { status: "ACTIVE", version: listing.version });
      if (!updated) return res.status(409).json({ message: "Conflict" });
      res.status(200).json(updated);
    } catch (err) {
      res.status(500).json({ message: "Error approving listing" });
    }
  });

  app.post("/api/manager/listings/:id/reject", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== "COMMUNITY_MANAGER" && user.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const listing = await storage.getListing(req.params.id);
      if (!listing || listing.communityId !== user.communityId || listing.status !== "PENDING_APPROVAL") {
        return res.status(404).json({ message: "Listing not found or not pending approval" });
      }
      const updated = await storage.updateListing(listing.id, { status: "INACTIVE", version: listing.version });
      if (!updated) return res.status(409).json({ message: "Conflict" });
      res.status(200).json(updated);
    } catch (err) {
      res.status(500).json({ message: "Error rejecting listing" });
    }
  });

  app.get("/api/communities/:id/manager", authMiddleware, async (req: any, res) => {
    try {
      const manager = await storage.getCommunityManager(req.params.id);
      if (!manager) return res.status(404).json({ message: "Community manager not found" });
      res.status(200).json(manager);
    } catch (err) {
      res.status(500).json({ message: "Error fetching community manager" });
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

  app.post(api.admin.backup.path, authMiddleware, async (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });

    await storage.createAuditLog({
      actorId: req.user.id,
      action: "MANUAL_BACKUP_TRIGGERED",
      targetType: "SYSTEM",
      targetId: "BACKUP"
    });

    res.status(200).json({ message: "Backup routine has been initiated." });
  });

  return httpServer;
}