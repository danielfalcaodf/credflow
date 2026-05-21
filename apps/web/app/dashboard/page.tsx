import Container from '@/components/layout/Container';
import { Card } from '@/components/ui/card';
import { CreditScoreGauge } from './Chart/page';
import { ScoreFactors } from './ScoreFactors/page';
import { ScoreAnalysis } from './ScoreAnalysis/page';

const userScore = 820;

const user = {
  name: 'Juliana',
};

export default function Dashboard() {
  const getScoreBadge = (score: number) => {
    if (score < 500) {
      return {
        label: 'Baixo',
        className:
          'bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm shadow-red-500/10',
      };
    }

    if (score < 700) {
      return {
        label: 'Regular',
        className:
          'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm shadow-amber-500/10',
      };
    }

    if (score < 850) {
      return {
        label: 'Muito Bom',
        className:
          'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm shadow-emerald-500/10',
      };
    }

    return {
      label: 'Excelente',
      className:
        'bg-green-500/10 text-green-500 border border-green-500/20 shadow-sm shadow-green-500/10',
    };
  };

  const scoreBadge = getScoreBadge(userScore);

  return (
    <Container>
      <div>
        <h1 className="text-2xl font-bold tracking-tight ">
          Olá, {user.name}! 👋
        </h1>

        <span className="text-muted-foreground">
          Aqui está sua análise financeira
        </span>
      </div>

      <Card className="w-full p-5 rounded-3xl border border-border/60 shadow-sm lg:flex-row">
        <div>
          <ScoreAnalysis />
          <div className="mt-6">
            <CreditScoreGauge userScore={userScore} scoreBadge={scoreBadge} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="mt-6 lg:mt-0 lg:ml-6">
          <ScoreFactors />
        </div>
      </Card>
    </Container>
  );
}
