import { useMemo } from "react";
import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useListings } from "@/hooks/use-listings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, Receipt, Wrench, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

type OrderRecord = {
  id: string;
  type: "order" | "booking";
  date: string;
  title: string;
  sellerName: string;
  amount: number;
  status: string;
  quantity?: number;
  listingId: string;
  extra?: string;
};

function statusVariant(status: string) {
  const s = status.toUpperCase();
  if (s === "DELIVERED" || s === "CONFIRMED" || s === "COMPLETED")
    return "bg-green-500/10 text-green-600 border-green-500/20";
  if (s === "PENDING" || s === "QUOTATION_PROVIDED")
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  if (s === "SHIPPED") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  return "bg-muted text-muted-foreground";
}

export default function Orders() {
  const { data: bookings, isLoading: loadingBookings } = useQuery<any[]>({
    queryKey: [api.bookings.list.path],
  });
  const { data: orders, isLoading: loadingOrders } = useQuery<any[]>({
    queryKey: [api.orders.list.path],
  });
  const { data: listings } = useListings();
  const listingsMap = useMemo(() => new Map(listings?.map((l: any) => [l.id, l]) ?? []), [listings]);

  const getTitle = (item: any, listingId: string) =>
    item.listingTitle ?? listingsMap.get(listingId)?.title ?? (item.type === "booking" ? "Service" : "Product");
  const getSeller = (item: any, listingId: string) =>
    item.sellerName ?? listingsMap.get(listingId)?.sellerNameSnapshot ?? "—";

  const history = useMemo<OrderRecord[]>(() => {
    const rows: OrderRecord[] = [];
    (orders ?? []).forEach((o: any) => {
      rows.push({
        id: o.id,
        type: "order",
        date: o.createdAt,
        title: getTitle(o, o.listingId),
        sellerName: getSeller(o, o.listingId),
        amount: o.priceSnapshot ?? 0,
        status: o.status ?? "PENDING",
        quantity: o.quantity,
        listingId: o.listingId,
      });
    });
    (bookings ?? []).forEach((b: any) => {
      const dateStr = b.bookingDate ? format(new Date(b.bookingDate), "yyyy-MM-dd") : "";
      const slot = b.slotStartTime && b.slotEndTime ? ` ${b.slotStartTime}–${b.slotEndTime}` : "";
      rows.push({
        id: b.id,
        type: "booking",
        date: b.createdAt,
        title: getTitle(b, b.listingId),
        sellerName: getSeller(b, b.listingId),
        amount: b.priceSnapshot ?? 0,
        status: b.status ?? "PENDING",
        listingId: b.listingId,
        extra: dateStr ? `${format(new Date(b.bookingDate), "MMM d, yyyy")}${slot}` : undefined,
      });
    });
    rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return rows;
  }, [orders, bookings, listingsMap]);

  const isLoading = loadingBookings || loadingOrders;

  return (
    <Layout>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
          <p className="text-muted-foreground">Your past orders and service bookings</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-3">
            {history.map((record) => (
              <Link key={`${record.type}-${record.id}`} href={`/listings/${record.listingId}`}>
                <Card className="border-border/50 shadow-sm bg-white overflow-hidden hover:shadow-md hover:border-primary/20 transition-all cursor-pointer">
                  <CardContent className="p-5 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      {record.type === "booking" ? (
                        <Wrench className="w-7 h-7 text-primary" />
                      ) : (
                        <ShoppingBag className="w-7 h-7 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-foreground truncate">{record.title}</span>
                        {record.quantity && record.quantity > 1 && (
                          <span className="text-muted-foreground text-sm">×{record.quantity}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{record.sellerName}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{format(new Date(record.date), "MMM d, yyyy")}</span>
                        {record.extra && <span>• {record.extra}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="font-bold text-primary">
                        {record.amount > 0 ? `₹${record.amount.toLocaleString()}` : "Quotation requested"}
                      </span>
                      <Badge variant="secondary" className={`text-[10px] font-bold capitalize px-2.5 py-0.5 ${statusVariant(record.status)}`}>
                        {record.status.toLowerCase().replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-border/60 bg-muted/20 overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="p-5 rounded-full bg-primary/10 text-primary mb-5">
                <Receipt className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-bold mb-2">No orders yet</h2>
              <p className="text-muted-foreground max-w-sm mb-8">
                When you buy a product or book a service from the marketplace, it will show up here.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/products">
                  <span className="inline-flex items-center justify-center gap-2 rounded-lg font-bold h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <ShoppingBag className="w-4 h-4" />
                    Browse Products
                  </span>
                </Link>
                <Link href="/services">
                  <span className="inline-flex items-center justify-center gap-2 rounded-lg font-bold h-11 px-6 border-2 border-primary/30 text-primary hover:bg-primary/5 transition-colors">
                    <Calendar className="w-4 h-4" />
                    Browse Services
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
