import { interpretarScore } from "@/services/creditInterpretation";
import { gerarExplicacoes } from "@/services/explanations";
import { gerarSugestoes } from "@/services/suggestions";

interface Props {
  score: number;
  income: number;
  debts: number;
}

export default function ResultCard({ score, income, debts }: Props) {
  const info = interpretarScore(score);
  const explicacoes = gerarExplicacoes({ income, debts });
  const sugestoes = gerarSugestoes(score);

  const percentage = (score / 1000) * 100;

  return (
    <div className="space-y-6 mt-6">
      <div className="card-base space-y-4">
        <p className="text-sm text-muted-foreground">Seu score</p>

        <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="text-2xl font-bold">{score}</p>
      </div>

      {/* CLASSIFICAÇÃO */}
      <div className="card-base space-y-2">
        <p className="text-sm text-muted-foreground">Classificação</p>

        <h2 className={`text-xl font-semibold ${info.cor}`}>
          {info.nivel}
        </h2>

        <p className="text-sm text-muted-foreground">
          {info.mensagem}
        </p>
      </div>

      {/* EXPLICAÇÕES */}
      <div className="card-base space-y-3">
        <p className="text-sm font-medium">O que influenciou seu resultado</p>

        {explicacoes.length > 0 ? (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {explicacoes.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Seu perfil está equilibrado.
          </p>
        )}
      </div>

      {/* SUGESTÕES */}
      <div className="card-base space-y-3">
        <p className="text-sm font-medium">Como melhorar seu score</p>

        <ul className="space-y-2 text-sm">
          {sugestoes.map((item, index) => (
            <li key={index} className="flex gap-2">
              <span>💡</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}