import { Layout } from "@/components/layout";
import { useListings } from "@/hooks/use-listings";
import { useAuthStore } from "@/store/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Eye, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ManagerProducts() {
    const { data: listings, isLoading } = useListings();
    const currentUser = useAuthStore(s => s.user!);

    if (isLoading) return <Layout><LoadingSpinner /></Layout>;

    const communityProducts = listings?.filter(l => l.communityId === currentUser.communityId && l.listingType === 'PRODUCT') || [];

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Community Products</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Review product listings from members of your community.</p>
                </div>

                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-4 border-b border-border/50 bg-slate-50/50 rounded-t-xl">
                        <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                            <Package className="w-5 h-5 text-indigo-600" /> Active Products ({communityProducts.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {communityProducts.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-slate-500 font-medium">No product listings found in your community.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                {communityProducts.map(product => (
                                    <Card key={product.id} className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
                                        <CardContent className="p-5">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{product.title}</h3>
                                                <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">
                                                    {product.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{product.description}</p>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                                                <div className="font-bold text-emerald-600 border border-emerald-100 bg-emerald-50/50 px-2.5 py-1 rounded-md">
                                                    ₹{(product.price / 100).toLocaleString()}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Eye className="w-4 h-4 text-slate-400" />
                                                    <Star className="w-4 h-4 text-slate-400" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
