export type TourStep = { target: string; title: string; content: string };
export type TourPage = { route: string; label: string; steps: TourStep[] };

export const TOUR_PAGES: TourPage[] = [
  {
    route: "/dashboard",
    label: "Dashboard",
    steps: [
      { target: "[data-tour='dash-stats']", title: "Key Metrics", content: "These stat cards give you an instant pulse on your business. 'Urgent' means deliveries due within the configured window, while 'Overdue' means past the delivery date with no closure yet." },
      { target: "[data-tour='dash-wip']", title: "WIP Pipeline", content: "This summary mirrors live counts from your Work in Progress board, broken down exactly by your custom stages so you know where jobs are sitting." },
      { target: "[data-tour='dash-insights']", title: "Smart Insights", content: "These insights are automatically generated from real data—tracking overdue trends, WIP bottlenecks, and margin flags. Click the info icon on any number to see exactly how it's calculated." },
      { target: "[data-tour='dash-recent']", title: "Recent Activity", content: "Quickly access your latest generated invoices and drafted quotations right here without having to navigate away from the dashboard." },
      { target: "[data-tour='dash-team']", title: "Team Performance", content: "This leaderboard ranks staff by revenue and order volume to encourage healthy competition. If your business prefers not to gamify sales, this can be turned off entirely in System Settings." },
      { target: "[data-tour='dash-controls']", title: "Controls & Filters", content: "Use the date-range picker to compare performance across different periods, refresh data on demand, or export the current view for reporting." }
    ]
  },
  {
    route: "/dashboard/invoices",
    label: "Invoices",
    steps: [
      { target: "[data-tour='inv-list']", title: "Invoices List", content: "Manage your invoices here. Status badges clearly show what is active or closed, while urgent and overdue indicators help prioritize collections. You can also search and filter easily." },
      { target: "[data-tour='inv-new']", title: "New Invoice Workflow", content: "Clicking 'New Invoice' opens a form where you enter customer details, live-calculating line items, select GST rates, choose between flat or percentage discounts, and log advance payments to auto-calculate the final balance due." },
      { target: "[data-tour='inv-review']", title: "Review Step", content: "Before submitting any invoice, you must pass a Review step. This is a crucial last check to verify accuracy before committing financial data to the system." },
      { target: "[data-tour='inv-pdf']", title: "PDF Generation", content: "Once created, you can instantly download a beautifully formatted PDF of the invoice to send directly to your client." },
      { target: "[data-tour='inv-note']", title: "Automated Invoices", content: "Note: You won't always need to create invoices manually! Most invoices will appear here automatically the moment a Quotation is accepted." }
    ]
  },
  {
    route: "/dashboard/quotations",
    label: "Quotations",
    steps: [
      { target: "[data-tour='quo-list']", title: "Quotations Ledger", content: "Track all your proposals here. Search through them and monitor their statuses: Draft, Sent, Accepted, or Rejected." },
      { target: "[data-tour='quo-new']", title: "Drafting a Quotation", content: "The 'New Quotation' form includes internal tracking fields like 'Lead Source'—which is visible to staff but never appears on the final PDF. It also handles line items, discounts, GST, and validity dates." },
      { target: "[data-tour='quo-review']", title: "Review Phase", content: "Just like invoices, every quotation goes through a final review step to ensure pricing and terms are perfect before generation." },
      { target: "[data-tour='quo-accept']", title: "1-Click Accept (Crucial!)", content: "This is the most powerful feature: accepting a quotation automatically creates the matching invoice AND starts that order moving through the Work in Progress board. No manual re-entry needed anywhere!" },
      { target: "[data-tour='quo-pdf']", title: "Client Proposals", content: "You can generate a professional PDF proposal instantly from any quotation to present to your prospective clients." }
    ]
  },
  {
    route: "/dashboard/work-in-progress",
    label: "Work in Progress",
    steps: [
      { target: "[data-tour='wip-board']", title: "Production Kanban", content: "Welcome to the production floor! Each column here represents a production stage. These stages are completely configurable to match your unique business in the Workflow settings." },
      { target: "[data-tour='wip-drag']", title: "Moving Cards", content: "Simply drag and drop a card between stages to update its production status visually and instantly." },
      { target: "[data-tour='wip-checklists']", title: "Enforced Checklists", content: "This is a strict rule, not a suggestion: a card CANNOT be moved to the next stage until its current stage's checklist items are 100% checked off. This ensures zero skipped steps in production." },
      { target: "[data-tour='wip-mobile']", title: "Mobile Optimized", content: "If you view this on a phone or tablet on the shop floor, it automatically converts into a streamlined single-column list with a stage selector for ease of use." }
    ]
  },
  {
    route: "/dashboard/final-check",
    label: "Final Check",
    steps: [
      { target: "[data-tour='fc-intro']", title: "Quality Assurance", content: "This page acts as the absolute last quality check before an order is considered fully complete and ready for delivery." },
      { target: "[data-tour='fc-flow']", title: "The Final Step", content: "Cards arrive here automatically once they clear the final stage of the WIP board. Staff must complete a final checklist here to formally close out the job." }
    ]
  },
  {
    route: "/dashboard/users",
    label: "Users",
    steps: [
      { target: "[data-tour='usr-intro']", title: "Team Management", content: "This page is restricted to Admins only. Here you manage your entire staff directory and their access levels." },
      { target: "[data-tour='usr-roles']", title: "Roles & Permissions", content: "You can invite new team members and assign them roles like ADMIN or USER. Standard users are restricted from sensitive pages, such as seeing profit margins in the Purchases tab." }
    ]
  },
  {
    route: "/dashboard/accounts",
    label: "Accounts",
    steps: [
      { target: "[data-tour='acc-tx']", title: "Transactions", content: "A transaction is every single cash or online inflow and outflow logged against the business, from vendor payments to daily overheads." },
      { target: "[data-tour='acc-balance']", title: "Running Balance", content: "Your running balance updates dynamically. If you go back and edit or delete an older transaction, everything after it recalculates automatically and correctly." },
      { target: "[data-tour='acc-expenses']", title: "Monthly Expenses", content: "Monthly Expenses are a separate concept from standard transactions. They are used to track fixed, recurring overheads on a month-by-month basis." },
      { target: "[data-tour='acc-auto']", title: "Automated Entries", content: "Any time you log an advance or balance payment on an invoice, it automatically creates a linked transaction here—so you never have to double-enter financial data!" }
    ]
  },
  {
    route: "/dashboard/purchases",
    label: "Purchases",
    steps: [
      { target: "[data-tour='pur-intro']", title: "Cost Tracking", content: "This Admin-only page is for recording the actual costs incurred to fulfill a specific invoice—like designer fees, printer costs, and raw materials." },
      { target: "[data-tour='pur-margin']", title: "Live Profit Margins", content: "The system calculates exact profit margins automatically: it takes the invoice bill value minus the total recorded costs, displaying it as both a rupee amount and a percentage." },
      { target: "[data-tour='pur-status']", title: "Payment Status", content: "You can track the payment status of every single cost line to ensure you know exactly which vendors or designers have actually been paid." }
    ]
  },
  {
    route: "/dashboard/settings",
    label: "System Settings",
    steps: [
      { target: "[data-tour='set-intro']", title: "System Configuration", content: "This Admin-level panel houses your core business settings. You can toggle the gamified leaderboard, adjust GST rate options, and configure other global application preferences." }
    ]
  },
  {
    route: "/dashboard/settings/workflow",
    label: "Workflow",
    steps: [
      { target: "[data-tour='wf-pipeline']", title: "Pipeline Configuration", content: "This is where the WIP pipeline is configured. You can rename stages, reorder them, or change their colors and icons to match your shop floor." },
      { target: "[data-tour='wf-checklists']", title: "Checklist Definitions", content: "You can also define the specific checklist for each stage here. Add, remove, reorder items, and mark them as strictly required or purely optional." },
      { target: "[data-tour='wf-purpose']", title: "System Adaptability", content: "Different businesses run completely different production processes. This page lets ZyOps adapt perfectly to your company's workflow without touching a single line of code! You're ready to go!" }
    ]
  }
];
