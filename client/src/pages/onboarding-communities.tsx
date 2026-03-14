import { useCommunities, useJoinCommunity } from "@/hooks/use-communities";
import { useAuthStore } from "@/store/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useLocation } from "wouter";
import { Users, SkipForward, CheckCircle2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OnboardingCommunities() {
    const { data: communities, isLoading } = useCommunities();
    const joinCommunity = useJoinCommunity();
    const [, setLocation] = useLocation();
    const user = useAuthStore((state) => state.user);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingSpinner />
            </div>
        );
    }

    const handleJoin = async (communityId: string) => {
        try {
            await joinCommunity.mutateAsync(communityId);
            setLocation("/");
        } catch (error) {
            // Error handled by hook's toast
        }
    };

    const handleSkip = () => {
        setLocation("/");
    };

    // Only show top-level communities for discovery
    const discoveryCommunities = communities?.filter(c => !c.parentId) || [];

    return (
        <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12 space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
                        <Users className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                        Find Your Community
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Discover local groups near you to start buying, selling, and connecting with neighbors.
                    </p>
                    <div className="flex justify-center pt-4">
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground group" onClick={handleSkip}>
                            Skip for now <SkipForward className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {discoveryCommunities.map((community) => (
                        <Card key={community.id} className="flex flex-col border-border/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                        {community.locality || "Local Area"}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl font-bold line-clamp-1">{community.name}</CardTitle>
                                <CardDescription className="line-clamp-2 h-10 mt-2">
                                    {community.description || "A safe space for neighbors to trade and collaborate."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow pb-6">
                                <div className="space-y-3 text-sm text-muted-foreground">
                                    {community.address && (
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                            <span className="truncate">{community.address}</span>
                                        </div>
                                    )}
                                    {community.facilities && (
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                            <span className="truncate">{community.facilities}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 border-t bg-muted/5 mt-auto">
                                <Button
                                    className="w-full mt-4 group"
                                    onClick={() => handleJoin(community.id)}
                                    disabled={joinCommunity.isPending}
                                >
                                    {joinCommunity.isPending ? "Joining..." : (
                                        <>
                                            Join Community <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {discoveryCommunities.length === 0 && (
                    <div className="text-center py-20 bg-background rounded-2xl border-2 border-dashed border-border/50 max-w-lg mx-auto mt-8">
                        <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">No communities found yet</h3>
                        <p className="text-muted-foreground mt-1 px-8">
                            We're still growing! You can skip this step and browse the global marketplace for now.
                        </p>
                        <Button variant="outline" className="mt-6" onClick={handleSkip}>
                            Continue to Home
                        </Button>
                    </div>
                )}

                <div className="mt-16 text-center border-t border-border/50 pt-8">
                    <p className="text-sm text-muted-foreground">
                        Can't find your area? Contact us to register a new community.
                    </p>
                </div>
            </div>
        </div>
    );
}
