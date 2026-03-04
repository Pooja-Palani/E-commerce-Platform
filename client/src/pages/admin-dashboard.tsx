import { Layout } from "@/components/layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Building2,
  Users as UsersIcon,
  Wrench,
  IndianRupee,
  TrendingUp,
  ArrowUpRight,
  ChevronRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export default function AdminDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: [api.admin.analytics.path],
    queryFn: async () => {
      const res = await fetch(api.admin.analytics.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      return api.admin.analytics.responses[200].parse(json);
    },
    refetchInterval: 2000,
  });

  if (isLoading) return <Layout><LoadingSpinner /></Layout>;

  const metrics = [
    {
      title: "Communities",
      value: analytics?.metrics.communities || 0,
      icon: Building2,
      color: "bg-blue-50 text-blue-600",
      trend: null,
      url: "/admin/communities"
    },
    {
      title: "Total Users",
      value: (analytics?.metrics.totalUsers || 0).toLocaleString(),
      icon: UsersIcon,
      color: "bg-indigo-50 text-indigo-600",
      trend: "+15% vs last month",
      url: "/admin/users"
    },
    {
      title: "Active Services",
      value: analytics?.metrics.activeServices || 0,
      icon: Wrench,
      color: "bg-sky-50 text-sky-600",
      trend: null,
      url: "/admin/analytics"
    },
    {
      title: "Total Revenue",
      value: `₹${(analytics?.metrics.totalRevenue || 0).toLocaleString()}`,
      icon: IndianRupee,
      color: "bg-slate-50 text-slate-600",
      trend: "+22% vs last month",
      url: "/admin/analytics"
    },
    {
      title: "Commission",
      value: `₹${(analytics?.metrics.commission || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-600",
      trend: null,
      url: "/admin/analytics"
    },
  ];

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Overview</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Monitor and manage the entire marketplace</p>
          </div>
          <Button asChild className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 font-bold shadow-md transition-all active:scale-95">
            <Link href="/admin/communities" className="flex items-center gap-2">
              Go to Communities <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {metrics.map((m, idx) => (
            <Link key={idx} href={m.url}>
              <Card className="h-full border-border/50 shadow-sm overflow-hidden hover:border-[#1e3a8a]/30 hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.title}</p>
                      <h3 className="text-2xl font-bold text-slate-900">{m.value}</h3>
                      <div className="h-4 mt-1 flex items-center">
                        {m.trend && (
                          <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                            <ArrowUpRight className="w-3 h-3" /> {m.trend}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-xl ${m.color} group-hover:scale-110 transition-transform`}>
                      <m.icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.revenueTrend || []} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#1e3a8a"
                      radius={[4, 4, 0, 0]}
                      barSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">Service Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.serviceCategories || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(analytics?.serviceCategories || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4 mt-6">
                {(analytics?.serviceCategories || []).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 font-bold text-slate-600">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded text-[10px]">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
