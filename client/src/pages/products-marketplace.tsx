import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, ShoppingBag, MapPin, Loader2, ShoppingCart, Sparkles, Truck } from "lucide-react";
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

export default function ProductsMarketplace() {
    const { data: listings, isLoading: loadingListings } = useListings();
    const { data: settings, isLoading: loadingSettings } = useAdminSettings();
    const user = useAuthStore(s => s.user!);
    const addToCart = useCartStore((s) => s.addItem);
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [query, setQuery] = useState("");

    const isLoading = loadingListings || loadingSettings;

    const products = useMemo(() => {
        const allProducts = listings?.filter(l =>
            l.listingType === "PRODUCT" && l.status === "ACTIVE"
        ) || [];

        if (!query.trim()) {
            return allProducts;
        }

        const search = query.toLowerCase();
        return allProducts.filter((product) =>
            [product.title, product.description, product.category, product.communityNameSnapshot]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(search))
        );
    }, [listings, query]);

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
                <section className="retail-gradient relative overflow-hidden rounded-[2.5rem] p-8 text-white shadow-[0_30px_80px_-32px_rgba(79,70,229,0.45)] md:p-10">
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-white/20 to-transparent" />
                    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl space-y-4">
                            <div className="retail-chip inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 text-white shadow-sm backdrop-blur-sm text-sm">
                                <Sparkles className="h-3.5 w-3.5 text-white" />
                                <span className="font-semibold uppercase tracking-wider text-white">Curated Neighborhood Finds</span>
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl text-white">Products Marketplace</h1>
                                <p className="max-w-xl text-base text-white/95 md:text-lg">
                                    Shop trending products from trusted sellers on {settings?.platformName || "your marketplace"}.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Badge className="rounded-full border-none bg-white/15 px-4 py-2 text-white hover:bg-white/15">
                                    <Truck className="mr-2 h-4 w-4" /> Quick local pickup
                                </Badge>
                                <Badge className="rounded-full border-none bg-white/15 px-4 py-2 text-white hover:bg-white/15">
                                    <ShoppingCart className="mr-2 h-4 w-4" /> Easy checkout
                                </Badge>
                            </div>
                        </div>
                        <div className="retail-surface w-full max-w-md rounded-[2rem] p-4 text-slate-800">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Today’s assortment</p>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl bg-indigo-50 p-4">
                                    <p className="text-2xl font-extrabold">{products.length}</p>
                                    <p className="text-xs font-semibold text-muted-foreground">Available products</p>
                                </div>
                                <div className="rounded-2xl bg-blue-50 p-4">
                                    <p className="text-2xl font-extrabold">24h</p>
                                    <p className="text-xs font-semibold text-muted-foreground">Fast community response</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Browse top deals</h2>
                        <p className="text-muted-foreground">Compare categories, sellers, and prices in one place.</p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="h-12 rounded-2xl border-white/70 bg-white pl-10 shadow-sm" />
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product) => (
                            <Card key={product.id} className="overflow-hidden rounded-[2rem] border-white/70 bg-white/95 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.26)] transition-all group hover:-translate-y-1.5 hover:shadow-[0_32px_70px_-34px_rgba(79,70,229,0.28)]">
                                <Link href={`/listings/${product.id}`} className="block">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="cursor-pointer">
                                                <div className="retail-gradient-soft relative flex h-60 items-center justify-center overflow-hidden">
                                                    {product.imageUrl ? (
                                                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    ) : (
                                                        <ShoppingBag className="w-20 h-20 text-primary/20 group-hover:scale-110 transition-transform" />
                                                    )}
                                                    <div className="absolute top-3 right-3">
                                                        <Badge className="border-none bg-slate-950/75 text-white shadow-sm capitalize">
                                                            {product.condition || "New"}
                                                        </Badge>
                                                    </div>
                                                    <div className="absolute left-4 top-4">
                                                        <Badge className="border-none bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary shadow-sm">
                                                            {product.buyNowEnabled ? "Hot deal" : "Quote"}
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
                                            className="gap-2 rounded-xl font-bold shadow-lg shadow-primary/20"
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
                            {query ? "Try another keyword or browse other categories." : "We couldn't find any products in your community yet. Be the first to list something!"}
                        </p>
                    </div>
                )}
            </div>
        </Layout>
    );
}