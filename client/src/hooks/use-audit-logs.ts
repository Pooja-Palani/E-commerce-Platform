import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useAuditLogs() {
  return useQuery({
    queryKey: [api.auditLogs.list.path],
    queryFn: async () => {
      const res = await fetch(api.auditLogs.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return api.auditLogs.list.responses[200].parse(await res.json());
    },
  });
}
