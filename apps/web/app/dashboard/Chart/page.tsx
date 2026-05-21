'use client';

import { BarChart, Bar, ResponsiveContainer, XAxis, Cell } from 'recharts';

import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';

const userScore = 820;

const getScoreStatus = (score: number) => {
  if (score < 500) {
    return {
      label: 'Baixo',
      color: '#ef4444',
    };
  }

  if (score < 700) {
    return {
      label: 'Regular',
      color: '#f59e0b',
    };
  }

  if (score < 850) {
    return {
      label: 'Muito Bom',
      color: '#22c55e',
    };
  }

  return {
    label: 'Excelente',
    color: '#10b981',
  };
};

const status = getScoreStatus(userScore);

const chartData = [
  {
    name: 'score',
    value: userScore,
  },
];

const chartConfig = {
  score: {
    label: 'Score',
    color: status.color,
  },
} satisfies ChartConfig;

export function CreditScoreGauge({
  userScore,
  scoreBadge,
}: {
  userScore: number;
  scoreBadge: { className: string; label: string };
}) {
  return (
    <div className="w-full max-w-[420px] space-y-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black tracking-tight text-foreground">
            {userScore}
          </span>
          <p className="text-sm text-muted-foreground">/ 1000</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            className={`
              rounded-full px-3 py-1 text-xs font-semibold
              backdrop-blur-md transition-all duration-300
              ${scoreBadge.className}
            `}
          >
            {scoreBadge.label}
          </Badge>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[88px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 0,
              right: 0,
              left: 0,
              bottom: 0,
            }}
          >
            <XAxis type="number" hide domain={[0, 1000]} />

            <Bar
              dataKey="value"
              radius={[999, 999, 999, 999]}
              barSize={22}
              background={{
                fill: '#E2E8F0',
                radius: 999,
              }}
            >
              <Cell fill={status.color} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
