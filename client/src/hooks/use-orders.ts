import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/api-error";

export function useSellerOrders() {
  return useQuery({
    queryKey: ["/api/seller/orders"],
    queryFn: async () => {
      const res = await fetch("/api/seller/orders", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ orderId, status, priceSnapshot }: { orderId: string; status?: string; priceSnapshot?: number }) => {
      const res = await fetch(`/api/seller/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priceSnapshot }),
        credentials: "include",
      });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to update order");
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/orders"] });
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      toast({ title: "Order updated" });
    },
  });
}

export function useCreateOrder() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { listingId: string; quantity?: number; logisticsPreference?: string; deliveryAddress?: string }) => {
            const res = await fetch(api.orders.create.path, {
                method: api.orders.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include",
            });
        if (!res.ok) {
          const message = await getErrorMessage(res, "Failed to create order");
          throw new Error(message);
        }
            return api.orders.create.responses[201].parse(await res.json());
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [api.listings.list.path] });
            queryClient.invalidateQueries({ queryKey: ["/api/listings", variables.listingId] });
            queryClient.invalidateQueries({ queryKey: ["/api/seller/orders"] });
            queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
            toast({ title: "Order placed successfully!" });
        },
    });
}
