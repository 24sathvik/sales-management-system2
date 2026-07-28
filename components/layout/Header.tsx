/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { memo } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, LogOut, Sparkles, PlayCircle, Menu, X, Download } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ResourcesModal } from "@/components/dashboard/ResourcesModal";
import { useUIStore } from "@/lib/store";
import { Sidebar } from "@/components/layout/Sidebar";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/invoices": "Invoices",
  "/dashboard/invoices/new": "New Invoice",
  "/dashboard/quotations": "Quotations",
  "/dashboard/work-in-progress": "Work in Progress",
  "/dashboard/final-check": "Final Check",
  "/dashboard/users": "Users",
  "/dashboard/accounts": "Accounts",
  "/dashboard/purchases": "Purchases",
};

function getTitle(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  if (pathname.includes("/invoices/") && pathname.includes("/edit")) return "Edit Invoice";
  if (pathname.includes("/invoices/")) return "Invoice Details";
  return "Dashboard";
}

function getBreadcrumbs(pathname: string) {
  const crumbs: { label: string; href: string }[] = [{ label: "Dashboard", href: "/dashboard" }];
  if (pathname === "/dashboard") return crumbs;

  const segments = pathname.replace("/dashboard/", "").split("/");
  let accumulated = "/dashboard";

  for (const seg of segments) {
    if (!seg) continue;
    accumulated += `/${seg}`;
    const label = ROUTE_LABELS[accumulated] || (seg.startsWith("INV-") ? seg : seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "));
    crumbs.push({ label, href: accumulated });
  }

  return crumbs;
}

export const Header = memo(function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isMobileMenuOpen, setMobileMenuOpen, pwaPrompt, setPwaPrompt } = useUIStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [demoDismissed, setDemoDismissed] = useState(true); // default true to avoid flicker, then update in effect
  const dropdownRef = useRef<HTMLDivElement>(null);

  const name = session?.user?.name || "User";
  const role = session?.user?.role;
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const title = getTitle(pathname);
  const breadcrumbs = getBreadcrumbs(pathname);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);

    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      setDemoDismissed(localStorage.getItem("zyops_demo_dismissed") === "true");
    }

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-[56px] glass-surface border-b border-border px-4 md:px-6 flex items-center justify-between shrink-0 z-20 sticky top-0">
      {/* Left: Hamburger + Title + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-1.5 -ml-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex flex-col justify-center">
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-[14px]">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={crumb.href} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-text-muted">/</span>}
                  {isLast ? (
                    <span className="text-text-heading font-semibold tracking-tight">{crumb.label}</span>
                  ) : (
                    <a href={crumb.href} className="text-text-secondary hover:text-text-heading transition-colors">{crumb.label}</a>
                  )}
                </span>
              );
            })}
          </nav>
        )}
      </div>
      </div>

      {/* Right: User Dropdown */}
      <div className="relative flex items-center gap-3" ref={dropdownRef}>
        {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && !demoDismissed && (
          <div className="hidden sm:flex items-center gap-2 bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border border-[var(--status-warning)]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-warning)] animate-pulse" />
            Demo Data Active
            <button
              onClick={() => {
                setDemoDismissed(true);
                localStorage.setItem("zyops_demo_dismissed", "true");
              }}
              className="ml-1 text-[var(--status-warning-text)] hover:brightness-90 focus:outline-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {pwaPrompt && (
          <button
            onClick={async () => {
              pwaPrompt.prompt();
              const { outcome } = await pwaPrompt.userChoice;
              if (outcome === "accepted") {
                setPwaPrompt(null);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-status-success hover:bg-green-600 rounded-full transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        <div className="relative" id="resources-popover-container">
          <button
            onClick={() => setResourcesOpen(!resourcesOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-gold bg-brand-gold/10 hover:bg-brand-gold/20 rounded-full transition-colors border border-brand-gold/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Resources</span>
          </button>
          
          <ResourcesModal isOpen={resourcesOpen} onClose={() => setResourcesOpen(false)} />
        </div>

        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-card-hover transition-colors text-[14px]"
        >
          <div 
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white text-[12px] font-bold font-display"
            style={{ backgroundColor: 'var(--brand-gold)' }}
          >
            {initials}
          </div>
          <span className="hidden sm:block font-semibold text-text-heading max-w-[120px] truncate">{name}</span>
          <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border border-border shadow-lg z-50 py-1 animate-fade-in">
            <div className="px-4 py-3 border-b border-border">
              <div className="font-semibold text-[14px] text-text-heading">{name}</div>
              <div className="text-[12px] text-text-secondary mt-0.5 flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${role === "ADMIN" ? "bg-status-success" : "bg-status-info"}`} />
                {role}
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-status-danger hover:bg-status-danger-bg transition-colors"
            >
              <LogOut className="w-[18px] h-[18px]" />
              Sign Out
            </button>
          </div>
        )}
      </div>



      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex w-[280px] max-w-[calc(100%-3rem)] flex-col shadow-2xl animate-in slide-in-from-left bg-transparent">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-4 top-4 p-2 text-text-muted hover:text-text-primary z-50 bg-background/50 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex-1 overflow-y-auto" onClick={() => setMobileMenuOpen(false)}>
              <Sidebar />
            </div>
          </div>
        </div>
      )}
    </header>
  );
});
