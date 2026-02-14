export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-10 flex items-center justify-between">
        <div className="h-8 w-36 animate-warm-pulse rounded bg-linen" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-linen bg-ivory p-5 shadow-[var(--shadow-warm-sm)]"
          >
            <div className="h-5 w-3/4 animate-warm-pulse rounded bg-linen" />
            <div className="mt-3 h-4 w-1/2 animate-warm-pulse rounded bg-linen" />
            <div className="mt-2 h-3 w-1/3 animate-warm-pulse rounded bg-linen" />
          </div>
        ))}
      </div>
    </div>
  );
}
