import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  return (
    <Switch>
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppLayout>
          <Router />
        </AppLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
