import { 
  Building2, Globe, LayoutDashboard, Settings, 
  ShoppingBag, Shield, LogOut, Tags 
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
import { Link, useLocation } from "wouter";

export function AppSidebar() {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const [location] = useLocation();

  if (!user) return null;

  const residentItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Community Market", url: "/community", icon: Building2 },
    { title: "Global Market", url: "/global", icon: Globe },
    ...(user.isSeller ? [{ title: "My Listings", url: "/seller", icon: Tags }] : []),
  ];

  const managerItems = [
    { title: "Manager Dashboard", url: "/manager", icon: Shield },
  ];

  const adminItems = [
    { title: "Admin Panel", url: "/admin", icon: Settings },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-6">
          <div className="flex items-center gap-3 font-semibold text-xl tracking-tight text-primary">
            <ShoppingBag className="w-6 h-6" />
            NexusMarket
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Resident Access</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {residentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} className="flex items-center gap-3 w-full">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(user.role === "COMMUNITY_MANAGER" || user.role === "ADMIN") && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managerItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} className="flex items-center gap-3 w-full">
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user.role === "ADMIN" && (
          <SidebarGroup>
            <SidebarGroupLabel>System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} className="flex items-center gap-3 w-full">
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-4">
          <div className="px-2 py-1">
            <p className="text-sm font-medium leading-none">{user.fullName}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
          </div>
          <SidebarMenuButton 
            onClick={() => logout.mutate()} 
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
