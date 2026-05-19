# agent-harness-kit

> CLI local para **preparar, instalar, versionar e validar** estruturas de
> **Agent Harness Engineering** em projetos trabalhados por agentes como
> **Codex** e **Claude Code** (e, no mesmo molde, Cursor).

> ⚠️ Esta CLI **não chama nenhum modelo de IA**. Não usa OpenAI API,
> Anthropic API nem qualquer API de LLM. Ela apenas organiza o ambiente,
> gera contexto, cria skills/hooks e valida entregas localmente. O objetivo
> é **controlar o ambiente onde o Codex trabalha**, não substituí-lo.

## Instalação (qualquer pessoa, um comando)

A partir do GitHub — não exige conta no npm:

```bash
# instala o comando global `harness` (compila no install via `prepare`)
npm i -g github:dancampari/agent-harness-kit

# ou sem instalar nada permanentemente:
npx github:dancampari/agent-harness-kit install
```

Depois, no diretório do seu projeto:

```bash
harness install        # assistente interativo
```

Pré-requisitos no computador do usuário: **Node.js >= 18.17** e **git**
(o npm já vem com o Node). Funciona em Windows PowerShell, macOS e Linux.

Pelo npm (após publicado, escopo da conta):

```bash
npm i -g @dancampari/agent-harness-kit
# ou: npx @dancampari/agent-harness-kit install
```

---

## O que é Agent Harness Engineering

Agentes de código são ótimos executores e péssimos "donos de processo".
Sem disciplina, eles declaram vitória cedo, ignoram critérios de aceite e
quebram coisas fora do escopo.

**Harness Engineering** é a prática de cercar o agente com:

- **Contexto estável** (`project-context.md`, `AGENTS.md`)
- **Tarefa explícita** com escopo, riscos e critérios de aceite
- **Skills** que dizem _quando_ e _quando não_ fazer algo
- **Hooks** que bloqueiam ações destrutivas
- **Validação objetiva** (lint/typecheck/build/test) antes de "pronto"
- **Memória de falhas** que vira regra preventiva

Este kit materializa esse harness em qualquer projeto.

## Para que serve este kit

- Padronizar a estrutura `.harness/`, `AGENTS.md`, `.agents/skills/`, `.codex/hooks/`
- Gerar tarefas com critérios de aceite versionáveis
- Rodar validações reproduzíveis e gerar relatórios
- Impedir vitória prematura (`harness done`)
- Acumular aprendizado via `harness failure add`

## Estrutura criada no projeto de destino

```
.harness/
  harness.config.json
  project-context.md
  current-task.md
  acceptance-criteria.md
  qa-checklist.md
  decisions.md
  failures.md
  current-run.json              # ponteiro para a execução ativa
  runs/
    <runId>/
      run.json                  # estado/score/validações
      events.jsonl              # eventos em tempo real
      commands.log
      changed-files.json
      validation.json           # saída completa das validações
      implementation-report.md
  reports/
    latest.md                   # último relatório (lido por `report latest`/UI)
  evals/
    regression-cases.yaml
    acceptance-tests.yaml
AGENTS.md                     # Prompt Master universal (sem stack)
.agents/skills/
  core/ engineering/ architecture/ quality/ security/
  data/ frontend/ api/ operations/ agent-behavior/
    <skill>/SKILL.md           # ~48 skills universais por categoria
  adapters/<stack>/<skill>/SKILL.md   # só após `harness adapter add`
.harness/adapters/{available,installed}/   # controle de adapters

# se "codex" ∈ agentTargets:
.codex/
  hooks/{pre_tool_use_policy,post_tool_use_review,stop_validate_done}.ts
  hooks.example.json
  # após `harness hooks install codex`:
  hooks.json
  hooks/harness-{post-tool,stop,prompt-submit}.mjs

# se "claude-code" ∈ agentTargets:
CLAUDE.md                     # aponta para AGENTS.md (sem duplicar)
.claude/
  skills/<categoria>/<skill>/SKILL.md   # mesmas skills universais
  hooks/{pre_tool_use_policy,post_tool_use_review,stop_validate_done}.ts
  settings.example.json       # hooks no formato do Claude Code
  # após `harness hooks install claude`:
  settings.json
  hooks/harness-{post-tool,stop,task-completed}.mjs
```

> `AGENTS.md` é a **fonte única de verdade**. `CLAUDE.md` é um ponteiro
> curto para ele + especificidades do Claude Code — nada é duplicado.

## Requisitos

- Node.js >= 18.17
- pnpm (recomendado)
- Funciona em Windows PowerShell, macOS e Linux (sem comandos Unix exclusivos)

## Instalação local

```bash
git clone <repo> agent-harness-kit
cd agent-harness-kit
pnpm install
pnpm build
npm link            # deixa o comando `harness` global (npm costuma estar no PATH)
harness --help
```

> Alternativa: `pnpm link --global`. Se mexer no código do kit, rode
> `pnpm build` de novo (o link continua válido).

## Início rápido — `harness install` (assistente)

No diretório do **seu projeto**, rode o assistente interativo:

```bash
cd C:\caminho\do\seu\projeto
harness install
```

Ele detecta o projeto (nome, gerenciador via lockfile, se já foi
inicializado) e pergunta, passo a passo:

1. **Nome do projeto** (com default detectado)
2. **Qual CLI/agente você usa** — Claude Code / Codex / Cursor (multi-escolha)
3. **Gerenciador de pacotes** (pnpm/npm/yarn/bun)
4. **Comandos de validação** (usar padrão do gerenciador ou customizar)
5. **Instalar os hooks de integração agora?**
6. **Preservar ou sobrescrever** arquivos existentes (com backup)

Mostra um **resumo**, pede confirmação e então cria a estrutura, exporta
para cada agente escolhido e instala os hooks — tudo sem nenhuma API de
LLM.

### Modo não-interativo (CI / scripts)

```bash
harness install --yes --agent claude-code,codex --pm npm
harness install --yes --agent claude-code --no-hooks
```

| Flag | Efeito |
|---|---|
| `-y, --yes` | não pergunta nada; usa flags + defaults detectados |
| `-a, --agent <csv>` | alvos (`codex,claude-code,cursor`) — aceita vírgula **ou** espaço |
| `--pm <gerenciador>` | `pnpm` \| `npm` \| `yarn` \| `bun` |
| `-f, --force` | sobrescreve arquivos existentes (cria `.bak-<timestamp>`) |
| `--no-hooks` | não instala os hooks |

Sem TTY e sem flags suficientes, o comando **falha com instrução clara**
(não trava esperando input).

## Uso via `pnpm dev` (sem build)

No diretório do **projeto que receberá o harness**:

```bash
# rodando a partir do agent-harness-kit
pnpm --dir /caminho/agent-harness-kit dev -- init
```

Ou, mais simples, após `pnpm build` + `pnpm link --global`, basta `harness <comando>`.

> O separador `--` repassa argumentos para a CLI: `pnpm dev -- <comando>`.

## Como testar a CLI

```bash
pnpm test         # vitest
pnpm typecheck    # tsc --noEmit
pnpm build        # tsup + cópia de templates
```

## Comandos

### `harness init`
Cria a estrutura no diretório atual, **sem sobrescrever** arquivos
existentes (use `--force` para sobrescrever criando backup `.bak-<timestamp>`).
Com `--agent` você escolhe os alvos; a estrutura específica de cada agente
só é criada para os alvos selecionados.

```bash
harness init                              # alvo padrão: codex
harness init --agent claude-code          # só Claude Code
harness init --agent codex,claude-code    # ambos
```

Rodar `init --agent ...` num projeto já iniciado **atualiza apenas
`agentTargets`** no `harness.config.json` (o resto é preservado).

### `harness task "descrição"`
Cria/atualiza `current-task.md`, gera critérios de aceite e registra a run.

```bash
harness task "Adicionar validação de entrada e tratamento de erro no endpoint X"
```

### `harness export codex`
Garante `AGENTS.md`, skills e hooks (sem duplicar) e imprime a instrução
pronta para o Codex:

```text
codex "Leia AGENTS.md e .harness/current-task.md. Implemente a tarefa
seguindo as skills disponíveis e só considere concluído após cumprir
.harness/acceptance-criteria.md."
```

### `harness export claude-code` (alias: `harness export claude`)
Garante `CLAUDE.md` (ponteiro para `AGENTS.md`), skills em
`.claude/skills/`, hooks em `.claude/hooks/` (no formato real do Claude
Code) e `.claude/settings.example.json`. Sem duplicar conteúdo. Imprime:

```text
claude "Leia CLAUDE.md e .harness/current-task.md. Implemente a tarefa
seguindo as skills em .claude/skills/ e só considere concluído após
cumprir .harness/acceptance-criteria.md e rodar harness validate."
```

### `harness validate`
Roda os comandos de `validation` do `harness.config.json`. Pula (com aviso)
scripts inexistentes no `package.json`. Gera
`.harness/reports/latest-validation.md`. **Exit 1** se algo falhar.

### `harness done`
Roda `validate`, confere critérios de aceite e TODOs críticos, gera
`done-report.md` e **bloqueia** a conclusão se houver pendência crítica.

### `harness report`
Consolida tarefa, critérios, validações, falhas, decisões e próximos
passos em `.harness/reports/report-YYYY-MM-DD-HH-mm.md`.

### `harness doctor`
Diagnostica: `package.json`, git, `AGENTS.md`, `.harness/`, skills, hooks,
config, pnpm no PATH e scripts esperados — com sugestões.

### `harness skill new <nome>`
Cria `.agents/skills/<nome>/SKILL.md` com frontmatter e seções
(Objetivo, Quando usar, Quando não usar, Regras, Checklist, Exemplos,
Anti-padrões).

### `harness failure add "descrição"`
Acrescenta uma falha estruturada em `.harness/failures.md` (data, causa,
impacto, regra preventiva, skill a atualizar) para alimentar o `AGENTS.md`.

## Integração automática por hooks + UI

A partir desta versão o kit acompanha a execução do agente em tempo real,
roda validações no fim da feature e **bloqueia a conclusão** quando há
pendências — tudo por **comandos locais e arquivos de configuração**,
sem nenhuma API de LLM.

### Como instalar hooks no Codex

```bash
harness hooks install codex
```

Cria `.codex/hooks/harness-*.mjs` (wrappers finos) e
`.codex/hooks.json` configurando `PostToolUse`, `Stop` e
`UserPromptSubmit`. Se `.codex/hooks.json` já existir, é feito **backup**
(`*.bak-<timestamp>`) e os hooks existentes são **preservados** (sem
duplicar). Revise o arquivo e, se o Codex pedir, marque os hooks como
confiáveis (*trust*).

### Como instalar hooks no Claude Code

```bash
harness hooks install claude
```

Cria `.claude/hooks/harness-*.mjs` e mescla `.claude/settings.json`
(`PostToolUse`, `Stop`, `TaskCompleted`) preservando a config existente,
com backup. Observação: `TaskCompleted` não é nativo no Claude Code atual
— o bloqueio real ocorre no `Stop` (também configurado).

> Os wrappers não contêm lógica: só repassam o stdin para
> `harness hook ...` e espelham stdout/exit code. Não abrem UI. Se a CLI
> `harness` não estiver disponível, o wrapper sai com código 0 (não trava
> o agente). Resolução sem caminho absoluto: `HARNESS_CMD` → `harness` no
> PATH → `npx harness`.

### Como iniciar uma feature

```bash
harness feature start "Implementar paginação na listagem" --agent claude
```

Cria `.harness/runs/<runId>/` com `run.json`, `events.jsonl`,
`commands.log`, `changed-files.json`, `validation.json` e
`implementation-report.md`, e aponta `.harness/current-run.json`.

A partir daí, enquanto o agente trabalha, os hooks registram eventos
(`tool_use`, `command`, `file_change`, …). Quando o agente tenta
finalizar, o hook `Stop`/`TaskCompleted` roda as validações e os
critérios de bloqueio.

### Como abrir a UI

```bash
harness ui            # TUI Ink, somente leitura, atualiza em tempo real
harness ui --once     # snapshot textual único (sem TUI)
```

- Observa, via `chokidar`, `current-run.json`, `runs/*/run.json`,
  `runs/*/events.jsonl` e `reports/latest.md`.
- Mostra: projeto, execução atual, lista de execuções, status, score,
  validações (lint/typecheck/build/test), arquivos alterados, últimos
  eventos, trecho do relatório, motivo de bloqueio, tempo decorrido e
  agente.
- Somente leitura. Sai com **q** ou **Ctrl+C**. Não trava sem execução
  ativa. **Fallback** automático para texto se não houver TTY ou se o
  Ink falhar (funciona em Windows PowerShell).

### Como interpretar status

`created → planning → implementing → files_changed → validating →
needs_fix → failed → passed → reported → done`

| Status | Significado |
|---|---|
| `created` | feature iniciada, sem atividade ainda |
| `implementing` / `files_changed` | agente alterando arquivos |
| `validating` | rodando lint/typecheck/build/test |
| `needs_fix` | bloqueado — há pendências (ver `blockReason`) |
| `passed` / `reported` / `done` | concluído e relatório gerado |

`harness status` e `harness runs` mostram esse estado; `score` (0–100)
cai a cada validação que falha e a cada critério de bloqueio.

### Como funciona o bloqueio de conclusão

Ao finalizar, a feature é **bloqueada** se:

- lint, typecheck, build ou test falharam;
- critérios de aceite não foram todos marcados;
- `.env` foi alterado;
- migrations foram apagadas;
- há `TODO`/`FIXME` crítico;
- arquivos de auth/RLS mudaram sem registro em `decisions.md`;
- arquivo `.sql` cria tabela sem `tenant_id` (multi-tenant);
- arquivo de webhook não aparenta idempotência.

Resposta do hook:

- **Codex / Claude `Stop`** → `{"decision":"block","reason":"…"}` no
  stdout (impede a parada e devolve o motivo ao agente).
- **Claude `task-completed`** → exit code **2** com o motivo no stderr.
- **Sem execução ativa** → sucesso, sem bloquear.

O relatório `implementation-report.md` (e `.harness/reports/latest.md`)
é gerado mesmo quando bloqueado (parcial), com falhas e correções.

## Arquitetura universal (sem assumir stack)

O kit é **agnóstico de stack**. O core nunca contém skill específica de
tecnologia.

- **Core universal** — ~48 skills em 10 categorias (`core`, `engineering`,
  `architecture`, `quality`, `security`, `data`, `frontend`, `api`,
  `operations`, `agent-behavior`). Instaladas por `harness init`.
- **Prompt Master universal** — `AGENTS.md`/`CLAUDE.md` orientam
  comportamento do agente; não citam framework/banco como regra.
- **Project Profiler adaptativo** — `harness doctor` detecta linguagem,
  gerenciador, framework, testes, Docker, CI, banco, frontend/backend,
  comandos de validação e riscos — **sem assumir**.
- **Validation Engine adaptativo** — `validation.autoDetect` usa os
  comandos detectados; ou defina `validation.commands` no
  `harness.config.json`.
- **Adapters opcionais** — skills de stack (`node`, `python`, `php`,
  `react`, `nextjs`, `docker`, `database`, `wordpress`, `generic-api`)
  vivem fora do core e **só são instaladas quando você pede**:

```bash
harness doctor                 # detecta a stack e SUGERE adapters
harness adapter list           # adapters disponíveis/sugeridos
harness adapter add nextjs     # instala skills de stack (opt-in)
harness skills list            # skills instaladas por categoria
harness skill new cache-review                 # nova skill universal
harness skill new ssr-review --adapter nextjs  # nova skill de adapter
```

Adapters **nunca** são instalados automaticamente — nem em detecção de
alta confiança; o `doctor` apenas sugere.

## Fluxo recomendado com o Codex

```bash
harness init
# edite .harness/project-context.md
harness task "..."
# detalhe escopo/riscos em .harness/current-task.md
harness export codex          # cole a instrução no Codex
# ... Codex implementa ...
harness validate
harness done                  # só conclua se passar
harness report
```

## Como usar com Claude Code

O suporte a Claude Code é de primeira classe:

```bash
harness init --agent claude-code     # ou: codex,claude-code
# edite .harness/project-context.md
harness task "..."
harness export claude-code           # gera CLAUDE.md / .claude/skills / .claude/hooks

# ative os hooks (escopo de projeto, opcional):
cp .claude/settings.example.json .claude/settings.json   # revise antes

# rode o Claude Code e cole a instrução impressa; ao final:
harness validate
harness done
```

Mapeamento:

| Conceito | Codex | Claude Code |
|---|---|---|
| Diretrizes | `AGENTS.md` | `CLAUDE.md` → aponta para `AGENTS.md` |
| Skills | `.agents/skills/` | `.claude/skills/` (mesmas skills) |
| Hooks | `.codex/hooks/` + `hooks.example.json` | `.claude/hooks/` + `settings.example.json` |
| Bloqueio | exit 2 (pre) | `PreToolUse` exit 2; `Stop` exit 2 respeitando `stop_hook_active` |

O núcleo (`core/templates.ts`, `core/validators.ts`) é agnóstico de
agente; adicionar Cursor segue exatamente o mesmo molde do
`export claude-code`. **A CLI continua sem chamar nenhuma API de LLM** e
não aplica `settings.json` automaticamente (apenas gera o `.example`).

## Como criar novas skills

```bash
harness skill new minha-skill
```

Edite o `SKILL.md` gerado: deixe **explícito quando NÃO usar** a skill — é
isso que reduz erro do agente.

## Como registrar falhas

```bash
harness failure add "Agente declarou pronto com build quebrado"
```

Depois preencha causa/impacto/regra e **reflita a regra no `AGENTS.md`** e
na skill indicada. O harness aprende com o que deu errado.

## Garantias de segurança da CLI

- Não sobrescreve arquivos sem `--force` (e com `--force` cria backup)
- Não usa caminhos hardcoded (tudo relativo + `harness.config.json`)
- Não depende de comandos Unix exclusivos (cross-platform via `execa`)
- Não chama nenhuma API de LLM

## Licença

MIT
