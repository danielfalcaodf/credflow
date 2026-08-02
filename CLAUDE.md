@AGENTS.md

# CredFlow — Guia para agentes

Plataforma de simulação e análise de crédito pessoal. Monorepo Nx + npm workspaces
com frontend Next.js e backend Spring Boot.

## Estrutura

```
credflow/
├── apps/
│   ├── web/          # Frontend — Next.js 16 + React 19 + TS (existe)
│   └── api/          # Backend — Spring Boot 3 + Java 21 + Maven (a implementar)
├── packages/         # Pacotes compartilhados (ainda não criado)
├── docs/
│   └── PRD-backend.md  # PRD do backend — fonte da verdade dos requisitos
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
```

Alvos do backend (`api`) devem ser expostos em `apps/api/project.json` como
`command` targets envolvendo o Maven Wrapper (`./mvnw`), para que
`nx run api:build` / `api:test` / `api:dev` funcionem igual ao `web`.

## Regras de arquitetura

- **Next.js 16 tem breaking changes** em relação ao conhecimento pré-treinado.
  Antes de escrever qualquer código de frontend, leia o guia relevante em
  `node_modules/next/dist/docs/` (requer `npm install`). Não confie na memória
  para APIs de App Router, `params`/`searchParams`, caching ou server actions.
- **O backend é a única fonte de verdade das regras de crédito.** As funções em
  `apps/web/services/*.ts` (`calcularScore`, `interpretarScore`,
  `analisarCredito`, `gerarExplicacoes`, `gerarSugestoes`) são um protótipo
  local e devem ser substituídas por chamadas à API. Não duplique regra de
  negócio no cliente; o frontend renderiza o que a API devolve.
- **Contrato tipado.** Tipos e schemas compartilhados entre `web` e `api`
  pertencem a `packages/` (ex.: `packages/contracts`), não a cópias em cada app.
- Camadas do backend: `controller` → `service` → `repository`; entidades JPA não
  cruzam a fronteira do controller — use DTOs/records.
- Erros HTTP seguem RFC 9457 (`ProblemDetail`, nativo no Spring Boot 3).

## Convenções

- **Idioma:** código, identificadores e nomes de campos em **inglês**; textos
  voltados ao usuário (mensagens, labels, sugestões) em **português (pt-BR)**.
  O código atual mistura os dois (`renda`/`income`) — ao tocar num arquivo,
  padronize para inglês.
- **Valores monetários:** `BigDecimal` no backend, `number` (reais, não
  centavos) no JSON. Nunca `double` para dinheiro.
- **Score:** inteiro de 0 a 1000, sempre calculado no backend.
- Frontend: TypeScript estrito, Tailwind v4, shadcn/ui em `components/ui`
  (não editar à mão — regenerar via `shadcn`), features em
  `components/features`, alias de import `@/*`.
- Validação de formulário com `zod` + `react-hook-form`; o schema do cliente
  deve espelhar a validação do servidor, nunca substituí-la.

## Estado atual do frontend (armadilhas conhecidas)

Ao integrar a API, estes pontos já estão quebrados e devem ser corrigidos:

- `StepPersonal`/`StepFinancial`/`StepProfessional` registram campos em
  português (`nome`, `idade`, `renda`, `dividas`) enquanto `types/credit.ts`
  define `name`, `age`, `income`, `debts`, `incomeType` — nada chega ao submit.
- `CreditForm` simula latência com `setTimeout` e calcula o score no cliente.
- O botão final envolve um `<Link href="/dashboard">` dentro de um
  `<button type="submit">`, então navega antes de submeter.
- `/dashboard` e `/dashboard/Chart` usam `userScore = 820` fixo.
- `app/page.tsx` linka `/historico`, rota que não existe.
- `app/history.tsx` e `app/results.tsx` estão vazios.
- Faixas de classificação divergem entre `services/creditInterpretation.ts`
  (800/600/400) e `app/dashboard/page.tsx` (500/700/850). O PRD define uma
  tabela canônica única — use a do backend.

## Antes de entregar

- `npm run lint` e `npm run build` devem passar.
- Backend: `nx run api:test` verde; regras de score cobertas por testes
  unitários com os casos-limite listados no PRD.
- Não commite segredos; configuração sensível via variáveis de ambiente.
