import { Layout } from "@/components/layout";
import { useListings } from "@/hooks/use-listings";
import { ListingCard } from "@/components/listing-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Globe } from "lucide-react";

export default function GlobalMarketplace() {
  const { data: listings, isLoading } = useListings();

  if (isLoading) return <Layout><LoadingSpinner /></Layout>;

  // Filter listings: Active and GLOBAL visibility
  const globalListings = listings?.filter(l => 
    l.status === 'ACTIVE' && 
    l.visibility === 'GLOBAL'
  ) || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" />
            Global Market
          </h1>
          <p className="text-muted-foreground">Discover items from communities everywhere.</p>
        </div>

        {globalListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border rounded-2xl bg-muted/10 border-dashed">
            <Globe className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No global items</h3>
            <p className="text-muted-foreground max-w-sm mt-1">There are no globally visible listings at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {globalListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
