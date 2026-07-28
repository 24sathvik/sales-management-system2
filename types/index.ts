export type UserRole = "ADMIN" | "USER";

export interface DashboardStats {
  totalInvoices: number;
  activeLeads: number;
  itemsInWIP: number;
  pendingChecks: number;
}
