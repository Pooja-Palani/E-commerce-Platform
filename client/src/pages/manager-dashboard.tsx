import { Layout } from "@/components/layout";
import { useUsers, useUpdateUser } from "@/hooks/use-users";
import { useAuthStore } from "@/store/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, XCircle } from "lucide-react";

export default function ManagerDashboard() {
  const { data: users, isLoading } = useUsers();
  const update = useUpdateUser();
  const currentUser = useAuthStore(s => s.user!);

  if (isLoading) return <Layout><LoadingSpinner /></Layout>;

  // Only see users in the same community
  const communityUsers = users?.filter(u => u.communityId === currentUser.communityId) || [];
  const pendingUsers = communityUsers.filter(u => u.status === 'PENDING');
  const activeUsers = communityUsers.filter(u => u.status === 'ACTIVE');

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-muted-foreground">Manage members and approvals for your community.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{communityUsers.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-amber-500">{pendingUsers.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-primary">{activeUsers.length}</div></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">No pending approvals.</p>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                    <div>
                      <p className="font-semibold">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" variant="outline" className="text-destructive hover:bg-destructive/10"
                        onClick={() => update.mutate({ id: user.id, data: { status: 'REMOVED', version: user.version } })}
                        disabled={update.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button 
                        size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => update.mutate({ id: user.id, data: { status: 'ACTIVE', version: user.version } })}
                        disabled={update.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Name</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium rounded-tr-lg text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {communityUsers.map(user => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-muted-foreground text-xs">{user.email}</div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline">{user.role}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>{user.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
