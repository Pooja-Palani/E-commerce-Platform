import { useEffect } from "react";
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
import { useLocation, useParams, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useUserCommunities } from "@/hooks/use-communities";
import { useUpdateUser } from "@/hooks/use-users";
import { Loader2, ArrowLeft, FileText } from "lucide-react";
import { ImagePicker } from "@/components/image-picker";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { useListing, useUpdateListing } from "@/hooks/use-listings";

export default function ListProduct() {
    const user = useAuthStore(s => s.user);
    const [, setLocation] = useLocation();
    const params = useParams<{ id?: string }>();
    const editingListingId = params?.id;
    const isEditing = !!editingListingId;
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data: userCommunities } = useUserCommunities(user?.id ?? "");
    const updateUser = useUpdateUser();
    const { data: existingListing, isLoading: loadingListing } = useListing(editingListingId || "");
    const updateListing = useUpdateListing();

    const communities = (userCommunities ?? [])
        .filter((m: { joinStatus: string }) => m.joinStatus === "ACTIVE")
        .map((m: { community: { id: string; name: string; parentId?: string | null } }) => m.community);

    const form = useForm({
        resolver: zodResolver(insertListingSchema.extend({
            listingType: z.literal("PRODUCT"),
            communityId: z.string().min(1, "Community is required"),
            listToEntireCommunity: z.boolean().optional(),
            availabilityBasis: z.enum(["FOREVER", "TIMELINE", "STOCK"]).optional(),
            startDate: z.any().optional(),
            endDate: z.any().optional(),
            stockQuantity: z.number().min(0).optional().nullable(),
            buyNowEnabled: z.boolean().optional(),
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
            listingType: "PRODUCT",
            communityId: user?.communityId || "",
            listToEntireCommunity: false,
            sellerId: user?.id ?? "",
            availabilityBasis: "FOREVER",
            startDate: "",
            endDate: "",
            stockQuantity: null as number | null,
            buyNowEnabled: true,
            customCategory: "",
            imageUrl: null as string | null,
        }
    });

    const selectedCommunity = communities.find((c: any) => c.id === form.watch("communityId"));
    const isSubCommunity = selectedCommunity?.parentId;

    useEffect(() => {
        const current = form.getValues("communityId");
        if (user?.communityId && !current) {
            form.setValue("communityId", user.communityId);
        } else if (!current && communities.length === 1) {
            form.setValue("communityId", communities[0].id);
        }
        if (user?.id) form.setValue("sellerId" as any, user.id);
    }, [user?.communityId, user?.id, communities, form]);

    useEffect(() => {
        if (isEditing && existingListing) {
            const toInputDate = (value: any) => {
                if (!value) return "";
                const d = typeof value === "string" ? new Date(value) : value;
                if (Number.isNaN(d.getTime())) return "";
                return d.toISOString().split("T")[0];
            };

            const knownCategories = ["Home & Kitchen", "Electronics", "Furniture", "Books", "Other"];
            let category: string | undefined = (existingListing as any).category || "";
            let customCategory = "";
            if (category && !knownCategories.includes(category)) {
                customCategory = category;
                category = "Other";
            }

            form.reset({
                title: existingListing.title || "",
                description: existingListing.description || "",
                price: existingListing.price ?? 0,
                listingType: "PRODUCT",
                communityId: existingListing.communityId,
                sellerId: existingListing.sellerId,
                availabilityBasis: existingListing.availabilityBasis ?? "FOREVER",
                startDate: toInputDate((existingListing as any).startDate),
                endDate: toInputDate((existingListing as any).endDate),
                stockQuantity: existingListing.stockQuantity ?? null,
                buyNowEnabled: existingListing.buyNowEnabled,
                customCategory,
                imageUrl: existingListing.imageUrl ?? null,
                category: category as any,
            } as any);
        }
    }, [isEditing, existingListing, form]);

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(api.listings.create.path, {
                method: api.listings.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.message || "Failed to create listing");
            }
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Listing submitted", description: "Your listing will go live after your community manager approves it." });
            queryClient.invalidateQueries({ queryKey: ["/api/my-listings"] });
            setLocation("/my-products");
        },
        onError: (err: Error) => {
            toast({ title: "Could not post product", description: err.message, variant: "destructive" });
        },
    });

    const handleSubmit = (data: any) => {
        const payload: any = { ...data, sellerId: user!.id };
        const sel = communities.find((c: any) => c.id === data.communityId);
        if (data.listToEntireCommunity && sel?.parentId) {
            payload.communityId = sel.parentId;
        }
        delete payload.listToEntireCommunity;
        if (!payload.buyNowEnabled) {
            payload.price = 0;
        }
        if (payload.category === "Other" && payload.customCategory) {
            payload.category = payload.customCategory.trim();
        }
        delete payload.customCategory;
        if (!payload.imageUrl) delete payload.imageUrl;

        if (isEditing && existingListing) {
            updateListing.mutate(
                {
                    id: existingListing.id,
                    data: { ...payload, version: existingListing.version },
                },
                {
                    onSuccess: () => {
                        toast({ title: "Product updated", description: "Your changes have been saved." });
                        queryClient.invalidateQueries({ queryKey: ["/api/my-listings"] });
                        setLocation("/my-products");
                    },
                }
            );
        } else {
            createMutation.mutate(payload);
        }
    };

    const isSubmitting = isEditing ? updateListing.isPending : createMutation.isPending;

    if (!user) return null;

    if (isEditing && loadingListing) {
        return (
            <Layout>
                <div className="max-w-3xl mx-auto pb-20 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                </div>
            </Layout>
        );
    }

    if (!user.isSeller) {
        return (
            <Layout>
                <div className="max-w-3xl mx-auto pb-20">
                    <div className="mb-4">
                        <Link href="/my-products" className="flex items-center gap-2 text-sm text-primary hover:underline group w-fit">
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Back to my products
                        </Link>
                    </div>
                    <Card className="border-amber-200 bg-amber-50/50">
                        <CardContent className="p-8">
                            <h3 className="text-lg font-bold text-amber-800 mb-2">Enable seller mode</h3>
                            <p className="text-sm text-amber-700 mb-6">
                                You need to enable seller mode to list products. Use the View Mode toggle in the sidebar (switch to Seller), or click below.
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
                    <Link href="/my-products" className="flex items-center gap-2 text-sm text-primary hover:underline group w-fit">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to my products
                    </Link>
                </div>
                <div className="flex flex-col gap-1 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">{isEditing ? "Edit Product" : "List a Product"}</h1>
                    <p className="text-muted-foreground text-sm">
                        {isEditing ? "Update details for this product listing." : "Sell an item to your community members"}
                    </p>
                </div>

                <Card className="border-border/50 shadow-sm bg-white">
                    <CardContent className="p-8">
                        <form onSubmit={form.handleSubmit(
                            handleSubmit,
                            (errors) => {
                                const entries = Object.entries(errors);
                                const [firstKey, firstError] = entries[0] ?? [];
                                const fieldLabel = typeof firstKey === "string" ? firstKey : "Some fields";
                                const message = (firstError as any)?.message ?? "Some required fields are missing.";
                                toast({
                                    title: "Please fix the form",
                                    description: `${fieldLabel}: ${message}`,
                                    variant: "destructive",
                                });
                            }
                        )} className="space-y-6">
                            <div className="space-y-4">
                                <ImagePicker
                                    value={form.watch("imageUrl" as any)}
                                    onChange={(url) => form.setValue("imageUrl" as any, url)}
                                    label="Product Image"
                                />
                                <div className="grid gap-2">
                                    <Label htmlFor="title" className="font-bold">Product Name</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Ergonomic Office Chair"
                                        {...form.register("title")}
                                        className="h-11"
                                    />
                                    {form.formState.errors.title && <p className="text-xs text-destructive font-medium">{form.formState.errors.title.message}</p>}
                                </div>

                                {communities.length > 0 && (
                                    <div className="grid gap-2">
                                        <Label className="font-bold">Community</Label>
                                        <Select
                                            value={form.watch("communityId") || undefined}
                                            onValueChange={(v) => form.setValue("communityId", v)}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select community" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {communities.map((c: { id: string; name: string; parentId?: string | null }) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.parentId ? `${c.name} (sub-community)` : c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {isSubCommunity && (
                                            <div className="flex items-center justify-between rounded-xl border border-border/50 p-4 bg-muted/5 gap-4">
                                                <div>
                                                    <Label className="font-bold text-sm">List to</Label>
                                                    <p className="text-xs text-muted-foreground">Entire parent community or just this sub-community?</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Switch
                                                        checked={form.watch("listToEntireCommunity" as any)}
                                                        onCheckedChange={(v) => form.setValue("listToEntireCommunity" as any, v)}
                                                    />
                                                    <span className="text-xs font-medium">
                                                        {form.watch("listToEntireCommunity" as any) ? "Entire community" : "Sub only"}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        {form.formState.errors.communityId && (
                                            <p className="text-xs text-destructive font-medium">{form.formState.errors.communityId.message}</p>
                                        )}
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label className="font-bold">Category</Label>
                                    <Select
                                        value={(form.watch("category" as any) as string) || undefined}
                                        onValueChange={(v) => {
                                            form.setValue("category" as any, v);
                                            if (v !== "Other") form.setValue("customCategory", "");
                                        }}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Home & Kitchen">Home & Kitchen</SelectItem>
                                            <SelectItem value="Electronics">Electronics</SelectItem>
                                            <SelectItem value="Furniture">Furniture</SelectItem>
                                            <SelectItem value="Books">Books</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.watch("category" as any) === "Other" && (
                                        <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <Label htmlFor="customCategory" className="font-bold text-sm">Specify category</Label>
                                            <Input
                                                id="customCategory"
                                                placeholder="e.g. Sports Equipment, Art Supplies"
                                                {...form.register("customCategory")}
                                                className="h-11"
                                            />
                                            {form.formState.errors.customCategory && (
                                                <p className="text-xs text-destructive font-medium">{form.formState.errors.customCategory.message}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-border/50 p-4 bg-muted/5">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <div>
                                            <Label className="font-bold text-base">Request Quotation</Label>
                                            <p className="text-xs text-muted-foreground">Buyers will request a quote instead of buying at fixed price</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={!form.watch("buyNowEnabled")}
                                        onCheckedChange={(checked) => form.setValue("buyNowEnabled", !checked)}
                                    />
                                </div>

                                {form.watch("buyNowEnabled") && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="price" className="font-bold">Price (₹)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            {...form.register("price", { valueAsNumber: true })}
                                            className="h-11"
                                        />
                                    </div>
                                )}

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

                                <div className="grid gap-2 pt-2">
                                    <Label htmlFor="description" className="font-bold text-sm">Product Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Tell us about the item, its age, and why you are selling it..."
                                        {...form.register("description")}
                                        className="min-h-[120px] resize-none"
                                    />
                                    {form.formState.errors.description && (
                                        <p className="text-xs text-destructive font-medium">{form.formState.errors.description.message}</p>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-md font-bold shadow-md bg-primary hover:bg-primary/90 disabled:opacity-70 disabled:bg-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {isEditing ? "Saving..." : "Posting Listing..."}
                                    </>
                                ) : (
                                    isEditing ? "Save changes" : "Post Product Listing"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
