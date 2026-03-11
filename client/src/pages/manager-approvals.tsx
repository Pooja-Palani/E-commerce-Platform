import { Layout } from "@/components/layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, XCircle, Package, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

export default function ManagerApprovals() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: pendingUsers = [], isLoading } = useQuery({
        queryKey: ['/api/manager/approvals'],
        queryFn: async () => {
            const res = await fetch('/api/manager/approvals', { credentials: 'include' });
            if (!res.ok) throw new Error("Failed to fetch approvals");
            return res.json();
        },
        refetchInterval: 2000,
    });

    const { data: pendingListings = [], isLoading: loadingListings } = useQuery({
        queryKey: ['/api/manager/pending-listings'],
        queryFn: async () => {
            const res = await fetch('/api/manager/pending-listings', { credentials: 'include' });
            if (!res.ok) throw new Error("Failed to fetch pending listings");
            return res.json();
        },
        refetchInterval: 2000,
    });

    const approveMutation = useMutation({
        mutationFn: async (userCommunityId: string) => {
            const res = await fetch(`/api/manager/approvals/${userCommunityId}/approve`, {
                method: 'POST', credentials: 'include'
            });
            if (!res.ok) throw new Error("Approval failed");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/manager/approvals'] });
            toast({ title: "Success", description: "User request approved" });
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async (userCommunityId: string) => {
            const res = await fetch(`/api/manager/approvals/${userCommunityId}/reject`, {
                method: 'POST', credentials: 'include'
            });
            if (!res.ok) throw new Error("Rejection failed");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/manager/approvals'] });
            toast({ title: "Success", description: "User request rejected" });
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    const approveListingMutation = useMutation({
        mutationFn: async (listingId: string) => {
            const res = await fetch(`/api/manager/listings/${listingId}/approve`, {
                method: 'POST', credentials: 'include'
            });
            if (!res.ok) throw new Error("Approval failed");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/manager/pending-listings'] });
            queryClient.invalidateQueries({ queryKey: ['/api/my-listings'] });
            toast({ title: "Success", description: "Listing approved and now live" });
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    const rejectListingMutation = useMutation({
        mutationFn: async (listingId: string) => {
            const res = await fetch(`/api/manager/listings/${listingId}/reject`, {
                method: 'POST', credentials: 'include'
            });
            if (!res.ok) throw new Error("Rejection failed");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/manager/pending-listings'] });
            queryClient.invalidateQueries({ queryKey: ['/api/my-listings'] });
            toast({ title: "Success", description: "Listing rejected" });
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    if (isLoading) return <Layout><LoadingSpinner /></Layout>;

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Approvals</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Review and approve new members and listings for your community.</p>
                </div>

                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                            <Users className="w-5 h-5 text-indigo-600" /> Pending member approvals ({pendingUsers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pendingUsers.length === 0 ? (
                            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                                <p className="text-slate-500 font-medium">No pending member approvals at the moment.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingUsers.map((user: any) => (
                                    <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <div>
                                            <p className="font-bold text-slate-900 text-lg">{user.fullName}</p>
                                            <p className="text-sm font-medium text-slate-500">{user.email}</p>
                                            <p className="text-xs text-slate-400 mt-1">Joined: {new Date(user.createdAt!).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex gap-3 mt-4 sm:mt-0">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                                                onClick={() => rejectMutation.mutate(user.userCommunityId)}
                                                disabled={rejectMutation.isPending || approveMutation.isPending}
                                            >
                                                <XCircle className="w-4 h-4 mr-1.5" /> Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                onClick={() => approveMutation.mutate(user.userCommunityId)}
                                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                            <Package className="w-5 h-5 text-amber-600" /> Pending listings (awaiting your approval) ({pendingListings.length})
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Products and services submitted by sellers in your community. Approve to make them live.</p>
                    </CardHeader>
                    <CardContent>
                        {loadingListings ? (
                            <div className="py-8 flex justify-center"><LoadingSpinner /></div>
                        ) : pendingListings.length === 0 ? (
                            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                                <p className="text-slate-500 font-medium">No pending listings at the moment.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingListings.map((listing: any) => (
                                    <div key={listing.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            {listing.listingType === "PRODUCT" ? (
                                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600"><Package className="w-5 h-5" /></div>
                                            ) : (
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary"><Wrench className="w-5 h-5" /></div>
                                            )}
                                            <div>
                                                <p className="font-bold text-slate-900">{listing.title}</p>
                                                <p className="text-sm text-slate-500">{listing.listingType === "PRODUCT" ? "Product" : "Service"} · by {listing.sellerNameSnapshot}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">₹{listing.price}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-4 sm:mt-0">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                                                onClick={() => rejectListingMutation.mutate(listing.id)}
                                                disabled={rejectListingMutation.isPending || approveListingMutation.isPending}
                                            >
                                                <XCircle className="w-4 h-4 mr-1.5" /> Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                onClick={() => approveListingMutation.mutate(listing.id)}
                                                disabled={approveListingMutation.isPending || rejectListingMutation.isPending}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                                            </Button>
                                            <Link href={`/listings/${listing.id}`}>
                                                <Button size="sm" variant="ghost">View</Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
