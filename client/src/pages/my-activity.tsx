import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, ShoppingBag, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function MyActivity() {
    const { data: bookings, isLoading: loadingBookings } = useQuery<any[]>({
        queryKey: [api.bookings.list.path],
    });

    const { data: orders, isLoading: loadingOrders } = useQuery<any[]>({
        queryKey: [api.orders.list.path],
    });

    const isLoading = loadingBookings || loadingOrders;

    return (
        <Layout>
            <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">My Activity</h1>
                    <p className="text-muted-foreground">Bookings & buys in one place</p>
                </div>

                {/* My Service Bookings */}
                <section className="space-y-4">
                    <Card className="border-border/50 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="bg-muted/5 border-b border-border/40 py-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                <CardTitle className="text-lg font-bold">My Service Bookings</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="flex items-center justify-center p-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : bookings && bookings.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-bold text-xs uppercase tracking-wider pl-6">Service</TableHead>
                                            <TableHead className="font-bold text-xs uppercase tracking-wider">Provider</TableHead>
                                            <TableHead className="font-bold text-xs uppercase tracking-wider">Date & Time</TableHead>
                                            <TableHead className="font-bold text-xs uppercase tracking-wider">Price</TableHead>
                                            <TableHead className="font-bold text-xs uppercase tracking-wider text-right pr-6">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bookings.map((booking) => (
                                            <TableRow key={booking.id} className="hover:bg-muted/5 transition-colors">
                                                <TableCell className="font-medium pl-6">{booking.listingTitle || "Service Listing"}</TableCell>
                                                <TableCell className="text-muted-foreground">Provider Info</TableCell>
                                                <TableCell>
                                                    {format(new Date(booking.bookingDate), "MMM d, yyyy 'at' h:mm a")}
                                                </TableCell>
                                                <TableCell className="font-bold">₹{booking.priceSnapshot}</TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Badge
                                                        variant="secondary"
                                                        className={`capitalize px-3 py-0.5 text-[10px] font-bold ${booking.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                                booking.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                                    'bg-muted text-muted-foreground'
                                                            }`}
                                                    >
                                                        {booking.status.toLowerCase()}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                                    <div className="p-3 rounded-full bg-muted/50 text-muted-foreground mb-4">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-foreground">No service bookings yet</p>
                                    <p className="text-xs text-muted-foreground max-w-[240px] mt-1">When you book a service in your community, it will appear here.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* My Product Orders */}
                <section className="space-y-4">
                    <Card className="border-border/50 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="bg-muted/5 border-b border-border/40 py-4">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                <CardTitle className="text-lg font-bold">My Product Orders</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="flex items-center justify-center p-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : orders && orders.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-bold text-xs uppercase tracking-wider pl-6">Product</TableHead>
                                            <TableHead className="font-bold text-xs uppercase tracking-wider">Seller</TableHead>
                                            <TableHead className="font-bold text-xs uppercase tracking-wider">Date</TableHead>
                                            <TableHead className="font-bold text-xs uppercase tracking-wider">Price</TableHead>
                                            <TableHead className="font-bold text-xs uppercase tracking-wider text-right pr-6">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.map((order) => (
                                            <TableRow key={order.id} className="hover:bg-muted/5 transition-colors">
                                                <TableCell className="font-medium pl-6">{order.listingTitle || "Product Listing"}</TableCell>
                                                <TableCell className="text-muted-foreground">Seller Info</TableCell>
                                                <TableCell>
                                                    {format(new Date(order.createdAt), "MMM d, yyyy")}
                                                </TableCell>
                                                <TableCell className="font-bold">₹{order.priceSnapshot}</TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Badge variant="secondary" className="capitalize px-3 py-0.5 text-[10px] font-bold">
                                                        {order.status.toLowerCase()}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                                    <div className="p-3 rounded-full bg-muted/50 text-muted-foreground mb-4">
                                        <ShoppingBag className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-foreground">No product orders yet</p>
                                    <p className="text-xs text-muted-foreground max-w-[240px] mt-1">When you purchase a product from the market, it will appear here.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </Layout>
    );
}
