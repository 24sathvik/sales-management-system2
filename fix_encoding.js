const fs = require('fs');
const files = [
  'components/dashboard/AdminAnalytics.tsx',
  'components/dashboard/DashboardComponents.tsx',
  'components/dashboard/PerformanceCharts.tsx',
  'components/invoices/AdvancedFilterPanel.tsx',
  'lib/pdf-service.ts'
];
const map = {
  'â‚¹': '₹',
  'â€”': '—', // em dash
  'â†‘': '↑',
  'â†“': '↓',
  'ðŸ”´': '🔴',
  'Â·': '·',
  'â”€': '─',
  'â€œ': '"',
  'â€': '"',
  'â€™': '\''
};

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  for (let [k, v] of Object.entries(map)) {
    c = c.split(k).join(v);
  }
  fs.writeFileSync(f, c, 'utf8');
});
console.log('Fixed mojibake in 5 files');
