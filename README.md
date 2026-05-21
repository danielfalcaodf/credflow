# CredFlow

Plataforma de simulação e análise de crédito pessoal.

## Estrutura do Monorepo

```
credflow/
├── apps/
│   ├── web/     # Frontend — Next.js 16 + React 19 + TypeScript
│   └── api/     # Backend — Spring Boot 3 + Java 21 + Maven (em breve)
├── packages/    # Pacotes compartilhados (em breve)
├── nx.json      # Configuração do Nx
└── package.json # Workspace root
```

## Pré-requisitos

- Node.js 20+
- npm 10+

## Instalação

```bash
npm install
```

## Rodando o projeto

```bash
# Frontend em modo desenvolvimento
npm run dev

# Build do frontend
npm run build

# Lint
npm run lint
```

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Monorepo | Nx 21, npm workspaces |
| Backend (em breve) | Spring Boot 3, Java 21, Maven, PostgreSQL |
