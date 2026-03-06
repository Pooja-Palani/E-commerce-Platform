import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { getErrorMessage } from "@/lib/api-error";

export function useUserProfile(userId: string | null) {
    return useQuery({
        queryKey: [api.users.profile.path, { userId }],
        queryFn: async () => {
            if (!userId) throw new Error("No user ID");
            const url = buildUrl(api.users.profile.path, { id: userId });
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) {
                const message = await getErrorMessage(res, "Failed to fetch profile");
                throw new Error(message);
            }
            return api.users.profile.responses[200].parse(await res.json());
        },
        enabled: !!userId,
    });
}
