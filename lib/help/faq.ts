export interface FAQ {
  id: string;
  category: string;
  question: string;
  keywords: string[];
  answer: string;
  relevantOn?: string[]; // Routes where this FAQ should be suggested
}

export const faqData: FAQ[] = [
  // --- Getting Started ---
  {
    id: "getting-started-1", category: "Getting Started",
    question: "How do I use the product tour again?",
    keywords: ["tour", "help", "guide", "onboarding", "start"],
    answer: "You can restart the interactive product tour at any time by clicking the 'Restart Tour' button in your user profile dropdown in the top right corner of the dashboard.",
    relevantOn: ["/dashboard"]
  },
  {
    id: "getting-started-2", category: "Getting Started",
    question: "What is the dashboard's 'Urgent' deliveries logic?",
    keywords: ["dashboard", "urgent", "count", "metrics", "deliveries", "this week"],
    answer: "The 'Urgent' metric (Deliveries This Week) counts active invoices where the 'Final Delivery Date' falls within the next 7 days, helping you prioritize upcoming deadlines.",
    relevantOn: ["/dashboard"]
  },
  {
    id: "getting-started-3", category: "Getting Started",
    question: "What is the dashboard's 'Overdue' logic?",
    keywords: ["dashboard", "overdue", "count", "metrics", "deliveries", "late"],
    answer: "The 'Overdue' metric counts active invoices where the 'Final Delivery Date' is strictly before today's date, indicating jobs that have missed their deadline.",
    relevantOn: ["/dashboard"]
  },
  {
    id: "getting-started-4", category: "Getting Started",
    question: "How do I search for a specific invoice or quotation?",
    keywords: ["search", "find", "locate", "invoice", "quotation"],
    answer: "You can use the global search bar at the top of the dashboard to search for invoice numbers, quotation numbers, or customer names across all records.",
    relevantOn: ["/dashboard"]
  },
  {
    id: "getting-started-5", category: "Getting Started",
    question: "Can I use the system on a mobile device?",
    keywords: ["mobile", "phone", "tablet", "responsive"],
    answer: "Yes, the system is fully responsive. On mobile devices, the sidebar becomes a collapsible menu, and tables automatically convert into a card-based layout for easier reading and interaction.",
    relevantOn: ["/dashboard"]
  },
  {
    id: "getting-started-6", category: "Getting Started",
    question: "How do I update my profile settings?",
    keywords: ["profile", "settings", "update", "account"],
    answer: "Currently, profile information is managed centrally by an ADMIN. If you need to update your name or email, please contact a system administrator to adjust it in the Management > Users section.",
    relevantOn: ["/dashboard"]
  },
  {
    id: "getting-started-7", category: "Getting Started",
    question: "Where can I see an overview of my daily tasks?",
    keywords: ["daily", "tasks", "overview", "what to do"],
    answer: "The Dashboard provides a snapshot of urgent and overdue jobs. Additionally, the 'Work in Progress' (Kanban board) gives you a complete visual overview of all active tasks and what stage they are in.",
    relevantOn: ["/dashboard"]
  },
  
  // --- Quotations ---
  {
    id: "quotations-1", category: "Quotations",
    question: "How do I create a new quotation?",
    keywords: ["create", "new", "quotation", "quote", "draft"],
    answer: "Navigate to Workspace > Quotations and click 'New Quotation'. Fill in the customer details, add your line items (specifying descriptions, quantities, unit prices), apply any overall discounts or GST, and click 'Save'. The quotation will initially be in DRAFT status.",
    relevantOn: ["/dashboard/quotations"]
  },
  {
    id: "quotations-2", category: "Quotations",
    question: "How does accepting a quotation auto-generate an invoice (Pipeline)?",
    keywords: ["quotation", "accept", "invoice", "auto-generate", "pipeline", "workflow"],
    answer: "When a quotation is marked as 'ACCEPTED', the system automatically creates a matching ACTIVE Invoice. It copies all customer details, line items, discounts, GST, and totals directly. Simultaneously, it creates a new Work-In-Progress (WIP) card for production tracking, linking everything together in a single automated pipeline.",
    relevantOn: ["/dashboard/quotations", "/dashboard/invoices"]
  },
  {
    id: "quotations-3", category: "Quotations",
    question: "How do I send a quotation to a customer?",
    keywords: ["send", "email", "share", "pdf", "customer"],
    answer: "Open the quotation details and click the 'Download PDF' button. The system generates a clean, professional PDF without internal details (like Lead Source) that you can attach to an email or send to your customer.",
    relevantOn: ["/dashboard/quotations"]
  },
  {
    id: "quotations-4", category: "Quotations",
    question: "What is a Lead Source and where is it visible?",
    keywords: ["lead", "source", "marketing", "referral"],
    answer: "Lead Source tracks where a customer came from (e.g., 'Website', 'Referral'). It is only visible internally in the Quotation edit/view screens and is strictly hidden from the customer-facing generated PDF.",
    relevantOn: ["/dashboard/quotations"]
  },
  {
    id: "quotations-5", category: "Quotations",
    question: "Can I edit an accepted quotation?",
    keywords: ["edit", "accepted", "change", "modify"],
    answer: "Once a quotation is ACCEPTED, it becomes read-only to preserve the historical record of what the customer agreed to. To make changes, you should instead edit the generated Invoice.",
    relevantOn: ["/dashboard/quotations"]
  },
  {
    id: "quotations-6", category: "Quotations",
    question: "What happens if a quotation is rejected?",
    keywords: ["reject", "lost", "fail"],
    answer: "Marking a quotation as REJECTED updates its status for your records and prevents it from being converted into an invoice. It remains in the system for historical analysis.",
    relevantOn: ["/dashboard/quotations"]
  },
  {
    id: "quotations-7", category: "Quotations",
    question: "Can I convert a rejected quotation back to draft?",
    keywords: ["revert", "draft", "recover"],
    answer: "Yes, you can edit a REJECTED quotation and change its status back to DRAFT if negotiations resume with the customer.",
    relevantOn: ["/dashboard/quotations"]
  },

  // --- Invoices ---
  {
    id: "invoices-1", category: "Invoices",
    question: "What does the ACTIVE invoice status mean?",
    keywords: ["active", "status", "meaning"],
    answer: "An ACTIVE invoice means the job is currently in progress. Production is ongoing, or the final payment is still pending. The corresponding WIP card is active on the Kanban board.",
    relevantOn: ["/dashboard/invoices"]
  },
  {
    id: "invoices-2", category: "Invoices",
    question: "What does the CLOSED invoice status mean?",
    keywords: ["closed", "status", "meaning", "done"],
    answer: "A CLOSED invoice means the job is completely finished. The product has been delivered, and all balances have been settled. No further action is required.",
    relevantOn: ["/dashboard/invoices"]
  },
  {
    id: "invoices-3", category: "Invoices",
    question: "What does the CANCELLED invoice status mean?",
    keywords: ["cancelled", "void", "status"],
    answer: "A CANCELLED invoice indicates that the order was voided after being created. It is removed from the active production pipeline and revenue calculations.",
    relevantOn: ["/dashboard/invoices"]
  },
  {
    id: "invoices-4", category: "Invoices",
    question: "How is GST calculated on an invoice?",
    keywords: ["gst", "tax", "calculate", "math"],
    answer: "GST is calculated on the subtotal *after* the discount has been applied. The formula is: (Subtotal - Discount) * (GST Percentage / 100). The standard Indian GST rates (0%, 5%, 12%, 18%, 28%) are selectable from a dropdown.",
    relevantOn: ["/dashboard/invoices"]
  },
  {
    id: "invoices-5", category: "Invoices",
    question: "How is the discount applied to an invoice?",
    keywords: ["discount", "reduce", "price"],
    answer: "The discount is applied as a flat currency amount subtracted from the sum of all line items (the subtotal). It is applied *before* GST is calculated.",
    relevantOn: ["/dashboard/invoices"]
  },
  {
    id: "invoices-7", category: "Invoices",
    question: "How do I assign a staff member to an invoice?",
    keywords: ["assign", "staff", "owner", "responsibility"],
    answer: "When editing an invoice, you can select an 'Assignee' from the dropdown list of active users. This person becomes responsible for tracking the invoice through production.",
    relevantOn: ["/dashboard/invoices"]
  },
  {
    id: "invoices-8", category: "Invoices",
    question: "Can I add items to an invoice after it is created?",
    keywords: ["add", "items", "edit", "lines"],
    answer: "Yes, as long as the invoice is in the ACTIVE status, you can edit it and add, remove, or modify line items. All totals, taxes, and balances will recalculate automatically.",
    relevantOn: ["/dashboard/invoices"]
  },

  // --- WIP & Production ---
  {
    id: "wip-1", category: "WIP & Production",
    question: "How do I configure custom Workflow Stages?",
    keywords: ["workflow", "stages", "custom", "phases", "setup"],
    answer: "Admins can go to Management > Workflow to define custom pipeline stages. You can set the stage name, color, icon, and order. These stages dictate the columns on your Kanban board.",
    relevantOn: ["/dashboard/work-in-progress", "/dashboard/settings/workflow"]
  },
  {
    id: "wip-2", category: "WIP & Production",
    question: "How do I configure Checklists for a stage?",
    keywords: ["checklist", "template", "setup", "configure", "requirements"],
    answer: "In Management > Workflow, selecting a stage allows you to edit its Checklist Template. You can add items, mark them as 'Required', and reorder them. These items must be completed before a WIP card can leave that stage.",
    relevantOn: ["/dashboard/work-in-progress", "/dashboard/settings/workflow"]
  },
  {
    id: "wip-3", category: "WIP & Production",
    question: "How do I move a WIP card and why is it blocked?",
    keywords: ["wip", "kanban", "move", "drag", "drop", "checklist", "blocked"],
    answer: "To move a Work-In-Progress card to the next stage, you must first complete all checklist items for its current stage. The system enforces strict QC by blocking stage transitions until the mandatory checklist is 100% checked. Click the checklist icon on the card to complete items.",
    relevantOn: ["/dashboard/work-in-progress"]
  },
  {
    id: "wip-4", category: "WIP & Production",
    question: "How do I complete the Final Check?",
    keywords: ["final", "check", "complete", "finish", "dispatch"],
    answer: "Go to Operations > Final Check. This screen lists all jobs that have reached the end of the production pipeline. You review the final details, complete the mandatory Final Dispatch checklist, and click 'Mark Complete'. This removes the card from the active WIP board.",
    relevantOn: ["/dashboard/final-check"]
  },
  {
    id: "wip-5", category: "WIP & Production",
    question: "What does the 'Payment Pending' stage mean?",
    keywords: ["payment", "pending", "stage", "money"],
    answer: "When production is complete but you are awaiting final payment before dispatch, you can move a card to the Payment Pending stage. This pauses the production timer while you handle collections.",
    relevantOn: ["/dashboard/work-in-progress"]
  },
  {
    id: "wip-6", category: "WIP & Production",
    question: "How does AI bottleneck detection work?",
    keywords: ["ai", "bottleneck", "insights", "stuck", "delay"],
    answer: "The Insights engine analyzes how long cards spend in each Workflow Stage. If multiple cards are stalled in the same stage significantly longer than average, the AI flags that stage as a bottleneck on your dashboard, allowing you to reallocate resources.",
    relevantOn: ["/dashboard"]
  },
  {
    id: "wip-7", category: "WIP & Production",
    question: "What does the color priority dot mean on a WIP card?",
    keywords: ["color", "dot", "priority", "urgent", "red", "green"],
    answer: "The dot indicates urgency based on the Final Delivery Date: Red means overdue or due within 2 days. Amber means due in 3-6 days. Yellow means due in 7-14 days. Green means due beyond 14 days.",
    relevantOn: ["/dashboard/work-in-progress"]
  },
  {
    id: "wip-8", category: "WIP & Production",
    question: "Who can delete a WIP card?",
    keywords: ["delete", "remove", "wip", "card"],
    answer: "Only users with the ADMIN role can permanently delete a WIP card from the Kanban board. This is a destructive action that bypassing standard completion workflows.",
    relevantOn: ["/dashboard/work-in-progress"]
  },

  // --- Accounts ---
  {
    id: "accounts-1", category: "Accounts",
    question: "How do I record a payment/transaction?",
    keywords: ["record", "payment", "transaction", "money", "receive"],
    answer: "Go to Management > Accounts and click 'New Transaction'. Select whether it's Money In (Receipt) or Money Out (Payment), choose the payment mode (Cash, Bank, UPI), enter the amount, and optionally link it to a specific invoice.",
    relevantOn: ["/dashboard/accounts"]
  },
  {
    id: "accounts-2", category: "Accounts",
    question: "What does 'running balance' mean?",
    keywords: ["running", "balance", "ledger", "total", "counter"],
    answer: "The running balance is the real-time total of cash on hand. Every transaction updates this counter: 'Money In' increases the balance, and 'Money Out' decreases it. The ledger shows the balance dynamically after every historical transaction.",
    relevantOn: ["/dashboard/accounts"]
  },
  {
    id: "accounts-3", category: "Accounts",
    question: "Can I edit or delete a transaction?",
    keywords: ["edit", "delete", "transaction", "mistake"],
    answer: "For auditing and security purposes, financial transactions cannot be casually deleted. If a mistake is made, you must log an offsetting transaction (e.g., if you incorrectly logged 500 IN, log 500 OUT with a note explaining the correction).",
    relevantOn: ["/dashboard/accounts"]
  },
  {
    id: "accounts-4", category: "Accounts",
    question: "How do I link a transaction to an invoice?",
    keywords: ["link", "transaction", "invoice", "payment"],
    answer: "When creating a new transaction, type the Invoice Number into the 'Linked Invoice' field. This helps you track which payments belong to which jobs during reconciliation.",
    relevantOn: ["/dashboard/accounts"]
  },
  {
    id: "accounts-5", category: "Accounts",
    question: "How are the total receivables calculated?",
    keywords: ["receivables", "pending", "money", "owed"],
    answer: "Total Receivables is the sum of the remaining unpaid balances across all ACTIVE invoices. When you record 'Money In' linked to an invoice, its individual balance decreases, lowering the total receivables.",
    relevantOn: ["/dashboard/accounts"]
  },
  {
    id: "accounts-6", category: "Accounts",
    question: "What is the difference between Cash, Bank, and UPI modes?",
    keywords: ["cash", "bank", "upi", "mode", "payment"],
    answer: "These are tracking labels to help you reconcile your accounts. The system groups totals by mode so you can verify that your physical cash drawer matches the 'Cash' total, and your bank statement matches the 'Bank'/'UPI' totals.",
    relevantOn: ["/dashboard/accounts"]
  },

  // --- Purchases ---
  {
    id: "purchases-1", category: "Purchases",
    question: "How are purchases/profit-margin calculated?",
    keywords: ["profit", "margin", "purchase", "cost", "production", "percentage"],
    answer: "Profit margin is calculated automatically for an invoice in the Purchases view. It takes the invoice's total Bill Value (revenue) and subtracts the Total Production Cost (Designer + Printer + Raw Material + Post-Process Costs). Profit Percentage is (Profit / Bill Value) * 100.",
    relevantOn: ["/dashboard/purchases"]
  },
  {
    id: "purchases-2", category: "Purchases",
    question: "Who can view and edit purchase costs?",
    keywords: ["purchase", "cost", "admin", "permission", "view"],
    answer: "Purchases and profit margins contain highly sensitive financial data. Only users with the ADMIN role can access the Purchases section, view vendor costs, or edit the cost breakdowns.",
    relevantOn: ["/dashboard/purchases"]
  },
  {
    id: "purchases-3", category: "Purchases",
    question: "How do I track vendor payments?",
    keywords: ["vendor", "payment", "status", "designer", "printer"],
    answer: "In the Purchases editor for an invoice, each cost category (Designer, Printer, Raw Material, Post-Process) has its own Payment Status dropdown. You can track whether you have paid your vendors (Pending, Paid, N/A) independently of the customer's payment to you.",
    relevantOn: ["/dashboard/purchases"]
  },
  {
    id: "purchases-4", category: "Purchases",
    question: "Are purchase costs calculated using decimals or floating point?",
    keywords: ["decimal", "float", "math", "accuracy"],
    answer: "To prevent rounding errors and ensure absolute financial accuracy, all purchase costs and profit margins are calculated using precise Decimal math at the database level, rather than standard JavaScript floating-point numbers.",
    relevantOn: ["/dashboard/purchases"]
  },
  {
    id: "purchases-5", category: "Purchases",
    question: "What is included in Total Production Cost?",
    keywords: ["total", "cost", "production", "breakdown"],
    answer: "Total Production Cost is the sum of: Designer 1 & 2 Costs + Printer 1 & 2 Costs + Raw Material 1 & 2 Costs + Post Process 1 & 2 Costs. You can input these granular costs in the Purchases edit panel.",
    relevantOn: ["/dashboard/purchases"]
  },
  {
    id: "purchases-6", category: "Purchases",
    question: "Can I lock a purchase record?",
    keywords: ["lock", "purchase", "secure", "prevent"],
    answer: "Purchase records are effectively locked when the corresponding Invoice is marked as CLOSED. However, Admins can still adjust values if post-closure reconciliation is necessary.",
    relevantOn: ["/dashboard/purchases"]
  },

  // --- Users & Roles ---
  {
    id: "users-1", category: "Users & Roles",
    question: "How do I add a new user?",
    keywords: ["user", "add", "invite", "admin", "account", "staff", "role"],
    answer: "Adding new users is an Admin-only feature. Navigate to Management > Users. You can create a new account by providing their name, email, password, and assigning a role (ADMIN or USER).",
    relevantOn: ["/dashboard/users"]
  },
  {
    id: "users-2", category: "Users & Roles",
    question: "What is the difference between ADMIN and USER roles?",
    keywords: ["admin", "user", "role", "difference", "permissions"],
    answer: "USERs can create/edit invoices, process WIP cards, and view the dashboard. ADMINs have full access, plus the ability to manage other users, view/edit sensitive Purchase costs & profit margins, manage Accounts/Ledgers, and configure Workflow Settings.",
    relevantOn: ["/dashboard/users"]
  },
  {
    id: "users-3", category: "Users & Roles",
    question: "How do I disable a user's access?",
    keywords: ["disable", "remove", "delete", "suspend", "user"],
    answer: "Admins can go to Management > Users, edit the target user, and toggle their 'Active' status off. This prevents them from logging in while preserving their historical activity records (unlike deleting the user, which might break historical data).",
    relevantOn: ["/dashboard/users"]
  },
  {
    id: "users-4", category: "Users & Roles",
    question: "Can a user change their own password?",
    keywords: ["password", "change", "reset", "user"],
    answer: "Currently, users cannot change their own passwords. An ADMIN must go to Management > Users and set a new password for them if they forget it.",
    relevantOn: ["/dashboard/users"]
  },
  {
    id: "users-5", category: "Users & Roles",
    question: "How is team performance measured?",
    keywords: ["team", "performance", "measure", "dashboard", "stats"],
    answer: "The dashboard calculates team performance based on the number of invoices assigned to each user that have been successfully CLOSED. It provides a quick leaderboard of who is completing the most jobs.",
    relevantOn: ["/dashboard"]
  }
];
