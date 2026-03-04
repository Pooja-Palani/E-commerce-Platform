import {
  LayoutDashboard,
  Calendar,
  Wrench,
  Package,
  PlusCircle,
  ShoppingCart,
  ShoppingBag,
  Shield,
  Settings,
  LogOut,
  Building2,
  Search,
  User,
  Users,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/use-auth";
import { useLogout } from "@/hooks/use-auth-api";
import { useAdminSettings } from "@/hooks/use-admin";
import { useCommunities } from "@/hooks/use-communities";
import { Link, useLocation } from "wouter";

export function AppSidebar() {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const [location] = useLocation();
  const { data: settings } = useAdminSettings();
  const { data: communities } = useCommunities();
  const userCommunity = communities?.find(c => c.id === user?.communityId);

  if (!user) return null;

  const navigationItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "My Activity", url: "/activity", icon: Calendar },
    { title: "My Services", url: "/my-services", icon: Wrench },
    { title: "My Products", url: "/my-products", icon: Package },
    { title: "Cart", url: "/cart", icon: ShoppingCart },
  ];

  const marketplaceItems = [
    { title: "Services", url: "/services", icon: Wrench },
    { title: "Products", url: "/products", icon: ShoppingBag },
  ];

  const managerItems = [
    { title: "Manager Dashboard", url: "/manager", icon: Shield },
  ];

  const adminItems = [
    { title: "Admin Panel", url: "/admin", icon: Settings },
  ];

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarContent>
        <div className="p-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-primary">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-white">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold">{settings?.platformName || "Nexus Market"}</span>
                <span className="text-xs font-medium text-muted-foreground capitalize">{user.role.toLowerCase().replace('_', ' ')}</span>
              </div>
            </div>
          </div>
          {user.role !== "ADMIN" && (
            <div className="mt-6 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Community:</p>
              <p className="text-sm font-bold text-primary truncate">
                {user.communityId ? userCommunity?.name || "Loading..." : "No Community Joined"}
              </p>
            </div>
          )}
        </div>

        {user.role === "ADMIN" ? (
          <SidebarGroup>
            <SidebarGroupLabel className="px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Platform Admin</SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <SidebarMenu>
                {[
                  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
                  { title: "Communities", url: "/admin/communities", icon: Building2 },
                  { title: "Users", url: "/admin/users", icon: Users },
                  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
                  { title: "Settings", url: "/admin/settings", icon: Settings },
                ].map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url} className="px-4 py-2 hover:bg-primary/5 transition-colors group">
                      <Link href={item.url} className="flex items-center gap-3 w-full">
                        <item.icon className={`w-4 h-4 transition-colors ${location === item.url ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                        <span className={`text-sm font-medium ${location === item.url ? 'text-primary font-bold' : 'text-muted-foreground/90 group-hover:text-primary'}`}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : user.role === "COMMUNITY_MANAGER" ? (
          <SidebarGroup>
            <SidebarGroupLabel className="px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Navigation</SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <SidebarMenu>
                {[
                  { title: "Dashboard", url: "/manager", icon: LayoutDashboard },
                  { title: "Approvals", url: "/manager/approvals", icon: Shield },
                  { title: "Services", url: "/manager/services", icon: Wrench },
                  { title: "Products", url: "/manager/products", icon: Package },
                  { title: "Members", url: "/manager/members", icon: Users },
                ].map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url} className="px-4 py-2 hover:bg-primary/5 transition-colors group">
                      <Link href={item.url} className="flex items-center gap-3 w-full">
                        <item.icon className={`w-4 h-4 transition-colors ${location === item.url ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                        <span className={`text-sm font-medium ${location === item.url ? 'text-primary font-bold' : 'text-muted-foreground/90 group-hover:text-primary'}`}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Navigation</SidebarGroupLabel>
              <SidebarGroupContent className="px-2">
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url} className="px-4 py-2 hover:bg-primary/5 transition-colors group">
                        <Link href={item.url} className="flex items-center gap-3 w-full">
                          <item.icon className={`w-4 h-4 transition-colors ${location === item.url ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                          <span className={`text-sm font-medium ${location === item.url ? 'text-primary font-bold' : 'text-muted-foreground/90 group-hover:text-primary'}`}>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 mt-4">Marketplace</SidebarGroupLabel>
              <SidebarGroupContent className="px-2">
                <SidebarMenu>
                  {marketplaceItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url} className="px-4 py-2 hover:bg-primary/5 transition-colors group">
                        <Link href={item.url} className="flex items-center gap-3 w-full">
                          <item.icon className={`w-4 h-4 transition-colors ${location === item.url ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                          <span className={`text-sm font-medium ${location === item.url ? 'text-primary font-bold' : 'text-muted-foreground/90 group-hover:text-primary'}`}>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        <div className="flex flex-col gap-4">
          <Link href="/profile">
            <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-primary/5 transition-all group text-left">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                <User size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-foreground truncate">{user.fullName}</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                  {user.role.toLowerCase().replace('_', ' ')}
                </span>
              </div>
            </button>
          </Link>

          <SidebarMenuButton
            onClick={() => logout.mutate()}
            className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all rounded-lg group h-auto"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Sign Out</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
