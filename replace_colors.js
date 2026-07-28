const fs = require('fs');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.split(search).join(replace);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

replaceInFile('components/layout/Header.tsx', [
  ['bg-[#FDE68A]', 'bg-[var(--status-warning-bg)]'],
  ['text-[#92400E]', 'text-[var(--status-warning-text)]'],
  ['border-[#F59E0B]/20', 'border-[var(--status-warning)]/20'],
  ['bg-[#F59E0B]', 'bg-[var(--status-warning)]'],
  ['hover:text-[#78350F]', 'hover:brightness-90'],
]);

replaceInFile('components/layout/Sidebar.tsx', [
  ['text-[#C2A980]', 'text-[var(--brand-primary)]'],
  ['bg-[rgba(194,169,128,0.16)]', 'bg-[var(--bg-sidebar-active)]'],
  ['text-[#FAFAF2]', 'text-[var(--text-sidebar-active)]'],
  ['border-[#18A7AD]', 'border-[var(--brand-primary)]'],
  ['shadow-[inset_0_0_16px_rgba(24,167,173,0.08)]', 'shadow-none'],
  ['text-[#B8AE96]', 'text-[var(--text-sidebar)]'],
  ['hover:bg-[rgba(194,169,128,0.08)]', 'hover:bg-[var(--bg-sidebar-hover)]'],
  ['hover:text-[#D4C9A8]', 'hover:text-[var(--text-sidebar-active)]'],
  ['text-[#18A7AD]', 'text-[var(--brand-primary)]'],
  ['borderRight: \'1px solid rgba(194,169,128,0.10)\'', 'borderRight: \'1px solid var(--border-sidebar)\''],
  ['borderBottom: \'1px solid rgba(194,169,128,0.10)\'', 'borderBottom: \'1px solid var(--border-sidebar)\''],
  ['borderTop: \'1px solid rgba(194,169,128,0.10)\'', 'borderTop: \'1px solid var(--border-sidebar)\''],
  ['from-[#C2A980]', 'from-[var(--brand-primary)]'],
  ['to-[#18A7AD]', 'to-[var(--brand-primary-dark)]'],
  ['text-[#9C9478]', 'text-[var(--text-muted)]'],
  ['text-[#EF4444]', 'text-[var(--status-error)]'],
  ['bg-[#1C1A14]', 'bg-[var(--bg-sidebar-solid)]'],
  ['rgba(194,169,128,0.20)', 'var(--border-sidebar)'],
]);

replaceInFile('app/layout.tsx', [
  ['background: \'#FAFAF2\'', 'background: \'var(--bg-card)\''],
  ['border: \'1px solid #D8D4C0\'', 'border: \'1px solid var(--border-default)\''],
  ['color: \'#2D2A20\'', 'color: \'var(--text-body)\''],
  ['boxShadow: \'0 4px 12px rgba(28,26,20,0.12)\'', 'boxShadow: \'var(--shadow-md)\''],
  ['!border-l-[#22C55E]', '!border-l-[var(--status-success)]'],
  ['!border-l-[#EF4444]', '!border-l-[var(--status-error)]'],
  ['!border-l-[#F59E0B]', '!border-l-[var(--status-warning)]'],
  ['!border-l-[#3B82F6]', '!border-l-[var(--status-info)]'],
]);
