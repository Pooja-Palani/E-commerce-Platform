import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/api-error";

export function useListingSlots(listingId: string) {
  return useQuery({
    queryKey: ["/api/listings", listingId, "slots"],
    queryFn: async () => {
      const useAsUser = (await import('@/store/use-auth')).useAuthStore.getState().useAsUser;
      const headers: any = {};
      if (useAsUser) headers['x-act-as-user'] = '1';
      const res = await fetch(buildUrl(api.listingSlots.list.path, { id: listingId }), { credentials: "include", headers });
      if (!res.ok) throw new Error("Failed to fetch slots");
      return res.json();
    },
    enabled: !!listingId,
  });
}

export function useAvailableSlots(listingId: string, date: string) {
  return useQuery({
    queryKey: ["/api/listings", listingId, "available-slots", date],
    queryFn: async () => {
      const url = `${buildUrl(api.listingSlots.available.path, { id: listingId })}?date=${encodeURIComponent(date)}`;
      const useAsUser = (await import('@/store/use-auth')).useAuthStore.getState().useAsUser;
      const headers: any = {};
      if (useAsUser) headers['x-act-as-user'] = '1';
      const res = await fetch(url, { credentials: "include", headers });
      if (!res.ok) throw new Error("Failed to fetch available slots");
      return res.json();
    },
    enabled: !!listingId && !!date,
  });
}

export function useReplaceListingSlots(listingId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (slots: { startTime: string; endTime: string }[]) => {
      const url = buildUrl(api.listingSlots.replace.path, { id: listingId });
      const res = await fetch(url, {
        method: api.listingSlots.replace.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update slots");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings", listingId, "slots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings", listingId] });
      toast({ title: "Slots updated successfully" });
    },
  });
}

export function useSellerBookings() {
  return useQuery({
    queryKey: ["/api/seller/bookings"],
    queryFn: async () => {
      const res = await fetch("/api/seller/bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const res = await fetch(`/api/seller/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to update booking");
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/bookings"] });
      queryClient.invalidateQueries({ queryKey: [api.bookings.list.path] });
      toast({ title: "Booking updated" });
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { listingId: string; bookingDate: string; slotStartTime?: string; slotEndTime?: string }) => {
      const res = await fetch(api.bookings.create.path, {
        method: api.bookings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to create booking");
        throw new Error(message);
      }
      return api.bookings.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.bookings.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.listings.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings", variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/bookings"] }); // so seller sees new booking on My Services
      toast({ title: "Booking requested successfully!" });
    },
  });
}
