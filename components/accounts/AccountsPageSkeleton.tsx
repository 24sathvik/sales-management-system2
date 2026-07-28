export function AccountsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* ── HEADER & COUNTER BALANCE ── */}
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 bg-slate-200 rounded-md"></div>
        <div className="h-4 w-64 bg-slate-200 rounded-md"></div>
      </div>

      <div className="bg-slate-200 rounded-2xl h-48 w-full border border-slate-200"></div>

      {/* ── 4 SUMMARY SQUARES ── */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-32 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-slate-200 rounded-xl h-24 shadow-sm border border-slate-200"></div>
        ))}
      </div>

      {/* ── TWIN CHARTS / LISTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-200 rounded-xl h-[400px] border border-slate-200"></div>
        <div className="bg-slate-200 rounded-xl h-[400px] border border-slate-200"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Receivables Split layout */}
          <div className="bg-slate-200 rounded-xl h-[500px] border border-slate-200"></div>
        </div>
        <div>
          {/* Ledger block */}
          <div className="bg-slate-200 rounded-xl h-[500px] border border-slate-200"></div>
        </div>
      </div>
    </div>
  );
}
