export function gerarSugestoes(score: number) {
  if (score < 400) {
    return [
      "Reduza suas dívidas antes de solicitar crédito",
      "Evite atrasos em pagamentos",
    ];
  }

  if (score < 700) {
    return [
      "Tente reduzir seu comprometimento mensal",
      "Mantenha pagamentos em dia",
    ];
  }

  return ["Continue mantendo seu bom histórico financeiro"];
}