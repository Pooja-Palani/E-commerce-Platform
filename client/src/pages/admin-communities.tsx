import { Layout } from "@/components/layout";
import { useCommunities, useCreateCommunity, useDeleteCommunity, useCommunityMembers, useRemoveMemberFromCommunity, useAddMemberToCommunity } from "@/hooks/use-communities";
import { useUsers } from "@/hooks/use-users";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Plus, MapPin, Globe, Lock, Trash2, UserPlus, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { insertCommunitySchema, Community } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function AdminCommunities() {
    const { data: communities, isLoading: isCommunitiesLoading } = useCommunities();
    const { data: users, isLoading: isUsersLoading } = useUsers();
    const createCommunity = useCreateCommunity();
    const deleteCommunity = useDeleteCommunity();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
    const [communityToDelete, setCommunityToDelete] = useState<string | null>(null);
    const [addUserId, setAddUserId] = useState<string>("");
    const { toast } = useToast();
    const communityMembers = useCommunityMembers(selectedCommunity?.id);
    const removeMember = useRemoveMemberFromCommunity(selectedCommunity?.id);
    const addMember = useAddMemberToCommunity(selectedCommunity?.id);

    const form = useForm({
        resolver: zodResolver(insertCommunitySchema),
        defaultValues: {
            name: "",
            parentId: null as string | null,
            visibility: "PUBLIC",
            status: "ACTIVE",
            locality: "",
            address: "",
            description: "",
            contactEmail: "",
            contactPhone: "",
            facilities: "",
            rules: ""
        }
    });

    const topLevelCommunities = (communities ?? []).filter(c => !c.parentId);
    const communitiesByParent = (communities ?? []).reduce<Record<string, Community[]>>((acc, c) => {
        const pid = c.parentId ?? "_root";
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(c);
        return acc;
    }, {});

    const onSubmit = (data: any) => {
        createCommunity.mutate(data, {
            onSuccess: () => {
                setIsOpen(false);
                form.reset();
                toast({ title: "Community created successfully" });
            },
            onError: (err: any) => {
                toast({ title: "Failed to create community", description: err.message, variant: "destructive" });
            }
        });
    };

    if (isCommunitiesLoading || isUsersLoading) return <Layout><LoadingSpinner /></Layout>;

    return (
        <Layout>
            <div className="space-y-8 pb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-[#1e3a8a]" /> Platform Communities
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">Manage and monitor residential complexes on the platform.</p>
                    </div>

                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 flex items-center gap-2 font-bold transition-all shadow-md active:scale-95">
                                <Plus className="w-4 h-4" /> New Community
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[1000px] w-[95vw] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold text-slate-900">Create New Community</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4 pb-4">
                                    <FormField control={form.control} name="parentId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Parent Community (optional – sub-community)</FormLabel>
                                            <Select onValueChange={(v) => field.onChange(v === "__none__" ? null : v)} value={field.value ?? "__none__"}>
                                                <FormControl><SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="None (top-level community)" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="__none__">None (top-level community)</SelectItem>
                                                    {topLevelCommunities.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.locality || "—"})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold text-slate-700">Display Name</FormLabel>
                                                <FormControl><Input placeholder="e.g. Sristi Greenwoods" className="h-10 border-slate-200" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="visibility" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold text-slate-700">Visibility</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="PUBLIC">Public (Visible to All)</SelectItem>
                                                        <SelectItem value="PRIVATE">Private (Invite Only)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <FormField control={form.control} name="locality" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Locality</FormLabel>
                                            <FormControl><Input placeholder="e.g. Adyar" className="h-10 border-slate-200" {...field} value={field.value || ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="address" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Full Address</FormLabel>
                                            <FormControl><Textarea placeholder="Full postal address..." className="min-h-[80px] border-slate-200" {...field} value={field.value || ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Description</FormLabel>
                                            <FormControl><Textarea placeholder="Describe the community..." className="min-h-[80px] border-slate-200" {...field} value={field.value || ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="contactEmail" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold text-slate-700">Contact Email</FormLabel>
                                                <FormControl><Input type="email" placeholder="admin@community.com" className="h-10 border-slate-200" {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="contactPhone" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold text-slate-700">Contact Phone</FormLabel>
                                                <FormControl><Input placeholder="+91..." className="h-10 border-slate-200" {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <FormField control={form.control} name="facilities" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Facilities (Amenities)</FormLabel>
                                            <FormControl><Textarea placeholder="Gym, Pool, Park..." className="min-h-[80px] border-slate-200" {...field} value={field.value || ''} /></FormControl>
                                            <p className="text-[10px] text-muted-foreground">List amenities available to residents.</p>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="rules" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Community Rules</FormLabel>
                                            <FormControl><Textarea placeholder="Standard guidelines..." className="min-h-[80px] border-slate-200" {...field} value={field.value || ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <Button type="submit" className="w-full h-11 bg-[#1e3a8a] text-base font-bold shadow-lg mt-6" disabled={createCommunity.isPending}>
                                        {createCommunity.isPending ? "Creating..." : "Confirm & Create"}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="space-y-8">
                    {topLevelCommunities.map((community) => (
                        <div key={community.id} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Card className="border-border/50 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                                    <div className="h-2 bg-[#1e3a8a] opacity-0 group-hover:opacity-100 transition-all" />
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg font-bold text-slate-900">{community.name}</CardTitle>
                                                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mt-1">
                                                    <MapPin className="w-3.5 h-3.5" /> {community.locality || "Unspecified Locality"}
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={`font-bold text-[10px] uppercase tracking-wider ${community.visibility === 'PUBLIC' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-amber-200 text-amber-700 bg-amber-50'}`}>
                                                {community.visibility === 'PUBLIC' ? <Globe className="w-3 h-3 mr-1 inline" /> : <Lock className="w-3 h-3 mr-1 inline" />}
                                                {community.visibility}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {community.description || "No description provided for this residential complex."}
                                            </p>
                                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-xs font-bold text-[#1e3a8a] hover:bg-[#1e3a8a]/5"
                                                        onClick={() => setSelectedCommunity(community)}
                                            >
                                                View Details
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => setCommunityToDelete(community.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                            </div>
                            {(communitiesByParent[community.id] ?? []).length > 0 && (
                                <div className="pl-4 border-l-2 border-slate-200 space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sub-communities of {community.name}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {(communitiesByParent[community.id] ?? []).map((sub) => (
                                            <Card key={sub.id} className="border-border/50 shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary/30">
                                                <CardHeader className="pb-2">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-base font-bold text-slate-900">↳ {sub.name}</CardTitle>
                                                            <div className="text-slate-500 text-xs font-medium mt-1"><MapPin className="w-3.5 h-3.5 inline" /> {sub.locality || "—"}</div>
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px]">Sub</Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex items-center justify-between">
                                                        <Button variant="ghost" size="sm" className="text-xs font-bold text-[#1e3a8a]" onClick={() => setSelectedCommunity(sub)}>View Details</Button>
                                                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setCommunityToDelete(sub.id)}><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <Dialog open={!!selectedCommunity} onOpenChange={(open) => !open && setSelectedCommunity(null)}>
                    <DialogContent className="sm:max-w-[800px] w-[95vw]">
                        <DialogHeader>
                            <div className="flex items-center justify-between pr-8">
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-slate-900">{selectedCommunity?.name}</DialogTitle>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className="font-bold text-[10px] bg-blue-50 text-blue-700 border-blue-100">
                                            {selectedCommunity?.visibility}
                                        </Badge>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" /> {selectedCommunity?.locality || "Independent"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="max-h-[70vh] overflow-y-auto mt-6 pr-4">
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</h4>
                                        <p className="text-lg font-bold text-emerald-600">Active</p>
                                    </div>
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Community Admin</h4>
                                        <p className="text-lg font-bold text-indigo-700">
                                            {users?.find(u => u.communityId === selectedCommunity?.id && u.role === 'COMMUNITY_MANAGER')?.fullName || "null"}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        Full Address
                                    </h4>
                                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                        {selectedCommunity?.address || "No address provided."}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        Description
                                    </h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {selectedCommunity?.description || "No description provided."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Contact Email</h4>
                                        <p className="text-sm font-bold text-[#1e3a8a]">{selectedCommunity?.contactEmail || "N/A"}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Contact Phone</h4>
                                        <p className="text-sm font-bold text-slate-900">{selectedCommunity?.contactPhone || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        Facilities & Amenities
                                    </h4>
                                    <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-50">
                                        <p className="text-sm text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">
                                            {selectedCommunity?.facilities || "No facilities listed."}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        Rules & Guidelines
                                    </h4>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                                            {selectedCommunity?.rules || "No rules established yet."}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-200">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Community Members
                                    </h4>
                                    {communityMembers.isLoading ? (
                                        <p className="text-sm text-slate-500">Loading members...</p>
                                    ) : (
                                        <>
                                            <ul className="space-y-2 max-h-48 overflow-y-auto">
                                                {(communityMembers.data?.length ?? 0) === 0 ? (
                                                    <li className="text-sm text-slate-500">No members in this community yet.</li>
                                                ) : (
                                                    communityMembers.data?.map((member) => (
                                                        <li key={member.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                                                            <div>
                                                                <span className="font-medium text-slate-900">{member.fullName}</span>
                                                                <span className="text-slate-500 text-xs ml-2">({member.email})</span>
                                                                <Badge variant="outline" className="ml-2 text-[10px]">{member.role}</Badge>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8"
                                                                onClick={() => removeMember.mutate(member.id)}
                                                                disabled={removeMember.isPending}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                                                            </Button>
                                                        </li>
                                                    ))
                                                )}
                                            </ul>
                                            <div className="flex flex-wrap items-center gap-2 pt-2">
                                                <Select value={addUserId} onValueChange={setAddUserId}>
                                                    <SelectTrigger className="w-[220px] h-9">
                                                        <SelectValue placeholder="Select user to add..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {users?.filter((u) => !communityMembers.data?.some((m) => m.id === u.id)).map((u) => (
                                                            <SelectItem key={u.id} value={u.id}>
                                                                {u.fullName} ({u.email})
                                                            </SelectItem>
                                                        )) ?? null}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    size="sm"
                                                    className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 h-9"
                                                    disabled={!addUserId || addUserId === "_none" || addMember.isPending}
                                                    onClick={() => {
                                                        if (addUserId && addUserId !== "_none") {
                                                            addMember.mutate(addUserId, { onSuccess: () => setAddUserId("") });
                                                        }
                                                    }}
                                                >
                                                    <UserPlus className="w-4 h-4 mr-1" /> Add to community
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-8">
                            <Button
                                variant="outline"
                                className="text-red-500 border-red-100 hover:bg-red-50 font-bold"
                                onClick={() => {
                                    setCommunityToDelete(selectedCommunity?.id || null);
                                    setSelectedCommunity(null);
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Community
                            </Button>
                            <Button onClick={() => setSelectedCommunity(null)} className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 font-bold px-12">
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={!!communityToDelete} onOpenChange={() => setCommunityToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold text-slate-900">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-600">
                                This action cannot be undone. This will permanently delete the community
                                and all associated data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="font-bold">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 font-bold"
                                onClick={() => {
                                    if (communityToDelete) {
                                        deleteCommunity.mutate(communityToDelete, {
                                            onSuccess: () => setCommunityToDelete(null)
                                        });
                                    }
                                }}
                            >
                                {deleteCommunity.isPending ? "Deleting..." : "Delete Permanently"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </Layout>
    );
}
