@AGENTS.md

# CredFlow — Guia para agentes

Plataforma de simulação e análise de crédito pessoal. Monorepo Nx + npm
workspaces com frontend Next.js e backend Spring Boot.

## Estrutura

```
credflow/
├── apps/
│   ├── web/          # Frontend — Next.js 16 + React 19 + TS (existe)
│   └── api/          # Backend — Spring Boot 3 + Java 21 + Maven (a implementar)
├── packages/         # Pacotes compartilhados (ainda não criado)
├── docs/
│   └── PRD-backend.md  # PRD do backend — fonte da verdade dos requisitos
├── .claude/          # rules, agents e skills do projeto (ver .claude/README.md)
├── nx.json
└── package.json      # workspaces: apps/*, packages/*
```

## Comandos

Sempre rode a partir da raiz do repositório.

```bash
npm install            # instala dependências do workspace
npm run dev            # nx run web:dev      — frontend em localhost:3000
npm run build          # nx run web:build
npm run lint           # nx run web:lint     — eslint em apps/web
npm run start          # nx run web:start

nx run <projeto>:<alvo>   # forma genérica; defaultProject = web
nx run api:test           # backend (após apps/api existir)
```

## Regras do projeto

@.claude/rules/architecture.md
@.claude/rules/conventions.md
@.claude/rules/git-workflow.md
@.claude/rules/credit-rules.md

## Skills e agents disponíveis

| Recurso | Para quê |
|---|---|
| skill `score-parity` | Verificar o motor de score contra a §7 do PRD |
| skill `api-endpoint` | Adicionar endpoint, do requisito ao consumo no front |
| skill `nx-java-target` | Integrar o app Maven ao Nx |
| agent `spring-api-builder` | Implementar o backend |
| agent `web-api-integrator` | Integrar o frontend à API |
| agent `credit-rules-auditor` | Auditar as regras de crédito (somente leitura) |

## Estado atual do frontend (armadilhas conhecidas)

Ao integrar a API, estes pontos já estão quebrados e devem ser corrigidos:

- `StepPersonal`/`StepFinancial`/`StepProfessional` registram campos em
  português (`nome`, `idade`, `renda`, `dividas`) enquanto `types/credit.ts`
  define `name`, `age`, `income`, `debts`, `incomeType` — nada chega ao submit.
- `StepProfessional` não conecta o `RadioGroup` ao formulário; `incomeType`
  nunca é preenchido.
- `CreditForm` simula latência com `setTimeout`, calcula o score no cliente e
  usa `form.register as any`.
- O botão final envolve um `<Link href="/dashboard">` dentro de um
  `<button type="submit">`, então navega antes de submeter.
- `/dashboard` e `/dashboard/Chart` usam `userScore = 820` fixo; `ScoreFactors`
  usa array estático; `ScoreAnalysis` tem texto fixo.
- `app/page.tsx` linka `/historico`, rota que não existe.
- `app/history.tsx` e `app/results.tsx` estão vazios.
- Faixas de classificação divergem entre `services/creditInterpretation.ts`
  (800/600/400) e `app/dashboard/page.tsx` (500/700/850). A tabela canônica está
  em `.claude/rules/credit-rules.md` — use a do backend.

## Antes de entregar

- `npm run lint` e `npm run build` passando.
- Backend: `nx run api:test` verde; regras de score cobertas pelos casos-limite
  da §7.6 do PRD (`score-parity` verifica).
- Não commite segredos; configuração sensível via variáveis de ambiente.
