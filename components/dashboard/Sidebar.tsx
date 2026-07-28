/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, FileText, Users, Kanban,
  CheckSquare, UserCog, ChevronLeft, ChevronRight, LogOut, ShoppingBag, Landmark,
} from "lucide-react";
import { useUIStore } from "@/lib/store";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/invoices", icon: FileText, label: "Invoices" },
  { href: "/dashboard/quotations", icon: Users, label: "Quotations" },
  { href: "/dashboard/work-in-progress", icon: Kanban, label: "Work in Progress" },
  { href: "/dashboard/final-check", icon: CheckSquare, label: "Final Check" },
  { href: "/dashboard/purchases", icon: ShoppingBag, label: "Purchases" },
];

const ADMIN_ITEMS = [
  { href: "/dashboard/users", icon: UserCog, label: "Users" },
  { href: "/dashboard/accounts", icon: Landmark, label: "Accounts" },
];

const LogoIconSmall = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg viewBox="0 0 120 120" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M95 95 C 95 30, 45 5, 20 5 C 20 60, 60 95, 95 95 Z" fill="var(--brand-primary-light)" opacity="0.85"/>
    <path d="M95 95 C 80 25, 25 10, 5 30 C 25 75, 70 95, 95 95 Z" fill="var(--brand-primary)" opacity="0.9"/>
    <path d="M95 95 C 75 45, 15 35, 5 60 C 35 90, 80 95, 95 95 Z" fill="var(--brand-primary-dark)" />
    <path d="M95 95 C 70 65, 10 70, 5 85 C 40 100, 85 95, 95 95 Z" fill="var(--brand-accent)" />
  </svg>
);

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();

  const isAdmin = session?.user?.role === "ADMIN";
  const name = session?.user?.name || "User";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const collapsed = isSidebarCollapsed;

  return (
    <aside
      className={`hidden md:flex flex-col bg-brand-white border-r border-brand-border transition-all duration-300 relative shrink-0 ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
      style={{ minHeight: "100vh" }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-5 py-5 border-b border-brand-border ${collapsed ? "justify-center px-2" : ""}`}>
        <LogoIconSmall className="w-[28px] h-[28px] shrink-0" />
        {!collapsed && (
          <div className="flex flex-col justify-center">
            <div className="text-brand-forest font-semibold text-[15px] leading-none tracking-tight" style={{ fontFamily: "var(--font-quicksand)" }}>Ink & Print</div>
            <div className="text-brand-sage text-[9.5px] tracking-[0.3em] font-normal mt-[3px] ml-[1px]" style={{ fontFamily: "var(--font-quicksand)" }}>STUDIO</div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-6 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 py-[10px] pr-3 transition-colors duration-150 ${
                active
                  ? "bg-brand-cream text-brand-forest font-semibold border-l-[3px] border-brand-forest"
                  : "text-brand-black hover:bg-brand-cream/50 hover:text-brand-forest border-l-[3px] border-transparent font-medium"
              } ${collapsed ? "justify-center pl-0 pr-0" : "pl-[17px]"}`}
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? "text-brand-forest" : "text-brand-sage"}`} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className={`my-4 border-t border-brand-border/50 mx-4`} />
            <div className={`px-5 mb-2 text-xs font-semibold text-brand-muted tracking-wider uppercase ${collapsed ? "hidden" : "block"}`} style={{ fontFamily: "var(--font-quicksand)" }}>
              Admin
            </div>
            {ADMIN_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? label : undefined}
                  className={`flex items-center gap-3 py-[10px] pr-3 transition-colors duration-150 ${
                    active
                      ? "bg-brand-cream text-brand-forest font-semibold border-l-[3px] border-brand-forest"
                      : "text-brand-black hover:bg-brand-cream/50 hover:text-brand-forest border-l-[3px] border-transparent font-medium"
                  } ${collapsed ? "justify-center pl-0 pr-0" : "pl-[17px]"}`}
                  style={{ fontFamily: "var(--font-quicksand)" }}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${active ? "text-brand-forest" : "text-brand-sage"}`} />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className={`border-t border-brand-border p-4 ${collapsed ? "flex justify-center" : ""}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-forest/10 border border-brand-forest/20 flex items-center justify-center text-brand-forest text-sm font-bold shrink-0 shadow-sm" style={{ fontFamily: "var(--font-quicksand)" }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-brand-black truncate" style={{ fontFamily: "var(--font-quicksand)" }}>{name}</div>
              <div className="text-[11px] font-medium text-brand-muted uppercase tracking-wider" style={{ fontFamily: "var(--font-quicksand)" }}>{session?.user?.role}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 text-brand-muted hover:text-brand-danger hover:bg-brand-danger/10 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-brand-muted hover:text-brand-danger hover:bg-brand-danger/10 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3.5 top-20 w-7 h-7 bg-brand-white border border-brand-border rounded-full flex items-center justify-center text-brand-sage hover:text-brand-forest hover:shadow-md shadow-sm z-10 transition-all"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5 ml-0.5" /> : <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />}
      </button>
    </aside>
  );
}
