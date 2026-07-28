export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-100 rounded w-64"></div>
        </div>
        <div className="h-10 bg-slate-200 rounded w-32"></div>
      </div>

      {/* Stats/Cards Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border rounded-xl p-5 h-32 flex flex-col justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-3 bg-slate-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-slate-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton (like a table) */}
      <div className="bg-white border rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-slate-200 rounded w-32"></div>
          <div className="h-8 bg-slate-200 rounded w-48"></div>
        </div>
        
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded w-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
