import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Wrench, MapPin, Star, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useListings } from "@/hooks/use-listings";
import { useAdminSettings } from "@/hooks/use-admin";
import { useAuthStore } from "@/store/use-auth";

export default function ServicesMarketplace() {
    const { data: listings, isLoading: loadingListings } = useListings();
    const { data: settings, isLoading: loadingSettings } = useAdminSettings();
    const user = useAuthStore(s => s.user!);

    const isLoading = loadingListings || loadingSettings;

    const services = listings?.filter(l => {
        if (l.listingType !== "SERVICE" || l.status !== "ACTIVE") return false;
        if (l.communityId !== user.communityId) return false; // Only show listings from user's current community
        return true;
    }) || [];

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service) => (
                            <Link key={service.id} href={`/listings/${service.id}`}>
                                <Card className="border-border/50 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all group cursor-pointer">
                                <div className="h-40 bg-muted/30 flex items-center justify-center relative">
                                    <Wrench className="w-12 h-12 text-primary/20 group-hover:scale-110 transition-transform" />
                                    <div className="absolute top-3 left-3">
                                        <Badge className="bg-white/90 backdrop-blur-sm text-primary border-primary/20 hover:bg-white/90">
                                            {service.category || "Service"}
                                        </Badge>
                                    </div>
                                </div>
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold truncate pr-2">{service.title}</h3>
                                        <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                                            <Star className="w-4 h-4 fill-amber-500" />
                                            4.8
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4">
                                        {service.description}
                                    </p>

                                    <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground font-medium">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {service.communityNameSnapshot}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Starts from</span>
                                            <span className="text-lg font-bold text-primary">₹{service.price}</span>
                                        </div>
                                        <span className="inline-flex items-center justify-center rounded-md font-bold text-xs h-9 px-4 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
                                            Book Now
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                            </Link>
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
