const fs = require('fs');
const path = require('path');

const routes = [
  { path: 'invoices', type: 'TableSkeleton' },
  { path: 'invoices/new', type: 'FormSkeleton' },
  { path: 'invoices/[id]/edit', type: 'FormSkeleton' },
  { path: 'quotations', type: 'TableSkeleton' },
  { path: 'quotations/new', type: 'FormSkeleton' },
  { path: 'quotations/[id]/edit', type: 'FormSkeleton' },
  { path: 'work-in-progress', type: 'KanbanSkeleton' },
  { path: 'final-check', type: 'TableSkeleton' },
  { path: 'accounts', type: 'TableSkeleton' },
  { path: 'purchases', type: 'TableSkeleton' },
  { path: 'users', type: 'TableSkeleton' },
  { path: 'settings', type: 'FormSkeleton' },
];

for (const route of routes) {
  const dirPath = path.join(__dirname, 'app/dashboard', route.path);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  const filePath = path.join(dirPath, 'loading.tsx');
  const content = `import { ${route.type} } from "@/components/ui/skeletons/${route.type}";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-200 animate-pulse rounded"></div>
      <div className="h-4 w-96 bg-slate-100 animate-pulse rounded mb-8"></div>
      <${route.type} />
    </div>
  );
}
`;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Created ${filePath}`);
}
