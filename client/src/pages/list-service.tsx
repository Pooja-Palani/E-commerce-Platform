import { useEffect, useState } from "react";
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
import { api, buildUrl } from "@shared/routes";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useUpdateUser } from "@/hooks/use-users";
import { Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { ImagePicker } from "@/components/image-picker";
import { z } from "zod";

export default function ListService() {
    const user = useAuthStore(s => s.user);
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const updateUser = useUpdateUser();

    const form = useForm({
        resolver: zodResolver(insertListingSchema.extend({
            listingType: z.literal("SERVICE"),
            communityId: z.string().min(1, "Community is required"),
            availabilityBasis: z.enum(["FOREVER", "TIMELINE", "STOCK"]).optional(),
            startDate: z.any().optional(),
            endDate: z.any().optional(),
            stockQuantity: z.number().min(0).optional().nullable(),
            customCategory: z.string().optional(),
            imageUrl: z.string().nullable().optional(),
        }).refine((data) => data.category !== "Other" || (data.customCategory && data.customCategory.trim().length > 0), {
            message: "Please specify the category",
            path: ["customCategory"],
        })),
        defaultValues: {
            title: "",
            description: "",
            price: 0,
            listingType: "SERVICE",
            communityId: user?.communityId || "",
            sellerId: user?.id ?? "",
            availabilityBasis: "FOREVER",
            startDate: "",
            endDate: "",
            stockQuantity: null as number | null,
            customCategory: "",
            duration: "",
            mode: "On-site",
            imageUrl: null as string | null,
        }
    });

    const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>([]);

    useEffect(() => {
        if (user?.id) form.setValue("sellerId" as any, user.id);
    }, [user?.id, form]);

    const addSlot = () => setSlots((s) => [...s, { startTime: "", endTime: "" }]);
    const removeSlot = (i: number) => setSlots((s) => s.filter((_, j) => j !== i));
    const updateSlot = (i: number, field: "startTime" | "endTime", value: string) =>
        setSlots((s) => s.map((slot, j) => (j === i ? { ...slot, [field]: value } : slot)));

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(api.listings.create.path, {
                method: api.listings.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to create listing");
            const listing = await res.json();
            const validSlots = slots.filter((s) => s.startTime.trim() && s.endTime.trim());
            for (const slot of validSlots) {
                const slotRes = await fetch(buildUrl(api.listingSlots.create.path, { id: listing.id }), {
                    method: api.listingSlots.create.method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ startTime: slot.startTime, endTime: slot.endTime }),
                    credentials: "include",
                });
                if (!slotRes.ok) throw new Error("Failed to add slot");
            }
            return listing;
        },
        onSuccess: () => {
            toast({ title: "Service listed successfully", description: "Your service is now available to the community." });
            queryClient.invalidateQueries({ queryKey: ["/api/my-listings"] });
            setLocation("/my-services");
        }
    });

    if (!user) return null;

    if (!user.isSeller) {
        return (
            <Layout>
                <div className="max-w-3xl mx-auto pb-20">
                    <div className="mb-4">
                        <Link href="/my-services" className="flex items-center gap-2 text-sm text-primary hover:underline group w-fit">
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Back to my services
                        </Link>
                    </div>
                    <Card className="border-amber-200 bg-amber-50/50">
                        <CardContent className="p-8">
                            <h3 className="text-lg font-bold text-amber-800 mb-2">Enable seller mode</h3>
                            <p className="text-sm text-amber-700 mb-6">
                                You need to enable seller mode to list services. Use the View Mode toggle in the sidebar (switch to Seller), or click below.
                            </p>
                            <Button
                                onClick={() => updateUser.mutate(
                                    { id: user.id, data: { isSeller: true, version: user.version } },
                                    { onSuccess: (updated) => useAuthStore.getState().setUser(updated) }
                                )}
                                disabled={updateUser.isPending}
                            >
                                {updateUser.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Enable seller mode
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        );
    }

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
                        <form onSubmit={form.handleSubmit((data) => {
                            const payload = { ...data, sellerId: user!.id };
                            if (payload.category === "Other" && payload.customCategory) {
                                payload.category = (payload as any).customCategory.trim();
                            }
                            delete (payload as any).customCategory;
                            if (!(payload as any).imageUrl) delete (payload as any).imageUrl;
                            mutation.mutate(payload);
                        })} className="space-y-6">
                            <div className="space-y-4">
                                <ImagePicker
                                    value={form.watch("imageUrl" as any)}
                                    onChange={(url) => form.setValue("imageUrl" as any, url)}
                                    label="Service Image"
                                />
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
                                    <Select
                                        value={(form.watch("category" as any) as string) || undefined}
                                        onValueChange={(v) => {
                                            form.setValue("category" as any, v);
                                            if (v !== "Other") form.setValue("customCategory", "");
                                        }}
                                    >
                                        <Trigger className="h-11">
                                            <SelectValue placeholder="Select category" />
                                        </Trigger>
                                        <SelectContent>
                                            <SelectItem value="Home Maintenance">Home Maintenance</SelectItem>
                                            <SelectItem value="Tutoring">Tutoring</SelectItem>
                                            <SelectItem value="Personal Care">Personal Care</SelectItem>
                                            <SelectItem value="Pet Services">Pet Services</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.watch("category" as any) === "Other" && (
                                        <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <Label htmlFor="customCategory" className="font-bold text-sm">Specify category</Label>
                                            <Input
                                                id="customCategory"
                                                placeholder="e.g. Landscaping, Event Planning"
                                                {...form.register("customCategory")}
                                                className="h-11"
                                            />
                                            {form.formState.errors.customCategory && (
                                                <p className="text-xs text-destructive font-medium">{form.formState.errors.customCategory.message}</p>
                                            )}
                                        </div>
                                    )}
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
                                            {...form.register("duration" as any)}
                                            className="h-11"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="font-bold text-sm">Availability Basis</Label>
                                    <Select
                                        value={form.watch("availabilityBasis" as any) ?? "FOREVER"}
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

                                {form.watch("availabilityBasis" as any) === "FOREVER" && (
                                    <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Label className="font-bold text-sm">Available Time Slots</Label>
                                        <p className="text-xs text-muted-foreground">Define when you're available. Buyers will book one of these slots.</p>
                                        {slots.map((slot, i) => (
                                            <div key={i} className="flex gap-2 items-center">
                                                <Input
                                                    placeholder="Start (e.g. 11:00)"
                                                    value={slot.startTime}
                                                    onChange={(e) => updateSlot(i, "startTime", e.target.value)}
                                                    className="h-11 flex-1"
                                                />
                                                <span className="text-muted-foreground">–</span>
                                                <Input
                                                    placeholder="End (e.g. 12:00)"
                                                    value={slot.endTime}
                                                    onChange={(e) => updateSlot(i, "endTime", e.target.value)}
                                                    className="h-11 flex-1"
                                                />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(i)} className="shrink-0">
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" onClick={addSlot} className="w-fit gap-2">
                                            <Plus className="w-4 h-4" /> Add slot
                                        </Button>
                                    </div>
                                )}

                                {form.watch("availabilityBasis" as any) === "TIMELINE" && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-2 gap-4">
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
                                        <div className="grid gap-2">
                                            <Label className="font-bold text-sm">Available Time Slots</Label>
                                            <p className="text-xs text-muted-foreground">Define when you're available within this date range. Buyers will book one of these slots.</p>
                                            {slots.map((slot, i) => (
                                                <div key={i} className="flex gap-2 items-center">
                                                    <Input
                                                        placeholder="Start (e.g. 11:00)"
                                                        value={slot.startTime}
                                                        onChange={(e) => updateSlot(i, "startTime", e.target.value)}
                                                        className="h-11 flex-1"
                                                    />
                                                    <span className="text-muted-foreground">–</span>
                                                    <Input
                                                        placeholder="End (e.g. 12:00)"
                                                        value={slot.endTime}
                                                        onChange={(e) => updateSlot(i, "endTime", e.target.value)}
                                                        className="h-11 flex-1"
                                                    />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(i)} className="shrink-0">
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" onClick={addSlot} className="w-fit gap-2">
                                                <Plus className="w-4 h-4" /> Add slot
                                            </Button>
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
                                    <Select
                                        value={form.watch("mode" as any) ?? "On-site"}
                                        onValueChange={(v) => form.setValue("mode" as any, v)}
                                    >
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
