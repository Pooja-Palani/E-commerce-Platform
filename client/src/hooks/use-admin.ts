import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { api, buildUrl } from "@shared/routes";
import { PlatformSettings, UpdatePlatformSettingsRequest } from "@shared/schema";

interface AnalyticsResponse {
    metrics: {
        communities: number;
        totalUsers: number;
        activeServices: number;
        totalRevenue: number;
        commission: number;
    };
    revenueTrend: { name: string; revenue: number }[];
    userGrowth: { name: string; users: number }[];
    serviceCategories: { name: string; value: number; color: string }[];
}

export function useAdminAnalytics() {
    return useQuery<AnalyticsResponse, Error>({
        queryKey: ["/api/admin/analytics"],
        queryFn: async () => {
            const res = await fetch(api.admin.analytics.path);
            if (!res.ok) throw new Error("Failed to fetch analytics");
            return res.json();
        },
    });
}

export function useAdminSettings() {
    return useQuery<PlatformSettings, Error>({
        queryKey: ["/api/admin/settings"],
        queryFn: async () => {
            const res = await fetch(api.admin.settings.get.path);
            if (!res.ok) throw new Error("Failed to fetch settings");
            return res.json();
        },
    });
}

export function useUpdateAdminSettings() {
    return useMutation({
        mutationFn: async (data: UpdatePlatformSettingsRequest) => {
            const res = await fetch(api.admin.settings.update.path, {
                method: api.admin.settings.update.method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to update settings");
            }

            return res.json() as Promise<PlatformSettings>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
        },
    });
}
