import path from "node:path";
import { resolveProjectPaths } from "../core/paths.js";
import { pathExists } from "../core/file-system.js";
import { loadConfig, readPackageScripts } from "../core/config.js";
import { isToolAvailable } from "../core/command-runner.js";
import { logger } from "../core/logger.js";
import type { DoctorCheck } from "../types/index.js";

/**
 * `harness doctor`
 * Diagnostica o projeto: estrutura, git, pnpm, scripts e config.
 */
export async function runDoctor(): Promise<void> {
  const cwd = process.cwd();
  const checks: DoctorCheck[] = [];

  logger.title("harness doctor");

  // Lê a config (se houver) para conhecer os alvos e caminhos resolvidos.
  const bootPaths = resolveProjectPaths(cwd);
  const config = (await pathExists(bootPaths.configFile))
    ? await loadConfig(bootPaths.configFile).catch(() => null)
    : null;
  const targets = config?.agentTargets ?? ["codex"];
  const paths = config
    ? resolveProjectPaths(
        cwd,
        config.paths.harness,
        config.paths.skills,
        config.paths.codexHooks,
        config.paths.claudeSkills,
        config.paths.claudeHooks,
      )
    : bootPaths;

  const check = async (
    label: string,
    target: string,
    suggestion: string,
  ): Promise<void> => {
    const ok = await pathExists(target);
    checks.push({
      label,
      ok,
      detail: ok ? "encontrado" : "ausente",
      ...(ok ? {} : { suggestion }),
    });
  };

  await check("package.json", paths.packageJson, "Inicialize o projeto Node (pnpm init).");
  await check(".git", path.join(cwd, ".git"), "Inicialize o git: git init.");
  await check("AGENTS.md", paths.agentsFile, "Rode `harness init` (fonte canônica).");
  await check(".harness/", paths.harnessDir, "Rode `harness init`.");
  await check(".agents/skills/", paths.skillsDir, "Rode `harness init`.");
  await check("harness.config.json", paths.configFile, "Rode `harness init`.");

  logger.info(`Alvos configurados: ${targets.join(", ")}`);
  if (targets.includes("codex")) {
    await check(".codex/hooks/", paths.codexHooksDir, "Rode `harness export codex`.");
  }
  if (targets.includes("claude-code")) {
    await check("CLAUDE.md", paths.claudeFile, "Rode `harness export claude-code`.");
    await check(".claude/skills/", paths.claudeSkillsDir, "Rode `harness export claude-code`.");
    await check(".claude/hooks/", paths.claudeHooksDir, "Rode `harness export claude-code`.");
  }

  // pnpm disponível?
  const pnpmOk = await isToolAvailable("pnpm");
  checks.push({
    label: "pnpm no PATH",
    ok: pnpmOk,
    detail: pnpmOk ? "disponível" : "não encontrado",
    ...(pnpmOk ? {} : { suggestion: "Instale o pnpm: npm i -g pnpm" }),
  });

  // git disponível?
  const gitOk = await isToolAvailable("git");
  checks.push({
    label: "git no PATH",
    ok: gitOk,
    detail: gitOk ? "disponível" : "não encontrado",
    ...(gitOk ? {} : { suggestion: "Instale o Git." }),
  });

  // Config válida + scripts esperados
  if (await pathExists(paths.configFile)) {
    try {
      const config = await loadConfig(paths.configFile);
      const scripts = await readPackageScripts(paths.packageJson);
      for (const key of Object.keys(config.validation)) {
        if (!config.validation[key]) continue;
        const present = Object.prototype.hasOwnProperty.call(scripts, key);
        checks.push({
          label: `script "${key}" no package.json`,
          ok: present,
          detail: present ? "definido" : "ausente",
          ...(present
            ? {}
            : {
                suggestion: `Adicione um script "${key}" ou ajuste validation.${key} no harness.config.json.`,
              }),
        });
      }
    } catch (error) {
      checks.push({
        label: "harness.config.json válido",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
        suggestion: "Corrija o JSON conforme o schema.",
      });
    }
  }

  logger.plain();
  let problems = 0;
  for (const c of checks) {
    if (c.ok) {
      logger.plain(`  ✅ ${c.label} — ${c.detail}`);
    } else {
      problems += 1;
      logger.plain(`  ❌ ${c.label} — ${c.detail}`);
      if (c.suggestion) logger.hint(`     → ${c.suggestion}`);
    }
  }

  logger.plain();
  if (problems === 0) {
    logger.success("Diagnóstico OK: projeto pronto para o harness.");
    process.exitCode = 0;
  } else {
    logger.warn(`${problems} problema(s) encontrado(s). Veja as sugestões acima.`);
    process.exitCode = 1;
  }
}
