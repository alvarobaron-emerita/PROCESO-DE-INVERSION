interface CompanyLogoProps {
  name: string;
}

export function CompanyLogo({ name }: CompanyLogoProps) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground flex-shrink-0">
      {initials}
    </div>
  );
}
