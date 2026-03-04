import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Activity, Users, Settings2, TrendingUp, CreditCard, Box } from "lucide-react";
import { useAdminAnalytics } from "@/hooks/use-admin";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const COLORS = ['#1e3a8a', '#10b981', '#f59e0b', '#3b82f6', '#cbd5e1'];

export default function AdminAnalytics() {
    const { data, isLoading } = useAdminAnalytics();

    if (isLoading || !data) {
        return (
            <Layout>
                <div className="flex h-full items-center justify-center min-h-[50vh]">
                    <LoadingSpinner />
                </div>
            </Layout>
        );
    }

    const { metrics, revenueTrend: revenueData, userGrowth: userGrowthData, serviceCategories } = data;

    return (
        <Layout>
            <div className="space-y-8 pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-blue-50 rounded-lg text-[#1e3a8a] py-2">
                            <Activity className="w-4 h-4" />
                        </div> Platform Analytics
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Detailed insights into platform usage, revenue, and growth.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">Monthly Active Users</p>
                                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                    <Users className="h-4 w-4 text-[#1e3a8a]" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{metrics.totalUsers.toLocaleString()}</div>
                            <p className="text-xs text-emerald-600 font-medium flex items-center mt-1">
                                <TrendingUp className="w-3 h-3 mr-1" /> +12% from last month
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">Transaction Volume</p>
                                <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                                    <CreditCard className="h-4 w-4 text-emerald-600" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <p className="text-xs text-emerald-600 font-medium flex items-center mt-1">
                                <TrendingUp className="w-3 h-3 mr-1" /> +8% from last month
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                                <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                                    <Box className="h-4 w-4 text-amber-600" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{metrics.activeServices.toLocaleString()}</div>
                            <p className="text-xs text-emerald-600 font-medium flex items-center mt-1">
                                <TrendingUp className="w-3 h-3 mr-1" /> +24% from last month
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">Platform Commission</p>
                                <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                                    <Activity className="h-4 w-4 text-purple-600" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">${metrics.commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <p className="text-xs text-emerald-600 font-medium flex items-center mt-1">
                                <TrendingUp className="w-3 h-3 mr-1" /> +15% from last month
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-slate-900">Revenue Growth</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} tickFormatter={(value) => `$${value}`} />
                                        <RechartsTooltip
                                            cursor={{ fill: '#f1f5f9' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="revenue" fill="#1e3a8a" radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-slate-900">User Acquisition</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={userGrowthData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm col-span-1 lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-slate-900">Service Category Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full mt-4 flex justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={serviceCategories}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {serviceCategories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-6 mt-4">
                                {serviceCategories.map((category, index) => (
                                    <div key={category.name} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-sm text-slate-600 font-medium">{category.name}</span>
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
