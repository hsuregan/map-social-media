export default function FeedLoading() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-8 w-36 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
