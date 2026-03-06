import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/use-auth";
import { useUpdateUser } from "@/hooks/use-users";
import { Loader2, Wallet, Smartphone, CreditCard, Banknote } from "lucide-react";

export default function AcceptPayments() {
    const user = useAuthStore(s => s.user);
    const updateUser = useUpdateUser();

    if (!user) return null;

    const isSeller = user.isSeller || user.role === "COMMUNITY_MANAGER" || user.role === "ADMIN";
    const acceptsUpi = (user as any).paymentAcceptsUpi ?? false;
    const acceptsCard = (user as any).paymentAcceptsCard ?? false;
    const acceptsCash = (user as any).paymentAcceptsCash ?? false;

    const handleToggle = (field: "paymentAcceptsUpi" | "paymentAcceptsCard" | "paymentAcceptsCash", value: boolean) => {
        updateUser.mutate({
            id: user.id,
            data: {
                version: user.version,
                [field]: value,
            } as any,
        }, {
            onSuccess: (updated) => useAuthStore.getState().setUser(updated),
        });
    };

    if (!isSeller) {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto py-12">
                    <Card className="border-amber-200 bg-amber-50/50">
                        <CardContent className="p-8">
                            <h3 className="text-lg font-bold text-amber-800 mb-2">Seller mode required</h3>
                            <p className="text-sm text-amber-700">
                                Enable seller mode to configure how you accept payments. Switch to Seller in the sidebar.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Accept Payments</h1>
                    <p className="text-muted-foreground mt-1">
                        Choose how you want to receive payments from buyers
                    </p>
                </div>

                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-primary" />
                            Payment methods
                        </CardTitle>
                        <CardDescription>
                            Buyers will see these options when they purchase your products or services
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Smartphone className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <Label htmlFor="upi" className="font-bold text-base">UPI</Label>
                                    <p className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm, etc.</p>
                                </div>
                            </div>
                            <Switch
                                id="upi"
                                checked={acceptsUpi}
                                onCheckedChange={(v) => handleToggle("paymentAcceptsUpi", v)}
                                disabled={updateUser.isPending}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <CreditCard className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <Label htmlFor="card" className="font-bold text-base">Card</Label>
                                    <p className="text-xs text-muted-foreground">Debit / Credit card</p>
                                </div>
                            </div>
                            <Switch
                                id="card"
                                checked={acceptsCard}
                                onCheckedChange={(v) => handleToggle("paymentAcceptsCard", v)}
                                disabled={updateUser.isPending}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Banknote className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <Label htmlFor="cash" className="font-bold text-base">Physical cash</Label>
                                    <p className="text-xs text-muted-foreground">Pay in person</p>
                                </div>
                            </div>
                            <Switch
                                id="cash"
                                checked={acceptsCash}
                                onCheckedChange={(v) => handleToggle("paymentAcceptsCash", v)}
                                disabled={updateUser.isPending}
                            />
                        </div>

                        {updateUser.isPending && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
