export default function ScoreCard({ score }: { score: number }) {
  const percentage = (score / 1000) * 100;

  return (
    <div className="card-base space-y-4">
      <h2 className="text-lg font-semibold">Seu score</h2>

      <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-2xl font-bold">{score}</p>
    </div>
  );
}