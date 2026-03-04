import { Layout } from "@/components/layout";
import { useUsers, useUpdateUser, useDeleteUser } from "@/hooks/use-users";
import { useCommunities } from "@/hooks/use-communities";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Shield, ArrowUpCircle, ArrowDownCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function AdminUsers() {
    const { data: users, isLoading } = useUsers();
    const { data: communities } = useCommunities();
    const updateRole = useUpdateUser();
    const deleteUser = useDeleteUser();
    const { toast } = useToast();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ id: string, name: string, version: number } | null>(null);
    const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");

    if (isLoading) return <Layout><LoadingSpinner /></Layout>;

    const handleRoleChange = (userId: string, currentVersion: number, newRole: "RESIDENT" | "COMMUNITY_MANAGER" | "ADMIN") => {
        updateRole.mutate({
            id: userId,
            data: { role: newRole, version: currentVersion }
        }, {
            onSuccess: () => {
                toast({ title: "Role updated", description: `User role changed to ${newRole}` });
            },
            onError: (err: any) => {
                toast({ title: "Update failed", description: err.message, variant: "destructive" });
            }
        });
    };

    const handlePromoteClick = (user: any) => {
        setSelectedUser({ id: user.id, name: user.fullName, version: user.version });
        setSelectedCommunityId(user.communityId || "");
        setIsDialogOpen(true);
    };

    const handlePromoteConfirm = () => {
        if (!selectedUser || !selectedCommunityId) {
            toast({ title: "Error", description: "Please select a community for the manager.", variant: "destructive" });
            return;
        }

        updateRole.mutate({
            id: selectedUser.id,
            data: {
                role: "COMMUNITY_MANAGER",
                communityId: selectedCommunityId,
                version: selectedUser.version
            }
        }, {
            onSuccess: () => {
                toast({ title: "Role updated", description: `${selectedUser.name} is now a Community Manager.` });
                setIsDialogOpen(false);
                setSelectedUser(null);
            },
            onError: (err: any) => {
                toast({ title: "Update failed", description: err.message, variant: "destructive" });
            }
        });
    };

    const handleRemoveUser = (userId: string, userName: string) => {
        if (window.confirm(`Are you sure you want to permanently remove ${userName}? This action cannot be undone.`)) {
            deleteUser.mutate(userId);
        }
    };

    return (
        <Layout>
            <div className="space-y-8 pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-blue-50 rounded-lg text-[#1e3a8a] py-2">
                            <Users className="w-4 h-4" />
                        </div> User Management
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Manage platform users, roles, and access permissions.</p>
                </div>

                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-800">Platform Directory</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#f8fafc] text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-bold border-b">User Profile</th>
                                        <th className="px-6 py-4 font-bold border-b">Community</th>
                                        <th className="px-6 py-4 font-bold border-b">Access Level</th>
                                        <th className="px-6 py-4 font-bold border-b text-right">Administrative Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users?.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{user.fullName}</div>
                                                <div className="text-slate-500 text-xs font-medium">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-600 font-medium">{user.locality || "Independent"}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant={user.role === 'ADMIN' ? 'default' : user.role === 'COMMUNITY_MANAGER' ? 'secondary' : 'outline'}
                                                    className={`font-bold text-[10px] tracking-tight ${user.role === 'ADMIN' ? 'bg-[#1e3a8a]' :
                                                        user.role === 'COMMUNITY_MANAGER' ? 'bg-indigo-100 text-indigo-700' :
                                                            'text-slate-500'
                                                        }`}
                                                >
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {user.role !== 'ADMIN' ? (
                                                        <>
                                                            {user.role === 'RESIDENT' ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a]/10 font-bold text-xs h-8"
                                                                    onClick={() => handlePromoteClick(user)}
                                                                    disabled={updateRole.isPending}
                                                                >
                                                                    <ArrowUpCircle className="w-3.5 h-3.5 mr-1" /> Promote
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-amber-600 text-amber-600 hover:bg-amber-50 font-bold text-xs h-8"
                                                                    onClick={() => handleRoleChange(user.id, user.version, "RESIDENT")}
                                                                    disabled={updateRole.isPending}
                                                                >
                                                                    <ArrowDownCircle className="w-3.5 h-3.5 mr-1" /> Demote
                                                                </Button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest self-center mr-2">System Admin</span>
                                                    )}

                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="bg-rose-500 hover:bg-rose-600 font-bold text-xs h-8 px-3"
                                                        onClick={() => handleRemoveUser(user.id, user.fullName)}
                                                        disabled={deleteUser.isPending}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Community Manager</DialogTitle>
                        <DialogDescription>
                            Select the community {selectedUser?.name} will be managing.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Community</Label>
                            <Select value={selectedCommunityId} onValueChange={setSelectedCommunityId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a community" />
                                </SelectTrigger>
                                <SelectContent>
                                    {communities?.map((community) => (
                                        <SelectItem key={community.id} value={community.id}>
                                            {community.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handlePromoteConfirm} disabled={!selectedCommunityId || updateRole.isPending}>
                            Confirm Promotion
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
