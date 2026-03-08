import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { UpdateUserRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/api-error";

export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: "include" });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to fetch users");
        throw new Error(message);
      }
      return api.users.list.responses[200].parse(await res.json());
    },
    refetchInterval: 2000,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserRequest }) => {
      const url = buildUrl(api.users.update.path, { id });
      const res = await fetch(url, {
        method: api.users.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (res.status === 409) throw new Error("Conflict: User was modified recently.");
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to update user");
        throw new Error(message);
      }
      return api.users.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({ title: "User updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  });
}

export function useRemoveUserFromCommunities() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, communityIds }: { userId: string; communityIds: string[] }) => {
      const res = await fetch(`/api/admin/users/${userId}/remove-from-communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityIds }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to remove user from communities");
      }
      return res.json();
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "communities"] });
      toast({ title: "User removed from selected communities" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.users.delete.path, { id });
      const res = await fetch(url, {
        method: api.users.delete.method,
        credentials: "include",
      });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to remove user");
        throw new Error(message);
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "User removed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Removal failed", description: error.message, variant: "destructive" });
    }
  });
}
