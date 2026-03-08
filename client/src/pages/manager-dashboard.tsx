import { useState } from "react";
import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  Star,
  Users,
  Store,
  LayoutGrid,
  TrendingUp,
  DollarSign,
  Percent,
  ArrowUpRight,
  Eye,
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Link } from "wouter";

const REASON_LABELS: Record<string, string> = {
  INAPPROPRIATE_CONTENT: "Inappropriate content",
  MISLEADING_DESCRIPTION: "Misleading description",
  FAKE_OR_SPAM: "Fake or spam",
  QUALITY_ISSUE: "Quality issue",
  SCAM_OR_FRAUD: "Scam or fraud",
  OTHER: "Other",
};

type ReportRow = {
  id: string;
  listingId: string;
  reporterId: string;
  reason: string;
  details: string | null;
  bookingId: string | null;
  createdAt: string;
  listingTitle?: string;
  reporterName?: string;
  sellerName?: string;
};

export default function ManagerDashboard() {
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);

  const { data: analytics, isLoading } = useQuery({
    queryKey: [api.manager.analytics.path],
    queryFn: async () => {
      const res = await fetch(api.manager.analytics.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      return api.manager.analytics.responses[200].parse(json);
    },
    refetchInterval: 2000,
  });

  const { data: reports = [], isLoading: loadingReports } = useQuery<ReportRow[]>({
    queryKey: [api.manager.reports.path],
    queryFn: async () => {
      const res = await fetch(api.manager.reports.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
    refetchInterval: 2000,
  });

  const reportedListings = reports.filter((r) => !r.bookingId);
  const disputedBookings = reports.filter((r) => r.bookingId);

  if (isLoading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manager Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Oversee and manage your community</p>
        </div>

        {/* Action Center */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Action Center</h2>
          <p className="text-sm text-muted-foreground -mt-3">Items that need your attention</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Pending approvals</p>
                  <h3 className="text-2xl font-bold text-slate-900">{analytics?.actionCenter.pendingApprovals || 0}</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Reported listings</p>
                  <h3 className="text-2xl font-bold text-slate-900">{analytics?.actionCenter.reportedListings || 0}</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Disputed bookings</p>
                  <h3 className="text-2xl font-bold text-slate-900">{analytics?.actionCenter.disputedBookings || 0}</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Low-rated services</p>
                  <h3 className="text-2xl font-bold text-slate-900">{analytics?.actionCenter.lowRatedServices || 0}</h3>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reported Listings & Disputed Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-amber-200/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Reported Listings
              </CardTitle>
              <p className="text-sm text-muted-foreground">Listings reported by community members</p>
            </CardHeader>
            <CardContent>
              {loadingReports ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
              ) : reportedListings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No reported listings</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Listing</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportedListings.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium truncate max-w-[140px]">{r.listingTitle || "—"}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[100px]">{r.reporterName || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{format(new Date(r.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedReport(r)} className="gap-1">
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-red-200/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-600" />
                Disputed Bookings
              </CardTitle>
              <p className="text-sm text-muted-foreground">Bookings with reported issues</p>
            </CardHeader>
            <CardContent>
              {loadingReports ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
              ) : disputedBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No disputed bookings</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Listing</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputedBookings.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium truncate max-w-[140px]">{r.listingTitle || "—"}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[100px]">{r.reporterName || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{format(new Date(r.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedReport(r)} className="gap-1">
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Detail Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Report details</DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Listing</p>
                  <Link href={`/listings/${selectedReport.listingId}`}>
                    <span className="font-medium text-primary hover:underline cursor-pointer">
                      {selectedReport.listingTitle || selectedReport.listingId}
                    </span>
                  </Link>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Seller</p>
                  <p className="font-medium">{selectedReport.sellerName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Reported by</p>
                  <p className="font-medium">{selectedReport.reporterName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Reason</p>
                  <Badge variant="secondary">{REASON_LABELS[selectedReport.reason] || selectedReport.reason}</Badge>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">What&apos;s wrong</p>
                  <p className="text-sm rounded-lg bg-muted/50 p-3 whitespace-pre-wrap">
                    {selectedReport.details || "No additional details provided."}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Reported on</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(selectedReport.createdAt), "PPP 'at' p")}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Community Snapshot */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Community Snapshot</h2>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <Card className="border-border/50 shadow-sm h-full">
              <CardContent className="p-5 flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Members</p>
                  <h3 className="text-xl font-bold text-slate-900">{analytics?.snapshot.totalMembers || 0}</h3>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm h-full">
              <CardContent className="p-5 flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Sellers</p>
                  <h3 className="text-xl font-bold text-slate-900">{analytics?.snapshot.activeSellers || 0}</h3>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Store className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm h-full">
              <CardContent className="p-5 flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Listings</p>
                  <h3 className="text-xl font-bold text-slate-900">{analytics?.snapshot.totalListings || 0}</h3>
                </div>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <LayoutGrid className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm h-full">
              <CardContent className="p-5 flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Weekly Growth</p>
                  <h3 className="text-xl font-bold text-slate-900">{analytics?.snapshot.weeklyGrowth || 0}%</h3>
                  <div className="h-4 flex items-center">
                    {(analytics?.snapshot.weeklyGrowth || 0) > 0 && (
                      <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" /> vs last week
                      </p>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm h-full">
              <CardContent className="p-5 flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monthly GMV</p>
                  <h3 className="text-xl font-bold text-slate-900">₹{(analytics?.snapshot.monthlyGmv || 0).toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm h-full">
              <CardContent className="p-5 flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Platform Commission</p>
                  <h3 className="text-xl font-bold text-slate-900">₹{(analytics?.snapshot.platformCommission || 0).toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                  <Percent className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">Weekly Bookings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.weeklyBookingsTrend || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                    <Bar dataKey="bookings" fill="#1e3a8a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">Monthly Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.monthlyRevenueTrend || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
