import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wrench, Loader2, Calendar, Eye, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useSellerBookings, useUpdateBookingStatus } from "@/hooks/use-bookings";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { format } from "date-fns";

export default function MyServices() {
    const { data: listings, isLoading } = useQuery<any[]>({
        queryKey: ["/api/my-listings"],
    });
    const { data: sellerBookings = [], isLoading: loadingBookings } = useSellerBookings();
    const updateBookingStatus = useUpdateBookingStatus();

    const services = listings?.filter(l => l.listingType === "SERVICE") || [];
    const getListingTitle = (listingId: string) =>
        services.find(s => s.id === listingId)?.title || "Service";

    const BOOKING_STATUS_OPTIONS = [
        { value: "PENDING", label: "Pending" },
        { value: "CONFIRMED", label: "Confirmed" },
        { value: "COMPLETED", label: "Completed" },
        { value: "CANCELLED", label: "Cancelled" },
    ];

    return (
        <Layout>
            <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight">My Services</h1>
                        <p className="text-muted-foreground text-sm">Services you've listed — pending or live</p>
                        {!isLoading && services.length > 0 && (
                            <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
                                <BarChart3 className="w-4 h-4" />
                                <span className="font-medium text-foreground">{services.length}</span> service{services.length !== 1 ? "s" : ""} listed
                                <span className="text-muted-foreground">·</span>
                                <span className="font-medium text-foreground">
                                    {services.filter((s: any) => (s.status || "").toLowerCase() === "active").length}
                                </span> active
                            </p>
                        )}
                    </div>
                    <Link href="/list-service">
                        <Button className="bg-primary hover:bg-primary/90 font-bold px-6 shadow-sm">
                            <Plus className="w-4 h-4 mr-2" />
                            List a Service
                        </Button>
                    </Link>
                </div>

                {sellerBookings.length > 0 && (
                    <Card id="seller-bookings" className="border-border/50 shadow-sm overflow-hidden bg-white scroll-mt-6">
                        <CardContent className="p-0">
                            <div className="bg-muted/5 border-b border-border/40 py-4 px-6">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    <h3 className="text-lg font-bold">Bookings for your services</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">Incoming service bookings</p>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-bold text-xs uppercase tracking-wider pl-6">Service</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-wider">Date</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-wider">Price</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-wider text-right pr-6">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sellerBookings.map((booking: any) => (
                                        <TableRow key={booking.id} className="hover:bg-muted/5 transition-colors">
                                            <TableCell className="font-medium pl-6">{getListingTitle(booking.listingId)}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {format(new Date(booking.bookingDate), "MMM d, yyyy")}
                                                {booking.slotStartTime && booking.slotEndTime && (
                                                    <span className="ml-1">({booking.slotStartTime}–{booking.slotEndTime})</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-bold">₹{booking.priceSnapshot}</TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Select
                                                    value={booking.status}
                                                    onValueChange={(status) => updateBookingStatus.mutate({ bookingId: booking.id, status })}
                                                    disabled={updateBookingStatus.isPending}
                                                >
                                                    <SelectTrigger className="w-[130px] h-8 ml-auto border-0 shadow-none bg-transparent focus:ring-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {BOOKING_STATUS_OPTIONS.map((opt) => (
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
                ) : services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service) => (
                            <Card key={service.id} className="border-border/50 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-xl bg-primary/5 text-primary">
                                            <Wrench className="w-5 h-5" />
                                        </div>
                                        <Badge variant="secondary" className="capitalize px-3 py-1 text-[10px] font-bold bg-green-500/10 text-green-600 border-green-500/20">
                                            {service.status.toLowerCase()}
                                        </Badge>
                                    </div>
                                    <h3 className="text-lg font-bold mb-1 truncate">{service.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4">
                                        {service.description}
                                    </p>
                                    <div className="flex flex-col gap-3 pt-4 border-t border-border/40">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Price</span>
                                                <span className="text-lg font-bold text-primary">₹{service.price}</span>
                                            </div>
                                            {(() => {
                                                const bookingCount = sellerBookings.filter((b: any) => b.listingId === service.id).length;
                                                return bookingCount > 0 ? (
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        {bookingCount} booking{bookingCount !== 1 ? "s" : ""}
                                                    </span>
                                                ) : null;
                                            })()}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Link href={`/listings/${service.id}`}>
                                                <Button variant="outline" size="sm" className="font-bold text-xs h-8 gap-1.5">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View details
                                                </Button>
                                            </Link>
                                            <Link href={`/list-service/${service.id}`}>
                                                <Button variant="outline" size="sm" className="font-bold text-xs h-8">
                                                    Edit Listing
                                                </Button>
                                            </Link>
                                            {sellerBookings.some((b: any) => b.listingId === service.id) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="font-bold text-xs h-8 text-primary hover:text-primary"
                                                    onClick={() => document.getElementById("seller-bookings")?.scrollIntoView({ behavior: "smooth" })}
                                                >
                                                    <Calendar className="w-3.5 h-3.5 mr-1" />
                                                    View bookings
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="border-dashed border-2 border-border/50 rounded-2xl bg-muted/5 flex flex-col items-center justify-center p-20 text-center">
                        <div className="p-4 rounded-full bg-primary/5 text-primary mb-6">
                            <Wrench className="w-10 h-10" />
                        </div>
                        <p className="text-lg font-bold text-muted-foreground mb-1">You haven't listed any services yet.</p>
                        <p className="text-sm text-muted-foreground max-w-sm mb-8">
                            Share your skills with your community members and start earning.
                        </p>
                        <Link href="/list-service">
                            <Button size="lg" className="bg-primary hover:bg-primary/90 font-bold px-8 shadow-sm h-12">
                                <Plus className="w-5 h-5 mr-2" />
                                List a Service
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </Layout>
    );
}
