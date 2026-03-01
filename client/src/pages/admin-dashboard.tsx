import { Layout } from "@/components/layout";
import { useCommunities, useCreateCommunity } from "@/hooks/use-communities";
import { useUsers } from "@/hooks/use-users";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCommunitySchema, InsertCommunity } from "@shared/schema";
import { useState } from "react";
import { Shield, Building, Users } from "lucide-react";

export default function AdminDashboard() {
  const { data: communities, isLoading: cLoading } = useCommunities();
  const { data: users, isLoading: uLoading } = useUsers();
  const createCommunity = useCreateCommunity();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<InsertCommunity>({
    resolver: zodResolver(insertCommunitySchema),
    defaultValues: { name: "", visibility: "PUBLIC", status: "ACTIVE" }
  });

  if (cLoading || uLoading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" /> Admin Control
            </h1>
            <p className="text-muted-foreground">System-wide overview and management.</p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>Create Community</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Community</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(d => createCommunity.mutate(d, { onSuccess: () => setIsOpen(false) }))} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="visibility" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="PUBLIC">Public</SelectItem>
                          <SelectItem value="PRIVATE">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createCommunity.isPending}>Create</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building className="w-5 h-5"/> Communities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communities?.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.id}</div>
                    </div>
                    <Badge variant="outline">{c.visibility}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5"/> Recent Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users?.slice(0, 5).map(u => (
                  <div key={u.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-semibold">{u.fullName}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    <Badge>{u.role}</Badge>
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
