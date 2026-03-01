import { Listing } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, Tag } from "lucide-react";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Card className="group flex flex-col h-full overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300">
      <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary relative flex items-center justify-center">
        <Tag className="w-12 h-12 text-primary/40 group-hover:scale-110 transition-transform duration-300" />
        <div className="absolute top-3 right-3 flex gap-2">
          {listing.visibility === 'GLOBAL' ? (
            <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm">
              <Globe className="w-3 h-3 mr-1" /> Global
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm">
              <Building2 className="w-3 h-3 mr-1" /> Community
            </Badge>
          )}
        </div>
      </div>
      <CardHeader className="p-4 pb-2 shrink-0">
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{listing.title}</h3>
          <span className="font-bold text-lg text-primary">${(listing.price / 100).toFixed(2)}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 border-t mt-auto text-xs text-muted-foreground flex justify-between items-center bg-muted/20">
        <span>By {listing.sellerNameSnapshot}</span>
        <span>{listing.communityNameSnapshot}</span>
      </CardFooter>
    </Card>
  );
}
