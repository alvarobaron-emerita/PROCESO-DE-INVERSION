export function ReportSkeleton() {
  return (
    <div className="flex flex-col h-full p-8 space-y-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/6" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
      </div>
      <div className="h-32 bg-muted rounded" />
    </div>
  );
}
