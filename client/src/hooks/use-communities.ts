import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertCommunity, UpdateCommunityRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useCommunities() {
  return useQuery({
    queryKey: [api.communities.list.path],
    queryFn: async () => {
      const res = await fetch(api.communities.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch communities");
      return api.communities.list.responses[200].parse(await res.json());
    },
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
      if (!res.ok) throw new Error("Failed to create community");
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
      if (!res.ok) throw new Error("Failed to update community");
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
      if (!res.ok) throw new Error("Failed to join community");
      return api.communities.join.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({ title: "Joined community. Status is pending approval." });
    }
  });
}
