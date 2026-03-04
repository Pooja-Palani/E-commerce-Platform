import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, MapPin, Tag, Loader2, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useListings } from "@/hooks/use-listings";
import { useAdminSettings } from "@/hooks/use-admin";
import { useAuthStore } from "@/store/use-auth";

export default function ProductsMarketplace() {
    const { data: listings, isLoading: loadingListings } = useListings();
    const { data: settings, isLoading: loadingSettings } = useAdminSettings();
    const user = useAuthStore(s => s.user!);

    const isLoading = loadingListings || loadingSettings;

    const products = listings?.filter(l => {
        if (l.listingType !== "PRODUCT" || l.status !== "ACTIVE") return false;
        if (!settings?.enableGlobalMarketplace && l.communityId !== user.communityId) return false;
        return true;
    }) || [];

    return (
        <Layout>
            <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight">Products Marketplace</h1>
                        <p className="text-muted-foreground">Quality items from neighbors you can trust</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Search products..." className="pl-10 h-11 border-border/50" />
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <Card key={product.id} className="border-border/50 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all group">
                                <div className="h-48 bg-muted/30 flex items-center justify-center relative">
                                    <ShoppingBag className="w-16 h-16 text-primary/20 group-hover:scale-110 transition-transform" />
                                    <div className="absolute top-3 right-3">
                                        <Badge className="bg-primary text-white border-none shadow-sm capitalize">
                                            {product.condition || "New"}
                                        </Badge>
                                    </div>
                                </div>
                                <CardContent className="p-5">
                                    <div className="flex flex-col gap-1 mb-3">
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                            {product.category || "General"}
                                        </span>
                                        <h3 className="text-md font-bold truncate">{product.title}</h3>
                                    </div>

                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
                                        <MapPin className="w-3 h-3" />
                                        <span className="truncate">{product.communityNameSnapshot}</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                                        <span className="text-xl font-bold text-foreground">₹{product.price}</span>
                                        <Button size="sm" variant="outline" className="font-bold text-xs h-9 bg-primary/5 hover:bg-primary hover:text-white transition-all border-primary/10">
                                            <ShoppingCart className="w-3.5 h-3.5 mr-2" />
                                            Add
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="p-6 rounded-full bg-muted/50 text-muted-foreground mb-6">
                            <ShoppingBag className="w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No products found</h3>
                        <p className="text-muted-foreground max-w-sm">
                            We couldn't find any products in your community yet. Be the first to list something!
                        </p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
