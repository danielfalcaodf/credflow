export function calcularScore({
  renda,
  dividas,
  tipoRenda,
}: {
  renda: number;
  dividas: number;
  tipoRenda: string;
}) {
  let score = 500;

  const comprometimento = dividas / renda;

  if (comprometimento > 0.6) {
    score -= 300;
  } else if (comprometimento > 0.3) {
    score -= 150;
  } else {
    score += 100;
  }

  if (renda > 5000) {
    score += 150;
  } else if (renda > 3000) {
    score += 80;
  }

  if (tipoRenda === "CLT") {
    score += 100;
  } else {
    score -= 50;
  }

  return Math.max(0, Math.min(1000, score));
}