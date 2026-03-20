import { useMemo } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ShoppingBag, Trash2, ArrowRight, Minus, Plus, Smartphone, CreditCard, Banknote, Wrench, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCartStore, type CartItem } from "@/store/use-cart";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCreateOrder } from "@/hooks/use-orders";
import { useCreateBooking } from "@/hooks/use-bookings";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { api } from "@shared/routes";

type PaymentMethod = "UPI" | "CARD" | "CASH";

export default function Cart() {
    const { items, removeItem, updateQuantity, clearCart } = useCartStore();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
    const [couponCode, setCouponCode] = useState("");
    const [couponPreview, setCouponPreview] = useState<null | { discountApplied: number; discountedSubtotal: number; tax: number; total: number }>(null);
    const [couponPreviewPending, setCouponPreviewPending] = useState(false);
    const [couponCheckoutPending, setCouponCheckoutPending] = useState(false);

    const couponInput = couponCode.trim();
    const hasCouponInput = couponInput.length > 0;
    const hasCouponApplied = !!couponPreview;

    const parseJsonResponse = async <T,>(res: Response): Promise<T> => {
        const text = await res.text();
        const trimmed = text.trim();
        if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
            throw new Error("Server returned non-JSON response");
        }
        return JSON.parse(text) as T;
    };

    const sellerIds = useMemo(() => [...new Set(items.map((i) => i.sellerId))], [items]);
    const { data: paymentMethodsMap } = useQuery({
        queryKey: ["seller-payment-methods", sellerIds],
        queryFn: async () => {
            const map: Record<string, { acceptsUpi: boolean; acceptsCard: boolean; acceptsCash: boolean }> = {};
            for (const id of sellerIds) {
                const res = await fetch(`/api/sellers/${id}/payment-methods`, { credentials: "include" });
                if (res.ok) {
                    map[id] = await res.json();
                } else {
                    map[id] = { acceptsUpi: true, acceptsCard: true, acceptsCash: true };
                }
            }
            return map;
        },
        enabled: sellerIds.length > 0,
    });

    const availableMethods = useMemo(() => {
        const upi = sellerIds.every((id) => paymentMethodsMap?.[id]?.acceptsUpi ?? true);
        const card = sellerIds.every((id) => paymentMethodsMap?.[id]?.acceptsCard ?? true);
        const cash = sellerIds.every((id) => paymentMethodsMap?.[id]?.acceptsCash ?? true);
        const methods: PaymentMethod[] = [];
        if (upi) methods.push("UPI");
        if (card) methods.push("CARD");
        if (cash) methods.push("CASH");
        return methods.length > 0 ? methods : (["UPI", "CARD", "CASH"] as PaymentMethod[]);
    }, [sellerIds, paymentMethodsMap]);

    const subtotal = items.reduce((acc, item) => acc + (item.price * (item.quantity ?? 1)), 0);
    const effectiveSubtotal = couponPreview?.discountedSubtotal ?? subtotal;
    const tax = effectiveSubtotal * 0.18;
    const total = effectiveSubtotal + tax;

    const createOrder = useCreateOrder();
    const createBooking = useCreateBooking();
    const isPending = createOrder.isPending || createBooking.isPending || couponCheckoutPending || couponPreviewPending;

    const handleCheckout = async () => {
        // Backend still requires payment method for priced (non-quotation) items even if coupon makes the final total 0.
        if (subtotal > 0 && !selectedPayment) {
            toast({ title: "Select a payment method", variant: "destructive" });
            return;
        }
        try {
            if (hasCouponInput) {
                if (!hasCouponApplied) {
                    toast({ title: "Apply coupon first", description: "Click Apply to validate the code before checkout.", variant: "destructive" });
                    return;
                }
                setCouponCheckoutPending(true);
                const res = await fetch("/api/checkout/cart-with-coupon", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        couponCode: couponInput,
                        paymentMethod: selectedPayment,
                        items: items.map((it) => ({
                            listingId: it.listingId,
                            type: it.type === "service" ? "service" : "product",
                            quantity: it.type === "product" ? it.quantity ?? 1 : undefined,
                            bookingDate: it.type === "service" ? it.bookingDate : undefined,
                            slotStartTime: it.type === "service" ? it.slotStartTime : undefined,
                            slotEndTime: it.type === "service" ? it.slotEndTime : undefined,
                            logisticsPreference: it.type === "product" ? it.logisticsPreference : undefined,
                            deliveryAddress: it.type === "product" ? it.deliveryAddress : undefined,
                        })),
                    }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err?.message || "Checkout failed");
                }

                clearCart();
                toast({ title: "Order placed", description: "Coupon applied successfully. Seller will confirm." });
                // Coupon checkout creates bookings/orders directly (no useCreateBooking/useCreateOrder hooks),
                // so we must force My Activity to refresh.
                queryClient.invalidateQueries({ queryKey: [api.bookings.list.path] });
                queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
                setLocation("/activity");
            } else {
                for (const item of items) {
                    if (item.type === "service") {
                        await createBooking.mutateAsync({
                            listingId: item.listingId,
                            bookingDate: item.bookingDate || new Date().toISOString().split("T")[0],
                            slotStartTime: item.slotStartTime,
                            slotEndTime: item.slotEndTime,
                        });
                    } else {
                        await createOrder.mutateAsync({
                            listingId: item.listingId,
                            quantity: item.quantity ?? 1,
                            logisticsPreference: item.logisticsPreference ?? "PICKUP",
                            deliveryAddress: item.deliveryAddress,
                        });
                    }
                }
                clearCart();
                toast({ title: "Order placed", description: `Payment via ${selectedPayment}. Seller will confirm.` });
                setLocation("/activity");
            }
        } catch (err) {
            if (hasCouponInput) setCouponCheckoutPending(false);
            toast({ title: "Checkout failed", description: (err as Error).message, variant: "destructive" });
        }
        setCouponCheckoutPending(false);
    };

    const handleCheckoutItem = async (item: CartItem) => {
        if (hasCouponInput) {
            toast({ title: "Coupon redemption is only for full checkout", description: "Use the Confirm Order button to apply the coupon once.", variant: "destructive" });
            return;
        }
        const itemTotal = item.price * (item.quantity ?? 1);
        if (itemTotal > 0 && !selectedPayment) {
            toast({ title: "Select a payment method in Order Summary first", variant: "destructive" });
            return;
        }
        try {
            if (item.type === "service") {
                await createBooking.mutateAsync({
                    listingId: item.listingId,
                    bookingDate: item.bookingDate || new Date().toISOString().split("T")[0],
                    slotStartTime: item.slotStartTime,
                    slotEndTime: item.slotEndTime,
                });
            } else {
                await createOrder.mutateAsync({
                    listingId: item.listingId,
                    quantity: item.quantity ?? 1,
                    logisticsPreference: item.logisticsPreference ?? "PICKUP",
                    deliveryAddress: item.deliveryAddress,
                });
            }
            removeItem(item.id);
            toast({ title: "Order placed", description: `${item.title} — Seller will confirm.` });
            setLocation("/activity");
        } catch (err) {
            toast({ title: "Checkout failed", description: (err as Error).message, variant: "destructive" });
        }
    };

    return (
        <Layout>
            <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-20">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight font-serif">Your Cart</h1>
                    <p className="text-muted-foreground">Review and checkout your community finds</p>
                </div>

                {items.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {items.map((item) => (
                                <Card key={item.id} className="border-border/50 shadow-sm bg-white overflow-hidden">
                                    <CardContent className="p-4 flex items-center gap-6">
                                        <div className="w-24 h-24 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                                            {item.type === "service" ? (
                                                <Wrench className="w-8 h-8 text-primary/30" />
                                            ) : (
                                                <ShoppingBag className="w-8 h-8 text-primary/30" />
                                            )}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                        {item.type === "service" ? "Service" : "Product"}
                                                    </span>
                                                    <h3 className="font-bold text-lg truncate">{item.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{item.sellerName}</p>
                                                    {item.type === "service" && item.bookingDate && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {item.bookingDate}
                                                            {item.slotStartTime && ` • ${item.slotStartTime}–${item.slotEndTime}`}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap items-end justify-between gap-3 mt-4">
                                                <div className="flex items-center gap-4">
                                                    {item.type === "product" && (item.quantity ?? 1) > 0 ? (
                                                        <div className="flex items-center border border-border/50 rounded-lg overflow-hidden bg-muted/10 h-9">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-full w-8 rounded-none px-0"
                                                                onClick={() => updateQuantity(item.id, (item.quantity ?? 1) - 1)}
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </Button>
                                                            <span className="w-10 text-center text-sm font-bold">{item.quantity ?? 1}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-full w-8 rounded-none px-0"
                                                                onClick={() => updateQuantity(item.id, (item.quantity ?? 1) + 1)}
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">×1</span>
                                                    )}
                                                    <span className="font-bold text-lg text-primary">
                                                        {item.price > 0 ? `₹${(item.price * (item.quantity ?? 1)).toLocaleString()}` : "Quotation requested"}
                                                    </span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="gap-2 font-bold shrink-0"
                                                    onClick={() => handleCheckoutItem(item)}
                                                    disabled={isPending || hasCouponInput}
                                                >
                                                    <Zap className="w-4 h-4" />
                                                    Checkout
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="lg:col-span-1 space-y-6">
                            <Card className="border-primary/10 shadow-lg bg-white sticky top-24 overflow-hidden">
                                <div className="h-1.5 bg-primary" />
                                <CardHeader>
                                    <CardTitle className="text-lg">Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span className="font-medium">₹{effectiveSubtotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">GST (18%)</span>
                                            <span className="font-medium">₹{tax.toFixed(0)}</span>
                                        </div>
                                        {couponPreview && couponPreview.discountApplied > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Coupon Discount</span>
                                                <span className="font-medium text-emerald-700">-₹{couponPreview.discountApplied.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <Separator className="my-2" />
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="font-bold">Total Amount</span>
                                            <span className="text-2xl font-black text-primary">₹{Math.round(total).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {subtotal > 0 && (
                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold">Payment Method</Label>
                                        <div className="grid gap-2">
                                            {availableMethods.includes("UPI") && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPayment("UPI")}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                                        selectedPayment === "UPI" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                                                    }`}
                                                >
                                                    <Smartphone className="w-5 h-5 text-primary" />
                                                    <span className="font-medium">UPI</span>
                                                </button>
                                            )}
                                            {availableMethods.includes("CARD") && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPayment("CARD")}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                                        selectedPayment === "CARD" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                                                    }`}
                                                >
                                                    <CreditCard className="w-5 h-5 text-primary" />
                                                    <span className="font-medium">Card</span>
                                                </button>
                                            )}
                                            {availableMethods.includes("CASH") && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPayment("CASH")}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                                        selectedPayment === "CASH" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                                                    }`}
                                                >
                                                    <Banknote className="w-5 h-5 text-primary" />
                                                    <span className="font-medium">Physical Cash</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold">Coupon Code (optional)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={couponCode}
                                                onChange={(e) => {
                                                    setCouponCode(e.target.value);
                                                    setCouponPreview(null);
                                                }}
                                                placeholder="Enter code"
                                                className="h-11 rounded-xl flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-11 px-4 rounded-xl font-bold"
                                                disabled={isPending || couponPreviewPending || !couponInput}
                                                onClick={async () => {
                                                    const code = couponInput;
                                                    if (!code) return;
                                                    setCouponPreviewPending(true);
                                                    try {
                                                        const res = await fetch("/api/checkout/preview-cart-with-coupon", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            credentials: "include",
                                                            body: JSON.stringify({
                                                                couponCode: code,
                                                                items: items.map((it) => ({
                                                                    listingId: it.listingId,
                                                                    type: it.type === "service" ? "service" : "product",
                                                                    quantity: it.type === "product" ? it.quantity ?? 1 : undefined,
                                                                    bookingDate: it.type === "service" ? it.bookingDate : undefined,
                                                                    slotStartTime: it.type === "service" ? it.slotStartTime : undefined,
                                                                    slotEndTime: it.type === "service" ? it.slotEndTime : undefined,
                                                                    logisticsPreference: it.type === "product" ? it.logisticsPreference : undefined,
                                                                    deliveryAddress: it.type === "product" ? it.deliveryAddress : undefined,
                                                                })),
                                                            }),
                                                        });

                                                        const data = await parseJsonResponse<any>(res);
                                                        if (!res.ok) throw new Error(data?.message || "Invalid coupon");
                                                        setCouponPreview({
                                                            discountApplied: data.discountApplied,
                                                            discountedSubtotal: data.discountedSubtotal,
                                                            tax: data.tax,
                                                            total: data.total,
                                                        });
                                                        toast({
                                                            title: "Coupon applied",
                                                            description: `Discount ₹${data.discountApplied.toLocaleString()}`,
                                                        });
                                                    } catch (err) {
                                                        setCouponCode("");
                                                        setCouponPreview(null);
                                                        toast({
                                                            title: "Invalid coupon",
                                                            description: (err as Error).message,
                                                            variant: "destructive",
                                                        });
                                                    } finally {
                                                        setCouponPreviewPending(false);
                                                    }
                                                }}
                                            >
                                                {couponPreviewPending ? "Applying..." : "Apply"}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Applying updates the payable total. Coupon is redeemed only on <strong>Confirm Order</strong>.
                                        </p>
                                    </div>

                                    {effectiveSubtotal <= 0 && items.length > 0 && (
                                        <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/30">
                                            Quotation requests only — no payment due now.
                                        </p>
                                    )}

                                    <Button
                                        className="w-full h-12 font-bold text-md mt-4 shadow-md bg-primary hover:bg-primary/90"
                                        onClick={handleCheckout}
                                        disabled={isPending}
                                    >
                                        {isPending ? (
                                            <>Processing...</>
                                        ) : (
                                            <>
                                                Confirm Order
                                                <ArrowRight className="w-5 h-5 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                    {effectiveSubtotal <= 0 && items.some((i) => i.price === 0) && (
                                        <p className="text-xs text-muted-foreground">
                                            Quotation requests will be sent to sellers. No payment due now.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-white border border-dashed border-border/60 rounded-3xl">
                        <div className="p-6 rounded-full bg-primary/5 text-primary mb-6 animate-pulse">
                            <ShoppingCart className="w-16 h-16" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
                        <p className="text-muted-foreground max-w-sm mb-10">
                            Browse the community marketplace to find products and services from your neighbors.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/services">
                                <Button variant="outline" className="font-bold h-12 px-8 rounded-xl border-primary/20 text-primary hover:bg-primary/5">
                                    Browse Services
                                </Button>
                            </Link>
                            <Link href="/products">
                                <Button className="font-bold h-12 px-8 rounded-xl shadow-md">
                                    Shop Products
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
