import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const getScoreStyles = () => {
    if (score >= 8) return "bg-score-high text-score-high-foreground";
    if (score >= 5) return "bg-score-medium text-score-medium-foreground";
    return "bg-score-low text-score-low-foreground";
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium min-w-[3rem]",
        getScoreStyles()
      )}
    >
      {score.toFixed(1)}
    </span>
  );
}
