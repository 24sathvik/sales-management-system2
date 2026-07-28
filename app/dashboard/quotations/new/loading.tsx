import { FormSkeleton } from "@/components/ui/skeletons/FormSkeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-200 animate-pulse rounded"></div>
      <div className="h-4 w-96 bg-slate-100 animate-pulse rounded mb-8"></div>
      <FormSkeleton />
    </div>
  );
}
