import { Layout } from "@/components/layout";
import { useUsers } from "@/hooks/use-users";
import { useAuthStore } from "@/store/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ManagerMembers() {
    const { data: users, isLoading } = useUsers();
    const currentUser = useAuthStore(s => s.user!);

    if (isLoading) return <Layout><LoadingSpinner /></Layout>;

    const communityUsers = users?.filter(u => u.communityId === currentUser.communityId && u.status === 'ACTIVE') || [];

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Community Members</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">View and manage all active residents in your community.</p>
                </div>

                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-4 border-b border-border/50 bg-slate-50/50 rounded-t-xl">
                        <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                            <UsersIcon className="w-5 h-5 text-indigo-600" /> Active Members ({communityUsers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {communityUsers.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-slate-500 font-medium">No active members found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Name</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Email</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Role</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {communityUsers.map(user => (
                                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                                                    {user.fullName}
                                                    {user.role === 'COMMUNITY_MANAGER' && (
                                                        <Shield className="w-4 h-4 text-indigo-500" />
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 font-medium">{user.email}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className={`font-bold text-[10px] tracking-wider uppercase ${user.role === 'COMMUNITY_MANAGER' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                        {user.role.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 text-right">{new Date(user.createdAt!).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
