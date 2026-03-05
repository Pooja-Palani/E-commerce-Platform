import { useParams, useLocation } from "wouter";
import { useListing } from "@/hooks/use-listings";
import { useCreateOrder } from "@/hooks/use-orders";
import { Layout } from "@/components/layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Building2, Globe, Tag, Calendar, Package,
    Infinity, ShoppingCart, MessageSquare, Phone, Mail,
    MapPin, Truck, Store, CheckCircle2, Star
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ListingDetail() {
    const { id } = useParams();
    const [, setLocation] = useLocation();
    const { data: listing, isLoading } = useListing(id || "");
    const createOrder = useCreateOrder();
    const { toast } = useToast();

    const [logisticsPreference, setLogisticsPreference] = useState<"PICKUP" | "DELIVERY_SUPPORT">("PICKUP");
    const [deliveryAddress, setDeliveryAddress] = useState("");

    if (isLoading) return <Layout><LoadingSpinner /></Layout>;
    if (!listing) return <Layout><div className="text-center py-24">Listing not found</div></Layout>;

    const handlePurchase = async () => {
        try {
            await createOrder.mutateAsync({
                listingId: listing.id,
                logisticsPreference,
                deliveryAddress: logisticsPreference === "DELIVERY_SUPPORT" ? deliveryAddress : undefined
            });
            setLocation("/activity");
        } catch (err) {
            toast({
                title: "Purchase failed",
                description: (err as Error).message,
                variant: "destructive"
            });
        }
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-8 pb-24">
                <Button
                    variant="ghost"
                    className="gap-2 -ml-4 hover:bg-transparent"
                    onClick={() => window.history.back()}
                >
                    <ArrowLeft size={18} />
                    Back to Marketplace
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left Column: Image/Visual placeholder */}
                    <div className="space-y-6">
                        <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary rounded-[2.5rem] flex items-center justify-center shadow-inner">
                            <Tag size={120} className="text-primary/20" />
                        </div>

                        <div className="flex gap-4">
                            {listing.visibility === 'GLOBAL' ? (
                                <Badge variant="secondary" className="px-4 py-1 rounded-full text-xs font-bold">
                                    <Globe className="w-3 h-3 mr-2" /> Global Listing
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="px-4 py-1 rounded-full text-xs font-bold">
                                    <Building2 className="w-3 h-3 mr-2" /> {listing.communityNameSnapshot}
                                </Badge>
                            )}
                            <Badge variant="outline" className="px-4 py-1 rounded-full text-xs font-bold border-primary/20 text-primary uppercase">
                                {listing.availabilityBasis}
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl font-extrabold tracking-tight">{listing.title}</h1>
                            <p className="text-2xl font-bold text-primary">₹{listing.price}</p>
                            <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {listing.description}
                            </div>
                        </div>

                        {/* Availability info */}
                        <Card className="rounded-3xl border-border/50 bg-muted/5">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                        {listing.availabilityBasis === 'FOREVER' && <Infinity />}
                                        {listing.availabilityBasis === 'TIMELINE' && <Calendar />}
                                        {listing.availabilityBasis === 'STOCK' && <Package />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Availability Status</h4>
                                        <p className="text-sm text-muted-foreground font-medium">
                                            {listing.availabilityBasis === 'FOREVER' && "Always available for purchase."}
                                            {listing.availabilityBasis === 'TIMELINE' && `Available from ${format(new Date(listing.startDate!), 'PPP')} to ${format(new Date(listing.endDate!), 'PPP')}`}
                                            {listing.availabilityBasis === 'STOCK' && `${listing.stockQuantity} items remaining in stock.`}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Acton Panels */}
                    <div className="space-y-6">
                        {/* Purchase Section */}
                        {listing.buyNowEnabled && (
                            <Card className="rounded-[2.5rem] shadow-2xl shadow-primary/5 border-primary/10 overflow-hidden">
                                <CardHeader className="bg-primary/5 pb-6">
                                    <CardTitle className="text-xl">Buy Now</CardTitle>
                                    <CardDescription>Select your logistics preference to complete the order.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="space-y-4">
                                        <Label className="text-base font-bold">How would you like to receive it?</Label>
                                        <RadioGroup
                                            value={logisticsPreference}
                                            onValueChange={(val: any) => setLogisticsPreference(val)}
                                            className="grid grid-cols-1 gap-4"
                                        >
                                            <div className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${logisticsPreference === 'PICKUP' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'}`} onClick={() => setLogisticsPreference('PICKUP')}>
                                                <RadioGroupItem value="PICKUP" id="pickup" className="mt-1" />
                                                <div className="flex-1">
                                                    <Label htmlFor="pickup" className="font-bold flex items-center gap-2 cursor-pointer">
                                                        <Store size={16} /> Self Pickup
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground mt-1">Coordinate a meeting spot with the neighbor.</p>
                                                </div>
                                            </div>

                                            <div className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${logisticsPreference === 'DELIVERY_SUPPORT' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'}`} onClick={() => setLogisticsPreference('DELIVERY_SUPPORT')}>
                                                <RadioGroupItem value="DELIVERY_SUPPORT" id="delivery" className="mt-1" />
                                                <div className="flex-1">
                                                    <Label htmlFor="delivery" className="font-bold flex items-center gap-2 cursor-pointer">
                                                        <Truck size={16} /> Delivery Support
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground mt-1">Request delivery to your doorstep.</p>
                                                </div>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {logisticsPreference === 'DELIVERY_SUPPORT' && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <Label htmlFor="address" className="font-bold">Delivery Address</Label>
                                            <Input
                                                id="address"
                                                placeholder="Flat No, Building Name..."
                                                className="rounded-xl h-12"
                                                value={deliveryAddress}
                                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <Button
                                        className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 gap-2"
                                        onClick={handlePurchase}
                                        disabled={createOrder.isPending || (logisticsPreference === 'DELIVERY_SUPPORT' && !deliveryAddress)}
                                    >
                                        <ShoppingCart size={20} />
                                        {createOrder.isPending ? "Processing..." : "Confirm & Pay Now"}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Seller Info Section */}
                        <Card className="rounded-[2.5rem] border-border/50">
                            <CardHeader>
                                <CardTitle className="text-xl">Seller Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                        {listing.sellerNameSnapshot.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">{listing.sellerNameSnapshot}</h4>
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Star size={14} fill="currentColor" />
                                            <span className="text-xs font-bold">4.9 Dealer</span>
                                        </div>
                                    </div>
                                </div>

                                {listing.contactSellerEnabled && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h5 className="font-bold text-sm">Contact Details</h5>
                                            <Badge variant="outline" className="text-[10px] font-bold text-green-600 bg-green-50 border-green-200 uppercase">Verified Neighbor</Badge>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/50">
                                                <Phone size={16} className="text-muted-foreground" />
                                                <span className="text-sm font-medium">{listing.sellerContactSnapshot || "Contact via App"}</span>
                                            </div>
                                            <Button variant="outline" className="w-full rounded-xl font-bold h-12 gap-2">
                                                <MessageSquare size={16} />
                                                Send Message
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="px-6 flex items-center gap-2 text-muted-foreground/60">
                            <CheckCircle2 size={14} />
                            <p className="text-[10px] font-medium uppercase tracking-widest">Secure transaction guaranteed by platform.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
