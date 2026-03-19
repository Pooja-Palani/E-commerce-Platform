import {
  LayoutDashboard,
  Calendar,
  Wrench,
  Package,
  PlusCircle,
  ShoppingCart,
  ShoppingBag,
  Wallet,
  Shield,
  Settings,
  LogOut,
  Building2,
  Search,
  User,
  Users,
  BarChart3,
  TrendingUp,
  Store,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Receipt,
  UserRound,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/use-auth";
import { useLogout } from "@/hooks/use-auth-api";
import { useAdminSettings } from "@/hooks/use-admin";
import { useCommunities, useUserCommunities, usePendingInvites, useHasApprovedAccess } from "@/hooks/use-communities";
import { useUpdateUser } from "@/hooks/use-users";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";

export function AppSidebar() {
  const user = useAuthStore((state) => state.user);
  const viewMode = useAuthStore((state) => state.viewMode);
  const setViewMode = useAuthStore((state) => state.setViewMode);
  const useAsUser = useAuthStore((state) => state.useAsUser);
  const setUseAsUser = useAuthStore((state) => state.setUseAsUser);
  const logout = useLogout();
  const [location] = useLocation();
  const { data: settings } = useAdminSettings();
  const { data: communities } = useCommunities();
  const { data: userCommunitiesData = [] } = useUserCommunities(user?.id ?? "");
  const { data: pendingInvites = [] } = usePendingInvites();
  const { hasApprovedAccess } = useHasApprovedAccess();
  const updateUser = useUpdateUser();
  const userCommunity = communities?.find(c => c.id === user?.communityId);
  const activeMemberships = userCommunitiesData
    .filter((m: { joinStatus: string }) => m.joinStatus === "ACTIVE")
    .map((m: { community: { id: string; name: string } }) => m.community);
  const hasCurrentInList = activeMemberships.some((c: { id: string }) => c.id === user?.communityId);
  const userCommunitiesList =
    user?.communityId && !hasCurrentInList && userCommunity
      ? [{ id: user.communityId!, name: userCommunity.name }, ...activeMemberships]
      : activeMemberships;
  const currentCommunityId = user?.communityId ?? userCommunitiesList[0]?.id ?? "";

  if (!user) return null;

  const isAdminOrManager = user.role === "ADMIN" || user.role === "COMMUNITY_MANAGER";
  const showResidentNav = user.role === "RESIDENT" || (isAdminOrManager && useAsUser);

  const navigationItems = [
    { title: "Home", url: "/", icon: LayoutDashboard },
    ...(hasApprovedAccess ? [{ title: "Community Ads", url: "/forum", icon: MessageSquare }] : []),
    ...(hasApprovedAccess && viewMode === "BUYER" ? [{ title: "My Activity", url: "/activity", icon: Calendar }] : []),
    ...(showResidentNav && hasApprovedAccess ? [
      { title: "Cart", url: "/cart", icon: ShoppingCart },
      { title: "Orders", url: "/orders", icon: Receipt },
    ] : []),
    ...(showResidentNav && hasApprovedAccess && viewMode === "BUYER" ? [] : showResidentNav && hasApprovedAccess ? [
      { title: "My Services", url: "/my-services", icon: Wrench },
      { title: "My Products", url: "/my-products", icon: Package },
      { title: "Accept Payments", url: "/accept-payments", icon: Wallet },
    ] : []),
  ];

  const marketplaceItems = [
    { title: "Services", url: "/services", icon: Wrench },
    { title: "Products", url: "/products", icon: ShoppingBag },
    { title: "Shops", url: "/subcommunities", icon: Building2 },
  ];

  const managerItems = [
    { title: "Manager Dashboard", url: "/manager", icon: Shield },
  ];

  const adminItems = [
    { title: "Admin Panel", url: "/admin", icon: Settings },
  ];

  const navButtonClass = "rounded-2xl px-4 py-3 transition-all group border border-transparent hover:border-primary/10 hover:bg-white hover:shadow-[0_18px_35px_-22px_rgba(15,23,42,0.30)]";

  return (
    <Sidebar className="border-r border-white/60 bg-transparent">
      <SidebarContent>
        <div className="p-5">
          <div className="retail-surface rounded-[2rem] p-5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-primary">
                <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shadow-sm">
                  {settings?.platformLogoUrl ? (
                    <img src={settings.platformLogoUrl} alt="Platform logo" className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-lg font-bold">{settings?.platformName || "Qvanto Market"}</span>
                  <span className="text-xs font-medium text-muted-foreground capitalize">{user.role.toLowerCase().replace('_', ' ')} • neighborhood commerce</span>
                </div>
              </div>
            </div>
            <div className="mt-4 retail-gradient-soft rounded-[1.5rem] border border-primary/10 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary/70">Today’s vibe</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">Shop local, book faster, stay connected.</p>
                </div>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
          <div className="mt-5 retail-surface rounded-[1.75rem] p-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Community</p>
              {showResidentNav && (
                <Link href="/profile" className="text-[10px] font-bold text-primary hover:underline">Manage</Link>
              )}
            </div>
            {userCommunitiesList.length > 0 ? (
              <Select
                value={currentCommunityId || (userCommunitiesList[0]?.id ?? "")}
                onValueChange={(value) => {
                  if (value && user && value !== user.communityId) {
                    updateUser.mutate({ id: user.id, data: { communityId: value, version: user.version } });
                  }
                }}
                disabled={updateUser.isPending}
              >
                <SelectTrigger className="h-10 w-full rounded-xl font-bold text-primary border-primary/15 bg-background/90">
                  <SelectValue placeholder="Choose community" />
                </SelectTrigger>
                <SelectContent>
                  {userCommunitiesList.map((c: { id: string; name: string }) => (
                    <SelectItem key={c.id} value={c.id} className="font-medium">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-bold text-primary truncate">
                {user.communityId ? userCommunity?.name || "Loading..." : "No Community Joined"}
              </p>
            )}
          </div>

          {showResidentNav && (
            <div className="mt-5 retail-surface rounded-[1.75rem] px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">View Mode</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${viewMode === 'BUYER' ? 'bg-blue-500/10 text-blue-500' : 'bg-violet-500/10 text-violet-600'}`}>
                  {viewMode}
                </span>
              </div>
              <div className="flex items-center gap-3 bg-background/50 p-2 rounded-lg border border-border/50">
                <div className={`p-1.5 rounded-md ${viewMode === 'BUYER' ? 'bg-blue-500 text-white shadow-blue-500/20' : 'bg-muted text-muted-foreground'} transition-all shadow-sm`}>
                  <ShoppingCart size={14} />
                </div>
                <div className="flex-1">
                  <Switch
                    id="view-mode"
                    checked={viewMode === 'SELLER'}
                    onCheckedChange={(checked) => {
                      setViewMode(checked ? 'SELLER' : 'BUYER');
                      if (checked && !user.isSeller) {
                        updateUser.mutate(
                          { id: user.id, data: { isSeller: true, version: user.version } },
                          { onSuccess: (updated) => useAuthStore.getState().setUser(updated) }
                        );
                      }
                    }}
                    className="data-[state=checked]:bg-violet-500"
                  />
                </div>
                <div className={`p-1.5 rounded-md ${viewMode === 'SELLER' ? 'bg-violet-500 text-white shadow-violet-500/20' : 'bg-muted text-muted-foreground'} transition-all shadow-sm`}>
                  <Store size={14} />
                </div>
              </div>
              <p className="mt-2 text-[10px] text-center text-muted-foreground/60 italic font-medium">
                Switching to {viewMode === 'BUYER' ? 'Seller' : 'Buyer'} mode...
              </p>
            </div>
          )}

          {isAdminOrManager && (
            <div className="mt-5 retail-surface rounded-[1.75rem] px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Role Mode</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${useAsUser ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {useAsUser ? "User view" : user.role === "ADMIN" ? "Admin" : "Manager"}
                </span>
              </div>
              <div className="flex items-center gap-3 bg-background/50 p-2 rounded-lg border border-border/50">
                <div className={`p-1.5 rounded-md ${useAsUser ? 'bg-blue-500 text-white shadow-blue-500/20' : 'bg-muted text-muted-foreground'} transition-all shadow-sm`}>
                  <UserRound size={14} />
                </div>
                <div className="flex-1">
                  <Switch
                    id="use-as-user"
                    checked={useAsUser}
                    onCheckedChange={setUseAsUser}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
                <div className={`p-1.5 rounded-md ${!useAsUser ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-muted text-muted-foreground'} transition-all shadow-sm`}>
                  <Shield size={14} />
                </div>
              </div>
              <p className="mt-2 text-[10px] text-center text-muted-foreground/60 italic font-medium">
                {useAsUser ? "Using platform as a regular user" : `Back to ${user.role === "ADMIN" ? "Admin" : "Manager"} panel`}
              </p>
            </div>
          )}
        </div>

        {user.role === "ADMIN" && !useAsUser ? (
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
                    <SidebarMenuButton asChild isActive={location === item.url} className={`${navButtonClass} ${location === item.url ? 'bg-white shadow-[0_18px_35px_-24px_rgba(99,102,241,0.32)] border-primary/10' : ''}`}>
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
        ) : user.role === "COMMUNITY_MANAGER" && !useAsUser ? (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Navigation</SidebarGroupLabel>
              <SidebarGroupContent className="px-2">
                <SidebarMenu>
                  {[
                    { title: "Dashboard", url: "/manager", icon: LayoutDashboard },
                    { title: "Community Ads", url: "/forum", icon: MessageSquare },
                    { title: "Approvals", url: "/manager/approvals", icon: Shield },
                    { title: "Services", url: "/manager/services", icon: Wrench },
                    { title: "Products", url: "/manager/products", icon: Package },
                    { title: "Members", url: "/manager/members", icon: Users },
                  ].map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url} className={`${navButtonClass} ${location === item.url ? 'bg-white shadow-[0_18px_35px_-24px_rgba(99,102,241,0.32)] border-primary/10' : ''}`}>
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
                  {[
                    { title: "Browse Services", url: "/services", icon: Wrench },
                    { title: "Browse Products", url: "/products", icon: ShoppingBag },
                    { title: "My Services", url: "/my-services", icon: Package },
                    { title: "My Products", url: "/my-products", icon: Package },
                    { title: "Accept Payments", url: "/accept-payments", icon: Wallet },
                  ].map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url} className={`${navButtonClass} ${location === item.url ? 'bg-white shadow-[0_18px_35px_-24px_rgba(99,102,241,0.32)] border-primary/10' : ''}`}>
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
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Navigation</SidebarGroupLabel>
              <SidebarGroupContent className="px-2">
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url} className={`${navButtonClass} ${location === item.url ? 'bg-white shadow-[0_18px_35px_-24px_rgba(99,102,241,0.32)] border-primary/10' : ''}`}>
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

            {hasApprovedAccess && (
              <SidebarGroup>
                <SidebarGroupLabel className="px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 mt-4">Marketplace</SidebarGroupLabel>
                <SidebarGroupContent className="px-2">
                  <SidebarMenu>
                    {marketplaceItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={location === item.url} className={`${navButtonClass} ${location === item.url ? 'bg-white shadow-[0_18px_35px_-24px_rgba(99,102,241,0.32)] border-primary/10' : ''}`}>
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
            )}

            {/* Sub-communities: only those user is a member of */}
            {hasApprovedAccess && user.communityId && (() => {
              const subsOfParent = communities?.filter(c => c.parentId === user.communityId) ?? [];
              const memberSubIds = new Set(
                (userCommunitiesData ?? [])
                  .filter((m: { joinStatus: string; community: { id: string } }) => m.joinStatus === "ACTIVE" && m.community?.id)
                  .map((m: { community: { id: string } }) => m.community.id)
              );
              const visibleSubs = subsOfParent.filter(sub => memberSubIds.has(sub.id));
              return visibleSubs.length > 0 && (
                <SidebarGroup>
                  <SidebarGroupLabel className="px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 mt-4">Shops</SidebarGroupLabel>
                  <SidebarGroupContent className="px-2">
                    <SidebarMenu>
                      {visibleSubs.map((sub) => (
                        <SidebarMenuItem key={sub.id}>
                          <SidebarMenuButton asChild className={navButtonClass}>
                            <Link href={`/communities/${sub.id}`} className="flex items-center gap-3 w-full">
                              <Building2 className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                              <span className="text-sm font-medium text-muted-foreground/90 group-hover:text-primary">{sub.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })()}
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/60 p-4">
        <div className="flex flex-col gap-4">
          <Link href="/profile">
            <button className="retail-surface flex items-center gap-3 w-full rounded-[1.5rem] p-3 transition-all group text-left relative hover:translate-y-[-1px]">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                <User size={18} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-bold text-foreground truncate">{user.fullName}</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                  {user.role.toLowerCase().replace('_', ' ')}
                  {pendingInvites.length > 0 && (
                    <span className="ml-1 text-amber-600 font-bold"> • {pendingInvites.length} invite{pendingInvites.length > 1 ? "s" : ""}</span>
                  )}
                </span>
              </div>
            </button>
          </Link>

          <SidebarMenuButton
            onClick={() => logout.mutate()}
            className="flex h-auto items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-muted-foreground transition-all hover:border-destructive/10 hover:bg-destructive/5 hover:text-destructive group"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Sign Out</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
