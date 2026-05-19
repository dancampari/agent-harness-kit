import fs from "fs-extra";
import { resolveProjectPaths, rel, type ProjectPaths } from "../core/paths.js";
import { loadConfig } from "../core/config.js";
import { createRun, appendEvent } from "../core/runStore.js";
import { readableStamp } from "../core/date.js";
import { logger } from "../core/logger.js";
import type { AgentKind } from "../types/index.js";

export interface FeatureStartOptions {
  agent?: string;
}

function normalizeAgent(value: string | undefined): AgentKind {
  const v = (value ?? "manual").toLowerCase();
  if (v === "codex") return "codex";
  if (v === "claude" || v === "claude-code") return "claude";
  return "manual";
}

async function resolvePaths(cwd: string): Promise<ProjectPaths> {
  const config = await loadConfig(
    resolveProjectPaths(cwd).configFile,
  ).catch(() => null);
  return config
    ? resolveProjectPaths(
        cwd,
        config.paths.harness,
        config.paths.skills,
        config.paths.codexHooks,
        config.paths.claudeSkills,
        config.paths.claudeHooks,
      )
    : resolveProjectPaths(cwd);
}

/** `harness feature start "<nome>"` */
export async function runFeatureStart(
  name: string,
  options: FeatureStartOptions,
): Promise<void> {
  const cwd = process.cwd();
  const feature = name.trim();
  if (!feature) {
    logger.error('Nome vazio. Uso: harness feature start "<nome>"');
    process.exitCode = 1;
    return;
  }

  const paths = await resolvePaths(cwd);
  if (!(await fs.pathExists(paths.harnessDir))) {
    logger.error("Estrutura .harness/ não encontrada. Rode `harness init` primeiro.");
    process.exitCode = 1;
    return;
  }

  const agent = normalizeAgent(options.agent);
  const run = await createRun(paths, feature, agent);
  await appendEvent(paths, run.runId, "info", agent, `Feature iniciada: ${feature}`);

  // Atualiza current-task.md para o agente ler.
  await fs.writeFile(
    paths.currentTask,
    `# Tarefa Atual

> Run: ${run.runId}
> Agente: ${agent}
> Iniciada em ${readableStamp()}

## Objetivo

${feature}

## Instrução para o agente

Implemente a feature seguindo \`AGENTS.md\`/\`CLAUDE.md\` e as skills.
Os hooks do harness registram eventos e, ao tentar finalizar, rodam
validações e bloqueiam a conclusão se houver pendências críticas.
Marque os critérios em \`.harness/acceptance-criteria.md\`.
`,
  );

  logger.title("harness feature start");
  logger.success(`Run criada: ${run.runId}`);
  logger.info(`Feature: ${feature}`);
  logger.info(`Agente: ${agent}`);
  logger.info(`Diretório: ${rel(cwd, paths.runsDir)}/${run.runId}`);
  logger.plain();
  logger.step("Acompanhe em tempo real:  harness ui");
  logger.step("Status resumido:          harness status");
}
