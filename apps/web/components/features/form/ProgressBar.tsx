interface Props {
  step: number;
  total: number;
}

export default function ProgressBar({
  step,
  total,
}: Props) {
  const progress = (step / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Etapa {step}</span>
        <span>{total}</span>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}