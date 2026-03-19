import { Layout } from "@/components/layout";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag, Loader2, FileText } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useSellerOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { format } from "date-fns";

function useCommunityManagers(communityIds: string[]) {
    const results = useQueries({
        queries: communityIds.map((cid) => ({
            queryKey: ["/api/communities", cid, "manager"],
            queryFn: async () => {
                const res = await fetch(`/api/communities/${cid}/manager`, { credentials: "include" });
                if (!res.ok) return null;
                return res.json() as Promise<{ id: string; fullName: string }>;
            },
            enabled: !!cid,
        })),
    });
    const map: Record<string, string> = {};
    communityIds.forEach((cid, i) => {
        const data = results[i]?.data;
        if (data?.fullName) map[cid] = data.fullName;
    });
    return map;
}

function ProductCard({
    product,
    getQuoted,
    statusLabel,
    statusBadgeClass,
    approvalRecipient,
}: {
    product: any;
    getQuoted: (id: string) => number | null;
    statusLabel: string;
    statusBadgeClass: string;
    approvalRecipient?: string;
}) {
    const priceDisplay = product.price > 0
        ? `₹${product.price}`
        : (() => {
            const quoted = getQuoted(product.id);
            return quoted != null ? `₹${quoted} (quoted)` : "Price on request";
        })();
    return (
        <Card className="border-border/50 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                    <Badge variant="secondary" className={`capitalize px-3 py-1 text-[10px] font-bold ${statusBadgeClass}`}>
                        {statusLabel}
                    </Badge>
                </div>
                <h3 className="text-lg font-bold mb-1 truncate">{product.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4">
                    {product.description}
                </p>
                {approvalRecipient && (
                    <p className="text-xs text-amber-600 font-medium mb-2">Awaiting approval from: {approvalRecipient}</p>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Price</span>
                        <span className="text-lg font-bold text-primary">{priceDisplay}</span>
                    </div>
                    <Link href={`/list-product/${product.id}`}>
                        <Button variant="outline" size="sm" className="font-bold text-xs h-8">Edit Listing</Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

export default function MyProducts() {
    const { data: listings, isLoading } = useQuery<any[]>({
        queryKey: ["/api/my-listings"],
    });
    const { data: sellerOrders = [], isLoading: loadingOrders } = useSellerOrders();

    const products = listings?.filter(l => l.listingType === "PRODUCT") || [];
    const liveProducts = products.filter((p: any) => p.status === "ACTIVE");
    const notLiveProducts = products.filter((p: any) => p.status === "INACTIVE" || p.status === "REMOVED");

    const getListingTitle = (listingId: string) =>
        (listings ?? []).find((l: any) => l.id === listingId)?.title || "Listing";
    const getQuotedPriceForListing = (listingId: string) => {
        const quotedOrders = sellerOrders.filter(
            (o: any) => o.listingId === listingId && o.priceSnapshot > 0
        );
        if (quotedOrders.length === 0) return null;
        return Math.min(...quotedOrders.map((o: any) => o.priceSnapshot));
    };
    const updateOrderStatus = useUpdateOrderStatus();

    const ORDER_STATUS_OPTIONS = [
        { value: "PENDING", label: "Pending" },
        { value: "QUOTATION_PROVIDED", label: "Quotation Provided" },
        { value: "CONFIRMED", label: "Confirmed" },
        { value: "SHIPPED", label: "Shipped" },
        { value: "DELIVERED", label: "Delivered" },
        { value: "CANCELLED", label: "Cancelled" },
    ];

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

                {sellerOrders.length > 0 && (
                    <Card className="border-border/50 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="bg-muted/5 border-b border-border/40 py-4">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                <CardTitle className="text-lg font-bold">Orders for your products</CardTitle>
                            </div>
                            <p className="text-sm text-muted-foreground">Incoming orders and quotation requests</p>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-bold text-xs uppercase tracking-wider pl-6">Product</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-wider">Date</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-wider">Price</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-wider text-right pr-6">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sellerOrders.map((order: any) => (
                                        <TableRow key={order.id} className="hover:bg-muted/5 transition-colors">
                                            <TableCell className="font-medium pl-6">
                                                {getListingTitle(order.listingId)}
                                                {order.quantity > 1 && <span className="text-muted-foreground font-normal ml-1">(×{order.quantity})</span>}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{format(new Date(order.createdAt), "MMM d, yyyy")}</TableCell>
                                            <TableCell className="font-bold">
                                                {order.priceSnapshot === 0 ? "Quotation requested" : `₹${order.priceSnapshot}`}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Select
                                                    value={order.status}
                                                    onValueChange={(status) => updateOrderStatus.mutate({ orderId: order.id, status })}
                                                    disabled={updateOrderStatus.isPending}
                                                >
                                                    <SelectTrigger className="w-[140px] h-8 ml-auto border-0 shadow-none bg-transparent focus:ring-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ORDER_STATUS_OPTIONS.map((opt) => (
                                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                    </div>
                ) : products.length > 0 ? (
                    <div className="space-y-10">
                        {liveProducts.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold text-slate-800 mb-4">Live listings</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {liveProducts.map((product: any) => (
                                        <ProductCard key={product.id} product={product} getQuoted={getQuotedPriceForListing} statusLabel="Live" statusBadgeClass="bg-green-500/10 text-green-600 border-green-500/20" />
                                    ))}
                                </div>
                            </section>
                        )}
                        {/* Listing approval removed — there are no waiting-for-approval listings */}
                        {notLiveProducts.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold text-slate-800 mb-4">Not live</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {notLiveProducts.map((product: any) => (
                                        <ProductCard key={product.id} product={product} getQuoted={getQuotedPriceForListing} statusLabel={product.status === "REMOVED" ? "Removed" : "Inactive"} statusBadgeClass="bg-slate-500/10 text-slate-600 border-slate-500/20" />
                                    ))}
                                </div>
                            </section>
                        )}
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
