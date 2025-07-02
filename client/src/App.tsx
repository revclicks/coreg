import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Login } from "@/pages/login";
import { Register } from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Questions from "@/pages/questions";
import Campaigns from "@/pages/campaigns";
import Sites from "@/pages/sites";
import Stats from "@/pages/stats";
import AdvancedAnalytics from "@/pages/advanced-analytics";
import AnalyticsHub from "@/pages/analytics-hub";
import Data from "@/pages/data";
import AudienceSegments from "@/pages/audience-segments";
import ABTesting from "@/pages/ab-testing";
import Targeting from "@/pages/targeting";
import RTBManager from "@/pages/rtb-manager";
import PersonalizationHub from "@/pages/personalization-hub";
import FlowDemo from "@/pages/flow-demo";
import FlowTesting from "@/pages/flow-testing";
import LeadCollection from "@/pages/lead-collection";
import LeadWidgetTest from "@/pages/lead-widget-test";
import WidgetTest from "@/pages/widget-test";
import WidgetGenerator from "@/pages/widget-generator";
import FormData from "@/pages/form-data";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import NotFound from "@/pages/not-found";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={() => <Login />} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={() => <Dashboard />} />
      <Route path="/register" component={() => <Dashboard />} />
      <Route path="/" component={Dashboard} />
      <Route path="/questions" component={Questions} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/rtb-manager" component={RTBManager} />
      <Route path="/sites" component={Sites} />
      <Route path="/targeting" component={Targeting} />
      <Route path="/stats" component={Stats} />
      <Route path="/analytics" component={AdvancedAnalytics} />
      <Route path="/analytics-hub" component={AnalyticsHub} />
      <Route path="/personalization" component={PersonalizationHub} />
      <Route path="/data" component={Data} />
      <Route path="/audience-segments" component={AudienceSegments} />
      <Route path="/ab-testing" component={ABTesting} />
      <Route path="/flow-demo" component={FlowDemo} />
      <Route path="/flow-testing" component={FlowTesting} />
      <Route path="/lead-collection" component={LeadCollection} />
      <Route path="/lead-widget-test" component={LeadWidgetTest} />
      <Route path="/widget-test" component={WidgetTest} />
      <Route path="/widget-generator" component={WidgetGenerator} />
      <Route path="/form-data" component={FormData} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Router />;
  }

  return (
    <AppLayout>
      <Router />
    </AppLayout>
  );
}

export default App;
