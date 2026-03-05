import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getErrorMessage } from "@/lib/api-error";

export function useAuditLogs() {
  return useQuery({
    queryKey: [api.auditLogs.list.path],
    queryFn: async () => {
      const res = await fetch(api.auditLogs.list.path, { credentials: "include" });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to fetch audit logs");
        throw new Error(message);
      }
      return api.auditLogs.list.responses[200].parse(await res.json());
    },
    refetchInterval: 2000,
  });
}
