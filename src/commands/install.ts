import fs from "fs-extra";
import * as p from "@clack/prompts";
import chalk from "chalk";
import { resolveProjectPaths } from "../core/paths.js";
import { loadConfig, parseAgentTargets } from "../core/config.js";
import {
  detectProject,
  buildValidation,
  ALL_TARGETS,
} from "../core/projectDetect.js";
import { withQuietLogger, logger } from "../core/logger.js";
import { runInit } from "./init.js";
import { runExportCodex } from "./exportCodex.js";
import { runExportClaude } from "./exportClaude.js";
import {
  runHooksInstallCodex,
  runHooksInstallClaude,
} from "./hooksInstall.js";
import type {
  AgentTarget,
  PackageManager,
  ValidationConfig,
} from "../types/index.js";

export interface InstallOptions {
  agent?: string;
  pm?: string;
  yes?: boolean;
  force?: boolean;
  hooks?: boolean; // commander: --no-hooks => false
}

interface InstallPlan {
  projectName: string;
  packageManager: PackageManager;
  targets: AgentTarget[];
  validation: ValidationConfig;
  installHooks: boolean;
  force: boolean;
}

const PM_VALUES: PackageManager[] = ["pnpm", "npm", "yarn", "bun"];

function cancelAndExit(): never {
  p.cancel("Instalação cancelada. Nada foi alterado.");
  process.exit(0);
}

function supportsHooks(targets: AgentTarget[]): boolean {
  return targets.some((t) => t === "codex" || t === "claude-code");
}

/** Constrói o plano sem prompts (modo --yes / sem TTY). */
async function planNonInteractive(
  cwd: string,
  options: InstallOptions,
): Promise<InstallPlan> {
  const info = await detectProject(cwd);
  const targets: AgentTarget[] = options.agent
    ? parseAgentTargets(options.agent)
    : info.existingConfig?.agentTargets ?? ["codex"];
  const pm = (
    options.pm && PM_VALUES.includes(options.pm as PackageManager)
      ? options.pm
      : info.packageManager
  ) as PackageManager;

  return {
    projectName: info.projectName,
    packageManager: pm,
    targets,
    validation:
      info.existingConfig?.validation ?? { autoDetect: true, commands: {} },
    installHooks: options.hooks !== false && supportsHooks(targets),
    force: Boolean(options.force),
  };
}

/** Constrói o plano com o assistente interativo (clack). */
async function planInteractive(
  cwd: string,
  options: InstallOptions,
): Promise<InstallPlan> {
  const info = await detectProject(cwd);

  p.intro(chalk.bgCyan(chalk.black(" agent-harness-kit · install ")));

  p.note(
    [
      `Projeto      : ${chalk.bold(info.projectName)}`,
      `Diretório    : ${cwd}`,
      `package.json : ${info.hasPackageJson ? "encontrado" : chalk.yellow("ausente")}`,
      `Gerenciador  : ${info.packageManager} (detectado)`,
      info.alreadyInitialized
        ? chalk.yellow("Já inicializado — arquivos existentes serão preservados.")
        : "Projeto novo para o harness.",
    ].join("\n"),
    "Diagnóstico",
  );

  const projectName = await p.text({
    message: "Nome do projeto",
    initialValue: info.projectName,
    validate: (v) => (v.trim() ? undefined : "Informe um nome."),
  });
  if (p.isCancel(projectName)) cancelAndExit();

  const targetsAnswer = await p.multiselect({
    message: "Qual(is) CLI/agente você usa neste projeto?",
    options: ALL_TARGETS.map((t) => ({
      value: t.value,
      label: t.label,
      hint: t.hint,
    })),
    initialValues:
      info.existingConfig?.agentTargets ?? (["claude-code"] as AgentTarget[]),
    required: true,
  });
  if (p.isCancel(targetsAnswer)) cancelAndExit();
  const targets = targetsAnswer as AgentTarget[];

  const pmAnswer = await p.select({
    message: "Gerenciador de pacotes (para os comandos de validação)",
    options: PM_VALUES.map((v) => ({ value: v, label: v })),
    initialValue: info.packageManager,
  });
  if (p.isCancel(pmAnswer)) cancelAndExit();
  const packageManager = pmAnswer as PackageManager;

  const autoDetectAnswer = await p.confirm({
    message:
      "Detectar os comandos de validação automaticamente? (recomendado — universal, sem assumir stack)",
    initialValue: true,
  });
  if (p.isCancel(autoDetectAnswer)) cancelAndExit();

  let validation: ValidationConfig = { autoDetect: true, commands: {} };
  if (autoDetectAnswer !== true) {
    const defaults = buildValidation(packageManager);
    const commands: Record<string, string> = {};
    for (const key of ["lint", "typecheck", "build", "test"] as const) {
      const ans = await p.text({
        message: `Comando para "${key}" (vazio = não usar)`,
        initialValue: defaults[key],
      });
      if (p.isCancel(ans)) cancelAndExit();
      const value = String(ans).trim();
      if (value) commands[key] = value;
    }
    validation = { autoDetect: false, commands };
  }

  let installHooks = false;
  if (supportsHooks(targets)) {
    const hooksAnswer = await p.confirm({
      message:
        "Instalar os hooks de integração agora (registro + validação + bloqueio)?",
      initialValue: options.hooks !== false,
    });
    if (p.isCancel(hooksAnswer)) cancelAndExit();
    installHooks = hooksAnswer === true;
  }

  let force = Boolean(options.force);
  if (info.alreadyInitialized && !force) {
    const fAnswer = await p.confirm({
      message:
        "Sobrescrever arquivos existentes (com backup .bak)? Não = preservar.",
      initialValue: false,
    });
    if (p.isCancel(fAnswer)) cancelAndExit();
    force = fAnswer === true;
  }

  const plan: InstallPlan = {
    projectName: String(projectName).trim(),
    packageManager,
    targets,
    validation,
    installHooks,
    force,
  };

  const labels = targets
    .map((t) => ALL_TARGETS.find((x) => x.value === t)?.label ?? t)
    .join(", ");
  p.note(
    [
      `Projeto      : ${plan.projectName}`,
      `Agentes      : ${labels}`,
      `Gerenciador  : ${plan.packageManager}`,
      `Validações   : ${
        plan.validation.autoDetect
          ? "autoDetect (universal)"
          : Object.entries(plan.validation.commands)
              .map(([k, v]) => `${k}="${v}"`)
              .join("  ") || "(nenhuma)"
      }`,
      `Hooks        : ${plan.installHooks ? "instalar" : "não"}`,
      `Arquivos     : ${plan.force ? "sobrescrever (backup)" : "preservar existentes"}`,
    ].join("\n"),
    "Resumo da instalação",
  );

  const go = await p.confirm({
    message: "Aplicar esta configuração?",
    initialValue: true,
  });
  if (p.isCancel(go) || go !== true) cancelAndExit();

  return plan;
}

async function applyPlan(cwd: string, plan: InstallPlan): Promise<string[]> {
  const created: string[] = [];
  const s = p.spinner();

  s.start("Criando estrutura do harness…");
  await withQuietLogger(() =>
    runInit({ force: plan.force, agent: plan.targets.join(",") }),
  );
  created.push(".harness/, AGENTS.md, .agents/skills/");
  s.stop("Estrutura do harness criada");

  s.start("Aplicando configuração (projeto, gerenciador, validações)…");
  const paths = resolveProjectPaths(cwd);
  const config = await loadConfig(paths.configFile);
  config.projectName = plan.projectName;
  config.packageManager = plan.packageManager;
  config.validation = plan.validation;
  config.agentTargets = plan.targets;
  await fs.writeJson(paths.configFile, config, { spaces: 2 });
  s.stop("harness.config.json configurado");

  if (plan.targets.includes("codex")) {
    s.start("Exportando para o Codex…");
    await withQuietLogger(() => runExportCodex());
    created.push("AGENTS.md + .codex/ (Codex)");
    s.stop("Codex preparado");
  }
  if (plan.targets.includes("claude-code")) {
    s.start("Exportando para o Claude Code…");
    await withQuietLogger(() => runExportClaude());
    created.push("CLAUDE.md + .claude/ (Claude Code)");
    s.stop("Claude Code preparado");
  }
  if (plan.targets.includes("cursor")) {
    created.push("AGENTS.md + .agents/skills/ (Cursor — sem hooks)");
  }

  if (plan.installHooks) {
    if (plan.targets.includes("codex")) {
      s.start("Instalando hooks do Codex…");
      await withQuietLogger(() =>
        runHooksInstallCodex({ force: plan.force }),
      );
      created.push(".codex/hooks.json + wrappers");
      s.stop("Hooks do Codex instalados");
    }
    if (plan.targets.includes("claude-code")) {
      s.start("Instalando hooks do Claude Code…");
      await withQuietLogger(() =>
        runHooksInstallClaude({ force: plan.force }),
      );
      created.push(".claude/settings.json + wrappers");
      s.stop("Hooks do Claude Code instalados");
    }
  }

  return created;
}

/**
 * `harness install` — assistente de instalação profissional.
 * Interativo por padrão; `--yes`/flags ou ausência de TTY → não-interativo.
 */
export async function runInstall(options: InstallOptions): Promise<void> {
  const cwd = process.cwd();
  const interactive =
    Boolean(process.stdout.isTTY) &&
    Boolean(process.stdin.isTTY) &&
    !options.yes;

  if (!interactive) {
    if (!options.yes && !options.agent && !process.stdin.isTTY) {
      logger.error(
        "Sem terminal interativo. Rode num terminal real ou use:\n" +
          "  harness install --yes --agent claude-code [--pm npm] [--force]",
      );
      process.exitCode = 1;
      return;
    }
    const plan = await planNonInteractive(cwd, options);
    logger.title("harness install (não-interativo)");
    logger.info(`Agentes: ${plan.targets.join(", ")}`);
    logger.info(`Gerenciador: ${plan.packageManager}`);
    logger.info(`Hooks: ${plan.installHooks ? "sim" : "não"}`);
    const created = await applyPlan(cwd, plan);
    logger.success("Instalação concluída.");
    for (const c of created) logger.step(c);
    logger.plain();
    logger.step('Próximo: harness feature start "<nome>" --agent <agente>');
    logger.step("Acompanhe:  harness ui");
    return;
  }

  const plan = await planInteractive(cwd, options);
  const created = await applyPlan(cwd, plan);

  p.note(created.map((c) => `✔ ${c}`).join("\n"), "Instalado");
  const agentForRun = plan.targets.includes("claude-code")
    ? "claude"
    : plan.targets.includes("codex")
      ? "codex"
      : "manual";
  p.outro(
    chalk.green("Pronto! ") +
      `Comece com:  ${chalk.cyan(
        `harness feature start "<nome>" --agent ${agentForRun}`,
      )}  e acompanhe com  ${chalk.cyan("harness ui")}.`,
  );
}
