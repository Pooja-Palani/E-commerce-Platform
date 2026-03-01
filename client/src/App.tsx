import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { useAuthStore } from "./store/use-auth";
import { useAuth } from "./hooks/use-auth-api";
import { LoadingSpinner } from "./components/ui/loading-spinner";

// Pages
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import CommunityMarketplace from "./pages/community-marketplace";
import GlobalMarketplace from "./pages/global-marketplace";
import SellerListings from "./pages/seller-listings";
import ManagerDashboard from "./pages/manager-dashboard";
import AdminDashboard from "./pages/admin-dashboard";

function Router() {
  const { isLoading, data: user } = useAuth();
  
  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background"><LoadingSpinner /></div>;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected Routes */}
      {!user ? (
        <Route>
          <Redirect to="/login" />
        </Route>
      ) : (
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/community" component={CommunityMarketplace} />
          <Route path="/global" component={GlobalMarketplace} />
          <Route path="/seller" component={SellerListings} />
          <Route path="/manager" component={ManagerDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route component={NotFound} />
        </Switch>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
