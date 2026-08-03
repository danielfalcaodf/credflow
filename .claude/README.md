# `.claude/` — configuração para agentes

Estrutura que o Claude Code carrega automaticamente ao trabalhar neste
repositório.

```
.claude/
├── settings.json       # permissões do projeto (comandos liberados/bloqueados)
├── rules/              # regras importadas pelo CLAUDE.md da raiz
├── agents/             # subagents especializados
└── skills/             # skills invocáveis por /<nome> ou automaticamente
```

## Rules

Importadas via `@.claude/rules/*.md` no `CLAUDE.md` da raiz, então valem em toda
sessão sem ninguém precisar lembrar de citá-las.

| Arquivo | Conteúdo |
|---|---|
| `architecture.md` | Fronteira front/back, camadas, contratos, erros, monorepo |
| `conventions.md` | Idioma, dinheiro, tipos, testes, padrões de cada stack |
| `git-workflow.md` | GitFlow, Conventional Commits, checklist de PR |
| `credit-rules.md` | Resumo normativo das regras de score (§7 do PRD) |

## Agents

Subagents rodam em contexto próprio; use quando a tarefa for grande o bastante
para valer a delegação.

| Agent | Quando usar |
|---|---|
| `spring-api-builder` | Implementar/evoluir o backend em `apps/api` |
| `web-api-integrator` | Integrar `apps/web` à API, corrigir os bugs conhecidos do front |
| `credit-rules-auditor` | Auditar (somente leitura) a corretude das regras de crédito |

## Skills

| Skill | Quando usar |
|---|---|
| `score-parity` | Verificar se o motor de score bate com a §7 do PRD |
| `api-endpoint` | Adicionar/alterar um endpoint, do PRD ao consumo no front |
| `nx-java-target` | Integrar o app Maven ao Nx, cache e `nx affected` |

`score-parity` traz um script sem dependências que também roda em CI:

```bash
python3 .claude/skills/score-parity/scripts/check_parity.py --api-url http://localhost:8080 --grid
```

Sai com código 1 em caso de divergência.

## Evoluindo esta configuração

As skills seguem o formato do `skill-creator` (frontmatter `name` +
`description`, corpo em markdown, `scripts/` para trabalho repetitivo). Elas
ainda não passaram por um ciclo de evals — quando quiser medir se estão
disparando e ajudando de fato, o `skill-creator` roda casos de teste com e sem a
skill e gera um comparativo.

Ao mudar uma regra de negócio, atualize `docs/PRD-backend.md` **primeiro** e
depois `.claude/rules/credit-rules.md`. O PRD é a decisão; o resto é consequência.
