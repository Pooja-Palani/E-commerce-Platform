import { Listing } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, Tag, Calendar, Package, Infinity } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="group flex h-full flex-col overflow-hidden rounded-[2rem] border-white/70 bg-white/95 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.26)] transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_32px_80px_-34px_rgba(99,102,241,0.28)]">
        <div className="retail-gradient-soft relative flex h-56 items-center justify-center overflow-hidden">
          {listing.imageUrl ? (
            <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <Tag className="w-12 h-12 text-primary/40 group-hover:scale-110 transition-transform duration-500" />
          )}
          <div className="absolute left-4 top-4">
            <Badge className="border-none bg-slate-950/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white shadow-lg">
              {listing.listingType}
            </Badge>
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            {listing.visibility === 'GLOBAL' ? (
              <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm shadow-sm border-none">
                <Globe className="w-3 h-3 mr-1" /> Global
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm shadow-sm border-none">
                <Building2 className="w-3 h-3 mr-1" /> Community
              </Badge>
            )}
          </div>
          <div className="absolute bottom-4 left-4">
            <Badge className="border-none bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary shadow-lg">
              {listing.buyNowEnabled ? "Buy Now" : "Request Quotation"}
            </Badge>
          </div>
        </div>
        <CardHeader className="shrink-0 p-5 pb-2">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{listing.title}</h3>
            <span className="text-lg font-extrabold text-primary">
              {listing.buyNowEnabled ? `₹${listing.price}` : "Price on request"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 flex-1 space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{listing.description}</p>

          <div className="flex flex-wrap gap-2 pt-1">
            {listing.availabilityBasis === 'FOREVER' && (
              <Badge variant="outline" className="text-[10px] font-bold border-blue-100 bg-blue-50/50 text-blue-600 px-2 py-0.5">
                <Infinity className="w-3 h-3 mr-1" /> Always
              </Badge>
            )}

            {listing.availabilityBasis === 'TIMELINE' && listing.startDate && listing.endDate && (
              <Badge variant="outline" className="text-[10px] font-bold border-indigo-100 bg-indigo-50/60 text-indigo-600 px-2 py-0.5">
                <Calendar className="w-3 h-3 mr-1" />
                {format(new Date(listing.startDate), 'MMM d')} - {format(new Date(listing.endDate), 'MMM d')}
              </Badge>
            )}

            {listing.availabilityBasis === 'STOCK' && (
              <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 ${listing.stockQuantity && listing.stockQuantity > 0 ? 'border-emerald-100 bg-emerald-50/50 text-emerald-600' : 'border-destructive/10 bg-destructive/5 text-destructive'}`}>
                <Package className="w-3 h-3 mr-1" />
                {listing.stockQuantity && listing.stockQuantity > 0 ? `${listing.stockQuantity} Left` : 'Sold Out'}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="mt-auto flex items-center justify-between border-t border-border/50 bg-gradient-to-r from-indigo-50/70 to-white px-5 py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground/70">
          <span className="truncate max-w-[100px]">{listing.sellerNameSnapshot}</span>
          <span className="truncate max-w-[100px]">{listing.communityNameSnapshot}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
