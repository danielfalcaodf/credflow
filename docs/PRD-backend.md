# PRD — Backend CredFlow (`apps/api`)

| Campo | Valor |
|---|---|
| Produto | CredFlow — plataforma de simulação e análise de crédito pessoal |
| Documento | PRD do backend (API consumida por `apps/web`) |
| Versão | 1.0 |
| Data | 2026-08-02 |
| Status | Proposto — aguardando implementação |
| Stack alvo | Spring Boot 3 · Java 21 · Maven · PostgreSQL 16 |
| Repositório | monorepo Nx (`apps/web`, `apps/api`, `packages/*`) |

---

## 1. Contexto e problema

O CredFlow hoje é **apenas frontend**. Toda a lógica de crédito vive em
`apps/web/services/*.ts` e roda no navegador:

| Arquivo | Responsabilidade atual |
|---|---|
| `services/creditScore.ts` | Calcula o score (0–1000) |
| `services/creditInterpretation.ts` | Classifica o score em faixas |
| `services/creditAnalysis.ts` | Decide APROVADO / NEGADO / ANALISE |
| `services/explanations.ts` | Gera explicações do resultado |
| `services/suggestions.ts` | Gera sugestões de melhoria |

Consequências:

1. **Regra de negócio exposta** — qualquer usuário lê e altera o cálculo no browser.
2. **Sem persistência** — o resultado morre no `useState`; a rota `/historico`
   linkada na home não existe e `app/history.tsx` está vazio.
3. **Dados fixos** — o dashboard usa `userScore = 820` e uma lista estática de
   fatores; não há usuário real.
4. **Sem identidade** — o sitemap do README prevê `/auth/login`, `/register` e
   `/onboarding`, nada implementado.
5. **Regras divergentes** — as faixas de classificação do `ResultCard`
   (800/600/400) não batem com as do dashboard (500/700/850).

Este PRD especifica o backend que resolve os cinco pontos e habilita as telas
já previstas no sitemap (`/analise-credito`, `/fluxo-caixa`, `/simulador`).

## 2. Objetivo

Entregar uma API REST versionada que seja a **única fonte de verdade** das
regras de crédito, com autenticação, persistência e histórico, consumível pelo
`apps/web` sem que o frontend precise conhecer qualquer fórmula.

### Métricas de sucesso

| Métrica | Alvo |
|---|---|
| Regras de crédito no bundle do cliente | 0 (todas as funções de `services/` removidas ou viradas em client de API) |
| p95 de `POST /simulations` | < 300 ms |
| Cobertura de testes do motor de score | ≥ 90 % de linhas, 100 % dos casos-limite da §7 |
| Disponibilidade em produção | ≥ 99,5 % mensal |
| Paridade de resultado front↔back durante a migração | 100 % nos casos da tabela §7.6 |

### Fora de escopo (v1)

- Integração com bureaus reais (Serasa, Boa Vista, Open Finance).
- Concessão real de crédito, contratos ou desembolso.
- Modelos estatísticos/ML — o score v1 é determinístico e baseado em regras.
- Painel administrativo, multi-tenant, cobrança.
- App mobile nativo.

## 3. Personas e jornadas

| Persona | Necessidade |
|---|---|
| **Visitante** | Entender seu potencial de crédito sem fricção, antes de criar conta |
| **Usuário autenticado** | Acompanhar score ao longo do tempo, entender o que o influencia e simular cenários |
| **Autônomo/PJ com renda variável** | Enxergar recebíveis e volatilidade da renda, testar quedas de faturamento |

Jornada principal (já desenhada no front):

```
/ (home)  →  /simulacao (form 3 etapas)  →  cálculo  →  resultado
                                                          ├→ /dashboard (score, fatores)
                                                          ├→ /analise-credito (fatores, evolução)
                                                          ├→ /fluxo-caixa (recebíveis, volatilidade)
                                                          └→ /simulador (what-if, stress test)
```

## 4. Mapa frontend → backend

Cada elemento de tela existente ou previsto e o endpoint que passa a alimentá-lo.

| Tela / componente | Origem hoje | Endpoint |
|---|---|---|
| `/simulacao` — `CreditForm` (3 etapas) | `calcularScore` local + `setTimeout` | `POST /api/v1/simulations` |
| `ResultCard` — score + barra | `results.score` | resposta de `POST /simulations` |
| `ResultCard` — classificação/cor/mensagem | `interpretarScore` | campo `classification` da mesma resposta |
| `ResultCard` — "o que influenciou" | `gerarExplicacoes` | campo `explanations` |
| `ResultCard` — "como melhorar" | `gerarSugestoes` | campo `suggestions` |
| Status de aprovação | `analisarCredito` | campo `decision` |
| `/dashboard` — saudação `user.name` | constante `'Juliana'` | `GET /api/v1/me` |
| `/dashboard` — `CreditScoreGauge` | constante `820` | `GET /api/v1/dashboard/summary` |
| `/dashboard` — badge (Baixo/Regular/Muito Bom/Excelente) | `getScoreBadge` local | `summary.score.classification` |
| `/dashboard` — `ScoreFactors` | array estático | `summary.factors` |
| `/dashboard` — `ScoreAnalysis` (texto) | texto fixo | `summary.headline` |
| `/historico` (link na home, tela a criar) | inexistente | `GET /api/v1/simulations` |
| `/analise-credito` — aba Fatores de Impacto | inexistente | `GET /api/v1/score/factors` |
| `/analise-credito` — aba Evolução do Score | inexistente | `GET /api/v1/score/history` |
| `/fluxo-caixa` — Calendário de Recebíveis | inexistente | `GET /api/v1/cash-flow/calendar` |
| `/fluxo-caixa` — Análise de Volatilidade | inexistente | `GET /api/v1/cash-flow/volatility` |
| `/simulador` — Sliders Dinâmicos | inexistente | `POST /api/v1/simulator/preview` |
| `/simulador` — Stress Test de Renda | inexistente | `POST /api/v1/simulator/stress-test` |
| `/auth/login`, `/register`, `/onboarding` | inexistentes | `POST /api/v1/auth/*`, `POST /api/v1/onboarding` |

## 5. Requisitos funcionais

Prioridade: **P0** = MVP (bloqueia lançamento) · **P1** = próxima entrega · **P2** = desejável.

### 5.1 Autenticação e conta

| ID | Prioridade | Requisito |
|---|---|---|
| RF-001 | P0 | `POST /auth/register` cria conta com `name`, `email`, `password`. E-mail único (case-insensitive), normalizado em minúsculas. |
| RF-002 | P0 | Senha com mínimo 8 caracteres, ao menos uma letra e um número; armazenada com BCrypt (força ≥ 10). Senha nunca aparece em resposta ou log. |
| RF-003 | P0 | `POST /auth/login` valida credenciais e devolve `accessToken` (JWT, 15 min) e `refreshToken` (opaco, 30 dias). |
| RF-004 | P0 | Credencial inválida devolve `401` com mensagem genérica ("E-mail ou senha inválidos"), sem revelar se o e-mail existe. |
| RF-005 | P0 | `POST /auth/refresh` troca um refresh token válido por um novo par (rotação: o token antigo é invalidado no uso). |
| RF-006 | P0 | `POST /auth/logout` revoga o refresh token da sessão atual. |
| RF-007 | P0 | `GET /me` devolve o perfil do usuário autenticado (`id`, `name`, `email`, `onboardingCompleted`, `createdAt`). |
| RF-008 | P1 | `PATCH /me` atualiza `name`, `age` e `incomeType`. |
| RF-009 | P1 | Após 5 falhas de login para o mesmo e-mail em 15 min, novas tentativas devolvem `429` por 15 min. |
| RF-010 | P2 | `POST /auth/forgot-password` e `POST /auth/reset-password` com token de uso único válido por 1 h. |

### 5.2 Onboarding e perfil de crédito

| ID | Prioridade | Requisito |
|---|---|---|
| RF-020 | P0 | `POST /onboarding` grava o perfil de crédito inicial (`age`, `monthlyIncome`, `monthlyDebts`, `incomeType`) e marca `onboardingCompleted = true`. |
| RF-021 | P0 | O onboarding dispara uma simulação inicial, gerando o primeiro snapshot de score do usuário. |
| RF-022 | P0 | `GET /credit-profile` devolve o perfil vigente; `PUT /credit-profile` o atualiza e **recalcula** o score, gerando novo snapshot. |
| RF-023 | P1 | O perfil mantém histórico de versões (append-only) para reconstruir a evolução do score. |
| RF-024 | P1 | `incomeType` aceita exatamente `CLT`, `AUTONOMO`, `PJ` (mesmo enum de `types/credit.ts`); valor fora da lista → `400`. |

### 5.3 Simulação de crédito (núcleo)

| ID | Prioridade | Requisito |
|---|---|---|
| RF-030 | P0 | `POST /simulations` recebe `{ name, age, income, debts, incomeType }` e devolve, numa única resposta: `score`, `classification`, `decision`, `explanations`, `suggestions`, `factors`, `commitmentRatio`. |
| RF-031 | P0 | O endpoint aceita chamada **anônima** (visitante da home) e **autenticada**. Autenticado: persiste e vincula ao usuário. Anônimo: calcula e devolve sem persistir dados pessoais. |
| RF-032 | P0 | Validação de entrada espelhando `creditSchema`: `name` ≥ 2 caracteres; `age` ≥ 18 e ≤ 120; `income` ≥ 1; `debts` ≥ 0; `incomeType` no enum. Violação → `400` com lista de erros por campo. |
| RF-033 | P0 | O cálculo é determinístico: mesma entrada ⇒ mesma saída, sem dependência de data/hora. |
| RF-034 | P0 | A resposta inclui `engineVersion` (ex.: `"1.0.0"`), persistida junto com a simulação, para auditoria e comparabilidade histórica. |
| RF-035 | P0 | `GET /simulations` lista as simulações do usuário autenticado, paginadas (`page`, `size` ≤ 50, padrão 20), ordenadas por `createdAt` desc. Alimenta `/historico`. |
| RF-036 | P0 | `GET /simulations/{id}` devolve uma simulação completa. Simulação de outro usuário → `404` (nunca `403`, para não vazar existência). |
| RF-037 | P1 | `DELETE /simulations/{id}` remove logicamente (soft delete) a simulação do próprio usuário. |
| RF-038 | P1 | Simulações anônimas podem ser reivindicadas: `POST /simulations/{token}/claim` associa ao usuário recém-registrado, usando um `claimToken` de uso único devolvido no cálculo anônimo (validade 24 h). |
| RF-039 | P2 | `GET /simulations/{id}/export` devolve um PDF do resultado. |

### 5.4 Motor de score

| ID | Prioridade | Requisito |
|---|---|---|
| RF-040 | P0 | O score é inteiro em `[0, 1000]`, calculado pelas regras da §7.1, com clamp final. |
| RF-041 | P0 | `commitmentRatio = debts / income`, arredondado a 4 casas, devolvido na resposta. `income` é sempre ≥ 1, então não há divisão por zero; ainda assim o serviço rejeita `income = 0` antes de dividir. |
| RF-042 | P0 | A classificação usa a **tabela canônica única** da §7.2, substituindo as duas tabelas divergentes do front. |
| RF-043 | P0 | A decisão (`APPROVED` / `DENIED` / `UNDER_REVIEW`) segue a §7.3. |
| RF-044 | P0 | Cada componente que alterou o score vira um **fator** (`label`, `type` ∈ `POSITIVE`/`NEUTRAL`/`WARNING`, `impact` em pontos, `weight` relativo), formato consumido direto por `ScoreFactors`. |
| RF-045 | P0 | Explicações (§7.4) e sugestões (§7.5) são geradas pelo backend em pt-BR; o front apenas renderiza. |
| RF-046 | P1 | As constantes do motor (pesos, limiares, faixas) ficam em configuração externalizada (`application.yml` + `@ConfigurationProperties`), alteráveis sem recompilar. |
| RF-047 | P1 | Mudança de qualquer constante exige bump de `engineVersion`; snapshots antigos preservam a versão com que foram calculados. |
| RF-048 | P2 | `GET /score/rules` expõe as regras vigentes (limiares e pesos) para telas explicativas. |

### 5.5 Dashboard

| ID | Prioridade | Requisito |
|---|---|---|
| RF-050 | P0 | `GET /dashboard/summary` devolve num único payload tudo que `/dashboard` renderiza: `user.name`, `score.value`, `score.max` (1000), `score.classification` (label + cor semântica), `headline`, `factors[]`, `lastUpdatedAt`. |
| RF-051 | P0 | Usuário sem simulação alguma recebe `200` com `score: null` e `state: "NO_DATA"`, para o front exibir o estado vazio em vez de quebrar. |
| RF-052 | P1 | `summary.delta` traz a variação de pontos em relação ao snapshot anterior (`+/- n`, `null` se for o primeiro). |
| RF-053 | P1 | `headline` é gerada a partir da faixa do score (equivalente ao texto fixo de `ScoreAnalysis`). |

### 5.6 Análise de crédito

| ID | Prioridade | Requisito |
|---|---|---|
| RF-060 | P0 | `GET /score/factors` devolve os fatores de impacto do score atual, ordenados por `|impact|` desc — aba "Fatores de Impacto". |
| RF-061 | P0 | `GET /score/history?from&to&granularity=DAY\|WEEK\|MONTH` devolve a série temporal de snapshots (`date`, `score`, `classification`) — aba "Evolução do Score". Padrão: últimos 12 meses, granularidade `MONTH`. |
| RF-062 | P1 | Sem snapshots no período, devolve `200` com série vazia (nunca `404`). |
| RF-063 | P1 | Um snapshot é criado a cada recálculo (nova simulação autenticada ou atualização de perfil), no máximo um por dia por usuário — o mais recente do dia sobrescreve. |
| RF-064 | P2 | `GET /score/history` aceita `compare=peers` e devolve a mediana da faixa etária, para benchmarking. |

### 5.7 Fluxo de caixa

| ID | Prioridade | Requisito |
|---|---|---|
| RF-070 | P1 | CRUD de lançamentos: `POST/GET/PUT/DELETE /cash-flow/entries`, com `type` (`INCOME`/`EXPENSE`), `amount`, `dueDate`, `description`, `recurrence` (`NONE`/`WEEKLY`/`MONTHLY`), `status` (`EXPECTED`/`RECEIVED`/`OVERDUE`). |
| RF-071 | P1 | `GET /cash-flow/calendar?month=YYYY-MM` devolve os dias do mês com totais de entradas, saídas e saldo acumulado — "Calendário de Recebíveis". |
| RF-072 | P1 | Lançamentos recorrentes são expandidos em ocorrências virtuais no calendário, sem gravar linha por ocorrência. |
| RF-073 | P1 | `GET /cash-flow/volatility?months=6` devolve `mean`, `standardDeviation`, `coefficientOfVariation`, `classification` (`STABLE` < 0,15 · `MODERATE` 0,15–0,35 · `VOLATILE` > 0,35) e a série mensal — "Análise de Volatilidade". |
| RF-074 | P1 | Com menos de 3 meses de dados, a volatilidade devolve `classification: "INSUFFICIENT_DATA"` e `null` nos indicadores. |
| RF-075 | P2 | A volatilidade influencia o score: `VOLATILE` aplica penalidade adicional (definida em configuração), refletida como fator `WARNING`. |
| RF-076 | P2 | Importação de extrato via CSV: `POST /cash-flow/import`. |

### 5.8 Simulador

| ID | Prioridade | Requisito |
|---|---|---|
| RF-080 | P1 | `POST /simulator/preview` recebe um cenário (`income`, `debts`, `incomeType` alterados) e devolve o score resultante **sem persistir** — alimenta os sliders dinâmicos. |
| RF-081 | P1 | A resposta traz `baseScore`, `simulatedScore`, `delta` e os fatores que mudaram, para o front destacar o efeito de cada ajuste. |
| RF-082 | P1 | `POST /simulator/stress-test` recebe `{ incomeDropPercentages: [10, 25, 50] }` e devolve, para cada queda, o score e a decisão resultantes. |
| RF-083 | P1 | O stress test aponta o `breakingPoint`: a menor queda percentual de renda que muda a decisão para `DENIED`, ou `null` se nenhuma das faixas testadas atingir. |
| RF-084 | P1 | `preview` e `stress-test` respondem em < 200 ms (p95) e não geram snapshot nem entram no histórico. |
| RF-085 | P2 | `POST /simulator/loan` calcula parcela máxima suportada dada uma taxa e prazo, respeitando o limite de comprometimento configurado. |

### 5.9 Plataforma e observabilidade

| ID | Prioridade | Requisito |
|---|---|---|
| RF-090 | P0 | `GET /actuator/health` (liveness/readiness) exposto; demais endpoints do Actuator restritos. |
| RF-091 | P0 | Toda resposta de erro segue RFC 9457 (`application/problem+json`), com `type`, `title`, `status`, `detail`, `instance` e, em `400`, o array `errors[{ field, message }]`. |
| RF-092 | P0 | CORS liberado apenas para as origens do `web` (configurável por ambiente); credenciais permitidas. |
| RF-093 | P0 | OpenAPI 3 gerado automaticamente (springdoc) em `/v3/api-docs` e Swagger UI em `/swagger-ui` (desabilitado em produção). |
| RF-094 | P1 | Toda requisição carrega `X-Request-Id` (gerado se ausente) propagado em logs estruturados JSON. |
| RF-095 | P1 | Migrações de banco versionadas com Flyway; `ddl-auto` sempre `validate`. |
| RF-096 | P1 | Rate limit global de 100 req/min por IP em endpoints públicos (`/auth/*`, `POST /simulations` anônimo). |

## 6. Requisitos não funcionais

| ID | Categoria | Requisito |
|---|---|---|
| RNF-01 | Desempenho | p95 < 300 ms para leituras e simulação; p95 < 200 ms para `simulator/*`. |
| RNF-02 | Escala | 1.000 usuários simultâneos, 50 req/s sustentados numa instância de 2 vCPU. |
| RNF-03 | Segurança | HTTPS obrigatório; JWT assinado (HS256 mínimo, RS256 preferível) com segredo por variável de ambiente; senhas com BCrypt; sem PII em log. |
| RNF-04 | Privacidade (LGPD) | A home promete "não compartilhamos seus dados com terceiros": nenhum dado pessoal sai da plataforma. Exportação (`GET /me/data`) e exclusão de conta (`DELETE /me`) com apagamento em até 30 dias. |
| RNF-05 | Confiabilidade | Disponibilidade ≥ 99,5 %; backup diário do PostgreSQL com retenção de 30 dias. |
| RNF-06 | Testabilidade | Testes unitários do motor de score sem contexto Spring; testes de integração com Testcontainers (PostgreSQL real, nunca H2). |
| RNF-07 | Manutenibilidade | Camadas `controller/service/repository/domain`; entidades JPA não vazam para o controller; DTOs como `record`. |
| RNF-08 | Portabilidade | Imagem Docker; configuração 100 % por variáveis de ambiente; `docker-compose` para desenvolvimento local. |
| RNF-09 | Acessibilidade do contrato | Mensagens ao usuário em pt-BR, prontas para exibição, sem necessidade de tradução no cliente. |
| RNF-10 | Compatibilidade | API versionada em `/api/v1`; mudanças incompatíveis exigem `/api/v2`. |

## 7. Regras de negócio (especificação executável)

Extraídas de `apps/web/services/*.ts` e formalizadas. **Esta seção é normativa** —
o backend deve reproduzi-la exatamente para que a migração não altere resultados.

### 7.1 Cálculo do score — `engineVersion 1.0.0`

```
base = 500
commitmentRatio = debts / income

// 1. Comprometimento de renda
se commitmentRatio > 0.60      → -300
senão se commitmentRatio > 0.30 → -150
senão                           → +100

// 2. Faixa de renda
se income > 5000               → +150
senão se income > 3000          → +80
senão                           →   0

// 3. Tipo de renda
se incomeType == CLT           → +100
senão (AUTONOMO, PJ)            →  -50

score = clamp(soma, 0, 1000)
```

Comparações são **estritas** (`>`), como no código atual: `commitmentRatio`
exatamente `0.30` cai no ramo `+100`; `income` exatamente `5000` recebe `+80`.

### 7.2 Classificação — tabela canônica

O front tem hoje duas tabelas incompatíveis: `creditInterpretation.ts`
(800 / 600 / 400) e `dashboard/page.tsx` (500 / 700 / 850). **Decisão:** adota-se
a tabela de `creditInterpretation.ts` como canônica, por ser a que já acompanha
mensagem ao usuário; os rótulos do dashboard são mapeados para ela. O badge do
dashboard passa a consumir `classification` da API.

| Faixa | `classification` | `label` (pt-BR) | Cor semântica | Mensagem |
|---|---|---|---|---|
| 800–1000 | `EXCELLENT` | Excelente | `success` | Seu perfil financeiro é muito sólido. |
| 600–799 | `GOOD` | Bom | `info` | Seu perfil é estável, com baixo risco. |
| 400–599 | `FAIR` | Risco | `warning` | Seu nível de endividamento merece atenção. |
| 0–399 | `POOR` | Alto risco | `danger` | Seu perfil indica alto risco de inadimplência. |

A API devolve `classification` (enum estável) e `label`/`message` (texto pt-BR).
Cores são devolvidas como token semântico, **não** como classe Tailwind — o
mapeamento `success → text-emerald-500` fica no frontend.

### 7.3 Decisão

```
se income > 3000 E commitmentRatio < 0.30  → APPROVED
senão se commitmentRatio > 0.60             → DENIED
senão                                        → UNDER_REVIEW
```

| Decisão | Mensagem |
|---|---|
| `APPROVED` | Seu perfil financeiro está saudável. |
| `DENIED` | Seu nível de endividamento está alto. |
| `UNDER_REVIEW` | Precisamos de mais informações. |

A ordem das cláusulas importa e deve ser preservada.

### 7.4 Explicações (`explanations[]`)

Lista, possivelmente vazia; front exibe "Seu perfil está equilibrado." quando vazia.

| Condição | Texto |
|---|---|
| `commitmentRatio > 0.60` | Seu nível de endividamento está muito alto. |
| `commitmentRatio < 0.30` | Seu controle de dívidas é positivo. |
| `income < 2000` | Sua renda pode limitar seu acesso ao crédito. |

### 7.5 Sugestões (`suggestions[]`)

| Faixa de score | Sugestões |
|---|---|
| `< 400` | Reduza suas dívidas antes de solicitar crédito · Evite atrasos em pagamentos |
| `400–699` | Tente reduzir seu comprometimento mensal · Mantenha pagamentos em dia |
| `≥ 700` | Continue mantendo seu bom histórico financeiro |

### 7.6 Casos-limite obrigatórios em teste

| # | income | debts | incomeType | ratio | score | classification | decision |
|---|---|---|---|---|---|---|---|
| 1 | 6000 | 1000 | CLT | 0,1667 | 850 | EXCELLENT | APPROVED |
| 2 | 3000 | 900 | CLT | 0,30 | 700 | GOOD | UNDER_REVIEW |
| 3 | 2000 | 1400 | AUTONOMO | 0,70 | 150 | POOR | DENIED |
| 4 | 10000 | 100 | PJ | 0,01 | 700 | GOOD | APPROVED |
| 5 | 1000 | 900 | AUTONOMO | 0,90 | 150 | POOR | DENIED |
| 6 | 5000 | 2000 | CLT | 0,40 | 530 | FAIR | UNDER_REVIEW |
| 7 | 1 | 0 | CLT | 0,00 | 700 | GOOD | UNDER_REVIEW |

Caso 2 documenta o limite estrito: `ratio = 0.30` **não** é `> 0.30`, então soma
`+100`; e `income = 3000` **não** é `> 3000`, então a decisão não é `APPROVED`.

## 8. Modelo de dados

```
users
  id UUID PK · name · email (unique, citext) · password_hash
  onboarding_completed bool · created_at · updated_at · deleted_at

credit_profiles                       -- append-only, versionado (RF-023)
  id UUID PK · user_id FK · version int
  age int · monthly_income numeric(15,2) · monthly_debts numeric(15,2)
  income_type varchar(16) · created_at
  UNIQUE (user_id, version)

simulations
  id UUID PK · user_id FK NULL          -- NULL = simulação anônima
  claim_token varchar NULL · claim_token_expires_at
  input_name · input_age · input_income numeric(15,2) · input_debts numeric(15,2)
  input_income_type varchar(16)
  score int · commitment_ratio numeric(6,4)
  classification varchar(16) · decision varchar(16) · engine_version varchar(16)
  created_at · deleted_at
  INDEX (user_id, created_at DESC)

simulation_factors
  id UUID PK · simulation_id FK
  label · type varchar(8) · impact int · weight numeric(5,4) · position int

score_snapshots                        -- série da evolução (RF-061/063)
  id UUID PK · user_id FK · simulation_id FK NULL
  score int · classification varchar(16) · snapshot_date date
  engine_version varchar(16) · created_at
  UNIQUE (user_id, snapshot_date)

cash_flow_entries
  id UUID PK · user_id FK
  type varchar(8) · amount numeric(15,2) · due_date date · description
  recurrence varchar(8) · status varchar(10) · created_at · updated_at · deleted_at
  INDEX (user_id, due_date)

refresh_tokens
  id UUID PK · user_id FK · token_hash · expires_at · revoked_at · created_at
  INDEX (user_id) · INDEX (token_hash)

login_attempts                         -- rate limit de login (RF-009)
  id UUID PK · email · ip · succeeded bool · attempted_at
```

Regras: dinheiro em `numeric(15,2)`; datas em UTC (`timestamptz`); exclusões
lógicas via `deleted_at`; migrações Flyway em `apps/api/src/main/resources/db/migration`.

## 9. Contrato da API

Base: `/api/v1`. Autenticação: `Authorization: Bearer <accessToken>`.

### 9.1 `POST /simulations`

Request:

```json
{
  "name": "Juliana Alves",
  "age": 32,
  "income": 6000,
  "debts": 1000,
  "incomeType": "CLT"
}
```

Response `201`:

```json
{
  "id": "6f1c…",
  "score": 850,
  "maxScore": 1000,
  "commitmentRatio": 0.1667,
  "classification": {
    "code": "EXCELLENT",
    "label": "Excelente",
    "tone": "success",
    "message": "Seu perfil financeiro é muito sólido."
  },
  "decision": { "code": "APPROVED", "message": "Seu perfil financeiro está saudável." },
  "explanations": ["Seu controle de dívidas é positivo."],
  "suggestions": ["Continue mantendo seu bom histórico financeiro"],
  "factors": [
    { "label": "Baixo comprometimento de renda", "type": "POSITIVE", "impact": 100 },
    { "label": "Renda acima de R$ 5.000",        "type": "POSITIVE", "impact": 150 },
    { "label": "Renda estável (CLT)",            "type": "POSITIVE", "impact": 100 }
  ],
  "engineVersion": "1.0.0",
  "createdAt": "2026-08-02T14:31:05Z",
  "claimToken": "…"
}
```

`claimToken` só aparece em chamada anônima.

### 9.2 `GET /dashboard/summary`

```json
{
  "state": "READY",
  "user": { "name": "Juliana" },
  "score": {
    "value": 820,
    "max": 1000,
    "delta": 35,
    "classification": { "code": "EXCELLENT", "label": "Excelente", "tone": "success" }
  },
  "headline": "Seu score está ótimo! Isso indica uma boa saúde financeira.",
  "factors": [
    { "label": "Estabilidade de renda",           "type": "POSITIVE" },
    { "label": "Baixo comprometimento",           "type": "POSITIVE" },
    { "label": "Histórico de pagamentos",         "type": "POSITIVE" },
    { "label": "Dívidas acima de 30% da renda",   "type": "WARNING"  }
  ],
  "lastUpdatedAt": "2026-08-02T14:31:05Z"
}
```

Estado vazio: `{ "state": "NO_DATA", "user": {...}, "score": null, "factors": [] }`.

### 9.3 Demais endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/register` | — | Cria conta |
| POST | `/auth/login` | — | Autentica |
| POST | `/auth/refresh` | — | Rotaciona tokens |
| POST | `/auth/logout` | ✅ | Revoga sessão |
| GET | `/me` | ✅ | Perfil |
| PATCH | `/me` | ✅ | Atualiza perfil |
| DELETE | `/me` | ✅ | Exclui conta (LGPD) |
| POST | `/onboarding` | ✅ | Perfil inicial + 1ª simulação |
| GET/PUT | `/credit-profile` | ✅ | Perfil de crédito |
| POST | `/simulations` | opc. | Calcula (§9.1) |
| GET | `/simulations` | ✅ | Histórico paginado |
| GET | `/simulations/{id}` | ✅ | Detalhe |
| DELETE | `/simulations/{id}` | ✅ | Soft delete |
| POST | `/simulations/{token}/claim` | ✅ | Vincula simulação anônima |
| GET | `/dashboard/summary` | ✅ | Payload do dashboard (§9.2) |
| GET | `/score/factors` | ✅ | Fatores de impacto |
| GET | `/score/history` | ✅ | Evolução do score |
| GET | `/score/rules` | — | Regras vigentes |
| GET/POST/PUT/DELETE | `/cash-flow/entries` | ✅ | Lançamentos |
| GET | `/cash-flow/calendar` | ✅ | Calendário de recebíveis |
| GET | `/cash-flow/volatility` | ✅ | Volatilidade da renda |
| POST | `/simulator/preview` | ✅ | What-if (sliders) |
| POST | `/simulator/stress-test` | ✅ | Stress test de renda |

### 9.4 Erros (RFC 9457)

```json
{
  "type": "https://credflow.app/errors/validation",
  "title": "Dados inválidos",
  "status": 400,
  "detail": "A requisição contém campos inválidos.",
  "instance": "/api/v1/simulations",
  "errors": [
    { "field": "age",    "message": "Você precisa ser maior de idade" },
    { "field": "income", "message": "Informe sua renda" }
  ]
}
```

| Status | Quando |
|---|---|
| 400 | Validação de entrada |
| 401 | Token ausente/expirado/credencial inválida |
| 403 | Autenticado sem permissão |
| 404 | Recurso inexistente **ou** de outro usuário |
| 409 | E-mail já cadastrado |
| 422 | Regra de negócio violada (ex.: onboarding duplicado) |
| 429 | Rate limit |
| 500 | Erro interno (sem stack trace no corpo) |

## 10. Arquitetura no monorepo

```
apps/api/
├── project.json                 # alvos Nx: build, test, dev, lint (wrapping ./mvnw)
├── pom.xml
├── Dockerfile
├── docker-compose.yml           # PostgreSQL local
└── src/main/java/app/credflow/
    ├── CredflowApplication.java
    ├── config/                  # Security, CORS, OpenAPI, Jackson, ScoreProperties
    ├── auth/                    # controller, service, jwt, dto
    ├── user/
    ├── creditprofile/
    ├── simulation/
    │   ├── SimulationController · SimulationService · SimulationRepository
    │   └── engine/              # ScoreEngine, ClassificationResolver,
    │                            # DecisionResolver, ExplanationGenerator,
    │                            # SuggestionGenerator, FactorBuilder
    ├── score/                   # snapshots, histórico, fatores
    ├── cashflow/
    ├── simulator/
    ├── dashboard/
    └── shared/                  # ProblemDetail handler, paginação, auditoria
```

Integração Nx: `apps/api/project.json` define `build`/`test`/`dev`/`lint` como
`command` targets sobre `./mvnw`, com `cwd: {projectRoot}`, cache ligado em
`build`/`test` e `outputs: ["{projectRoot}/target"]`. Assim `nx run api:test` e
`nx affected` funcionam para os dois apps.

Pacote compartilhado sugerido (P1): `packages/contracts` com os tipos TS gerados
a partir do OpenAPI da API, consumidos por `apps/web` — elimina a divergência
entre `types/credit.ts` e o contrato real.

### Consumo pelo frontend

- `NEXT_PUBLIC_API_URL` aponta para a API; um client em `apps/web/lib/api.ts`
  centraliza fetch, token e tratamento de `problem+json`.
- `apps/web/services/*.ts` deixa de conter regra e passa a chamar a API (ou é
  removido, com os componentes consumindo diretamente o client).
- Access token em memória; refresh token em cookie `httpOnly` + `SameSite=Lax`.

## 11. Plano de entrega

| Fase | Escopo | Entregável |
|---|---|---|
| **F0 — Fundação** | `apps/api` no Nx, Spring Boot 3 + Java 21, PostgreSQL via Docker, Flyway, Actuator, OpenAPI, handler RFC 9457, CORS | `nx run api:dev` sobe e `/actuator/health` responde |
| **F1 — Motor de score** | `POST /simulations` anônimo, engine completo (§7), testes dos 7 casos-limite | `/simulacao` consome a API; regra sai do bundle |
| **F2 — Identidade** | RF-001…RF-010, RF-020…RF-024, JWT + refresh, onboarding | `/auth/*` e `/onboarding` funcionais |
| **F3 — Persistência e dashboard** | Histórico, snapshots, `GET /dashboard/summary`, `/score/factors`, `/score/history` | `/dashboard` e `/historico` com dados reais |
| **F4 — Fluxo de caixa** | RF-070…RF-074 | `/fluxo-caixa` |
| **F5 — Simulador** | RF-080…RF-084 | `/simulador` |
| **F6 — Endurecimento** | Rate limit, LGPD (export/delete), logs estruturados, observabilidade, carga | Pronto para produção |

Critério de aceite transversal de F1: para as 7 entradas da §7.6, o resultado da
API é idêntico ao das funções TS atuais — validado por teste automatizado antes
de remover o código do cliente.

## 12. Riscos e decisões em aberto

| Risco / questão | Impacto | Encaminhamento |
|---|---|---|
| Duas tabelas de classificação divergentes no front | Usuário vê rótulos diferentes para o mesmo score | Resolvido nesta v1: tabela canônica §7.2; ajustar `dashboard/page.tsx` |
| Score puramente heurístico, sem dado real de bureau | Baixa credibilidade do resultado | Posicionar como **simulação educativa**; deixar explícito na UI; integração com bureau fica para v2 |
| Regra `income > 3000` para aprovação exclui grande parte do público | Muitos `UNDER_REVIEW` | Constantes externalizadas (RF-046) permitem calibrar sem redeploy |
| Simulação anônima cria dado pessoal sem consentimento | LGPD | Anônimo não persiste PII; `claimToken` expira em 24 h |
| `ScoreFactors` do front tem itens sem lastro nos dados (ex.: "Histórico de pagamentos") | Fator sem origem no cálculo | Só devolver fatores derivados de dados existentes; "Histórico de pagamentos" depende de F4 |
| Java + Node no mesmo pipeline Nx | CI mais lento/complexo | `nx affected` + cache; jobs separados por app |
| **Em aberto** | — | Autenticação social (Google) na v1? Retenção de snapshots além de 24 meses? Moeda/localidade além de BRL/pt-BR? |

## 13. Referências

- `README.md` — sitemap e stack alvo do monorepo
- `apps/web/types/credit.ts` — schema de entrada (zod)
- `apps/web/services/*.ts` — regras de negócio de origem (§7)
- `apps/web/app/dashboard/**` — contrato visual do dashboard (§9.2)
- Spring Boot 3 — `@Valid @RequestBody`, `ProblemDetail`, Bean Validation,
  `spring.jpa.hibernate` (docs consultadas via Context7 em `/spring-projects/spring-boot`)
- RFC 9457 — Problem Details for HTTP APIs
