export default function EntryLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 h-4 w-32 animate-pulse rounded bg-gray-200" />
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-7 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
