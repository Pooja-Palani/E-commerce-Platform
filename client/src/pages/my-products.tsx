import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function MyProducts() {
    const { data: listings, isLoading } = useQuery<any[]>({
        queryKey: ["/api/my-listings"],
    });

    const products = listings?.filter(l => l.listingType === "PRODUCT") || [];

    return (
        <Layout>
            <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight">My Products</h1>
                        <p className="text-muted-foreground text-sm">Products you're selling — manage stock and orders</p>
                    </div>
                    <Link href="/list-product">
                        <Button className="bg-primary hover:bg-primary/90 font-bold px-6 shadow-sm">
                            <Plus className="w-4 h-4 mr-2" />
                            List Product
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <Card key={product.id} className="border-border/50 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
                                            <ShoppingBag className="w-5 h-5" />
                                        </div>
                                        <Badge variant="secondary" className="capitalize px-3 py-1 text-[10px] font-bold bg-green-500/10 text-green-600 border-green-500/20">
                                            {product.status.toLowerCase()}
                                        </Badge>
                                    </div>
                                    <h3 className="text-lg font-bold mb-1 truncate">{product.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4">
                                        {product.description}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Price</span>
                                            <span className="text-lg font-bold text-primary">₹{product.price}</span>
                                        </div>
                                        <Button variant="outline" size="sm" className="font-bold text-xs h-8">Edit Listing</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="border-dashed border-2 border-border/50 rounded-2xl bg-muted/5 flex flex-col items-center justify-center p-20 text-center">
                        <div className="p-4 rounded-full bg-amber-500/5 text-amber-600 mb-6">
                            <ShoppingBag className="w-10 h-10" />
                        </div>
                        <p className="text-lg font-bold text-muted-foreground mb-1">You haven't listed any products yet.</p>
                        <p className="text-sm text-muted-foreground max-w-sm mb-8">
                            Sell items to your community members and declutter your space.
                        </p>
                        <Link href="/list-product">
                            <Button size="lg" className="bg-primary hover:bg-primary/90 font-bold px-8 shadow-sm h-12">
                                <Plus className="w-5 h-5 mr-2" />
                                List Product
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </Layout>
    );
}
