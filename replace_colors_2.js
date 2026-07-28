const fs = require('fs');

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.split(search).join(replace);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

replaceInFile('components/quotations/QuotationForm.tsx', [
  ['bg-[#14161C]', 'bg-[var(--bg-sidebar-solid)]'],
  ['shadow-[0_-4px_20px_rgba(0,0,0,0.5)]', 'shadow-2xl'],
  ['border-slate-800', 'border-[var(--border-sidebar)]']
]);

replaceInFile('components/invoices/InvoiceForm.tsx', [
  ['bg-[#14161C]', 'bg-[var(--bg-sidebar-solid)]'],
  ['shadow-[0_-4px_20px_rgba(0,0,0,0.5)]', 'shadow-2xl'],
  ['border-slate-800', 'border-[var(--border-sidebar)]']
]);

replaceInFile('components/final-check/ChecklistPanel.tsx', [
  ['rgba(0,0,0,0.1)', 'rgba(20,22,28,0.1)']
]);

replaceInFile('components/wip/ChecklistPopover.tsx', [
  ['rgba(0,0,0,0.5)', 'rgba(20,22,28,0.55)']
]);

replaceInFile('components/dashboard/Sidebar.tsx', [
  ['#717f65', 'var(--brand-primary-light)'],
  ['#5e7150', 'var(--brand-primary)'],
  ['#48663e', 'var(--brand-primary-dark)'],
  ['#32612d', 'var(--brand-accent)']
]);

replaceInFile('components/dashboard/PerformanceCharts.tsx', [
  ['#32612d', 'var(--brand-primary)'],
  ['#8ba282', 'var(--brand-primary-light)'],
  ['rgba(50, 97, 45', 'rgba(199, 125, 46'],
  ['#e2e8f0', 'var(--border-default)'],
  ['#3b82f6', 'var(--status-info)'],
  ['#64748b', 'var(--text-muted)'],
  ['#1e293b', 'var(--text-heading)']
]);

replaceInFile('components/dashboard/DashboardComponents.tsx', [
  ['#DC2626', 'var(--status-error)'],
  ['#C2A980', 'var(--brand-primary)']
]);

replaceInFile('components/dashboard/AdminAnalytics.tsx', [
  ['"#32612d", "#4a7d44", "#689d61", "#2563eb", "#7c3aed"', '"var(--brand-primary)", "var(--brand-primary-dark)", "var(--brand-primary-light)", "var(--brand-accent)", "var(--brand-accent-dark)"'],
  ['"#0891b2", "#d97706", "#dc2626", "#0d9488"', '"var(--status-info)", "var(--status-warning)", "var(--status-error)", "var(--status-success)"'],
  ['#e2e8f0', 'var(--border-default)']
]);

replaceInFile('components/ai/AdvisorChat.tsx', [
  ['#F5ECD7', 'var(--brand-primary-muted)'],
  ['#EEF2FA', 'var(--brand-accent-muted)']
]);

replaceInFile('components/accounts/CounterBalanceHero.tsx', [
  ['#1C3A2A', 'var(--brand-primary-dark)'],
  ['#2D5A3D', 'var(--brand-primary)'],
  ['#1C1A14', 'var(--bg-sidebar-solid)']
]);

replaceInFile('components/accounts/MonthlySalesChart.tsx', [
  ['#d6d0c4', 'var(--border-default)'],
  ['#9a9485', 'var(--text-muted)'],
  ['#ffffff', 'var(--bg-card)'],
  ['#32612d', 'var(--brand-primary)'],
  ['#717f65', 'var(--brand-accent)']
]);

replaceInFile('components/wip/KanbanColumn.tsx', [
  ['#64748B', '#C77D2E'],
  ['#8B5CF6', '#4C4FE0'],
  ['#2563EB', '#6366F1'],
  ['#06B6D4', '#E8A33D'],
  ['#D97706', '#D97706']
]);
replaceInFile('components/wip/KanbanCard.tsx', [
  ['#cbd5e1', '#E3E1DA']
]);

replaceInFile('app/dashboard/settings/workflow/page.tsx', [
  ['#64748B', '#C77D2E']
]);
replaceInFile('app/api/settings/workflow/route.ts', [
  ['#64748B', '#C77D2E']
]);
