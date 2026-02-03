import { cn } from "@/lib/utils";

interface StatusTagProps {
  status: string;
}

export function StatusTag({ status }: StatusTagProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "Contacted":
        return "bg-status-contacted text-status-contacted-foreground";
      case "Discarded":
        return "bg-status-discarded text-status-discarded-foreground";
      case "Shortlist":
        return "bg-emerald-100 text-emerald-800";
      case "Meeting Scheduled":
        return "bg-purple-100 text-purple-800";
      case "NDA Sent":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-status-pending text-status-pending-foreground";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap",
        getStatusStyles()
      )}
    >
      {status}
    </span>
  );
}
