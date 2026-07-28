/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, FileText, Users, Kanban,
  CheckSquare, UserCog, ChevronLeft, ChevronRight, LogOut, IndianRupee, ShoppingCart, Settings
} from "lucide-react";
import { useUIStore } from "@/lib/store";
import { ZyOpsLogo } from "@/components/ui/ZyOpsLogo";

const NAV_GROUPS = [
  {
    label: "WORKSPACE",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/dashboard/invoices", icon: FileText, label: "Invoices" },
      { href: "/dashboard/quotations", icon: FileText, label: "Quotations" },
    ]
  },
  {
    label: "OPERATIONS",
    items: [
      { href: "/dashboard/work-in-progress", icon: Kanban, label: "Work in Progress" },
      { href: "/dashboard/final-check", icon: CheckSquare, label: "Final Check" },
    ]
  }
];

const ADMIN_GROUP = {
  label: "MANAGEMENT",
  items: [
    { href: "/dashboard/users", icon: UserCog, label: "Users" },
    { href: "/dashboard/accounts", icon: IndianRupee, label: "Accounts" },
    { href: "/dashboard/purchases", icon: ShoppingCart, label: "Purchases" },
    { href: "/dashboard/settings", icon: Settings, label: "System Settings" },
    { href: "/dashboard/settings/workflow", icon: CheckSquare, label: "Workflow" },
  ]
};

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();

  const isAdmin = session?.user?.role === "ADMIN";
  const name = session?.user?.name || "User";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/dashboard/settings") return pathname === "/dashboard/settings";
    return pathname.startsWith(href);
  };

  const collapsed = isSidebarCollapsed;

  const renderNavGroup = (group: { label: string, items: any[] }) => (
    <div key={group.label} className="mb-4">
      {!collapsed && (
        <div className="text-[10px] uppercase tracking-[0.10em] text-[var(--brand-primary)] opacity-40 px-4 pt-5 pb-1.5 font-semibold font-sans">
          {group.label}
        </div>
      )}
      {collapsed && <div className="h-4" />}
      {group.items.map(({ href, icon: Icon, label }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            className={`flex items-center gap-3 h-[42px] mx-2.5 my-[1px] transition-all duration-150 ${
              active
                ? "bg-[var(--bg-sidebar-active)] text-[var(--text-sidebar-active)] border-l-[3px] border-[var(--brand-primary)] rounded-r-md ml-0 pl-[21px] font-[600] shadow-none"
                : "text-[var(--text-sidebar)] hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-sidebar-active)] rounded-md border-l-[3px] border-transparent font-medium"
            } ${collapsed && !active ? "justify-center px-0 mx-1" : (!collapsed && !active ? "px-3" : "")} ${
              href === "/dashboard/work-in-progress" ? "tour-sidebar-wip" : ""
            } ${href === "/dashboard/invoices" ? "tour-sidebar-invoices" : ""} ${
              href === "/dashboard/quotations" ? "tour-sidebar-quotations" : ""
            } ${href === "/dashboard/settings/workflow" ? "tour-sidebar-settings" : ""} ${
              href === "/dashboard/final-check" ? "tour-sidebar-final-check" : ""
            } ${href === "/dashboard/purchases" ? "tour-sidebar-purchases" : ""} ${
              href === "/dashboard/accounts" ? "tour-sidebar-accounts" : ""
            } ${href === "/dashboard/users" ? "tour-sidebar-users" : ""}`}
          >
            <Icon className={`w-[17px] h-[17px] shrink-0 ${active ? "text-[var(--brand-primary)]" : ""}`} />
            {!collapsed && <span className="text-[13.5px] font-sans">{label}</span>}
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside
      className={`flex flex-col glass-surface-dark transition-all duration-300 relative shrink-0 ${
        collapsed ? "w-16" : "w-[232px]"
      }`}
      style={{ height: "100vh", borderRight: '1px solid var(--border-sidebar)' }}
    >
      {/* Logo */}
      <div 
        className={`flex items-center gap-3 h-[68px] shrink-0 ${collapsed ? "justify-center px-0" : "px-4"}`}
        style={{ borderBottom: '1px solid var(--border-sidebar)' }}
      >
        {collapsed ? (
          <ZyOpsLogo size="sm" showWordmark={false} theme="dark" />
        ) : (
          <ZyOpsLogo size="md" showWordmark={true} theme="dark" />
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {NAV_GROUPS.map(renderNavGroup)}
        {isAdmin && renderNavGroup(ADMIN_GROUP)}
      </nav>

      {/* User Section */}
      <div 
        className={`p-[14px] shrink-0 ${collapsed ? "flex justify-center" : ""}`}
        style={{ borderTop: '1px solid var(--border-sidebar)' }}
      >
        {!collapsed ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 min-w-0">
              <div 
                className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-white shrink-0 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)]"
              >
                <span className="font-display text-[13px] font-bold">{initials}</span>
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-[13px] font-semibold text-[var(--text-sidebar-active)] truncate">{name}</div>
                <div className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase truncate">{session?.user?.role || "USER"}</div>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--status-error)] rounded-md transition-colors shrink-0"
              title="Sign out"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--status-error)] hover:bg-[var(--bg-sidebar-hover)] rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="hidden md:flex absolute -right-3 top-24 bg-[var(--bg-sidebar-solid)] border border-[var(--border-sidebar)] text-[var(--text-sidebar)] rounded-full p-1 hover:text-[var(--brand-primary)] transition-colors z-50 shadow-md"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
});
