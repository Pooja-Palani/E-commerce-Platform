import { useAuthStore } from "@/store/use-auth";
import { useCommunities, useJoinCommunity } from "@/hooks/use-communities";
import { useListings } from "@/hooks/use-listings";
import { useForumPosts } from "@/hooks/use-forum";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Calendar, Wrench, CreditCard, TrendingUp,
  Search, MapPin, Star, Clock, Laptop, Home as HomeIcon,
  Building2, Settings, Info, ShoppingBag, MessageSquare, ArrowRight, Zap, ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Link, Redirect } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const { data: communities, isLoading: loadingComm } = useCommunities();
  const { data: listings, isLoading: loadingList } = useListings();
  const { data: posts, isLoading: loadingPosts } = useForumPosts(user?.communityId || "");
  const join = useJoinCommunity();

  if (!user) return null;

  if (user.role === 'ADMIN') {
    return <Redirect to="/admin" />;
  }

  const isPending = user.status === 'PENDING';
  const noCommunity = !user.communityId;
  const userCommunity = communities?.find(c => c.id === user.communityId);

  if (loadingComm || loadingList || loadingPosts) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

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
    const hasCommunities = (communities?.length ?? 0) > 0;
    return (
      <Layout>
        <div className="max-w-5xl mx-auto mt-12 space-y-8 px-4">
          <div className="space-y-4 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <Building2 size={14} />
              Welcome to the Platform
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Connect with Your Neighbors</h1>
            <p className="text-muted-foreground text-lg">
              {hasCommunities
                ? "Select your residential complex to see local listings and participate in community discussions."
                : "Join a community to see local listings and participate in discussions. You can also complete your profile first."}
            </p>
            {!hasCommunities && (
              <Button asChild className="mt-4">
                <Link href="/profile">Go to Profile &amp; Community Memberships</Link>
              </Button>
            )}
          </div>

          {hasCommunities ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {communities?.map((community) => (
                <Card key={community.id} className="group hover:border-primary/50 transition-all hover:shadow-2xl bg-white border-border/50 rounded-3xl overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-primary/40 group-hover:scale-110 transition-transform" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-xl">
                      <span>{community.name}</span>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest">{community.locality}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{community.description || "A vibrant community for residents to connect and share services."}</p>
                    <Button
                      className="w-full font-bold h-12 rounded-2xl shadow-lg shadow-primary/20"
                      onClick={() => join.mutate(community.id)}
                      disabled={join.isPending}
                    >
                      {join.isPending ? "Joining..." : `Join ${community.name}`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border/50 p-8 text-center">
              <p className="text-muted-foreground mb-4">No communities are available on the platform yet. Complete your profile and check back later.</p>
              <Button asChild variant="outline">
                <Link href="/profile">Complete your profile</Link>
              </Button>
            </Card>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-12 max-w-7xl mx-auto pb-24 px-4">

        {/* Hero Section */}
        <section className="relative rounded-[2.5rem] overflow-hidden bg-primary p-8 md:p-16 text-primary-foreground shadow-2xl shadow-primary/20 overflow-visible">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-6">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
              Exclusive to {userCommunity?.name}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Discover Everything in Your Neighborhood.
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-lg leading-relaxed">
              From reliable home services to unique local products, find everything you need right here in your complex.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button size="lg" variant="secondary" className="rounded-2xl font-bold h-14 px-8 shadow-xl shadow-black/10 hover:scale-105 transition-transform" asChild>
                <Link href="/services">Browse Services</Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-2xl font-bold h-14 px-8 border-white/20 hover:bg-white/10 text-white hover:scale-105 transition-transform" asChild>
                <Link href="/products">Shop Products</Link>
              </Button>
            </div>
          </div>
          {/* Decorative floating elements hidden on small screens */}
          <div className="hidden lg:block absolute right-16 top-1/2 -translate-y-1/2 space-y-4">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 w-64 translate-x-12 animate-float">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-400 rounded-lg text-green-950"><Zap size={16} fill="currentColor" /></div>
                <span className="text-sm font-bold">Fastest Delivery</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 w-3/4" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 w-64 -translate-x-4 animate-float-delayed">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-400 rounded-lg text-blue-950"><ShieldCheck size={16} fill="currentColor" /></div>
                <span className="text-sm font-bold">Secure Booking</span>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-primary-foreground/20 border-2 border-primary" />)}
                <div className="w-6 h-6 rounded-full bg-white/10 text-[8px] flex items-center justify-center font-bold">50+</div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories / Quick Links */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { title: "Home Services", desc: "Plumbing, Cleaning & more", icon: Wrench, color: "bg-blue-500", url: "/services" },
            { title: "Local Market", desc: "Gadgets & Daily needs", icon: ShoppingBag, color: "bg-orange-500", url: "/products" },
            { title: "Community Chat", desc: "Share & connect", icon: MessageSquare, color: "bg-purple-500", url: "/forum" },
            { title: "My Activity", desc: "Track your orders", icon: Calendar, color: "bg-indigo-500", url: "/activity" },
          ].map((cat, i) => (
            <Link key={i} href={cat.url}>
              <div className="group cursor-pointer p-6 rounded-[2rem] bg-white border border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all space-y-4">
                <div className={`w-14 h-14 rounded-2xl ${cat.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <cat.icon size={28} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{cat.title}</h4>
                  <p className="text-xs text-muted-foreground font-medium">{cat.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* Featured Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Main Feed: Trending Items */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold tracking-tight">Trending Items</h3>
              <Link href="/products" className="group text-sm font-bold text-primary flex items-center gap-1">
                View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {listings && listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {listings.slice(0, 4).map((listing) => (
                  <Link key={listing.id} href={`/listings/${listing.id}`}>
                    <Card className="group relative rounded-[2rem] overflow-hidden border-border/50 shadow-sm hover:shadow-2xl transition-all bg-white flex flex-col h-full border-none ring-1 ring-border/50 hover:ring-primary/20 cursor-pointer">
                      <div className="h-48 bg-muted/20 relative overflow-hidden flex items-center justify-center">
                        <ShoppingBag className="w-16 h-16 text-muted-foreground/20 group-hover:scale-110 transition-all duration-500" />
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-white/80 backdrop-blur-sm text-primary border-none shadow-sm font-bold">₹{listing.price}</Badge>
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">{listing.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 text-[11px] font-medium">
                          <UserIcon size={12} /> by {listing.sellerNameSnapshot}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {listing.description}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button className="w-full rounded-xl font-bold h-11 bg-muted hover:bg-primary hover:text-white text-foreground transition-all">
                          View Item
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border/50 shadow-none bg-muted/5 flex items-center justify-center p-16 rounded-[2.5rem]">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                    <ShoppingBag size={32} />
                  </div>
                  <h4 className="text-lg font-bold">No items found</h4>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">Active listings in your community will appear here for easy browsing.</p>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar Feed: Community Talks */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold tracking-tight">Community Chat</h3>
              <Link href="/forum" className="group text-sm font-bold text-primary flex items-center gap-1">
                Chat <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <Card className="rounded-[2.5rem] border-none bg-muted/30 shadow-none overflow-hidden">
              <CardContent className="p-4 space-y-4">
                {posts && posts.length > 0 ? (
                  posts.slice(0, 5).map((post) => (
                    <Link key={post.id} href="/forum">
                      <div className="p-4 rounded-2xl bg-white border border-border/30 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group">
                        <h5 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors mb-1">{post.title}</h5>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-12 text-center space-y-3">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs font-bold text-muted-foreground px-8">No messages yet. Start the conversation!</p>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold border-primary/20" asChild>
                      <Link href="/forum">Open Chat</Link>
                    </Button>
                  </div>
                )}
                <Link href="/forum">
                  <Button variant="ghost" className="w-full text-primary font-bold hover:bg-primary/5 rounded-xl">
                    Open Chat
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Platform Help / Info */}
            <Card className="rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none p-6 shadow-xl shadow-indigo-600/20">
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Info size={24} />
                </div>
                <h4 className="font-bold text-lg">New here?</h4>
                <p className="text-xs text-white/80 leading-relaxed font-medium">Explore how our community platform works and how you can start selling today.</p>
                <Button className="w-full bg-white text-indigo-700 hover:bg-white/90 rounded-xl font-bold" asChild>
                  <Link href="/forum">Open Chat</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function UserIcon({ className, size = 16 }: { className?: string, size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
