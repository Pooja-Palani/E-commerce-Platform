import { useParams, useLocation } from "wouter";
import { useAuthStore } from "@/store/use-auth";
import { useCartStore } from "@/store/use-cart";
import { useListing, useListings, useUpdateListingStock, useCreateProductInterest, useProductInterestCount } from "@/hooks/use-listings";
import { useCreateOrder } from "@/hooks/use-orders";
import { useCreateBooking, useListingSlots, useAvailableSlots, useReplaceListingSlots } from "@/hooks/use-bookings";
import { Layout } from "@/components/layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Building2, Globe, Tag, Calendar, Package,
    Infinity, ShoppingCart, Phone, Mail,
    MapPin, Truck, Store, CheckCircle2, Star, FileText, Copy, Clock, Plus, Trash2, Settings2, Bell, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ListingDetail() {
    const { id } = useParams();
    const [, setLocation] = useLocation();
    const { data: listing, isLoading } = useListing(id || "");
    const { data: allListings } = useListings();
    const createOrder = useCreateOrder();
    const createBooking = useCreateBooking();
    const addToCart = useCartStore((s) => s.addItem);
    const { toast } = useToast();

    const [logisticsPreference, setLogisticsPreference] = useState<"PICKUP" | "DELIVERY_SUPPORT">("PICKUP");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [bookingDate, setBookingDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null);
    const [manageSlotsOpen, setManageSlotsOpen] = useState(false);
    const [editSlots, setEditSlots] = useState<{ startTime: string; endTime: string }[]>([]);
    const [quantity, setQuantity] = useState(1);
    const [stockEdit, setStockEdit] = useState("");
    const [manageStockOpen, setManageStockOpen] = useState(false);
    const [notifyUsersOpen, setNotifyUsersOpen] = useState(false);

    const user = useAuthStore((s) => s.user);
    const viewMode = useAuthStore((s) => s.viewMode);
    const listingFromCache = id && allListings?.find((l) => l.id === id);
    const displayListing = listing ?? listingFromCache;

    const listingId = displayListing?.id ?? id ?? "";
    const isService = displayListing?.listingType === "SERVICE";
    const isOwner = displayListing?.sellerId === user?.id;
    const isSeller = isOwner && viewMode === "SELLER";

    const { data: listingSlots, refetch: refetchSlots } = useListingSlots(listingId);
    const hasSlots = (listingSlots?.length ?? 0) > 0;
    const { data: availableSlots, isLoading: loadingSlots } = useAvailableSlots(listingId, bookingDate);
    const replaceSlots = useReplaceListingSlots(listingId);
    const updateStock = useUpdateListingStock(listingId);
    const createInterest = useCreateProductInterest(listingId);
    const { data: interestData } = useProductInterestCount(listingId, isSeller);
    const interestCount = interestData?.count ?? 0;

    const isStockProduct = !isService && displayListing?.availabilityBasis === "STOCK" && displayListing?.buyNowEnabled;
    const currentStock = displayListing?.stockQuantity ?? 0;
    const isOutOfStock = isStockProduct && currentStock <= 0;

    if (isLoading && !listingFromCache) return <Layout><LoadingSpinner /></Layout>;
    if (!displayListing) return <Layout><div className="text-center py-24">Listing not found</div></Layout>;

    const handlePurchase = async () => {
        try {
            await createOrder.mutateAsync({
                listingId: displayListing.id,
                quantity: isStockProduct ? quantity : undefined,
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

    const handleBookService = async () => {
        try {
            await createBooking.mutateAsync({
                listingId: displayListing.id,
                bookingDate: bookingDate || new Date().toISOString().split("T")[0],
                slotStartTime: selectedSlot?.startTime,
                slotEndTime: selectedSlot?.endTime
            });
            setLocation("/activity");
        } catch (err) {
            toast({
                title: "Booking failed",
                description: (err as Error).message,
                variant: "destructive"
            });
        }
    };

    const openManageSlots = () => {
        setEditSlots(listingSlots?.length ? listingSlots.map((s) => ({ startTime: s.startTime, endTime: s.endTime })) : [{ startTime: "", endTime: "" }]);
        setManageSlotsOpen(true);
    };
    const addEditSlot = () => setEditSlots((s) => [...s, { startTime: "", endTime: "" }]);
    const removeEditSlot = (i: number) => setEditSlots((s) => s.filter((_, j) => j !== i));
    const updateEditSlot = (i: number, field: "startTime" | "endTime", value: string) =>
        setEditSlots((s) => s.map((slot, j) => (j === i ? { ...slot, [field]: value } : slot)));
    const saveSlots = async () => {
        const valid = editSlots.filter((s) => s.startTime.trim() && s.endTime.trim());
        await replaceSlots.mutateAsync(valid);
        refetchSlots();
        setManageSlotsOpen(false);
    };

    const handleAddServiceToCart = () => {
        if (!displayListing || !bookingDate || (hasSlots && !selectedSlot)) return;
        addToCart({
            type: "service",
            listingId: displayListing.id,
            title: displayListing.title,
            sellerId: displayListing.sellerId,
            sellerName: displayListing.sellerNameSnapshot,
            price: displayListing.price,
            quantity: 1,
            bookingDate: bookingDate || new Date().toISOString().split("T")[0],
            slotStartTime: selectedSlot?.startTime,
            slotEndTime: selectedSlot?.endTime,
        });
        toast({ title: "Added to cart", description: "Go to Cart to checkout." });
        setLocation("/cart");
    };

    const handleAddProductToCart = () => {
        if (!displayListing) return;
        const price = displayListing.buyNowEnabled ? displayListing.price : 0;
        addToCart({
            type: "product",
            listingId: displayListing.id,
            title: displayListing.title,
            sellerId: displayListing.sellerId,
            sellerName: displayListing.sellerNameSnapshot,
            price,
            quantity: isStockProduct ? Math.min(quantity, currentStock) : 1,
            logisticsPreference,
            deliveryAddress: logisticsPreference === "DELIVERY_SUPPORT" ? deliveryAddress : undefined,
        });
        toast({ title: "Added to cart", description: "Go to Cart to checkout." });
        setLocation("/cart");
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
                        <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary rounded-[2.5rem] flex items-center justify-center shadow-inner overflow-hidden">
                            {displayListing.imageUrl ? (
                                <img src={displayListing.imageUrl} alt={displayListing.title} className="w-full h-full object-cover" />
                            ) : (
                                <Tag size={120} className="text-primary/20" />
                            )}
                        </div>

                        <div className="flex gap-4">
                            {displayListing.visibility === 'GLOBAL' ? (
                                <Badge variant="secondary" className="px-4 py-1 rounded-full text-xs font-bold">
                                    <Globe className="w-3 h-3 mr-2" /> Global Listing
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="px-4 py-1 rounded-full text-xs font-bold">
                                    <Building2 className="w-3 h-3 mr-2" /> {displayListing.communityNameSnapshot}
                                </Badge>
                            )}
                            <Badge variant="outline" className="px-4 py-1 rounded-full text-xs font-bold border-primary/20 text-primary uppercase">
                                {displayListing.availabilityBasis}
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl font-extrabold tracking-tight">{displayListing.title}</h1>
                            <div className="flex flex-wrap items-center gap-4">
                                <p className="text-2xl font-bold text-primary">
                                    {displayListing.buyNowEnabled ? `₹${displayListing.price}` : "Price on request"}
                                </p>
                                {isService && displayListing.duration && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock size={18} />
                                        <span className="font-medium">{displayListing.duration}</span>
                                    </div>
                                )}
                                {isService && displayListing.mode && (
                                    <Badge variant="secondary" className="text-xs">
                                        {displayListing.mode}
                                    </Badge>
                                )}
                            </div>
                            <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {displayListing.description}
                            </div>
                        </div>

                        {/* Availability info */}
                        <Card className="rounded-3xl border-border/50 bg-muted/5">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                        {displayListing.availabilityBasis === 'FOREVER' && <Infinity />}
                                        {displayListing.availabilityBasis === 'TIMELINE' && <Calendar />}
                                        {displayListing.availabilityBasis === 'STOCK' && <Package />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Availability Status</h4>
                                        <p className="text-sm text-muted-foreground font-medium">
                                            {displayListing.availabilityBasis === 'FOREVER' && (isService ? "Available for booking." : "Always available for purchase.")}
                                            {displayListing.availabilityBasis === 'TIMELINE' && `Available from ${format(new Date(displayListing.startDate!), 'PPP')} to ${format(new Date(displayListing.endDate!), 'PPP')}`}
                                            {displayListing.availabilityBasis === 'STOCK' && `${displayListing.stockQuantity} items remaining in stock.`}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Service: Book date & slot (buyers) – in main content so always visible */}
                        {isService && !isOwner && (
                            <Card className="rounded-3xl border-primary/20 bg-primary/5 overflow-hidden">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        Book this service
                                    </CardTitle>
                                    <CardDescription>
                                        {hasSlots
                                            ? "Pick a date and time slot. Each slot can only be booked once."
                                            : "Pick your preferred date. The seller will be notified and can confirm."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="mainBookingDate" className="font-bold">Preferred date</Label>
                                        <Input
                                            id="mainBookingDate"
                                            type="date"
                                            className="rounded-xl h-12"
                                            value={bookingDate}
                                            onChange={(e) => {
                                                setBookingDate(e.target.value);
                                                setSelectedSlot(null);
                                            }}
                                            min={new Date().toISOString().split("T")[0]}
                                        />
                                    </div>
                                    {hasSlots && bookingDate && (
                                        <div className="space-y-2">
                                            <Label className="font-bold">Available time slots</Label>
                                            {loadingSlots ? (
                                                <p className="text-sm text-muted-foreground">Loading slots...</p>
                                            ) : availableSlots && availableSlots.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {availableSlots.map((slot: { id: string; startTime: string; endTime: string }) => (
                                                        <button
                                                            key={slot.id}
                                                            type="button"
                                                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                                                selectedSlot?.startTime === slot.startTime
                                                                    ? "border-primary bg-primary/10 text-primary font-medium"
                                                                    : "border-border/50 hover:border-primary/30"
                                                            }`}
                                                            onClick={() => setSelectedSlot({ startTime: slot.startTime, endTime: slot.endTime })}
                                                        >
                                                            <span className="font-medium">{slot.startTime} – {slot.endTime}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No slots free on this date. Try another.</p>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button
                                            className="flex-1 h-12 rounded-xl font-bold gap-2"
                                            onClick={handleBookService}
                                            disabled={
                                                createBooking.isPending ||
                                                !bookingDate ||
                                                (hasSlots && !selectedSlot)
                                            }
                                        >
                                            <Calendar size={18} />
                                            {createBooking.isPending ? "Booking..." : "Confirm booking"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-12 rounded-xl font-bold gap-2"
                                            onClick={() => handlePurchase()}
                                            disabled={createOrder.isPending}
                                        >
                                            <FileText size={18} />
                                            {createOrder.isPending ? "Sending..." : "Request quotation"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Action Panels */}
                    <div className="space-y-6">
                        {/* Seller: Manage Stock (for STOCK products) */}
                        {!isService && isSeller && displayListing?.availabilityBasis === "STOCK" && (
                            <Card className="rounded-[2.5rem] border-amber-200/50 bg-amber-50/30 overflow-hidden">
                                {isOutOfStock && interestCount > 0 && (
                                    <Alert className="m-4 mb-0 rounded-xl border-amber-300 bg-amber-100/50">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        <AlertTitle className="text-amber-800">Out of stock — users waiting</AlertTitle>
                                        <AlertDescription className="text-amber-700">
                                            {interestCount} {interestCount === 1 ? "user wants" : "users want"} this when it&apos;s back. Use &quot;Notify users&quot; to share the link when you restock.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Package size={20} />
                                                Manage Stock
                                            </CardTitle>
                                            <CardDescription>
                                                {interestCount > 0
                                                    ? `${interestCount} person${interestCount > 1 ? "s" : ""} want${interestCount === 1 ? "s" : ""} this when back in stock.`
                                                    : `Current stock: ${currentStock}. Add more when you have inventory.`}
                                            </CardDescription>
                                        </div>
                                        {!manageStockOpen && (
                                            <div className="flex gap-2 shrink-0">
                                                {isOutOfStock && interestCount > 0 && (
                                                    <Button variant="default" size="sm" onClick={() => setNotifyUsersOpen(true)} className="gap-1.5">
                                                        <Bell size={16} /> Notify users
                                                    </Button>
                                                )}
                                                <Button variant="outline" size="sm" onClick={() => { setStockEdit(String(currentStock)); setManageStockOpen(true); }}>
                                                    Update Stock
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                {manageStockOpen && (
                                    <CardContent className="pt-0 space-y-4">
                                        <div className="grid gap-2">
                                            <Label className="font-bold text-sm">Stock quantity</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={stockEdit}
                                                onChange={(e) => setStockEdit(e.target.value)}
                                                className="h-11 rounded-xl"
                                                placeholder="e.g. 10"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => { const v = parseInt(stockEdit, 10); if (!isNaN(v) && v >= 0) updateStock.mutate(v); setManageStockOpen(false); }} disabled={updateStock.isPending}>
                                                {updateStock.isPending ? "Saving..." : "Save"}
                                            </Button>
                                            <Button variant="ghost" onClick={() => setManageStockOpen(false)}>Cancel</Button>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        )}
                        {/* Seller: Manage Slots */}
                        {isService && isSeller && (
                            <Card className="rounded-[2.5rem] border-amber-200/50 bg-amber-50/30 overflow-hidden">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Settings2 size={20} />
                                                Manage Time Slots
                                            </CardTitle>
                                            <CardDescription>
                                                {hasSlots
                                                    ? `${listingSlots?.length} slot(s) defined. Buyers will see these when booking.`
                                                    : "Add time slots so buyers can choose when to book your service."}
                                            </CardDescription>
                                        </div>
                                        {!manageSlotsOpen && (
                                            <Button variant="outline" size="sm" onClick={openManageSlots} className="shrink-0">
                                                {hasSlots ? "Edit" : "Add Slots"}
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                {manageSlotsOpen && (
                                    <CardContent className="pt-0 space-y-4">
                                        <div className="grid gap-2">
                                            {editSlots.map((slot, i) => (
                                                <div key={i} className="flex gap-2 items-center">
                                                    <Input
                                                        placeholder="Start (e.g. 11:00)"
                                                        value={slot.startTime}
                                                        onChange={(e) => updateEditSlot(i, "startTime", e.target.value)}
                                                        className="h-11 flex-1 rounded-xl"
                                                    />
                                                    <span className="text-muted-foreground">–</span>
                                                    <Input
                                                        placeholder="End (e.g. 12:00)"
                                                        value={slot.endTime}
                                                        onChange={(e) => updateEditSlot(i, "endTime", e.target.value)}
                                                        className="h-11 flex-1 rounded-xl"
                                                    />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEditSlot(i)} className="shrink-0">
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" onClick={addEditSlot} className="w-fit gap-2">
                                                <Plus className="w-4 h-4" /> Add slot
                                            </Button>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={saveSlots} disabled={replaceSlots.isPending}>
                                                {replaceSlots.isPending ? "Saving..." : "Save Slots"}
                                            </Button>
                                            <Button variant="ghost" onClick={() => setManageSlotsOpen(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        )}
                        {/* Service: Book Now (only for buyers, not the owner) */}
                        {isService && !isOwner && (
                            <Card className="rounded-[2.5rem] shadow-2xl shadow-primary/5 border-primary/10 overflow-hidden">
                                <CardHeader className="bg-primary/5 pb-6">
                                    <CardTitle className="text-xl">Book Now</CardTitle>
                                    <CardDescription>
                                        {hasSlots
                                            ? "Select your preferred date and time slot."
                                            : displayListing.duration
                                                ? `Select your preferred date for this ${displayListing.duration} service.`
                                                : "Select your preferred date to book this service."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="space-y-3">
                                        <Label htmlFor="bookingDate" className="font-bold">Preferred Date</Label>
                                        <Input
                                            id="bookingDate"
                                            type="date"
                                            className="rounded-xl h-12"
                                            value={bookingDate}
                                            onChange={(e) => {
                                                setBookingDate(e.target.value);
                                                setSelectedSlot(null);
                                            }}
                                            min={new Date().toISOString().split("T")[0]}
                                        />
                                    </div>
                                    {hasSlots && bookingDate && (
                                        <div className="space-y-3">
                                            <Label className="font-bold">Available Slots</Label>
                                            {loadingSlots ? (
                                                <p className="text-sm text-muted-foreground">Loading slots...</p>
                                            ) : availableSlots && availableSlots.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-2">
                                                    {availableSlots.map((slot: { id: string; startTime: string; endTime: string }) => (
                                                        <div
                                                            key={slot.id}
                                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                                selectedSlot?.startTime === slot.startTime
                                                                    ? "border-primary bg-primary/5"
                                                                    : "border-border/50 hover:border-primary/30"
                                                            }`}
                                                            onClick={() => setSelectedSlot({ startTime: slot.startTime, endTime: slot.endTime })}
                                                        >
                                                            <span className="font-medium">{slot.startTime} – {slot.endTime}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No slots available on this date.</p>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-3">
                                        <Button
                                            className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 gap-2"
                                            onClick={handleBookService}
                                            disabled={
                                                createBooking.isPending ||
                                                !bookingDate ||
                                                (hasSlots && !selectedSlot)
                                            }
                                        >
                                            <Calendar size={20} />
                                            {createBooking.isPending ? "Booking..." : "Confirm Booking"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full h-14 rounded-2xl font-bold text-lg gap-2"
                                            onClick={() => handlePurchase()}
                                            disabled={createOrder.isPending}
                                        >
                                            <FileText size={20} />
                                            {createOrder.isPending ? "Sending..." : "Request Quotation"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full h-14 rounded-2xl font-bold text-lg gap-2"
                                            onClick={handleAddServiceToCart}
                                            disabled={!bookingDate || (hasSlots && !selectedSlot)}
                                        >
                                            <ShoppingCart size={20} />
                                            Add to Cart
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {/* Product: Request Quotation (only for buyers, not the owner) */}
                        {!isService && !isOwner && !displayListing.buyNowEnabled && (
                            <Card className="rounded-[2.5rem] shadow-2xl shadow-primary/5 border-primary/10 overflow-hidden">
                                <CardHeader className="bg-primary/5 pb-6">
                                    <CardTitle className="text-xl">Request Quotation</CardTitle>
                                    <CardDescription>Get a custom price quote from the seller. The order will be sent directly to them.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-3">
                                    <Button
                                        className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 gap-2"
                                        onClick={handlePurchase}
                                        disabled={createOrder.isPending}
                                    >
                                        <FileText size={20} />
                                        {createOrder.isPending ? "Sending..." : "Request Quotation"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 rounded-2xl font-bold gap-2"
                                        onClick={handleAddProductToCart}
                                    >
                                        <ShoppingCart size={18} />
                                        Add to Cart
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                        {/* Product: Buy Now (only for buyers, not the owner) */}
                        {!isService && !isOwner && displayListing.buyNowEnabled && (
                            <Card className="rounded-[2.5rem] shadow-2xl shadow-primary/5 border-primary/10 overflow-hidden">
                                <CardHeader className="bg-primary/5 pb-6">
                                    <CardTitle className="text-xl">Buy Now</CardTitle>
                                    <CardDescription>
                                        {isOutOfStock
                                            ? "This product is out of stock. Notify the seller to add more."
                                            : isStockProduct
                                                ? `${currentStock} left in stock. Select quantity and logistics.`
                                                : "Select your logistics preference to complete the order."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    {isOutOfStock ? (
                                        <Button
                                            className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 gap-2"
                                            onClick={() => createInterest.mutate()}
                                            disabled={createInterest.isPending}
                                        >
                                            {createInterest.isPending ? "Sending..." : "Notify seller I want this"}
                                        </Button>
                                    ) : (
                                        <>
                                    {isStockProduct && (
                                        <div className="space-y-3">
                                            <Label className="text-base font-bold">Quantity</Label>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center border-2 border-border/50 rounded-xl overflow-hidden bg-muted/10 h-12">
                                                    <Button type="button" variant="ghost" size="icon" className="h-full w-12" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                                                        –
                                                    </Button>
                                                    <span className="w-12 text-center font-bold">{quantity}</span>
                                                    <Button type="button" variant="ghost" size="icon" className="h-full w-12" onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}>
                                                        +
                                                    </Button>
                                                </div>
                                                <span className="text-sm text-muted-foreground">of {currentStock} available</span>
                                            </div>
                                        </div>
                                    )}
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

                                    <div className="flex flex-col gap-3">
                                        <Button
                                            className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 gap-2"
                                            onClick={handlePurchase}
                                            disabled={createOrder.isPending || (logisticsPreference === 'DELIVERY_SUPPORT' && !deliveryAddress)}
                                        >
                                            <ShoppingCart size={20} />
                                            {createOrder.isPending ? "Processing..." : "Confirm & Pay Now"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 rounded-2xl font-bold gap-2"
                                            onClick={handleAddProductToCart}
                                            disabled={logisticsPreference === 'DELIVERY_SUPPORT' && !deliveryAddress}
                                        >
                                            <ShoppingCart size={18} />
                                            Add to Cart
                                        </Button>
                                    </div>
                                        </>
                                    )}
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
                                        {displayListing.sellerNameSnapshot.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">{displayListing.sellerNameSnapshot}</h4>
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Star size={14} fill="currentColor" />
                                            <span className="text-xs font-bold">4.9 Dealer</span>
                                        </div>
                                    </div>
                                </div>

                                {displayListing.contactSellerEnabled && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h5 className="font-bold text-sm">Contact Details</h5>
                                            <Badge variant="outline" className="text-[10px] font-bold text-green-600 bg-green-50 border-green-200 uppercase">Verified Neighbor</Badge>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/50">
                                                <Phone size={16} className="text-muted-foreground" />
                                                <span className="text-sm font-medium">{displayListing.sellerContactSnapshot || "Contact via App"}</span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="w-full rounded-xl font-bold h-12 gap-2"
                                                onClick={async () => {
                                                    const contact = displayListing.sellerContactSnapshot || "";
                                                    if (contact) {
                                                        await navigator.clipboard.writeText(contact);
                                                        toast({ title: "Copied", description: "Phone number copied to clipboard" });
                                                    }
                                                }}
                                            >
                                                <Copy size={16} />
                                                Copy Phone Number
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

            <Dialog open={notifyUsersOpen} onOpenChange={setNotifyUsersOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Notify interested users</DialogTitle>
                        <DialogDescription>
                            {interestCount} {interestCount === 1 ? "person wants" : "people want"} this when it&apos;s back in stock. Copy the link below and share via WhatsApp or SMS to notify them.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2">
                        <Input
                            readOnly
                            value={typeof window !== "undefined" ? `${window.location.origin}/listings/${displayListing?.id}` : ""}
                            className="font-mono text-sm"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={async () => {
                                const link = typeof window !== "undefined" ? `${window.location.origin}/listings/${displayListing?.id}` : "";
                                if (link) {
                                    await navigator.clipboard.writeText(link);
                                    toast({ title: "Link copied", description: "Share this with interested buyers." });
                                }
                            }}
                        >
                            <Copy size={16} />
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setNotifyUsersOpen(false)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
