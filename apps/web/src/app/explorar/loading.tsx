export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="h-10 w-48 animate-pulse rounded-2xl bg-secondary" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="h-72 animate-pulse rounded-3xl bg-secondary" />
        <div className="h-72 animate-pulse rounded-3xl bg-secondary" />
      </div>
    </div>
  );
}
