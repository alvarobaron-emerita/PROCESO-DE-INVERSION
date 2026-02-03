import { Skeleton } from "@/components/ui/skeleton";

export function ReportSkeleton() {
  return (
    <div className="space-y-8 p-8">
      {/* Title */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4 bg-muted/30" />
        <Skeleton className="h-6 w-1/2 bg-muted/30" />
      </div>

      {/* Verdict Section */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-40 bg-muted/30" />
        <Skeleton className="h-16 w-full bg-muted/30" />
      </div>

      {/* Classification */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-48 bg-muted/30" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full bg-muted/30" />
          <Skeleton className="h-4 w-5/6 bg-muted/30" />
          <Skeleton className="h-4 w-4/6 bg-muted/30" />
        </div>
      </div>

      {/* Table */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-56 bg-muted/30" />
        <div className="border border-border/30 rounded-lg overflow-hidden">
          <div className="grid grid-cols-2 gap-px bg-border/30">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 bg-muted/30" />
            ))}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-52 bg-muted/30" />
        <div className="border border-border/30 rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 gap-px bg-border/30">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-10 bg-muted/30" />
            ))}
          </div>
        </div>
      </div>

      {/* Signals */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-64 bg-muted/30" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-full bg-muted/30" />
          ))}
        </div>
      </div>

      {/* Companies */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-56 bg-muted/30" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-3/4 bg-muted/30" />
          ))}
        </div>
      </div>
    </div>
  );
}
