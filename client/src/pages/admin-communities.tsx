import { Layout } from "@/components/layout";
import { useCommunities, useCreateCommunity, useDeleteCommunity } from "@/hooks/use-communities";
import { useUsers } from "@/hooks/use-users";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Plus, MapPin, Globe, Lock, Trash2 } from "lucide-react";
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
    const { toast } = useToast();
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
    const [communityToDelete, setCommunityToDelete] = useState<string | null>(null);

    const form = useForm({
        resolver: zodResolver(insertCommunitySchema),
        defaultValues: {
            name: "",
            visibility: "PUBLIC",
            status: "ACTIVE",
            locality: "",
            address: "",
            description: "",
            totalUnits: 0,
            contactEmail: "",
            contactPhone: "",
            facilities: "",
            rules: ""
        }
    });

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

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="locality" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold text-slate-700">Locality</FormLabel>
                                                <FormControl><Input placeholder="e.g. Adyar" className="h-10 border-slate-200" {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="totalUnits" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold text-slate-700">Total Units</FormLabel>
                                                <FormControl><Input type="number" className="h-10 border-slate-200" {...field} onChange={e => field.onChange(parseInt(e.target.value))} value={field.value || 0} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {communities?.map((community) => (
                        <Card key={community.id} className="border-border/50 shadow-sm hover:shadow-md transition-all group overflow-hidden">
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Units</h4>
                                        <p className="text-lg font-bold text-slate-900">{selectedCommunity?.totalUnits || "N/A"}</p>
                                    </div>
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
