import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/store/use-auth";
import { useCartStore } from "@/store/use-cart";
import { Redirect } from "wouter";

export function Layout({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    useCartStore.getState().ensureUserCart(user?.id ?? null);
  }, [user?.id]);

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <header className="flex h-16 items-center justify-between px-6 border-b bg-card/50 backdrop-blur-sm z-10 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-sm font-medium text-muted-foreground">{user.status}</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto h-full w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
