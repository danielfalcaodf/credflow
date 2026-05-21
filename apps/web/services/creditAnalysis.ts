export function analisarCredito(data: {
  renda: number;
  dividas: number;
  tipoRenda: string;
}) {
  const comprometimento = data.dividas / data.renda;

  if (data.renda > 3000 && comprometimento < 0.3) {
    return {
      status: "APROVADO",
      mensagem: "Seu perfil financeiro está saudável.",
    };
  }

  if (comprometimento > 0.6) {
    return {
      status: "NEGADO",
      mensagem: "Seu nível de endividamento está alto.",
    };
  }

  return {
    status: "ANALISE",
    mensagem: "Precisamos de mais informações.",
  };
}