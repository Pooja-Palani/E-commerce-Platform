import { Layout } from "@/components/layout";
import { useListings, useCreateListing, useUpdateListing } from "@/hooks/use-listings";
import { useAuthStore } from "@/store/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash, Settings2 } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertListingSchema, InsertListing, Listing } from "@shared/schema";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function SellerListings() {
  const { data: listings, isLoading } = useListings();
  const user = useAuthStore(s => s.user!);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  const create = useCreateListing();
  const update = useUpdateListing();

  const createForm = useForm<InsertListing>({
    resolver: zodResolver(insertListingSchema),
    defaultValues: {
      title: "", description: "", price: 0, status: "ACTIVE", visibility: "COMMUNITY_ONLY",
      sellerId: user.id, communityId: user.communityId || ""
    }
  });

  const editForm = useForm<InsertListing>({
    resolver: zodResolver(insertListingSchema)
  });

  const onOpenEdit = (listing: Listing) => {
    setEditingListing(listing);
    editForm.reset({
      title: listing.title,
      description: listing.description,
      price: listing.price / 100, // Display as dollars
      status: listing.status,
      visibility: listing.visibility,
      sellerId: listing.sellerId,
      communityId: listing.communityId
    });
  };

  if (isLoading) return <Layout><LoadingSpinner /></Layout>;

  const myListings = listings?.filter(l => l.sellerId === user.id) || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Listings</h1>
            <p className="text-muted-foreground">Manage your items for sale.</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Listing</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit((d) => {
                  create.mutate({ ...d, price: Math.round(d.price * 100) }, { onSuccess: () => setIsCreateOpen(false) });
                })} className="space-y-4">
                  <FormField control={createForm.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={createForm.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Price ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={createForm.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={createForm.control} name="visibility" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select visibility" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="COMMUNITY_ONLY">Community Only</SelectItem>
                          <SelectItem value="GLOBAL">Global</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={create.isPending}>Create Listing</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Item</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Visibility</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {myListings.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">You have no listings yet.</td></tr>
                )}
                {myListings.map(listing => (
                  <tr key={listing.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{listing.title}</td>
                    <td className="px-6 py-4">${(listing.price / 100).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{listing.visibility}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={listing.status === 'ACTIVE' ? 'default' : 'secondary'}>{listing.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <Dialog open={editingListing?.id === listing.id} onOpenChange={(o) => !o && setEditingListing(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onOpenEdit(listing)}>
                            <Settings2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Edit Listing</DialogTitle></DialogHeader>
                          <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit((d) => {
                              if (!editingListing) return;
                              update.mutate({ 
                                id: editingListing.id, 
                                data: { ...d, price: Math.round(d.price * 100), version: editingListing.version } 
                              }, { onSuccess: () => setEditingListing(null) });
                            })} className="space-y-4">
                              <FormField control={editForm.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                              )} />
                              <FormField control={editForm.control} name="price" render={({ field }) => (
                                <FormItem><FormLabel>Price ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl></FormItem>
                              )} />
                              <FormField control={editForm.control} name="status" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Status</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                      <SelectItem value="ACTIVE">Active</SelectItem>
                                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                                      <SelectItem value="REMOVED">Removed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )} />
                              <Button type="submit" className="w-full" disabled={update.isPending}>Save Changes</Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
