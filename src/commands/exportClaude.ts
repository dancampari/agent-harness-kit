import path from "node:path";
import chalk from "chalk";
import { resolveProjectPaths, rel } from "../core/paths.js";
import { loadConfig } from "../core/config.js";
import { pathExists } from "../core/file-system.js";
import {
  materializeTemplate,
  listCoreSkillTemplates,
  skillSubPath,
  HOOK_FILES,
} from "../core/templates.js";
import { logger } from "../core/logger.js";

const CLAUDE_INSTRUCTION =
  'claude "Leia CLAUDE.md e .harness/current-task.md. Implemente a tarefa ' +
  "seguindo as skills em .claude/skills/ e só considere concluído após " +
  'cumprir .harness/acceptance-criteria.md e rodar harness validate."';

/**
 * `harness export claude-code`
 * Garante (sem duplicar) CLAUDE.md, skills em .claude/skills/, hooks em
 * .claude/hooks/ e .claude/settings.example.json; imprime a instrução
 * pronta para o Claude Code.
 */
export async function runExportClaude(): Promise<void> {
  const cwd = process.cwd();
  const config = await loadConfig(
    path.join(cwd, ".harness", "harness.config.json"),
  ).catch(() => null);

  if (!config) {
    logger.error("harness.config.json não encontrado. Rode `harness init` primeiro.");
    process.exitCode = 1;
    return;
  }

  const paths = resolveProjectPaths(
    cwd,
    config.paths.harness,
    config.paths.skills,
    config.paths.codexHooks,
    config.paths.claudeSkills,
    config.paths.claudeHooks,
  );
  const vars = { PROJECT_NAME: config.projectName };

  logger.title("harness export claude-code");

  if (!(await pathExists(paths.agentsFile))) {
    await materializeTemplate("AGENTS.md", paths.agentsFile, vars, false);
    logger.success(`Criado ${rel(cwd, paths.agentsFile)} (fonte canônica)`);
  }

  // CLAUDE.md — só cria se faltar (aponta para AGENTS.md, não duplica).
  if (await pathExists(paths.claudeFile)) {
    logger.info("CLAUDE.md já existe — mantido (não duplicado).");
  } else {
    await materializeTemplate("CLAUDE.md", paths.claudeFile, vars, false);
    logger.success(`Criado ${rel(cwd, paths.claudeFile)}`);
  }

  // Skills universais do core, materializadas em .claude/skills/.
  let createdSkills = 0;
  for (const relTpl of await listCoreSkillTemplates()) {
    const target = path.join(paths.claudeSkillsDir, skillSubPath(relTpl));
    if (await pathExists(target)) continue;
    await materializeTemplate(relTpl, target, vars, false);
    createdSkills += 1;
  }
  logger.success(
    createdSkills === 0
      ? `Skills já presentes em ${rel(cwd, paths.claudeSkillsDir)}`
      : `${createdSkills} skill(s) criada(s) em ${rel(cwd, paths.claudeSkillsDir)}`,
  );

  // Hooks no formato do Claude Code.
  let createdHooks = 0;
  for (const hook of HOOK_FILES) {
    const target = path.join(paths.claudeHooksDir, hook);
    if (await pathExists(target)) continue;
    await materializeTemplate(`claude/hooks/${hook}`, target, vars, false);
    createdHooks += 1;
  }
  const settingsExample = path.join(paths.claudeDir, "settings.example.json");
  if (!(await pathExists(settingsExample))) {
    await materializeTemplate(
      "claude/settings.example.json",
      settingsExample,
      vars,
      false,
    );
    createdHooks += 1;
  }
  logger.success(
    createdHooks === 0
      ? `Hooks já presentes em ${rel(cwd, paths.claudeHooksDir)}`
      : `${createdHooks} arquivo(s) de hook criado(s) em ${rel(cwd, paths.claudeHooksDir)}`,
  );

  logger.title("Agora execute:");
  logger.plain(chalk.greenBright(CLAUDE_INSTRUCTION));
  logger.plain();
  logger.hint(
    "Para ativar os hooks: copie .claude/settings.example.json para " +
      ".claude/settings.json e revise. A CLI não altera sua máquina globalmente.",
  );
}
