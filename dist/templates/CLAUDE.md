# CLAUDE.md

> Projeto: {{PROJECT_NAME}}
> Este arquivo é lido automaticamente pelo **Claude Code**.

## Fonte de verdade

As diretrizes completas de comportamento estão em **`AGENTS.md`** (fonte
canônica, sem duplicação). **Leia e siga `AGENTS.md` integralmente** antes
de qualquer implementação: papel do agente, ciclo obrigatório, fontes
obrigatórias, regras não negociáveis e definição de pronto.

## Especificidades do Claude Code

- **Skills**: disponíveis em `.claude/skills/<nome>/SKILL.md`. Use a skill
  adequada à tarefa e respeite "Quando não usar".
- **Hooks**: configurados via `.claude/settings.json`
  (exemplo em `.claude/settings.example.json`). Eles são guarda-rails
  leves — não substituem `harness validate` / `harness done`.
- **Contexto da tarefa**: `.harness/current-task.md`,
  `.harness/acceptance-criteria.md`, `.harness/qa-checklist.md`,
  `.harness/failures.md`, `.harness/project-context.md`.

## Antes de declarar conclusão

1. Cumprir todos os critérios de aceite (`.harness/acceptance-criteria.md`).
2. Pedir para rodar `harness validate` (lint/typecheck/build/test).
3. Pedir para rodar `harness done` — não declarar vitória se houver bloqueio.
4. Registrar decisões em `.harness/decisions.md`.

> Estes comandos `harness ...` são executados por humano/dev. O Claude Code
> não chama nenhuma API de LLM através deles — são ferramentas locais.
