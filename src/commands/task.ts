import path from "node:path";
import fs from "fs-extra";
import { resolveProjectPaths, rel } from "../core/paths.js";
import { loadConfig } from "../core/config.js";
import { ensureDir, writeFileSafe, pathExists } from "../core/file-system.js";
import { profileProject } from "../core/profiler.js";
import { readableStamp, fileStamp } from "../core/date.js";
import { logger } from "../core/logger.js";

function slugify(input: string): string {
  const deaccented = input.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  return deaccented
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

/** Lista os nomes de skills instaladas (qualquer categoria). */
async function installedSkillNames(skillsDir: string): Promise<Set<string>> {
  const names = new Set<string>();
  if (!(await fs.pathExists(skillsDir))) return names;
  async function walk(d: string): Promise<void> {
    for (const e of (await fs.readdir(d, { withFileTypes: true })) as fs.Dirent[]) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name === "SKILL.md")
        names.add(path.basename(path.dirname(full)));
    }
  }
  await walk(skillsDir);
  return names;
}

const ALWAYS = [
  "project-discovery",
  "requirements-analysis",
  "implementation-plan",
  "validation-before-done",
  "no-premature-victory",
  "report-builder",
];

const KEYWORD_MAP: Array<[RegExp, string[]]> = [
  [/\b(api|endpoint|rest|graphql|rpc|integ)/i, ["api-contract-review", "integration-error-handling"]],
  [/\b(webhook|callback|evento|event)/i, ["webhook-safety", "idempotency-review"]],
  [/\b(retry|timeout|resili|backoff)/i, ["retry-policy-review"]],
  [/\b(test|teste|spec|cobertura|coverage)/i, ["test-strategy", "regression-check"]],
  [/\b(refator|refactor|reescr|rewrite)/i, ["safe-refactor", "regression-check"]],
  [/\b(secur|seguran|auth|login|senha|token|jwt|permiss|rbac)/i, ["security-review", "auth-boundary-review", "permission-review", "input-validation"]],
  [/\b(secret|chave|api[_-]?key|credencial)/i, ["secrets-protection"]],
  [/\b(migrat|schema|banco|database|\bsql\b|tabela|model)/i, ["data-model-review", "migration-safety", "transaction-review"]],
  [/\b(ui|tela|form|formul|component|frontend|css|layout|acess)/i, ["form-validation-review", "accessibility-review", "loading-empty-error-states", "responsive-design-review"]],
  [/\b(deploy|release|ci\b|cd\b|pipeline|publish)/i, ["deployment-readiness", "ci-cd-review", "build-readiness"]],
  [/\b(depend|pacote|package|lib|biblioteca|upgrade)/i, ["dependency-management"]],
  [/\b(config|env|ambiente|variá|setting)/i, ["configuration-management"]],
  [/\b(log|observ|metric|trace|monitor)/i, ["logging-review", "observability-review"]],
  [/\b(arquitet|architecture|modul|acopl|boundary|contrato)/i, ["architecture-review", "modularity-review", "interface-contracts", "separation-of-concerns"]],
  [/\b(erro|error|exce|falha)/i, ["error-handling"]],
  [/\b(duplica|complex|legível|legivel|clean)/i, ["clean-code-review", "complexity-review", "duplication-review"]],
];

function suggestSkills(description: string, installed: Set<string>): string[] {
  const picked = new Set<string>(ALWAYS.filter((s) => installed.has(s)));
  for (const [re, skills] of KEYWORD_MAP) {
    if (re.test(description)) {
      for (const s of skills) if (installed.has(s)) picked.add(s);
    }
  }
  return [...picked];
}

function currentTaskDoc(
  description: string,
  suggested: string[],
  stackLine: string,
): string {
  const list =
    suggested.length > 0
      ? suggested.map((s) => `- \`${s}\``).join("\n")
      : "- (nenhuma sugerida automaticamente — selecione manualmente)";
  return `# Tarefa Atual

> Atualizado em ${readableStamp()}

## Objetivo

${description}

## Stack detectada

${stackLine}

## Contexto

- (Por que esta tarefa existe, de onde veio a demanda)

## Escopo

- (O que ENTRA nesta tarefa)

## Fora de escopo

- (O que NÃO deve ser feito agora)

## Arquivos prováveis

- (Arquivos/módulos que provavelmente serão tocados)

## Riscos

- (Riscos técnicos, de dados, de segurança)

## Skills sugeridas

${list}

> Use também as skills relevantes em \`.agents/skills/\`. Skills de stack
> só se um adapter estiver instalado (\`harness adapter add <nome>\`).

## Critérios de aceite

Ver e marcar em \`.harness/acceptance-criteria.md\`.

## Comandos de validação

Detectados/configurados (ver \`harness doctor\` / \`harness.config.json\`).

## Definição de pronto

Todos os critérios de aceite marcados e \`harness done\` sem falhas.

## Instrução para o agente

Leia \`AGENTS.md\`/\`CLAUDE.md\` e \`.harness/current-task.md\`. Implemente
em passos pequenos, valide, e só conclua após cumprir
\`.harness/acceptance-criteria.md\`.
`;
}

function acceptanceDoc(description: string): string {
  return `# Critérios de Aceite

> Tarefa: ${description}
> Atualizado em ${readableStamp()}

Marque \`[x]\` somente quando o critério estiver realmente cumprido e verificado.

- [ ] A funcionalidade descrita no objetivo está implementada
- [ ] O comportamento foi validado manualmente ou por teste
- [ ] Nenhuma funcionalidade existente foi quebrada
- [ ] Validações disponíveis executadas (lint/typecheck/build/test) ou justificadas
- [ ] Tratamento de erro e casos de borda cobertos
- [ ] Limites de segurança/autorização preservados (se aplicável)
- [ ] Integrações externas seguras e idempotentes (se aplicável)
- [ ] Decisões relevantes registradas em \`.harness/decisions.md\`
- [ ] Sem segredos hardcoded e sem TODOs críticos pendentes
`;
}

function runDoc(description: string): string {
  return `# Run — ${readableStamp()}

## Tarefa registrada

${description}

## Estado inicial

- Critérios de aceite gerados em \`.harness/acceptance-criteria.md\`
- current-task.md atualizado

## Notas durante a execução

- (Progresso e decisões)

## Resultado

- (Preenchido ao concluir / via \`harness report\`)
`;
}

/**
 * `harness task "descrição"`
 * Atualiza current-task.md (com skills sugeridas pelo perfil + descrição),
 * gera critérios de aceite e registra um run datado.
 */
export async function runTask(description: string): Promise<void> {
  const cwd = process.cwd();
  const trimmed = description.trim();
  if (!trimmed) {
    logger.error('Descrição vazia. Uso: harness task "descrição da tarefa"');
    process.exitCode = 1;
    return;
  }

  const config = await loadConfig(
    path.join(cwd, ".harness", "harness.config.json"),
  ).catch(() => null);
  const paths = resolveProjectPaths(
    cwd,
    config?.paths.harness,
    config?.paths.skills,
    config?.paths.codexHooks,
  );

  if (!(await pathExists(paths.harnessDir))) {
    logger.error("Estrutura .harness/ não encontrada. Rode `harness init` primeiro.");
    process.exitCode = 1;
    return;
  }

  logger.title("harness task");

  const profile = await profileProject(cwd).catch(() => null);
  const stackLine = profile
    ? `- Linguagem: ${profile.language} · Framework: ${
        profile.framework ?? "—"
      } · Gerenciador: ${profile.packageManager ?? "—"}`
    : "- (não detectada)";

  const installed = await installedSkillNames(paths.skillsDir);
  const suggested = suggestSkills(trimmed, installed);

  await writeFileSafe(
    paths.currentTask,
    currentTaskDoc(trimmed, suggested, stackLine),
    true,
  );
  logger.success(`Atualizado ${rel(cwd, paths.currentTask)}`);

  await writeFileSafe(paths.acceptanceCriteria, acceptanceDoc(trimmed), true);
  logger.success(`Critérios de aceite em ${rel(cwd, paths.acceptanceCriteria)}`);

  await ensureDir(paths.runsDir);
  const runFile = path.join(
    paths.runsDir,
    `${fileStamp()}-task-${slugify(trimmed) || "task"}.md`,
  );
  await fs.writeFile(runFile, runDoc(trimmed));
  logger.success(`Run registrada em ${rel(cwd, runFile)}`);

  logger.title("Skills sugeridas");
  if (suggested.length === 0) {
    logger.plain("  (nenhuma — selecione manualmente em .agents/skills/)");
  } else {
    for (const s of suggested) logger.plain(`  • ${s}`);
  }
  logger.title("Próximos passos");
  logger.step("Detalhe .harness/current-task.md (contexto, escopo, riscos).");
  logger.step("Ajuste .harness/acceptance-criteria.md conforme a tarefa.");
  logger.step("Exporte: harness export codex | claude-code");
}
