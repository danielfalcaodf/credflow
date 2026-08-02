# Regras de crédito — referência rápida (normativa)

Resumo operacional da §7 de `docs/PRD-backend.md`. Em caso de dúvida ou
divergência, **o PRD prevalece**. Qualquer alteração aqui exige alteração lá, no
mesmo commit.

Origem: `apps/web/services/creditScore.ts`, `creditInterpretation.ts`,
`creditAnalysis.ts`, `explanations.ts`, `suggestions.ts` — código que o backend
substitui sem mudar nenhum resultado.

## Score (`engineVersion 1.0.0`)

```
base = 500
commitmentRatio = debts / income

commitmentRatio > 0.60   → -300
commitmentRatio > 0.30   → -150
caso contrário           → +100

income > 5000            → +150
income > 3000            →  +80
caso contrário           →    0

incomeType == CLT        → +100
AUTONOMO | PJ            →  -50

score = clamp(soma, 0, 1000)
```

**As comparações são estritas (`>`)** e isso importa mais do que parece:
`commitmentRatio` exatamente `0.30` cai no ramo `+100`; `income` exatamente
`5000` recebe `+80`, não `+150`. Trocar `>` por `>=` muda o resultado de
usuários reais na fronteira — é o erro mais fácil de cometer ao portar.

## Classificação (tabela canônica única)

| Faixa | code | label | tone | Mensagem |
|---|---|---|---|---|
| 800–1000 | `EXCELLENT` | Excelente | `success` | Seu perfil financeiro é muito sólido. |
| 600–799 | `GOOD` | Bom | `info` | Seu perfil é estável, com baixo risco. |
| 400–599 | `FAIR` | Risco | `warning` | Seu nível de endividamento merece atenção. |
| 0–399 | `POOR` | Alto risco | `danger` | Seu perfil indica alto risco de inadimplência. |

O frontend tem hoje **duas** tabelas incompatíveis: `creditInterpretation.ts`
(800/600/400) e `dashboard/page.tsx` (500/700/850) — o mesmo score exibe rótulos
diferentes conforme a tela. A tabela acima é a canônica; o dashboard deve passar
a consumir `classification` da API em vez do seu `getScoreBadge` local.

## Decisão

```
income > 3000 E commitmentRatio < 0.30  → APPROVED
commitmentRatio > 0.60                   → DENIED
caso contrário                            → UNDER_REVIEW
```

A ordem das cláusulas importa — preserve-a.

| code | Mensagem |
|---|---|
| `APPROVED` | Seu perfil financeiro está saudável. |
| `DENIED` | Seu nível de endividamento está alto. |
| `UNDER_REVIEW` | Precisamos de mais informações. |

## Explicações

| Condição | Texto |
|---|---|
| `commitmentRatio > 0.60` | Seu nível de endividamento está muito alto. |
| `commitmentRatio < 0.30` | Seu controle de dívidas é positivo. |
| `income < 2000` | Sua renda pode limitar seu acesso ao crédito. |

Lista pode ficar vazia; nesse caso o front exibe "Seu perfil está equilibrado."

## Sugestões

| Score | Sugestões |
|---|---|
| `< 400` | Reduza suas dívidas antes de solicitar crédito · Evite atrasos em pagamentos |
| `400–699` | Tente reduzir seu comprometimento mensal · Mantenha pagamentos em dia |
| `≥ 700` | Continue mantendo seu bom histórico financeiro |

## Casos-limite obrigatórios em teste

| # | income | debts | incomeType | ratio | score | classification | decision |
|---|---|---|---|---|---|---|---|
| 1 | 6000 | 1000 | CLT | 0,1667 | 850 | EXCELLENT | APPROVED |
| 2 | 3000 | 900 | CLT | 0,30 | 700 | GOOD | UNDER_REVIEW |
| 3 | 2000 | 1400 | AUTONOMO | 0,70 | 150 | POOR | DENIED |
| 4 | 10000 | 100 | PJ | 0,01 | 700 | GOOD | APPROVED |
| 5 | 1000 | 900 | AUTONOMO | 0,90 | 150 | POOR | DENIED |
| 6 | 5000 | 2000 | CLT | 0,40 | 530 | FAIR | UNDER_REVIEW |
| 7 | 1 | 0 | CLT | 0,00 | 700 | GOOD | UNDER_REVIEW |

O caso 2 é o guardião dos limites estritos: `ratio = 0.30` não é `> 0.30`
(soma `+100`) e `income = 3000` não é `> 3000` (não aprova).

Use a skill `score-parity` para verificar a paridade automaticamente.
