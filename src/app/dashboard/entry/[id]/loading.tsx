export default function EntryLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 h-4 w-32 animate-warm-pulse rounded bg-linen" />
      <div className="rounded-xl border border-linen bg-ivory p-6 shadow-[var(--shadow-warm-sm)]">
        <div className="h-7 w-2/3 animate-warm-pulse rounded bg-linen" />
        <div className="mt-3 h-4 w-1/2 animate-warm-pulse rounded bg-linen" />
        <div className="mt-6 space-y-3">
          <div className="h-4 w-full animate-warm-pulse rounded bg-linen" />
          <div className="h-4 w-5/6 animate-warm-pulse rounded bg-linen" />
          <div className="h-4 w-4/6 animate-warm-pulse rounded bg-linen" />
        </div>
      </div>
    </div>
  );
}
