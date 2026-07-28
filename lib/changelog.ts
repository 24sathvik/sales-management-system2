export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string[];
}

export const changelogData: ChangelogEntry[] = [
  {
    version: "v1.2.0",
    date: "July 24, 2026",
    title: "ZyOps Assistant & Analytics",
    description: [
      "✨ Added contextual Help Assistant across all pages",
      "📈 Smart business insights and predictive revenue projections",
      "🧭 Interactive first-time user onboarding tour",
      "🔍 Deep-dive math tooltips for all financial metrics",
    ]
  },
  {
    version: "v1.1.0",
    date: "July 20, 2026",
    title: "Pitch-Ready Polish",
    description: [
      "💎 Rebuilt UI with premium glassmorphism styling",
      "📊 Added transaction ledgers and improved empty states",
      "📄 Export robust, branded PDFs for quotations and invoices",
      "⚡ Blazing fast Postgres-backed rate limiting",
    ]
  },
  {
    version: "v1.0.0",
    date: "July 15, 2026",
    title: "Initial Launch",
    description: [
      "🚀 Core sales management system launched",
      "📋 Quotations, Invoices, and Work in Progress (WIP)",
      "🔐 Role-based access control (Admin & User)",
    ]
  }
];
