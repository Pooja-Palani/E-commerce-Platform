import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/store/use-auth";
import { useCommunities } from "@/hooks/use-communities";
import { useCartStore } from "@/store/use-cart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminSettings } from "@/hooks/use-admin";
import { Bell, MapPin, Search, ShoppingCart, Sparkles } from "lucide-react";
import { Redirect, Link, useLocation } from "wouter";

export function Layout({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const viewMode = useAuthStore((state) => state.viewMode);
  const useAsUser = useAuthStore((state) => state.useAsUser);
  const cartItemsCount = useCartStore((state) => state.items.length);
  const { data: settings } = useAdminSettings();
  const [location] = useLocation();

  useEffect(() => {
    useCartStore.getState().ensureUserCart(user?.id ?? null);
  }, [user?.id]);

  // Apply community theme color as CSS variables on the document element
  const { data: communities } = useCommunities();
  const userCommunity = communities?.find((c: any) => c.id === user?.communityId);
  useEffect(() => {
    const root = document.documentElement;
    const color = userCommunity?.themeColor || "#6366f1";
    root.style.setProperty("--community-color", color);
    // derive a faded/transparent variant for backgrounds
    root.style.setProperty("--community-color-20", `${color}33`);
    root.style.setProperty("--community-color-10", `${color}1a`);
    return () => {
      root.style.removeProperty("--community-color");
      root.style.removeProperty("--community-color-20");
      root.style.removeProperty("--community-color-10");
    };
  }, [userCommunity?.id, userCommunity?.themeColor]);

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden bg-transparent">
        <AppSidebar />
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.06),transparent_40%)]" />
          <header className="relative z-10 shrink-0 border-b border-white/60 bg-background">
            {location === "/" ? (
              <>
                <div className="retail-gradient flex items-center justify-center gap-2 px-6 py-2 text-xs font-bold uppercase tracking-[0.28em] text-white/90">
                  <Sparkles className="h-3.5 w-3.5" />
                  Daily local deals, trusted sellers, and fast community checkout on {settings?.platformName || "Qvanto Market"}
                </div>
                <div className="flex flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-3">
                      <SidebarTrigger className="h-10 w-10 rounded-2xl border border-white/70 bg-white/80 shadow-sm hover:bg-white" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary/80">Welcome back</p>
                        <h1 className="text-xl font-extrabold tracking-tight text-foreground md:text-2xl">
                          Hi {user.fullName.split(" ")[0]}, ready to shop local?
                        </h1>
                      </div>
                    </div>

                    { (viewMode === 'BUYER' || viewMode === 'SELLER') && (user.role !== 'ADMIN' || useAsUser) && (
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="rounded-full border-0 bg-emerald-500/10 px-3 py-1.5 text-emerald-700 hover:bg-emerald-500/10">
                          <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
                          {user.status}
                        </Badge>
                        <Badge variant="secondary" className="rounded-full bg-white/85 px-3 py-1.5 text-slate-700 shadow-sm">
                          <MapPin className="mr-1 h-3.5 w-3.5 text-primary" />
                          {user.communityId ? "Community connected" : "Choose community"}
                        </Badge>
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl border-white/70 bg-white/80 shadow-sm hover:bg-white">
                          <Bell className="h-4 w-4" />
                        </Button>
                        <Button asChild className="h-10 rounded-2xl px-4 font-bold shadow-lg shadow-primary/20">
                          <Link href="/cart">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Cart ({cartItemsCount})
                          </Link>
                        </Button>
                      </div>
                    ) }
                  </div>

                  <div className="retail-surface flex flex-col gap-3 rounded-[1.75rem] px-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative flex-1 max-w-2xl">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        readOnly
                        value="Search products, services, and community offers"
                        className="h-12 rounded-2xl border-white/70 bg-white pl-11 text-sm font-medium text-muted-foreground shadow-none"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { label: "Top deals", href: "/products" },
                        { label: "Book services", href: "/services" },
                        { label: "Community ads", href: "/forum" },
                      ].map((item) => (
                        <Button key={item.label} asChild variant="ghost" className="rounded-full bg-primary/5 px-4 text-sm font-bold text-primary hover:bg-primary/10">
                          <Link href={item.href}>{item.label}</Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 md:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="h-10 w-10 rounded-2xl border border-white/70 bg-white/80 shadow-sm hover:bg-white" />
                </div>
                { (viewMode === 'BUYER' || viewMode === 'SELLER') && (user.role !== 'ADMIN' || useAsUser) && (
                  <div className="flex items-center gap-3">
                    <Badge className="rounded-full border-0 bg-emerald-500/10 px-3 py-1.5 text-emerald-700 hover:bg-emerald-500/10">
                      <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
                      {user.status}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full bg-white/85 px-3 py-1.5 text-slate-700 shadow-sm">
                      <MapPin className="mr-1 h-3.5 w-3.5 text-primary" />
                      {user.communityId ? "Community connected" : "Choose community"}
                    </Badge>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl border-white/70 bg-white/80 shadow-sm hover:bg-white">
                      <Bell className="h-4 w-4" />
                    </Button>
                    <Button asChild className="h-10 rounded-2xl px-4 font-bold shadow-lg shadow-primary/20">
                      <Link href="/cart">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Cart ({cartItemsCount})
                      </Link>
                    </Button>
                  </div>
                ) }
              </div>
            )}
          </header>
          <main className="relative z-10 flex-1 overflow-auto px-4 py-6 md:px-6 md:py-8 lg:px-8">
            <div className="mx-auto h-full w-full max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
