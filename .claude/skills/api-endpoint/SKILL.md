---
name: api-endpoint
description: Guia o caminho completo de adicionar um endpoint ao backend CredFlow — do requisito RF-0xx no PRD até controller, service, repository, migração Flyway, testes e consumo no frontend. Use ao criar ou alterar qualquer rota da API, ao ligar uma tela do apps/web a um endpoint novo, ou quando o pedido for do tipo "faz o histórico funcionar" / "cria a rota de fluxo de caixa" / "o dashboard precisa vir do banco".
---

# Adicionar um endpoint ao `apps/api`

O objetivo é que cada endpoint saia consistente com os outros: mesma estrutura,
mesmo formato de erro, mesma cobertura de teste. Isso importa porque o frontend
consome tudo por um client único — uma rota que devolve erro num formato
diferente vira um `catch` especial e a exceção se espalha.

## 1. Ancore no PRD antes de codificar

Localize o requisito em `docs/PRD-backend.md`:

- §4 diz qual tela consome o endpoint
- §5 tem o requisito (`RF-0xx`), com a prioridade
- §9 tem o contrato (rota, request, response)
- §8 tem o modelo de dados

Se o que você precisa não está lá, é sinal de que o escopo mudou: escreva o
requisito no PRD primeiro e depois implemente. Endpoint que não está no PRD
vira endpoint que ninguém sabe manter.

## 2. Implemente de dentro para fora

Começar pelo domínio evita moldar a regra ao formato do JSON.

**Domínio/service** — a regra e a transação. Se envolve cálculo de crédito, a §7
do PRD é normativa; consulte `.claude/rules/credit-rules.md`.

**Repository** — Spring Data JPA. Consultas de lista sempre paginadas
(`Pageable`), com `size` máximo de 50.

**Migração Flyway** — `src/main/resources/db/migration/V<n>__<descricao>.sql`,
numeração sequencial. `ddl-auto` fica em `validate`, então o schema só muda por
migração. Dinheiro em `numeric(15,2)`, datas em `timestamptz`, exclusão lógica
via `deleted_at`.

**DTOs** — `record` de entrada e de saída, em `dto/`. A entidade JPA não sai do
service: expor entidade acopla o contrato HTTP ao schema e vaza campo por
acidente (`passwordHash`).

**Controller** — só HTTP:

```java
@PostMapping
ResponseEntity<SimulationResponse> create(@Valid @RequestBody SimulationRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.simulate(request));
}
```

## 3. Regras transversais

- **Validação** com Bean Validation na entrada (`@Valid`), espelhando o schema
  zod do front. O cliente valida para dar feedback rápido; o servidor valida
  porque é a única barreira real.
- **Erro** em RFC 9457 pelo handler central. Não invente formato local.
- **Recurso de outro usuário devolve `404`, não `403`** — `403` confirma que o
  id existe e vaza informação.
- **Autorização** sempre a partir do usuário autenticado no contexto de
  segurança, nunca de um `userId` vindo do corpo ou da query. Aceitar `userId`
  do cliente é permitir que qualquer um leia dados alheios.

## 4. Teste

- `@WebMvcTest` para o contrato: status, forma do JSON, validação rejeitando
  entrada inválida.
- `@SpringBootTest` + Testcontainers (PostgreSQL real) para o caminho completo.
  Não use H2 — ele aceita SQL que o Postgres rejeita, e o teste fica verde
  enquanto a produção quebra.
- Um teste de autorização: usuário A não enxerga recurso de B.

```bash
nx run api:test
```

## 5. Consumo no frontend

- Adicione a função ao client em `apps/web/lib/api.ts` — fetch, token e
  tratamento de `problem+json` ficam centralizados.
- Trate os três estados: carregando, erro e vazio. As telas atuais assumem que
  sempre há dado (`userScore = 820` fixo) e quebram sem ele.
- Erro `400` traz `errors[{ field, message }]`: mapeie para os campos do
  `react-hook-form` em vez de um alerta genérico.
- Nenhuma regra de crédito no cliente. O front renderiza o que a API mandou.

```bash
npm run lint && npm run build
```

## 6. Feche o ciclo

Atualize o §9.3 do PRD se a rota mudou de forma, e marque o `RF-0xx` como
implementado. O PRD é lido como fonte da verdade — se ele envelhece, deixa de
servir para isso.
