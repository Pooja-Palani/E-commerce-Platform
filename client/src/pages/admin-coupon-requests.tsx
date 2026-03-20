import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tag, XCircle, CheckCircle2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type AdminCouponRequest = {
  id: string;
  communityName?: string;
  managerName?: string;
  numberOfCoupons: number;
  perCouponValue: number;
  couponTotal: number;
  commissionRate: number;
  adminCommission: number;
  totalPayable: number;
  reason: string;
  validUntil: string | Date;
  status: string;
  coupon:
    | null
    | {
        code: string;
        status: string;
        remainingUnits: number;
        expiresAt: string | Date;
        activatedAt: string | Date | null;
        sharedAt: string | Date | null;
      };
};

function requestBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "REJECTED") return "bg-red-500/10 text-red-600 border-red-500/20";
  if (s === "PENDING_ADMIN") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  if (s === "APPROVED_NOT_SHARED") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  return "bg-muted text-muted-foreground";
}

function couponBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  if (s === "NOT_SHARED") return "bg-indigo-500/10 text-indigo-700 border-indigo-500/20";
  if (s === "EXPIRED") return "bg-red-500/10 text-red-600 border-red-500/20";
  return "bg-muted text-muted-foreground";
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text().catch(() => "");
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Empty server response");
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed) as T;
  }
  throw new Error(trimmed.slice(0, 200) || "Server returned non-JSON response");
}

export default function AdminCouponRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading, isError, error } = useQuery<AdminCouponRequest[]>({
    queryKey: ["/api/admin/coupons/requests"],
    queryFn: async () => {
      const res = await fetch("/api/admin/coupons/requests", { credentials: "include" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text?.trim()?.slice(0, 200) || "Failed to fetch queue");
      }
      return await parseJsonResponse<AdminCouponRequest[]>(res);
    },
    staleTime: 10000,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetch(`/api/admin/coupons/requests/${requestId}/reject`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text?.trim()?.slice(0, 200) || "Reject failed");
      }
      return await parseJsonResponse<any>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons/requests"] });
      toast({ title: "Rejected", description: "Refund credited in ledger." });
    },
    onError: (err: Error) => toast({ title: "Reject failed", description: err.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetch(`/api/admin/coupons/requests/${requestId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text?.trim()?.slice(0, 200) || "Approve failed");
      }
      return await parseJsonResponse<any>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons/requests"] });
      toast({ title: "Approved", description: "Coupon code generated (inactive)." });
    },
    onError: (err: Error) => toast({ title: "Approve failed", description: err.message, variant: "destructive" }),
  });

  const shareMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetch(`/api/admin/coupons/requests/${requestId}/share`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text?.trim()?.slice(0, 200) || "Share failed");
      }
      return await parseJsonResponse<any>(res);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons/requests"] });
      toast({ title: "Shared", description: data?.message || "Coupon activated." });
    },
    onError: (err: Error) => toast({ title: "Share failed", description: err.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="py-20 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="flex flex-col gap-4 max-w-5xl mx-auto pb-12">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Coupon Requests Queue</h1>
          <p className="text-muted-foreground text-sm font-medium">
            {error instanceof Error ? error.message : "Failed to load queue."}
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Coupon Requests Queue</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Reject with refund, Approve to generate code, Share to activate immediately.
          </p>
        </div>

        {requests.length === 0 ? (
          <Card className="border-dashed border-border/60 bg-muted/20">
            <CardContent className="py-16 text-center">
              <p className="text-slate-500 font-medium">No pending coupon requests.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <Card key={r.id} className="border-border/50 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-900 text-lg truncate">{r.managerName ?? "Manager"}</p>
                        <Badge className={`text-[11px] font-bold capitalize px-2 py-0.5 border ${requestBadge(r.status)}`}>
                          {r.status.toLowerCase().replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Community: {r.communityName ?? "—"}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Reason: {r.reason}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Valid until: {new Date(r.validUntil).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Units: {r.numberOfCoupons}</p>
                      <p className="text-xs text-slate-500">Per unit: ₹{r.perCouponValue}</p>
                      <p className="font-black text-primary">Total payable: ₹{r.totalPayable.toLocaleString()}</p>
                    </div>
                  </div>

                  {r.coupon ? (
                    <div className="rounded-xl border border-border/50 bg-muted/10 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-primary flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Code: <span className="font-mono">{r.coupon.code}</span>
                          </p>
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 gap-2"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(r.coupon!.code);
                                  toast({ title: "Copied", description: "Coupon code copied to clipboard." });
                                } catch {
                                  toast({ title: "Copy failed", description: "Clipboard permission not available.", variant: "destructive" });
                                }
                              }}
                            >
                              <Copy className="w-4 h-4" /> Copy code
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Expires: {new Date(r.coupon.expiresAt).toLocaleDateString()} • Remaining units: {r.coupon.remainingUnits}
                          </p>
                        </div>
                        <Badge className={`text-[11px] font-bold capitalize px-2 py-0.5 border ${couponBadge(r.coupon.status)}`}>
                          coupon {r.coupon.status.toLowerCase().replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Coupon code not generated yet.</p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                    {r.status === "PENDING_ADMIN" && (
                      <>
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => rejectMutation.mutate(r.id)}
                          disabled={rejectMutation.isPending || approveMutation.isPending || shareMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1.5" /> Reject
                        </Button>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => approveMutation.mutate(r.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending || shareMutation.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
                        </Button>
                      </>
                    )}

                    {r.status === "APPROVED_NOT_SHARED" && r.coupon?.status === "NOT_SHARED" && (
                      <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => shareMutation.mutate(r.id)}
                        disabled={shareMutation.isPending}
                      >
                        Share (Activate)
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

