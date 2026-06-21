import { Route, Switch, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { Landing } from "@/pages/Landing";
import { Home } from "@/pages/Home";
import { EventPage } from "@/pages/EventPage";
import { Checkout } from "@/pages/Checkout";
import { OrderConfirmation } from "@/pages/OrderConfirmation";
import { MyTickets } from "@/pages/MyTickets";
import { DashboardEvents } from "@/pages/dashboard/Events";
import { EventForm } from "@/pages/dashboard/EventForm";
import { EventEdit } from "@/pages/dashboard/EventEdit";
import { DashboardOrders } from "@/pages/dashboard/Orders";
import { DashboardOrderDetail } from "@/pages/dashboard/OrderDetail";
import { DashboardCheckIn } from "@/pages/dashboard/CheckIn";
import { DashboardAnalytics } from "@/pages/dashboard/Analytics";
import { DashboardCrm } from "@/pages/dashboard/Crm";
import { DashboardReferrals } from "@/pages/dashboard/Referrals";
import { DashboardSeats } from "@/pages/dashboard/Seats";
import { DashboardSubscription } from "@/pages/dashboard/Subscription";
import { DashboardIntegrations } from "@/pages/dashboard/Integrations";
import { DashboardAdmin } from "@/pages/dashboard/Admin";
import { AdminEventsPage } from "@/pages/dashboard/AdminEvents";
import { AdminUsersPage } from "@/pages/dashboard/AdminUsers";
import { EmbedPage } from "@/pages/EmbedPage";
import { Login } from "@/pages/Login";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/events" component={Home} />
      <Route path="/event/:slug" component={EventPage} />
      <Route path="/embed/:slug" component={EmbedPage} />
      <Route path="/checkout/:slug" component={Checkout} />
      <Route path="/order/:orderNumber" component={OrderConfirmation} />
      <Route path="/my-tickets" component={MyTickets} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={DashboardEvents} />
      <Route path="/dashboard/events/new" component={EventForm} />
      <Route path="/dashboard/events/:id/edit" component={EventEdit} />
      <Route path="/dashboard/orders" component={DashboardOrders} />
      <Route path="/dashboard/orders/:orderNumber" component={DashboardOrderDetail} />
      <Route path="/dashboard/check-in" component={DashboardCheckIn} />
      <Route path="/dashboard/analytics" component={DashboardAnalytics} />
      <Route path="/dashboard/crm" component={DashboardCrm} />
      <Route path="/dashboard/referrals" component={DashboardReferrals} />
      <Route path="/dashboard/seats" component={DashboardSeats} />
      <Route path="/dashboard/subscription" component={DashboardSubscription} />
      <Route path="/dashboard/integrations" component={DashboardIntegrations} />
      <Route path="/dashboard/admin/events" component={AdminEventsPage} />
      <Route path="/dashboard/admin/users" component={AdminUsersPage} />
      <Route path="/dashboard/admin" component={DashboardAdmin} />
      <Route>404</Route>
    </Switch>
  );
}

export function App() {
  const [location] = useLocation();

  return (
    <PageTransition>
      <Switch location={location}>
        <Route path="/" component={Landing} />
        <Route>
          <Layout>
            <AppRoutes />
          </Layout>
        </Route>
      </Switch>
    </PageTransition>
  );
}
