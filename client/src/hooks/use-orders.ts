import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/api-error";

export function useCreateOrder() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { listingId: string; logisticsPreference: string; deliveryAddress?: string }) => {
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.listings.list.path] });
            toast({ title: "Order placed successfully!" });
        },
    });
}
