import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertListing, UpdateListingRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/api-error";

export function useListings() {
  return useQuery({
    queryKey: [api.listings.list.path],
    queryFn: async () => {
      const res = await fetch(api.listings.list.path, { credentials: "include" });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to fetch listings");
        throw new Error(message);
      }
      return api.listings.list.responses[200].parse(await res.json());
    },
    refetchInterval: 2000,
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: [api.listings.get.path, { id }],
    queryFn: async () => {
      const url = buildUrl(api.listings.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to fetch listing");
        throw new Error(message);
      }
      return api.listings.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertListing) => {
      const res = await fetch(api.listings.create.path, {
        method: api.listings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to create listing");
        throw new Error(message);
      }
      return api.listings.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.listings.list.path] });
      toast({ title: "Listing created" });
    },
  });
}

export function useUpdateListingStock(listingId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (stockQuantity: number) => {
      const res = await fetch(`/api/listings/${listingId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQuantity }),
        credentials: "include",
      });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to update stock");
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.listings.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.listings.get.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings", listingId] });
      toast({ title: "Stock updated" });
    },
  });
}

export function useCreateProductInterest(listingId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/listings/${listingId}/interest`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to express interest");
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.listings.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.listings.get.path, { id: listingId }] });
      toast({ title: "Seller notified! They'll add stock when available." });
    },
  });
}

export function useProductInterestCount(listingId: string, enabled = true) {
  return useQuery({
    queryKey: ["/api/listings", listingId, "interest-count"],
    queryFn: async () => {
      const res = await fetch(`/api/listings/${listingId}/interest-count`, { credentials: "include" });
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: !!listingId && enabled,
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateListingRequest }) => {
      const url = buildUrl(api.listings.update.path, { id });
      const res = await fetch(url, {
        method: api.listings.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (res.status === 409) throw new Error("Conflict: Listing was updated by someone else.");
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to update listing");
        throw new Error(message);
      }
      return api.listings.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.listings.list.path] });
      toast({ title: "Listing updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  });
}
