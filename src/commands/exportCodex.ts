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

const CODEX_INSTRUCTION =
  'codex "Leia AGENTS.md e .harness/current-task.md. Implemente a tarefa ' +
  "seguindo as skills disponíveis e só considere concluído após cumprir " +
  '.harness/acceptance-criteria.md."';

/**
 * `harness export codex`
 * Garante (sem duplicar) que AGENTS.md, skills e hooks existem e imprime
 * a instrução pronta para colar no Codex.
 */
export async function runExportCodex(): Promise<void> {
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
  );
  const vars = { PROJECT_NAME: config.projectName };

  logger.title("harness export codex");

  // AGENTS.md — só cria se faltar (não duplica conteúdo existente).
  if (await pathExists(paths.agentsFile)) {
    logger.info("AGENTS.md já existe — mantido (não duplicado).");
  } else {
    await materializeTemplate("AGENTS.md", paths.agentsFile, vars, false);
    logger.success(`Criado ${rel(cwd, paths.agentsFile)}`);
  }

  // Skills universais — cria apenas as ausentes (não duplica).
  let createdSkills = 0;
  for (const relTpl of await listCoreSkillTemplates()) {
    const target = path.join(paths.skillsDir, skillSubPath(relTpl));
    if (await pathExists(target)) continue;
    await materializeTemplate(relTpl, target, vars, false);
    createdSkills += 1;
  }
  logger.success(
    createdSkills === 0
      ? `Skills já presentes em ${rel(cwd, paths.skillsDir)}`
      : `${createdSkills} skill(s) criada(s) em ${rel(cwd, paths.skillsDir)}`,
  );

  // Hooks — cria apenas os ausentes.
  let createdHooks = 0;
  for (const hook of HOOK_FILES) {
    const target = path.join(paths.codexHooksDir, hook);
    if (await pathExists(target)) continue;
    await materializeTemplate(`hooks/${hook}`, target, vars, false);
    createdHooks += 1;
  }
  const hooksExample = path.join(paths.codexDir, "hooks.example.json");
  if (!(await pathExists(hooksExample))) {
    await materializeTemplate(
      "hooks/codex-hooks.example.json",
      hooksExample,
      vars,
      false,
    );
    createdHooks += 1;
  }
  logger.success(
    createdHooks === 0
      ? `Hooks já presentes em ${rel(cwd, paths.codexHooksDir)}`
      : `${createdHooks} arquivo(s) de hook criado(s) em ${rel(cwd, paths.codexHooksDir)}`,
  );

  logger.title("Agora execute:");
  logger.plain(chalk.greenBright(CODEX_INSTRUCTION));
  logger.plain();
  logger.hint(
    "Os hooks em .codex/ são exemplos. Configure-os manualmente no Codex " +
      "(veja .codex/hooks.example.json). A CLI não altera sua máquina globalmente.",
  );
}
