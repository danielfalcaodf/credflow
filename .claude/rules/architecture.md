# Regras de arquitetura — CredFlow

## Fronteira entre frontend e backend

O backend (`apps/api`) é a **única fonte de verdade das regras de crédito**.
Isso não é preferência de estilo: hoje `apps/web/services/*.ts` roda no
navegador, então qualquer pessoa lê e altera a fórmula do score pelo devtools.
Enquanto a regra estiver no cliente, o resultado não é confiável.

Consequências práticas:

- Nenhum cálculo de score, classificação, decisão, explicação ou sugestão pode
  ser implementado ou duplicado em `apps/web`. O front recebe o resultado pronto
  e apenas renderiza.
- Se uma tela precisa de um número derivado, o endpoint devolve o número — não
  os ingredientes para o front calcular.
- Textos voltados ao usuário (mensagens, labels, sugestões) vêm da API em
  pt-BR, prontos para exibição.

## Camadas do backend

```
controller → service → repository → domain
```

- **Controller**: HTTP apenas. Recebe/devolve DTOs (`record`), valida com
  `@Valid`, não contém regra de negócio.
- **Service**: orquestra regra e transação. É onde vive o motor de score.
- **Repository**: acesso a dados (Spring Data JPA).
- **Entidades JPA nunca cruzam a fronteira do controller.** Expor entidade
  acopla o contrato HTTP ao schema do banco e vaza campos por acidente
  (`passwordHash`, `deletedAt`).

O motor de score fica isolado em `simulation/engine/`, sem dependência de Spring,
JPA ou HTTP — assim ele é testável com testes unitários puros e rápidos.

## Contratos compartilhados

Tipos usados por `web` e `api` pertencem a `packages/` (ex.: `packages/contracts`),
gerados a partir do OpenAPI da API. Cópias manuais em cada app divergem — é
exatamente a origem do bug de campos (`nome` vs `name`) que existe hoje.

## Erros

Toda resposta de erro segue RFC 9457 (`application/problem+json`), usando o
`ProblemDetail` nativo do Spring Boot 3. Erros de validação incluem
`errors[{ field, message }]` para o front mapear no formulário.

Nunca devolva stack trace no corpo da resposta.

## Monorepo

- Alvos do `api` são expostos em `apps/api/project.json` como `command` targets
  sobre o Maven Wrapper (`./mvnw`), com `cwd: "{projectRoot}"`. Assim
  `nx run api:test` e `nx affected` funcionam igual ao `web`.
- Cache do Nx ligado em `build`/`test`; desligado em `dev`/`start`.
- Sempre rode comandos a partir da raiz do repositório.

## Referência normativa

`docs/PRD-backend.md` é a fonte da verdade dos requisitos. A §7 (regras de
negócio) é **normativa**: o backend deve reproduzi-la exatamente, senão a
migração muda o resultado visto pelo usuário. Ao divergir do PRD, atualize o PRD
na mesma mudança — documento e código não podem contar histórias diferentes.
