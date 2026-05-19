import fs from "fs-extra";
import path from "node:path";
import { resolveProjectPaths, rel } from "../core/paths.js";
import {
  ensureDirWithKeep,
  writeJson,
  pathExists,
} from "../core/file-system.js";
import {
  materializeTemplate,
  listCoreSkillTemplates,
  skillSubPath,
  HOOK_FILES,
} from "../core/templates.js";
import {
  defaultConfig,
  loadConfig,
  parseAgentTargets,
  readPackageName,
  inferProjectName,
} from "../core/config.js";
import { logger } from "../core/logger.js";
import type { AgentTarget } from "../types/index.js";

export interface InitOptions {
  force?: boolean;
  agent?: string;
}

/**
 * `harness init`
 * Cria a estrutura de Harness Engineering no diretório atual, sem
 * sobrescrever arquivos existentes (a menos que --force). A estrutura
 * específica de cada agente é criada conforme `agentTargets`.
 */
export async function runInit(options: InitOptions): Promise<void> {
  const cwd = process.cwd();
  const force = Boolean(options.force);
  const paths = resolveProjectPaths(cwd);

  logger.title("harness init");
  logger.info(`Diretório: ${cwd}`);

  const pkgName = await readPackageName(paths.packageJson);
  const projectName = inferProjectName(cwd, pkgName);
  const vars = { PROJECT_NAME: projectName };

  const requested: AgentTarget[] | undefined = options.agent
    ? parseAgentTargets(options.agent)
    : undefined;
  const targets: AgentTarget[] = requested ?? ["codex"];
  logger.info(`Alvos: ${targets.join(", ")}`);

  // 1. Diretórios base (neutros + por alvo)
  await ensureDirWithKeep(paths.runsDir);
  await ensureDirWithKeep(paths.reportsDir);
  await ensureDirWithKeep(paths.evalsDir);
  await ensureDirWithKeep(paths.skillsDir);
  await ensureDirWithKeep(path.join(paths.harnessDir, "adapters", "available"));
  await ensureDirWithKeep(path.join(paths.harnessDir, "adapters", "installed"));
  if (targets.includes("codex")) await ensureDirWithKeep(paths.codexHooksDir);
  if (targets.includes("claude-code")) {
    await ensureDirWithKeep(paths.claudeSkillsDir);
    await ensureDirWithKeep(paths.claudeHooksDir);
  }
  logger.success("Estrutura de diretórios garantida.");

  // 2. harness.config.json
  const configExists = await pathExists(paths.configFile);
  if (!configExists || force) {
    if (configExists && force) {
      await fs.copy(paths.configFile, `${paths.configFile}.bak-${Date.now()}`);
      logger.warn("harness.config.json sobrescrito (backup criado).");
    }
    await writeJson(paths.configFile, defaultConfig(projectName, targets));
    logger.success(`Criado ${rel(cwd, paths.configFile)}`);
  } else if (requested) {
    // Config preservada, mas atualiza apenas os alvos quando --agent é usado.
    const current = await loadConfig(paths.configFile);
    if (
      JSON.stringify([...current.agentTargets].sort()) !==
      JSON.stringify([...targets].sort())
    ) {
      await writeJson(paths.configFile, { ...current, agentTargets: targets });
      logger.warn(
        `agentTargets atualizado para [${targets.join(", ")}] (resto preservado).`,
      );
    } else {
      logger.warn("harness.config.json já existe — preservado.");
    }
  } else {
    logger.warn("harness.config.json já existe — preservado.");
  }

  // 3. Documentos do harness
  const docs: Array<[string, string]> = [
    ["project-context.md", paths.projectContext],
    ["current-task.md", paths.currentTask],
    ["acceptance-criteria.md", paths.acceptanceCriteria],
    ["qa-checklist.md", paths.qaChecklist],
    ["decisions.md", paths.decisions],
    ["failures.md", paths.failures],
  ];
  for (const [tpl, target] of docs) {
    const r = await materializeTemplate(tpl, target, vars, force);
    if (r.action === "created") logger.success(`Criado ${rel(cwd, target)}`);
  }

  // 4. Evals
  const evals: Array<[string, string]> = [
    ["evals/regression-cases.yaml", path.join(paths.evalsDir, "regression-cases.yaml")],
    ["evals/acceptance-tests.yaml", path.join(paths.evalsDir, "acceptance-tests.yaml")],
  ];
  for (const [tpl, target] of evals) {
    const r = await materializeTemplate(tpl, target, vars, force);
    if (r.action === "created") logger.success(`Criado ${rel(cwd, target)}`);
  }

  // 5. AGENTS.md (fonte canônica, sempre)
  {
    const r = await materializeTemplate("AGENTS.md", paths.agentsFile, vars, force);
    if (r.action === "created") logger.success(`Criado ${rel(cwd, paths.agentsFile)}`);
  }

  // 6. Skills universais do core (somente core — adapters são opcionais)
  const coreSkills = await listCoreSkillTemplates();
  let coreCreated = 0;
  for (const relTpl of coreSkills) {
    const target = path.join(paths.skillsDir, skillSubPath(relTpl));
    const r = await materializeTemplate(relTpl, target, vars, force);
    if (r.action === "created") coreCreated += 1;
  }
  logger.success(
    `${coreCreated} skill(s) universal(is) instalada(s) em ${rel(cwd, paths.skillsDir)} (${coreSkills.length} no catálogo)`,
  );

  // 7. Estrutura do Codex
  if (targets.includes("codex")) {
    for (const hook of HOOK_FILES) {
      const target = path.join(paths.codexHooksDir, hook);
      const r = await materializeTemplate(`hooks/${hook}`, target, vars, force);
      if (r.action === "created") logger.success(`Criado ${rel(cwd, target)}`);
    }
    const codexExample = path.join(paths.codexDir, "hooks.example.json");
    const r = await materializeTemplate(
      "hooks/codex-hooks.example.json",
      codexExample,
      vars,
      force,
    );
    if (r.action === "created") logger.success(`Criado ${rel(cwd, codexExample)}`);
  }

  // 8. Estrutura do Claude Code
  if (targets.includes("claude-code")) {
    const claudeMd = await materializeTemplate(
      "CLAUDE.md",
      paths.claudeFile,
      vars,
      force,
    );
    if (claudeMd.action === "created") {
      logger.success(`Criado ${rel(cwd, paths.claudeFile)}`);
    }
    let claudeSkills = 0;
    for (const relTpl of coreSkills) {
      const target = path.join(paths.claudeSkillsDir, skillSubPath(relTpl));
      const r = await materializeTemplate(relTpl, target, vars, force);
      if (r.action === "created") claudeSkills += 1;
    }
    logger.success(
      `${claudeSkills} skill(s) em ${rel(cwd, paths.claudeSkillsDir)}`,
    );
    for (const hook of HOOK_FILES) {
      const target = path.join(paths.claudeHooksDir, hook);
      const r = await materializeTemplate(`claude/hooks/${hook}`, target, vars, force);
      if (r.action === "created") logger.success(`Criado ${rel(cwd, target)}`);
    }
    const settingsExample = path.join(paths.claudeDir, "settings.example.json");
    const r = await materializeTemplate(
      "claude/settings.example.json",
      settingsExample,
      vars,
      force,
    );
    if (r.action === "created") logger.success(`Criado ${rel(cwd, settingsExample)}`);
  }

  logger.title("Próximos passos");
  logger.step("1. Edite .harness/project-context.md com o contexto do projeto.");
  logger.step('2. Defina a tarefa: harness task "descrição da tarefa"');
  if (targets.includes("codex")) {
    logger.step("3. Exporte para o Codex:       harness export codex");
  }
  if (targets.includes("claude-code")) {
    logger.step("3. Exporte para o Claude Code: harness export claude-code");
  }
  logger.step("4. Implemente e depois rode:   harness validate");
  logger.step("5. Antes de concluir:          harness done");
  logger.plain();
  logger.hint("Dica: rode `harness doctor` para diagnosticar o projeto.");
}
