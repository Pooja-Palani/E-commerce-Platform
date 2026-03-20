import { Layout } from "@/components/layout";
import { useAuthStore } from "@/store/use-auth";
import { useCommunities, useUserCommunities, useJoinCommunity, useLeaveCommunity, usePendingInvites, useAcceptInvite, useDeclineInvite } from "@/hooks/use-communities";
import { useUpdateUser } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Mail, Shield, MapPin, Phone, Info, Building2, CheckCircle, Clock, LogOut, Globe, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Store } from "lucide-react";

export default function Profile() {
    const user = useAuthStore((state) => state.user);
    const viewMode = useAuthStore((state) => state.viewMode);
    const setViewMode = useAuthStore((state) => state.setViewMode);
    const { data: allCommunities, isLoading: loadingAll } = useCommunities();
    const { data: memberships = [], isLoading: loadingMemberships } = useUserCommunities(user?.id || "");
    const { data: pendingInvites = [] } = usePendingInvites();
    const join = useJoinCommunity();
    const leave = useLeaveCommunity();
    const acceptInvite = useAcceptInvite();
    const declineInvite = useDeclineInvite();
    const update = useUpdateUser();

    if (!user || loadingAll || loadingMemberships) {
        return <Layout><LoadingSpinner /></Layout>;
    }

    const membershipMap = new Map();
    memberships.forEach((m: any) => membershipMap.set(m.community.id, m.joinStatus));

    const setPrimaryCommunity = (communityId: string) => {
        update.mutate({ id: user.id, data: { communityId, version: user.version } });
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Manage your personal information and community settings.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* User Basic Info Card */}
                    <Card className="md:col-span-1 border-border/50 shadow-sm overflow-hidden bg-white">
                        <div className="h-24 bg-primary/10 flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white border-4 border-white shadow-sm mt-12">
                                <User className="w-10 h-10" />
                            </div>
                        </div>
                        <CardContent className="pt-14 text-center">
                            <h3 className="text-xl font-bold">{user.fullName}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="mt-4 flex justify-center">
                                <Badge variant="secondary" className="capitalize px-4 py-1 text-xs font-bold bg-primary/5 text-primary border-primary/10">
                                    {user.role.toLowerCase().replace('_', ' ')}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Details Card */}
                    <Card className="md:col-span-2 border-border/50 shadow-sm bg-white">
                        <CardHeader className="bg-slate-50 border-b border-border/50">
                            <CardTitle className="text-lg">Account Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        <Mail className="w-3 h-3" /> Email
                                    </div>
                                    <p className="text-sm font-medium">{user.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        <Phone className="w-3 h-3" /> Phone
                                    </div>
                                    <p className="text-sm font-medium">{user.phone || 'Not provided'}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        <MapPin className="w-3 h-3" /> Locality
                                    </div>
                                    <p className="text-sm font-medium">{user.locality || 'Not provided'}</p>
                                </div>
                            </div>

                            {user.role === "RESIDENT" && (
                                <div className="mt-8 pt-6 border-t border-border/50">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold">Platform View Mode</h4>
                                            <p className="text-xs text-muted-foreground">Switch between buying and selling tools.</p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-xl border border-border/50">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border/50 shadow-sm">
                                                <div className={`p-1 rounded-md ${viewMode === 'BUYER' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                                    <ShoppingCart size={12} />
                                                </div>
                                                <Label htmlFor="profile-view-mode" className={`text-xs font-bold ${viewMode === 'BUYER' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    Buyer
                                                </Label>
                                                <Switch
                                                    id="profile-view-mode"
                                                    checked={viewMode === 'SELLER'}
                                                    onCheckedChange={(checked) => {
                                                        setViewMode(checked ? 'SELLER' : 'BUYER');
                                                        if (checked && !user.isSeller) {
                                                            update.mutate(
                                                                { id: user.id, data: { isSeller: true, version: user.version } },
                                                                { onSuccess: (updated) => useAuthStore.getState().setUser(updated) }
                                                            );
                                                        }
                                                    }}
                                                    className="data-[state=checked]:bg-orange-500"
                                                />
                                                <Label htmlFor="profile-view-mode" className={`text-xs font-bold ${viewMode === 'SELLER' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    Seller
                                                </Label>
                                                <div className={`p-1 rounded-md ${viewMode === 'SELLER' ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                                    <Store size={12} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {pendingInvites.length > 0 && (
                    <div className="border border-amber-200 bg-amber-50/30 rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-amber-100/50 p-6 border-b border-amber-200">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-amber-900">
                                <Info className="w-5 h-5" /> Community invites
                            </h2>
                            <p className="text-amber-800/80 mt-1 text-sm">You've been invited to join these communities.</p>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingInvites.map((inv: any) => (
                                <Card key={inv.id} className="border-amber-200 bg-white">
                                    <CardContent className="pt-6">
                                        <h4 className="font-bold">{inv.community?.name || "Community"}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">Invitation from your community manager</p>
                                        <div className="flex gap-2 mt-4">
                                            <Button
                                                size="sm"
                                                onClick={() => acceptInvite.mutate(inv.id)}
                                                disabled={acceptInvite.isPending}
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => declineInvite.mutate(inv.id)}
                                                disabled={declineInvite.isPending}
                                            >
                                                Decline
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border border-border/50 bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-slate-50 p-6 border-b border-border/50">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-indigo-600" /> Community Memberships
                        </h2>
                        <p className="text-muted-foreground mt-1">Join local communities and switch your active context. You can add more anytime.</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allCommunities?.filter(c => membershipMap.has(c.id)).map((community) => {
                                const status = membershipMap.get(community.id);
                                const isPrimary = user.communityId === community.id;

                                return (
                                    <Card key={community.id} className={`border-border/50 transition-all ${isPrimary ? 'ring-2 ring-primary bg-primary/5 shadow-md' : 'hover:shadow-md'}`}>
                                            {community.bannerUrl ? (
                                                <div className="h-32 w-full overflow-hidden rounded-t-2xl">
                                                    <img src={community.bannerUrl} alt={`${community.name} banner`} className="w-full h-full object-cover" />
                                                </div>
                                            ) : null}
                                            <CardHeader>
                                                <div className="flex items-center gap-3 mb-2">
                                                    {community.logoUrl && (
                                                        <div className="w-10 h-10 rounded-md overflow-hidden bg-white/60 border border-white/30">
                                                            <img src={community.logoUrl} alt={`${community.name} logo`} className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <CardTitle className="text-lg font-bold">{community.name}</CardTitle>
                                                        <CardDescription className="flex items-center gap-2 line-clamp-1 flex-wrap">
                                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {community.locality}</span>
                                                            <Badge variant="outline" className={`text-[10px] font-bold ${(community as any).visibility === 'PRIVATE' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-blue-200 text-blue-700 bg-blue-50'}`}>
                                                                {(community as any).visibility === 'PRIVATE' ? <Lock className="w-3 h-3 mr-0.5" /> : <Globe className="w-3 h-3 mr-0.5" />}
                                                                {(community as any).visibility || 'PUBLIC'}
                                                            </Badge>
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        <CardContent className="space-y-4">
                                            {status === 'ACTIVE' ? (
                                                <div className="space-y-4">
                                                    <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Active Member</Badge>
                                                    {isPrimary ? (
                                                        <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-2 rounded-md text-center border border-emerald-200">
                                                            Currently Active Context
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            className="w-full font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                                            onClick={() => setPrimaryCommunity(community.id)}
                                                            disabled={update.isPending}
                                                        >
                                                            Set as Active Context
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                                        onClick={() => leave.mutate(community.id)}
                                                        disabled={leave.isPending}
                                                    >
                                                        <LogOut className="w-3 h-3 mr-2" /> Leave community
                                                    </Button>
                                                </div>
                                            ) : status === 'PENDING' ? (
                                                <div className="space-y-4">
                                                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                                                        <Clock className="w-3 h-3 mr-1" /> Request Pending
                                                    </Badge>
                                                    <div className="text-xs text-muted-foreground bg-slate-50 p-3 rounded-md border border-slate-100">
                                                        Awaiting approval from the Community Manager.
                                                    </div>
                                                </div>
                                            ) : status === 'REJECTED' || status === 'REMOVED' ? (
                                                <div className="space-y-4">
                                                    <Badge variant="destructive">Membership Removed</Badge>
                                                    <div className="text-xs text-muted-foreground p-3">
                                                        You were removed or rejected from this community.
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{community.description}</p>
                                                        <Button
                                                        className="w-full font-bold"
                                                        onClick={() => join.mutate(community.id)}
                                                        disabled={join.isPending}
                                                    >
                                                        {join.isPending ? "Requesting..." : "Enter Community"}
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            {allCommunities?.length === 0 && (
                                <div className="col-span-full py-10 text-center text-muted-foreground">
                                    No communities are available on the platform yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
