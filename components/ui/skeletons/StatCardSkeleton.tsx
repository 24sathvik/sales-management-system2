export function StatCardSkeleton() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-9 w-9 rounded-lg" />
      </div>
      <div className="skeleton h-8 w-32 rounded" />
      <div className="skeleton h-3 w-20 rounded" />
    </div>
  );
}

export function StatCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
