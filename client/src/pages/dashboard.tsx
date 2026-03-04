import { useAuthStore } from "@/store/use-auth";
import { useCommunities, useJoinCommunity } from "@/hooks/use-communities";
import { useListings } from "@/hooks/use-listings";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Calendar, Wrench, CreditCard, TrendingUp,
  Search, MapPin, Star, Clock, Laptop, Home as HomeIcon,
  Building2, Settings, Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Link, Redirect } from "wouter";

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const { data: communities, isLoading: loadingComm } = useCommunities();
  const { data: listings, isLoading: loadingList } = useListings();
  const join = useJoinCommunity();

  if (!user) return null;

  if (user.role === 'ADMIN') {
    return <Redirect to="/admin" />;
  }

  const isPending = user.status === 'PENDING';
  const noCommunity = !user.communityId;
  const userCommunity = communities?.find(c => c.id === user.communityId);

  if (loadingComm || loadingList) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  // Functional: Handle Unauthenticated or Pending states first
  if (isPending && !noCommunity) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto mt-20 text-center space-y-6">
          <div className="p-4 rounded-full bg-amber-500/10 w-20 h-20 flex items-center justify-center mx-auto">
            <Settings className="w-10 h-10 text-amber-600 animate-spin-slow" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Pending Approval</h1>
            <p className="text-muted-foreground text-lg">
              Your account is currently being reviewed by the Community Manager of <strong>{userCommunity?.name || "your selected community"}</strong>.
              You'll have full access once approved.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (noCommunity) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto mt-12 space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-center">Join Your Community</h1>
            <p className="text-muted-foreground text-lg text-center">Select your residential complex to see local listings and connect with neighbors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities?.map((community) => (
              <Card key={community.id} className="hover:border-primary/50 transition-all hover:shadow-lg bg-white border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>{community.name}</span>
                    <Building2 className="w-5 h-5 text-primary/60" />
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {community.locality}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{community.description}</p>
                  <Button
                    className="w-full font-bold"
                    onClick={() => join.mutate(community.id)}
                    disabled={join.isPending}
                  >
                    {join.isPending ? "Joining..." : `Join ${community.name}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Authenticated and Joined: Show the Dashboard UI with dynamic (zeroed) values
  const stats = [
    { title: "Active Bookings", value: "0", icon: Calendar, color: "bg-blue-500/10 text-blue-600" },
    { title: "Services Listed", value: "0", icon: Wrench, color: "bg-purple-500/10 text-purple-600" },
    { title: "Total Spent", value: "₹0", icon: CreditCard, color: "bg-indigo-500/10 text-indigo-600" },
    { title: "Total Earned", value: "₹0", icon: TrendingUp, color: "bg-green-500/10 text-green-600" },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
        {/* Welcome Section */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground">Here's what's happening in your community today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="border-border/50 shadow-sm overflow-hidden transition-all hover:shadow-md bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-bold">{stat.value}</h2>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold tracking-tight">Recent Bookings</h3>
          <Card className="border-border/50 shadow-sm bg-white min-h-[150px] flex items-center justify-center">
            <CardContent className="flex flex-col items-center justify-center text-center p-8 space-y-2">
              <div className="p-3 rounded-full bg-muted/50 text-muted-foreground">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold">No active bookings</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">When you book a service or sell a product, it will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Popular Section - Now using real listings or empty state */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight">Popular in Your Community</h3>
            <Link href="/services" className="text-sm font-semibold text-primary hover:underline transition-all">
              View all
            </Link>
          </div>

          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.slice(0, 3).map((listing) => (
                <Card key={listing.id} className="border-border/50 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all group bg-white">
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <h4 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">{listing.title}</h4>
                        <p className="text-[11px] text-muted-foreground">by {listing.sellerNameSnapshot}</p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {listing.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-primary">₹{listing.price}</span>
                      </div>
                      <Button size="sm" className="bg-primary hover:bg-primary/90 px-6 font-bold shadow-sm h-8 text-xs">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-border/50 shadow-none bg-muted/5 flex items-center justify-center p-12">
              <div className="text-center space-y-2">
                <p className="text-sm font-bold text-muted-foreground">No items listed in your community yet.</p>
                <p className="text-xs text-muted-foreground">Be the first to list something!</p>
              </div>
            </Card>
          )}
        </section>
      </div>
    </Layout>
  );
}

function PlusCircle({ className, ...props }: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}
