import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Members from "@/pages/members";
import AddMember from "@/pages/member-new";
import MemberDetail from "@/pages/member-detail";
import Measurements from "@/pages/measurements";
import Attendance from "@/pages/attendance";
import Employees from "@/pages/employees";
import Billing from "@/pages/billing";
import Inventory from "@/pages/inventory";
import Accounts from "@/pages/accounts";
import Reports from "@/pages/reports";
import Notifications from "@/pages/notifications";
import AdminUsers from "@/pages/admin-users";
import BusinessSettings from "@/pages/business-settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground gap-2">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p>Coming soon</p>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/members" component={Members} />
        <Route path="/members/new" component={AddMember} />
        <Route path="/members/:id" component={MemberDetail} />
        <Route path="/measurements" component={Measurements} />
        <Route path="/attendance" component={Attendance} />
        <Route path="/employees" component={Employees} />
        <Route path="/billing" component={Billing} />
        <Route path="/sales" component={() => <PlaceholderPage title="POS & Sales" />} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/users" component={AdminUsers} />
        <Route path="/reports" component={Reports} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/business" component={BusinessSettings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
