import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "./hooks/use-auth-api";
import { useHasApprovedAccess } from "./hooks/use-communities";
import { LoadingSpinner } from "./components/ui/loading-spinner";
import { useAuthStore } from "./store/use-auth";
import { Redirect } from "wouter";

// Pages
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import CommunityMarketplace from "./pages/community-marketplace";
import GlobalMarketplace from "./pages/global-marketplace";
import SellerListings from "./pages/seller-listings";
import ManagerDashboard from "./pages/manager-dashboard";
import ManagerApprovals from "./pages/manager-approvals";
import ManagerServices from "./pages/manager-services";
import ManagerProducts from "./pages/manager-products";
import ManagerMembers from "./pages/manager-members";
import AdminDashboard from "./pages/admin-dashboard";
import AdminUsers from "./pages/admin-users";
import AdminCommunities from "./pages/admin-communities";
import AdminAnalytics from "./pages/admin-analytics";
import AdminSettings from "./pages/admin-settings";

// New Pages
import MyActivity from "./pages/my-activity";
import MyServices from "./pages/my-services";
import MyProducts from "./pages/my-products";
import ListService from "./pages/list-service";
import ListProduct from "./pages/list-product";
import Cart from "./pages/cart";
import ServicesMarketplace from "./pages/services-marketplace";
import ProductsMarketplace from "./pages/products-marketplace";
import Profile from "./pages/profile";
import Subcommunities from "./pages/subcommunities";
import Forum from "./pages/forum";
import PostDetail from "./pages/post-detail";
import ListingDetail from "./pages/listing-detail";
import AcceptPayments from "./pages/accept-payments";
import Orders from "./pages/orders";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Route {...rest} component={Component} />;
}

/** Protects marketplace routes: redirects to / when user has no ACTIVE community (e.g. PENDING or not joined). */
function ApprovedResidentRoute({ component: Component, ...rest }: { component: React.ComponentType<any>; path: string }) {
  const { user } = useAuthStore();
  const { hasApprovedAccess, isLoading } = useHasApprovedAccess();

  if (!user) return <Redirect to="/login" />;
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }
  if (!hasApprovedAccess) return <Redirect to="/" />;
  return <Route {...rest} component={Component} />;
}

function Router() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background"><LoadingSpinner /></div>;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ApprovedResidentRoute path="/activity" component={MyActivity} />
      <ApprovedResidentRoute path="/my-services" component={MyServices} />
      <ApprovedResidentRoute path="/my-products" component={MyProducts} />
      <ApprovedResidentRoute path="/list-service/:id" component={ListService} />
      <ApprovedResidentRoute path="/list-service" component={ListService} />
      <ApprovedResidentRoute path="/list-product/:id" component={ListProduct} />
      <ApprovedResidentRoute path="/list-product" component={ListProduct} />
      <ApprovedResidentRoute path="/cart" component={Cart} />
      <ApprovedResidentRoute path="/orders" component={Orders} />
      <ApprovedResidentRoute path="/services" component={ServicesMarketplace} />
      <ApprovedResidentRoute path="/products" component={ProductsMarketplace} />
      <ApprovedResidentRoute path="/subcommunities" component={Subcommunities} />
      <ApprovedResidentRoute path="/accept-payments" component={AcceptPayments} />
      <ApprovedResidentRoute path="/forum" component={Forum} />
      <ApprovedResidentRoute path="/forum/post/:id" component={PostDetail} />
      <ApprovedResidentRoute path="/community" component={CommunityMarketplace} />
      <ApprovedResidentRoute path="/communities/:id" component={CommunityMarketplace} />
      <ApprovedResidentRoute path="/listings/:id" component={ListingDetail} />
      <ApprovedResidentRoute path="/global" component={GlobalMarketplace} />
      <ApprovedResidentRoute path="/seller" component={SellerListings} />
      <ProtectedRoute path="/manager" component={ManagerDashboard} />
      <ProtectedRoute path="/manager/approvals" component={ManagerApprovals} />
      <ProtectedRoute path="/manager/services" component={ManagerServices} />
      <ProtectedRoute path="/manager/products" component={ManagerProducts} />
      <ProtectedRoute path="/manager/members" component={ManagerMembers} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/users" component={AdminUsers} />
      <ProtectedRoute path="/admin/communities" component={AdminCommunities} />
      <ProtectedRoute path="/admin/analytics" component={AdminAnalytics} />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} />
      <Route component={NotFound} />
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
