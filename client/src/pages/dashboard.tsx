import { Layout } from "@/components/layout";
import { useAuthStore } from "@/store/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Search, Settings, Globe } from "lucide-react";
import { Link } from "wouter";
import { useCommunities, useJoinCommunity } from "@/hooks/use-communities";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Dashboard() {
  const user = useAuthStore(s => s.user!);
  const { data: communities, isLoading } = useCommunities();
  const join = useJoinCommunity();

  const isPending = user.status === 'PENDING';
  const noCommunity = !user.communityId;

  if (isLoading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.fullName}</h1>
          <p className="text-muted-foreground mt-2 text-lg">Here's what's happening in your neighborhood today.</p>
        </header>

        {noCommunity && (
          <Card className="border-primary/20 bg-primary/5 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Join a Community
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">You need to join a community to start trading and interacting.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {communities?.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-background rounded-lg border">
                    <span className="font-medium">{c.name}</span>
                    <Button 
                      size="sm" 
                      onClick={() => join.mutate(c.id)}
                      disabled={join.isPending}
                    >
                      Request to Join
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isPending && !noCommunity && (
          <Card className="border-amber-500/20 bg-amber-500/5 shadow-none">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <Settings className="w-8 h-8 text-amber-600 animate-spin-slow" />
                </div>
                <h3 className="text-xl font-bold text-amber-900">Pending Approval</h3>
                <p className="text-amber-700 max-w-md">
                  Your account is currently pending approval by a Community Manager. 
                  You'll have full access to the marketplace once approved.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isPending && !noCommunity && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Community Market</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Browse items available within your local community.</p>
                <Link href="/community" className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  <Search className="w-4 h-4 mr-2" />
                  Browse Community
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Global Market</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Discover items from other communities globally.</p>
                <Link href="/global" className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  <Globe className="w-4 h-4 mr-2" />
                  Explore Global
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
