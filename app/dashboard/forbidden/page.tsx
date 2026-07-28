import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-10 h-10 text-danger" />
        </div>
        <div className="text-7xl font-black text-danger mb-2">403</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
        <p className="text-text-muted text-sm mb-6">
          You don&apos;t have permission to view this page. Please contact an administrator.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-forest text-white rounded-xl font-semibold hover:bg-brand-sage transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
