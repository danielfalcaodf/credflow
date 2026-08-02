# Convenções de código — CredFlow

## Idioma

- **Código, identificadores, campos de API, nomes de arquivo: inglês.**
- **Texto voltado ao usuário: português (pt-BR).**

O código atual mistura os dois (`renda`/`income`, `calcularScore`/`creditSchema`)
e isso já causou um bug real: os steps do formulário registram `nome`, `idade`,
`renda`, `dividas` enquanto o schema espera `name`, `age`, `income`, `debts` —
nada chega ao submit. Ao tocar num arquivo, padronize para inglês.

## Valores monetários

- Backend: `BigDecimal`, coluna `numeric(15,2)`. **Nunca `double`/`float`** —
  binário de ponto flutuante não representa `0.1` exatamente e o erro acumula.
- JSON: `number` em reais (não centavos). `6000` = R$ 6.000,00.
- Frontend: formate com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.

## Score

Inteiro em `[0, 1000]`, sempre calculado no backend. O front nunca deriva,
ajusta ou reclassifica.

## Datas

UTC no backend (`timestamptz`, `Instant`), ISO-8601 no JSON. A conversão para o
fuso do usuário acontece na renderização.

## Backend (Java 21 / Spring Boot 3)

- DTOs como `record`; imutáveis por padrão.
- Injeção por construtor, não por campo — deixa a dependência explícita e o
  teste unitário trivial.
- `Optional` como retorno de repositório, nunca como parâmetro ou campo.
- Enums para valores fechados (`IncomeType`, `Classification`, `Decision`),
  nunca `String` solta.
- Constantes do motor de score em `@ConfigurationProperties`, não hardcoded —
  calibrar limiar não deveria exigir recompilar.
- `spring.jpa.hibernate.ddl-auto: validate` sempre; schema muda por migração
  Flyway em `src/main/resources/db/migration`.

## Frontend (Next.js 16 / React 19)

- TypeScript estrito. Sem `any` — o `register as any` em `CreditForm.tsx` é
  dívida a remover, não padrão a copiar.
- `components/ui`: gerado por `shadcn`. **Não editar à mão** — a próxima
  regeneração sobrescreve. Customização vai em wrapper próprio.
- `components/features`: componentes de domínio.
- Alias de import `@/*`.
- Validação com `zod` + `react-hook-form`. O schema do cliente espelha a
  validação do servidor para dar feedback rápido — nunca a substitui.
- Cores vêm da API como token semântico (`success`, `warning`, `danger`), não
  como classe Tailwind. O mapeamento token→classe é do frontend.

## Next.js 16 tem breaking changes

Antes de escrever código de frontend, leia o guia relevante em
`node_modules/next/dist/docs/` (requer `npm install`). App Router,
`params`/`searchParams`, caching e server actions mudaram em relação ao
conhecimento pré-treinado — não confie na memória.

## Testes

- Motor de score: teste unitário puro, sem contexto Spring. Os 7 casos-limite da
  §7.6 do PRD são obrigatórios.
- Integração: Testcontainers com PostgreSQL real. **Não use H2** — ele aceita SQL
  que o Postgres rejeita, e o teste passa enquanto a produção quebra.

## Segurança

- Segredos por variável de ambiente, nunca commitados.
- Senha com BCrypt (força ≥ 10); nunca em log ou resposta.
- Sem PII em log.
