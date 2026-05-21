// src/services/creditInterpretation.ts

export function interpretarScore(score: number) {
  if (score >= 800) {
    return {
      nivel: "Excelente",
      cor: "text-green-600",
      mensagem: "Seu perfil financeiro é muito sólido.",
    };
  }

  if (score >= 600) {
    return {
      nivel: "Bom",
      cor: "text-blue-600",
      mensagem: "Seu perfil é estável, com baixo risco.",
    };
  }

  if (score >= 400) {
    return {
      nivel: "Risco",
      cor: "text-yellow-600",
      mensagem: "Seu nível de endividamento merece atenção.",
    };
  }

  return {
    nivel: "Alto risco",
    cor: "text-red-600",
    mensagem: "Seu perfil indica alto risco de inadimplência.",
  };
}