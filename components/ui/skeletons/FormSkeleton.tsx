interface FormSkeletonProps {
  fields?: number;
  sections?: number;
}

function FormFieldSkeleton() {
  return (
    <div className="space-y-1.5">
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton h-10 w-full rounded-md" />
    </div>
  );
}

function FormSectionSkeleton({ fieldCount = 4 }: { fieldCount?: number }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-sm p-5 space-y-4">
      <div className="skeleton h-4 w-36 rounded border-b border-[var(--border-default)] pb-2" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: fieldCount }).map((_, i) => (
          <FormFieldSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton({ sections = 2, fields = 4 }: FormSkeletonProps) {
  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-[var(--border-default)]">
        <div className="skeleton h-7 w-40 rounded" />
        <div className="skeleton h-9 w-36 rounded-md" />
      </div>

      {/* Form sections */}
      {Array.from({ length: sections }).map((_, i) => (
        <FormSectionSkeleton key={i} fieldCount={fields} />
      ))}

      {/* Submit button area */}
      <div className="flex justify-end gap-3 pt-2">
        <div className="skeleton h-10 w-28 rounded-md" />
        <div className="skeleton h-10 w-36 rounded-md" />
      </div>
    </div>
  );
}
