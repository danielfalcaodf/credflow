// src/components/ui/AppButton.tsx
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export function AppButton({
  children,
  variant = "primary",
  className,
}: Props) {
  if (variant === "secondary") {
    return (
      <Button
        variant="outline"
        className={`h-12 rounded-xl w-full ${className}`}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button className={`h-12 rounded-xl w-full ${className}`}>
      {children}
    </Button>
  );
}