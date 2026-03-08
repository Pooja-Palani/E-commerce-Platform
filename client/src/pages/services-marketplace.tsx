import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Wrench, MapPin, Star, Loader2, ShoppingCart } from "lucide-react";
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

    const isLoading = loadingListings || loadingSettings;

    const services = listings?.filter(l => {
        if (l.listingType !== "SERVICE" || l.status !== "ACTIVE") return false;
        if (l.communityId !== user.communityId) return false;
        return true;
    }) || [];

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
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight">Services Marketplace</h1>
                        <p className="text-muted-foreground">Find skilled professionals in your community</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Search services..." className="pl-10 h-11 border-border/50" />
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                    </div>
                ) : services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service) => (
                            <Card key={service.id} className="border-border/50 shadow-sm overflow-hidden bg-white hover:shadow-lg transition-all group">
                                <Link href={`/listings/${service.id}`} className="block">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="cursor-pointer">
                                                <div className="h-48 bg-muted/30 flex items-center justify-center relative overflow-hidden">
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
                                            className="gap-2 font-bold rounded-lg"
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
                            We couldn't find any services matching your community at the moment.
                        </p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
