import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Wrench, MapPin, Star, Loader2, ShoppingCart, Sparkles, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useListings } from "@/hooks/use-listings";
import { useAdminSettings } from "@/hooks/use-admin";
import { useAuthStore } from "@/store/use-auth";
import { useCartStore } from "@/store/use-cart";
import { useToast } from "@/hooks/use-toast";
import { ReportListingDialog } from "@/components/report-listing-dialog";
import { useMemo, useState } from "react";

function tomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
}

export default function ServicesMarketplace() {
    const { data: listings, isLoading: loadingListings } = useListings();
    const { data: settings, isLoading: loadingSettings } = useAdminSettings();
    const user = useAuthStore(s => s.user!);
    const addToCart = useCartStore((s) => s.addItem);
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [query, setQuery] = useState("");

    const isLoading = loadingListings || loadingSettings;

    const services = useMemo(() => {
        const allServices = listings?.filter(l =>
            l.listingType === "SERVICE" && l.status === "ACTIVE"
        ) || [];

        if (!query.trim()) {
            return allServices;
        }

        const search = query.toLowerCase();
        return allServices.filter((service) =>
            [service.title, service.description, service.category, service.communityNameSnapshot]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(search))
        );
    }, [listings, query]);

    const handleAddToCart = (e: React.MouseEvent, service: (typeof services)[0]) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({
            type: "service",
            listingId: service.id,
            title: service.title,
            sellerId: service.sellerId,
            sellerName: service.sellerNameSnapshot,
            price: service.price,
            quantity: 1,
            bookingDate: tomorrow(),
        });
        toast({ title: "Added to cart", description: "Go to Cart to select date/time and checkout." });
        setLocation("/cart");
    };

    return (
        <Layout>
            <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
                <section className="relative overflow-hidden rounded-[2.5rem] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_45%,#22c55e_100%)] p-8 text-white shadow-[0_30px_80px_-30px_rgba(29,78,216,0.5)] md:p-10">
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-white/10 to-transparent" />
                    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl space-y-4">
                            <div className="retail-chip border-white/20 bg-white/10 text-white">
                                <Sparkles className="h-3.5 w-3.5" />
                                Trusted experts around you
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Services Marketplace</h1>
                                <p className="max-w-xl text-base text-white/85 md:text-lg">
                                    Book reliable pros from {settings?.platformName || "your community network"} for home, lifestyle, and daily needs.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Badge className="rounded-full border-none bg-white/15 px-4 py-2 text-white hover:bg-white/15">
                                    <ShieldCheck className="mr-2 h-4 w-4" /> Verified community sellers
                                </Badge>
                                <Badge className="rounded-full border-none bg-white/15 px-4 py-2 text-white hover:bg-white/15">
                                    <Wrench className="mr-2 h-4 w-4" /> Fast booking flow
                                </Badge>
                            </div>
                        </div>
                        <div className="retail-surface w-full max-w-md rounded-[2rem] p-4 text-slate-800">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Booking snapshot</p>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl bg-emerald-50 p-4">
                                    <p className="text-2xl font-extrabold">{services.length}</p>
                                    <p className="text-xs font-semibold text-muted-foreground">Available services</p>
                                </div>
                                <div className="rounded-2xl bg-blue-50 p-4">
                                    <p className="text-2xl font-extrabold">4.8★</p>
                                    <p className="text-xs font-semibold text-muted-foreground">Local satisfaction</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Browse popular services</h2>
                        <p className="text-muted-foreground">Search by category, skill, or community.</p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services..." className="h-12 rounded-2xl border-white/70 bg-white pl-10 shadow-sm" />
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                    </div>
                ) : services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service) => (
                            <Card key={service.id} className="overflow-hidden rounded-[2rem] border-white/70 bg-white/95 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.26)] transition-all group hover:-translate-y-1.5 hover:shadow-[0_32px_70px_-34px_rgba(29,78,216,0.35)]">
                                <Link href={`/listings/${service.id}`} className="block">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="cursor-pointer">
                                                <div className="relative flex h-52 items-center justify-center overflow-hidden bg-[linear-gradient(135deg,rgba(29,78,216,0.10),rgba(34,197,94,0.10),rgba(255,255,255,1))]">
                                                    {service.imageUrl ? (
                                                        <img src={service.imageUrl} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    ) : (
                                                        <Wrench className="w-16 h-16 text-primary/20 group-hover:scale-110 transition-transform" />
                                                    )}
                                                    <div className="absolute top-3 left-3">
                                                        <Badge className="bg-white/90 backdrop-blur-sm text-primary border-primary/20">
                                                            {service.category || "Service"}
                                                        </Badge>
                                                    </div>
                                                    <div className="absolute top-3 right-3">
                                                        <Badge className="border-none bg-slate-950/75 text-white shadow-sm">Verified</Badge>
                                                    </div>
                                                </div>
                                                <CardContent className="p-6">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="text-lg font-bold line-clamp-2 pr-2">{service.title}</h3>
                                                        <div className="flex items-center gap-1 text-amber-500 font-bold text-sm shrink-0">
                                                            <Star className="w-4 h-4 fill-amber-500" />
                                                            4.8
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4">
                                                        {service.description}
                                                    </p>

                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                        {service.communityNameSnapshot}
                                                    </div>
                                                </CardContent>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Click to view details</TooltipContent>
                                    </Tooltip>
                                </Link>
                                <div className="px-6 pb-6 pt-0 -mt-2">
                                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Starts from</span>
                                                <span className="text-xl font-bold text-primary">₹{service.price}</span>
                                            </div>
                                            {service.sellerId !== user.id && (
                                                <ReportListingDialog
                                                    listingId={service.id}
                                                    listingTitle={service.title}
                                                    trigger={<Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-destructive">Report</Button>}
                                                />
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            className="gap-2 rounded-xl font-bold shadow-lg shadow-primary/20"
                                            onClick={(e) => handleAddToCart(e, service)}
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            Add to Cart
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="p-6 rounded-full bg-muted/50 text-muted-foreground mb-6">
                            <Search className="w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No services found</h3>
                        <p className="text-muted-foreground max-w-sm">
                            {query ? "Try another keyword or explore a different category." : "We couldn't find any services matching your community at the moment."}
                        </p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
