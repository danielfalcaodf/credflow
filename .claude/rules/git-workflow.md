# Fluxo Git — CredFlow (GitFlow)

## Branches

| Branch | Origem | Destino do merge | Propósito |
|---|---|---|---|
| `main` | — | — | Produção. Só recebe merge de `release/*` e `hotfix/*`. Toda commit é uma versão. |
| `develop` | `main` | — | Integração contínua. Base de todo trabalho novo. |
| `feature/<slug>` | `develop` | `develop` | Funcionalidade ou documentação |
| `bugfix/<slug>` | `develop` | `develop` | Correção em desenvolvimento |
| `release/<versão>` | `develop` | `main` + `develop` | Estabilização pré-lançamento |
| `hotfix/<slug>` | `main` | `main` + `develop` | Correção urgente em produção |

`<slug>` em kebab-case, curto e descritivo, **em inglês**, sem nome de
ferramenta ou de agente: `feature/score-engine`, não `feature/claude-score`.

```bash
git checkout develop && git pull origin develop
git checkout -b feature/score-engine
# ... trabalho ...
git push -u origin feature/score-engine
```

## Commits — Conventional Commits

```
<tipo>(<escopo>): <resumo no imperativo, minúsculo, sem ponto final>

<corpo: o quê e por quê, não como>
```

Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`.

Escopos deste repositório: `api`, `web`, `contracts`, `nx`, `docs`, `ci`.

```
feat(api): implementa motor de score com regras do PRD

Portugues os cálculos de apps/web/services para o backend, cobrindo os 7
casos-limite da §7.6. O frontend passa a consumir POST /simulations.
```

Regras:

- Resumo ≤ 72 caracteres.
- Um commit = uma mudança coerente. Não misture refactor com feature.
- **Sem trailers de co-autoria ou de sessão de ferramenta.** O autor do commit é
  a pessoa que revisou e aceitou a mudança; o histórico não registra o
  ferramental usado para escrevê-la.
- Nunca commite segredo, `.env` ou credencial.

## Pull requests

- Título segue Conventional Commits, igual ao commit principal.
- Descrição diz o **porquê** e liga aos requisitos do PRD (`RF-030`, `§7.2`).
- PR de `feature/*` sempre para `develop`; só `release/*` e `hotfix/*` vão para `main`.
- Antes de abrir: `npm run lint` e `npm run build` verdes; se tocou no `api`,
  `nx run api:test` verde.

## Antes de qualquer push

```bash
npm run lint
npm run build
nx run api:test    # se mexeu no backend
```
