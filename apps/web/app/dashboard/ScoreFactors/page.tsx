import { ArrowUp, Minus, TrendingDown } from 'lucide-react';

const scoreFactors = [
  {
    label: 'Estabilidade de renda',
    type: 'positive',
  },
  {
    label: 'Baixo comprometimento',
    type: 'positive',
  },
  {
    label: 'Histórico de pagamentos',
    type: 'positive',
  },
  {
    label: 'Dívidas acima de 30% da renda',
    type: 'warning',
  },
];

const factorStyles = {
  positive: {
    icon: ArrowUp,
    className:
      'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10',
  },

  neutral: {
    icon: Minus,
    className: 'bg-slate-500/10 text-slate-500 border border-slate-500/10',
  },

  warning: {
    icon: TrendingDown,
    className: 'bg-amber-500/10 text-amber-500 border border-amber-500/10',
  },
};

export function ScoreFactors() {
  return (
    <div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold leading-none">
          Fatores que mais influenciam seu score
        </h3>

        <p className="text-sm text-muted-foreground">
          Baseado na sua análise financeira
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {scoreFactors.map((factor) => {
          const style = factorStyles[factor.type as keyof typeof factorStyles];

          const Icon = style.icon;

          return (
            <div key={factor.label} className="flex items-center gap-3">
              <div
                className={`
                  flex h-7 w-7 items-center justify-center
                  rounded-full backdrop-blur-sm
                  ${style.className}
                `}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>

              <span className="text-sm font-medium text-foreground/90">
                {factor.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
