import { Layout } from "@/components/layout";
import { useListings } from "@/hooks/use-listings";
import { useAuthStore } from "@/store/use-auth";
import { useUserCommunities } from "@/hooks/use-communities";
import { ListingCard } from "@/components/listing-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PackageOpen } from "lucide-react";
import { useParams, Redirect } from "wouter";
import { useCommunities } from "@/hooks/use-communities";

export default function CommunityMarketplace() {
  const params = useParams();
  const { data: listings, isLoading } = useListings();
  const { data: communities } = useCommunities();
  const { data: userCommunitiesData = [] } = useUserCommunities(useAuthStore(s => s.user?.id ?? ""));
  const user = useAuthStore(s => s.user!);

  const targetCommunityId = params.id || user.communityId;
  const currentCommunity = communities?.find(c => c.id === targetCommunityId);

  const isSubCommunity = currentCommunity?.parentId;
  const userMemberOfTarget = (userCommunitiesData as { community: { id: string }; joinStatus: string }[]).some(
    m => m.community?.id === targetCommunityId && m.joinStatus === "ACTIVE"
  );
  if (isSubCommunity && !userMemberOfTarget) {
    return <Redirect to={user.communityId ? `/communities/${user.communityId}` : "/"} />;
  }

  if (isLoading) return <Layout><LoadingSpinner /></Layout>;

  // Filter listings: Active, in target community
  const communityListings = listings?.filter(l =>
    l.status === 'ACTIVE' &&
    l.communityId === targetCommunityId
  ) || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {currentCommunity ? `${currentCommunity.name} Market` : 'Community Market'}
          </h1>
          <p className="text-muted-foreground">
            {currentCommunity ? `Items available in ${currentCommunity.name}.` : 'Items available exclusively to your neighbors.'}
          </p>
        </div>

        {communityListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border rounded-2xl bg-muted/10 border-dashed">
            <PackageOpen className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No items found</h3>
            <p className="text-muted-foreground max-w-sm mt-1">There are currently no active listings in your community. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {communityListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
