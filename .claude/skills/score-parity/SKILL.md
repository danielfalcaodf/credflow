---
name: score-parity
description: Verifica se o motor de score do backend produz exatamente os mesmos resultados que a especificação normativa da §7 do PRD, incluindo uma varredura nas fronteiras onde erros de > vs >= se escondem. Use sempre que mexer no cálculo de score, classificação ou decisão; antes de remover as funções de apps/web/services; ao calibrar limiares; ou quando alguém disser que "o score está estranho" em qualquer camada.
---

# Paridade do motor de score

O CredFlow está migrando as regras de crédito de `apps/web/services/*.ts` para o
backend. A migração só pode ser considerada segura se o resultado visto pelo
usuário não mudar — e a maneira de saber isso é medir, não inspecionar.

## Rode o script

```bash
# Só a especificação, sem API rodando
python3 .claude/skills/score-parity/scripts/check_parity.py

# Compara com a API rodando (os 7 casos-limite)
python3 .claude/skills/score-parity/scripts/check_parity.py --api-url http://localhost:8080

# Varredura nas fronteiras — 240 combinações
python3 .claude/skills/score-parity/scripts/check_parity.py --api-url http://localhost:8080 --grid
```

Sai com código 1 se houver qualquer divergência, então serve direto em CI.

O script reimplementa a §7 do PRD sem dependências externas. Ele é uma segunda
opinião sobre a especificação, não uma cópia do backend — é isso que o torna
capaz de pegar erro de porte.

## Por que a varredura importa

Os casos-limite normais passam mesmo com a regra sutilmente errada. O `--grid`
testa `income` e `commitmentRatio` em `0.2999 / 0.30 / 0.3001`,
`0.5999 / 0.60 / 0.6001`, `2999 / 3000 / 3001`, `4999 / 5000 / 5001`.

As comparações da especificação são **estritas**:

- `commitmentRatio` exatamente `0.30` soma `+100` (não é `> 0.30`)
- `income` exatamente `5000` soma `+80` (não é `> 5000`)
- `income` exatamente `3000` **não** aprova (não é `> 3000`)

Um `>=` no lugar de `>` passa em todo teste de valor "redondo" e erra
silenciosamente para quem cai na fronteira. Foi por isso que o caso 2 da §7.6
existe.

## Ao encontrar divergência

Não ajuste o script nem a tabela do PRD para o resultado passar — isso apaga o
sinal que você acabou de receber. Investigue nesta ordem:

1. A implementação usa `>` onde a especificação pede `>`?
2. A ordem das cláusulas de decisão foi preservada? `APPROVED` exige
   `income > 3000` **e** `ratio < 0.30`; a checagem de `DENIED` vem depois.
3. Há `double`/`float` em valor monetário no backend? Deve ser `BigDecimal`.
4. O clamp final `[0, 1000]` está aplicado?
5. Existe uma segunda tabela de classificação concorrendo (o
   `dashboard/page.tsx` tinha uma com 500/700/850)?

Se a divergência for uma mudança **intencional** de regra de negócio, então o
PRD é que precisa mudar primeiro: atualize a §7 e a tabela §7.6, faça bump do
`engineVersion`, e só então ajuste o script. A ordem importa — o documento é a
decisão, o código é a consequência.

## Referências

- `docs/PRD-backend.md` §7 — especificação normativa completa
- `.claude/rules/credit-rules.md` — resumo operacional
- `apps/web/services/*.ts` — implementação de origem, a ser removida
