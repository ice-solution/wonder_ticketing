import { Redirect } from "wouter";

/** 舊路徑 /dashboard/admin → 精選活動分頁 */
export function DashboardAdmin() {
  return <Redirect to="/dashboard/admin/events" />;
}
