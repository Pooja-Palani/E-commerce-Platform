import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ShoppingBag, Trash2, ArrowRight, Minus, Plus } from "lucide-react";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";

export default function Cart() {
    // Mock data for demonstration - in a real app, this would come from a global store or context
    const cartItems: any[] = [];

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
    const tax = subtotal * 0.18; // 18% GST example
    const total = subtotal + tax;

    return (
        <Layout>
            <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-20">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight font-serif">Your Cart</h1>
                    <p className="text-muted-foreground">Review and checkout your community finds</p>
                </div>

                {cartItems.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map((item) => (
                                <Card key={item.id} className="border-border/50 shadow-sm bg-white overflow-hidden">
                                    <CardContent className="p-4 flex items-center gap-6">
                                        <div className="w-24 h-24 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                                            <ShoppingBag className="w-8 h-8 text-primary/30" />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg truncate">{item.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{item.sellerNameSnapshot}</p>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="flex justify-between items-end mt-4">
                                                <div className="flex items-center border border-border/50 rounded-lg overflow-hidden bg-muted/10 h-9">
                                                    <Button variant="ghost" size="icon" className="h-full w-8 rounded-none px-0">
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <span className="w-10 text-center text-sm font-bold">{item.quantity || 1}</span>
                                                    <Button variant="ghost" size="icon" className="h-full w-8 rounded-none px-0">
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                                <span className="font-bold text-lg text-primary">₹{item.price}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="lg:col-span-1">
                            <Card className="border-primary/10 shadow-lg bg-white sticky top-24 overflow-hidden">
                                <div className="h-1.5 bg-primary" />
                                <CardHeader>
                                    <CardTitle className="text-lg">Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">GST (18%)</span>
                                            <span className="font-medium">₹{tax.toLocaleString()}</span>
                                        </div>
                                        <Separator className="my-2" />
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="font-bold">Total Amount</span>
                                            <span className="text-2xl font-black text-primary">₹{total.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <Button className="w-full h-12 font-bold text-md mt-4 shadow-md bg-primary hover:bg-primary/90">
                                        Confirm Order
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
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
