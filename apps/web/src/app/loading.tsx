export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="h-12 w-2/3 animate-pulse rounded-2xl bg-secondary" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="aspect-4/3 animate-pulse rounded-3xl bg-secondary" />
        <div className="aspect-4/3 animate-pulse rounded-3xl bg-secondary" />
        <div className="aspect-4/3 animate-pulse rounded-3xl bg-secondary" />
      </div>
    </div>
  );
}
