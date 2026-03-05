import { Layout } from "@/components/layout";
import { useAuthStore } from "@/store/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertListingSchema } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";

export default function ListService() {
    const user = useAuthStore(s => s.user);
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm({
        resolver: zodResolver(insertListingSchema.extend({
            listingType: z.literal("SERVICE"),
            communityId: z.string().min(1, "Community is required"),
            availabilityBasis: z.enum(["FOREVER", "TIMELINE", "STOCK"]).optional(),
            startDate: z.any().optional(),
            endDate: z.any().optional(),
            stockQuantity: z.number().min(0).optional().nullable(),
        })),
        defaultValues: {
            title: "",
            description: "",
            price: 0,
            listingType: "SERVICE",
            communityId: user?.communityId || "",
            availabilityBasis: "FOREVER",
            startDate: "",
            endDate: "",
            stockQuantity: null as number | null
        }
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(api.listings.create.path, {
                method: api.listings.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to create listing");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Service listed successfully", description: "Your service is now available to the community." });
            queryClient.invalidateQueries({ queryKey: ["/api/my-listings"] });
            setLocation("/my-services");
        }
    });

    if (!user) return null;

    return (
        <Layout>
            <div className="max-w-3xl mx-auto pb-20">
                <div className="mb-4">
                    <Link href="/my-services" className="flex items-center gap-2 text-sm text-primary hover:underline group w-fit">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to my services
                    </Link>
                </div>
                <div className="flex flex-col gap-1 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">List a Service</h1>
                    <p className="text-muted-foreground text-sm">Offer a service to your community (requires approval)</p>
                </div>

                <Card className="border-border/50 shadow-sm bg-white">
                    <CardContent className="p-8">
                        <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-6">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title" className="font-bold">Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Home Plumbing Repair"
                                        {...form.register("title")}
                                        className="h-11"
                                    />
                                    {form.formState.errors.title && <p className="text-xs text-destructive font-medium">{form.formState.errors.title.message}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label className="font-bold">Category</Label>
                                    <Select onValueChange={(v) => form.setValue("category" as any, v)}>
                                        <Trigger className="h-11">
                                            <SelectValue placeholder="Select category" />
                                        </Trigger>
                                        <SelectContent>
                                            <SelectItem value="Home Maintenance">Home Maintenance</SelectItem>
                                            <SelectItem value="Tutoring">Tutoring</SelectItem>
                                            <SelectItem value="Personal Care">Personal Care</SelectItem>
                                            <SelectItem value="Pet Services">Pet Services</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="price" className="font-bold">Price (₹)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            {...form.register("price", { valueAsNumber: true })}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="duration" className="font-bold">Duration</Label>
                                        <Input
                                            id="duration"
                                            placeholder="e.g. 1 hr, 2-3 hrs"
                                            className="h-11"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="font-bold text-sm">Availability Basis</Label>
                                    <Select
                                        defaultValue="FOREVER"
                                        onValueChange={(v) => form.setValue("availabilityBasis" as any, v)}
                                    >
                                        <SelectTrigger className="h-11 border-primary/20 focus:ring-primary/20">
                                            <SelectValue placeholder="Select availability" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FOREVER">Forever (Always Available)</SelectItem>
                                            <SelectItem value="TIMELINE">Timeline (Specific Dates)</SelectItem>
                                            <SelectItem value="STOCK">Stock (Limited Quantity)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {form.watch("availabilityBasis" as any) === "TIMELINE" && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="grid gap-2">
                                            <Label htmlFor="startDate" className="font-bold text-sm">Start Date</Label>
                                            <Input
                                                id="startDate"
                                                type="date"
                                                {...form.register("startDate")}
                                                className="h-11 border-primary/20 focus:ring-primary/20"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="endDate" className="font-bold text-sm">End Date</Label>
                                            <Input
                                                id="endDate"
                                                type="date"
                                                {...form.register("endDate")}
                                                className="h-11 border-primary/20 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                )}

                                {form.watch("availabilityBasis" as any) === "STOCK" && (
                                    <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Label htmlFor="stockQuantity" className="font-bold text-sm">Stock Quantity</Label>
                                        <Input
                                            id="stockQuantity"
                                            type="number"
                                            {...form.register("stockQuantity", { valueAsNumber: true })}
                                            className="h-11 border-primary/20 focus:ring-primary/20"
                                            placeholder="e.g. 10"
                                        />
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label className="font-bold">Mode</Label>
                                    <Select defaultValue="On-site">
                                        <Trigger className="h-11">
                                            <SelectValue placeholder="Select mode" />
                                        </Trigger>
                                        <SelectContent>
                                            <SelectItem value="On-site">On-site</SelectItem>
                                            <SelectItem value="Remote">Remote</SelectItem>
                                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2 pt-2">
                                    <Label htmlFor="description" className="font-bold">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe what you offer..."
                                        {...form.register("description")}
                                        className="min-h-[120px] resize-none"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-md font-bold shadow-md bg-primary hover:bg-primary/90 disabled:opacity-70 disabled:bg-primary"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit for approval"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}

// Helper components for Select
function Trigger({ children, className }: any) {
    return (
        <SelectTrigger className={className}>
            {children}
        </SelectTrigger>
    );
}
