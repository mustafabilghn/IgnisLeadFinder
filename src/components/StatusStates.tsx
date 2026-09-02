export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="card flex items-center gap-3 text-sm text-stone-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-ignis-600" />
      {message}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card border-red-200 bg-red-50">
      <p className="text-sm text-red-800">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-sm font-medium text-red-700 underline">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "No leads yet",
  message = "Run a search to discover businesses and rank them for Ignis fit.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 py-12 text-center">
      <span className="text-3xl">🗂️</span>
      <h3 className="font-medium text-stone-800">{title}</h3>
      <p className="max-w-sm text-sm text-stone-500">{message}</p>
    </div>
  );
}
