import { Layout } from "@/components/layout";
import { useListings } from "@/hooks/use-listings";
import { useAuthStore } from "@/store/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Eye, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ManagerServices() {
    const { data: listings, isLoading } = useListings();
    const currentUser = useAuthStore(s => s.user!);

    if (isLoading) return <Layout><LoadingSpinner /></Layout>;

    const communityServices = listings?.filter(l => l.communityId === currentUser.communityId && l.listingType === 'SERVICE') || [];

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Community Services</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Monitor and manage service listings within your community.</p>
                </div>

                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-4 border-b border-border/50 bg-slate-50/50 rounded-t-xl">
                        <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                            <Wrench className="w-5 h-5 text-blue-600" /> Active Services ({communityServices.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {communityServices.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-slate-500 font-medium">No service listings found in your community.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                {communityServices.map(service => (
                                    <Card key={service.id} className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
                                        <CardContent className="p-5">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{service.title}</h3>
                                                <Badge variant={service.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">
                                                    {service.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{service.description}</p>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                                                <div className="font-bold text-indigo-600 border border-indigo-100 bg-indigo-50/50 px-2.5 py-1 rounded-md">
                                                    {service.buyNowEnabled ? <>₹{service.price} <span className="text-slate-500 text-xs font-medium">/hr</span></> : "Given for quotation"}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Eye className="w-4 h-4 text-slate-400" />
                                                    <Star className="w-4 h-4 text-slate-400" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
