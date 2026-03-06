import { useQuery } from "@tanstack/react-query";

export function useSellerPaymentMethods(sellerId: string | undefined) {
  return useQuery({
    queryKey: ["/api/sellers", sellerId, "payment-methods"],
    queryFn: async () => {
      if (!sellerId) return null;
      const res = await fetch(`/api/sellers/${sellerId}/payment-methods`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json() as Promise<{ acceptsUpi: boolean; acceptsCard: boolean; acceptsCash: boolean }>;
    },
    enabled: !!sellerId,
  });
}
