import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertCommunity, UpdateCommunityRequest, type User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/api-error";
import { useAuthStore } from "@/store/use-auth";

export function useCommunities() {
  return useQuery({
    queryKey: [api.communities.list.path],
    queryFn: async () => {
      const res = await fetch(api.communities.list.path, { credentials: "include" });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to fetch communities");
        throw new Error(message);
      }
      return api.communities.list.responses[200].parse(await res.json());
    },
    refetchInterval: 2000,
  });
}

export function useCommunityMembers(communityId: string | undefined) {
  return useQuery<User[]>({
    queryKey: ["/api/communities", communityId, "members"],
    queryFn: async () => {
      if (!communityId) return [];
      const res = await fetch(`/api/communities/${communityId}/members`, { credentials: "include" });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to fetch members");
        throw new Error(message);
      }
      return res.json();
    },
    enabled: !!communityId,
  });
}

export function useUserCommunities(userId: string) {
  return useQuery({
    queryKey: ['/api/users', userId, 'communities'],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/users/${userId}/communities`, { credentials: "include" });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to fetch user communities");
        throw new Error(message);
      }
      return await res.json();
    },
    enabled: !!userId,
    refetchInterval: 2000,
  });
}

export function useCreateCommunity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCommunity) => {
      const res = await fetch(api.communities.create.path, {
        method: api.communities.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to create community");
        throw new Error(message);
      }
      return api.communities.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.communities.list.path] });
      toast({ title: "Community created successfully" });
    },
  });
}

export function useUpdateCommunity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCommunityRequest }) => {
      const url = buildUrl(api.communities.update.path, { id });
      const res = await fetch(url, {
        method: api.communities.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (res.status === 409) throw new Error("Conflict: This community was updated by someone else.");
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to update community");
        throw new Error(message);
      }
      return api.communities.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.communities.list.path] });
      toast({ title: "Community updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  });
}

export function useJoinCommunity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.communities.join.path, { id });
      const res = await fetch(url, {
        method: api.communities.join.method,
        credentials: "include",
      });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to join community");
        throw new Error(message);
      }
      return api.communities.join.responses[200].parse(await res.json());
    },
    onSuccess: (updatedUser: User) => {
      useAuthStore.getState().setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", updatedUser.id, "communities"] });
      queryClient.invalidateQueries({ queryKey: [api.communities.list.path] });
      const isApproved = updatedUser.status === "ACTIVE";
      toast({
        title: isApproved ? "You've joined the community!" : "Join request sent",
        description: isApproved ? "You can now browse listings and participate." : "Your community manager will approve your request soon.",
      });
    }
  });
}

export function useLeaveCommunity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (communityId: string) => {
      const url = buildUrl(api.communities.leave.path, { id: communityId });
      const res = await fetch(url, {
        method: api.communities.leave.method,
        credentials: "include",
      });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to leave community");
        throw new Error(message);
      }
      return api.communities.leave.responses[200].parse(await res.json());
    },
    onSuccess: (updatedUser: User) => {
      useAuthStore.getState().setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", updatedUser.id, "communities"] });
      queryClient.invalidateQueries({ queryKey: [api.communities.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.listings.list.path] });
      toast({ title: "Left community", description: "You will no longer see content from that community." });
    },
    onError: (err: Error) => {
      toast({ title: "Could not leave", description: err.message, variant: "destructive" });
    }
  });
}

export function useDeleteCommunity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.communities.delete.path, { id });
      const res = await fetch(url, {
        method: api.communities.delete.method,
        credentials: "include",
      });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to delete community");
        throw new Error(message);
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.communities.list.path] });
      toast({ title: "Community deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  });
}

export function usePendingInvites() {
  return useQuery({
    queryKey: ["/api/invites"],
    queryFn: async () => {
      const res = await fetch("/api/invites", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invites");
      return res.json();
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await fetch(`/api/invites/${inviteId}/accept`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).message || "Failed to accept");
      return res.json();
    },
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "communities"] });
      toast({ title: "Invite accepted", description: "You've joined the community." });
    },
    onError: (err: Error) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });
}

export function useDeclineInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await fetch(`/api/invites/${inviteId}/decline`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to decline");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
    },
  });
}

export function useInviteByPhone(communityId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (phone: string) => {
      const res = await fetch(`/api/communities/${communityId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Invite failed");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "members"] });
      if (data.useInviteLink) {
        toast({ title: "User not on the app", description: "Use the invite link below to share with them." });
      } else {
        toast({ title: "Invite sent", description: "The user will see it in their profile." });
      }
    },
    onError: (err: Error) => toast({ title: "Invite failed", description: err.message, variant: "destructive" }),
  });
}

export function useInviteLink(communityId: string | undefined) {
  return useQuery({
    queryKey: ["/api/communities", communityId, "invite-link"],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communityId}/invite-link`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to get link");
      return res.json();
    },
    enabled: !!communityId,
  });
}

export function useRemoveMemberFromCommunity(communityId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!communityId) throw new Error("No community selected");
      const res = await fetch(`/api/communities/${communityId}/members/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        credentials: "include",
      });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to remove member");
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "members"] });
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "User removed from community" });
    },
    onError: (error: Error) => {
      toast({ title: "Remove failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddMemberToCommunity(communityId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!communityId) throw new Error("No community selected");
      const res = await fetch(`/api/communities/${communityId}/members/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        credentials: "include",
      });
      const text = await res.text();
      if (!res.ok) {
        try {
          const data = text && JSON.parse(text);
          const msg = (data && data.message) || "Failed to add member";
          throw new Error(msg);
        } catch (e) {
          if (e instanceof SyntaxError) {
            throw new Error(text?.startsWith("<") ? "Server error. Please try again." : `Failed to add member (${res.status})`);
          }
          throw e;
        }
      }
      try {
        return text ? JSON.parse(text) : null;
      } catch {
        throw new Error("Server returned an invalid response. Please try again.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "members"] });
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "User added to community" });
    },
    onError: (error: Error) => {
      toast({ title: "Add failed", description: error.message, variant: "destructive" });
    },
  });
}
