import { Layout } from "@/components/layout";
import { useAuthStore } from "@/store/use-auth";
import { useCommunities, useUserCommunities } from "@/hooks/use-communities";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ShoppingBag } from "lucide-react";
import { Link } from "wouter";

export default function Subcommunities() {
  const user = useAuthStore((s) => s.user);
  const { data: communities, isLoading } = useCommunities();
  const { data: userCommunitiesData = [] } = useUserCommunities(user?.id ?? "");

  const memberSubIds = new Set(
    (userCommunitiesData as { joinStatus: string; community: { id: string } }[])
      .filter((m) => m.joinStatus === "ACTIVE" && m.community?.id)
      .map((m) => m.community.id)
  );

  const subCommunities = (communities ?? []).filter(
    (c) => c.parentId && memberSubIds.has(c.id)
  );
  const parentCommunities = new Map(
    (communities ?? [])
      .filter((c) => !c.parentId)
      .map((c) => [c.id, c])
  );

  if (isLoading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sub-Communities</h1>
          <p className="text-muted-foreground mt-1">
            Browse and sell in your sub-communities. You only see sub-communities you&apos;ve joined.
          </p>
        </div>

        {subCommunities.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold">No sub-communities yet</h3>
              <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                You haven&apos;t joined any sub-communities, or your community doesn&apos;t have any. Check your Profile for community memberships.
              </p>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/profile">Go to Profile</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subCommunities.map((sub) => {
              const parent = parentCommunities.get(sub.parentId!);
              return (
                <Card key={sub.id} className="border-border/50 overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="w-5 h-5 text-primary" />
                      {sub.name}
                    </CardTitle>
                    <CardDescription>
                      {parent?.name && `Part of ${parent.name}`}
                      {sub.locality && ` • ${sub.locality}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button asChild className="w-full gap-2">
                      <Link href={`/communities/${sub.id}`}>
                        <ShoppingBag className="w-4 h-4" /> Browse products & services
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
