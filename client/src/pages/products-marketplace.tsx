import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, ShoppingBag, MapPin, Loader2, ShoppingCart } from "lucide-react";
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

export default function ProductsMarketplace() {
    const { data: listings, isLoading: loadingListings } = useListings();
    const { data: settings, isLoading: loadingSettings } = useAdminSettings();
    const user = useAuthStore(s => s.user!);
    const addToCart = useCartStore((s) => s.addItem);
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const isLoading = loadingListings || loadingSettings;

    const products = listings?.filter(l => {
        if (l.listingType !== "PRODUCT" || l.status !== "ACTIVE") return false;
        if (l.communityId !== user.communityId) return false;
        return true;
    }) || [];

    const handleAddToCart = (e: React.MouseEvent, product: (typeof products)[0]) => {
        e.preventDefault();
        e.stopPropagation();
        const isStockProduct = product.availabilityBasis === "STOCK" && product.buyNowEnabled;
        const stock = product.stockQuantity ?? 0;
        const price = product.buyNowEnabled ? product.price : 0;
        addToCart({
            type: "product",
            listingId: product.id,
            title: product.title,
            sellerId: product.sellerId,
            sellerName: product.sellerNameSnapshot,
            price,
            quantity: isStockProduct ? Math.min(1, stock) : 1,
            logisticsPreference: "PICKUP",
        });
        toast({ title: "Added to cart", description: "Go to Cart to checkout." });
        setLocation("/cart");
    };

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product) => (
                            <Card key={product.id} className="border-border/50 shadow-sm overflow-hidden bg-white hover:shadow-lg transition-all group">
                                <Link href={`/listings/${product.id}`} className="block">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="cursor-pointer">
                                                <div className="h-56 bg-muted/30 flex items-center justify-center relative overflow-hidden">
                                                    {product.imageUrl ? (
                                                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    ) : (
                                                        <ShoppingBag className="w-20 h-20 text-primary/20 group-hover:scale-110 transition-transform" />
                                                    )}
                                                    <div className="absolute top-3 right-3">
                                                        <Badge className="bg-primary text-white border-none shadow-sm capitalize">
                                                            {product.condition || "New"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col gap-2 mb-4">
                                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                                            {product.category || "General"}
                                                        </span>
                                                        <h3 className="text-lg font-bold line-clamp-2">{product.title}</h3>
                                                    </div>

                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="truncate">{product.communityNameSnapshot}</span>
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
                                            <span className="text-xl font-bold text-foreground">
                                                {product.buyNowEnabled ? `₹${product.price}` : "Price on request"}
                                            </span>
                                            {product.sellerId !== user.id && (
                                                <ReportListingDialog
                                                    listingId={product.id}
                                                    listingTitle={product.title}
                                                    trigger={<Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-destructive">Report</Button>}
                                                />
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            className="gap-2 font-bold rounded-lg"
                                            onClick={(e) => handleAddToCart(e, product)}
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