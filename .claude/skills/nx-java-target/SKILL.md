---
name: nx-java-target
description: Integra um app Java/Maven ao workspace Nx do CredFlow, expondo build, test, dev e lint como targets que funcionam igual aos do frontend. Use ao criar o apps/api, ao adicionar ou corrigir targets em project.json, quando "nx run api:test" não funcionar, ao configurar cache ou nx affected para o backend, ou ao montar CI que precisa rodar Java e Node no mesmo pipeline.
---

# Java/Maven dentro do Nx

O Nx não conhece Maven, mas não precisa conhecer: `command` targets envolvem
qualquer executável. O ganho de tratar o backend como projeto Nx de primeira
classe é que `nx affected` passa a decidir o que rodar no CI olhando os dois
apps, e quem chega no repositório usa o mesmo verbo para tudo — `nx run
<projeto>:<alvo>` — em vez de decorar um comando por stack.

## `apps/api/project.json`

```json
{
  "name": "api",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "root": "apps/api",
  "sourceRoot": "apps/api/src/main/java",
  "targets": {
    "dev": {
      "command": "./mvnw spring-boot:run",
      "options": { "cwd": "{projectRoot}" }
    },
    "build": {
      "command": "./mvnw -B clean package -DskipTests",
      "options": { "cwd": "{projectRoot}" },
      "cache": true,
      "inputs": ["{projectRoot}/src/**/*", "{projectRoot}/pom.xml"],
      "outputs": ["{projectRoot}/target"]
    },
    "test": {
      "command": "./mvnw -B test",
      "options": { "cwd": "{projectRoot}" },
      "cache": true,
      "inputs": ["{projectRoot}/src/**/*", "{projectRoot}/pom.xml"],
      "outputs": ["{projectRoot}/target/surefire-reports"]
    },
    "lint": {
      "command": "./mvnw -B spotless:check",
      "options": { "cwd": "{projectRoot}" }
    }
  }
}
```

Pontos que costumam dar trabalho:

- **`cwd: "{projectRoot}"`** é obrigatório. Sem ele o comando roda na raiz e o
  `./mvnw` não é encontrado.
- **`inputs` explícitos.** Sem eles o Nx considera o projeto inteiro como
  entrada do cache e invalida a cada mudança irrelevante — o cache deixa de
  economizar. Com eles, mexer no `apps/web` não refaz o build do `api`.
- **Bit de execução do wrapper.** `git update-index --chmod=+x apps/api/mvnw`,
  senão o CI falha com "permission denied" mesmo funcionando na sua máquina.
- **`-B`** (batch mode) tira a barra de progresso interativa, que polui o log de
  CI.
- **`dev` e `start` nunca com cache** — são processos de longa duração;
  `nx.json` já define isso em `targetDefaults`.

## Scripts na raiz

Mantenha o padrão do `package.json` atual, em que os scripts são atalhos para
alvos Nx:

```json
{
  "scripts": {
    "dev:api": "nx run api:dev",
    "build:api": "nx run api:build",
    "test:api": "nx run api:test"
  }
}
```

## Dependências entre projetos

Se `web` passar a consumir tipos gerados do OpenAPI da API, declare a
dependência para o Nx ordenar as tarefas e o `affected` propagar corretamente:

```json
"implicitDependencies": ["api"]
```

## Verificação

```bash
nx show project api          # confirma que o projeto foi reconhecido
nx run api:test              # roda os testes
nx run api:test              # de novo: deve sair do cache, quase instantâneo
nx affected -t test --base=main
```

Se a segunda execução não vier do cache, os `inputs` estão amplos demais ou
algo no build está escrevendo dentro de um caminho listado como input.

## CI

`nx affected -t lint test build` cobre os dois apps, mas o runner precisa de
**Node e JDK 21**. Faça o setup das duas toolchains no mesmo job (ou separe em
jobs por app e aceite perder o `affected` cruzado). Cacheie `~/.m2` e o cache do
Nx — sem isso o pipeline baixa o mundo a cada execução.
