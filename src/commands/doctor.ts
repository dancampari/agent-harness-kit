import path from "node:path";
import { resolveProjectPaths } from "../core/paths.js";
import { pathExists } from "../core/file-system.js";
import { loadConfig } from "../core/config.js";
import { isToolAvailable } from "../core/command-runner.js";
import { profileProject } from "../core/profiler.js";
import { resolveValidationCommands } from "../core/validationResolve.js";
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

  // git disponível?
  const gitOk = await isToolAvailable("git");
  checks.push({
    label: "git no PATH",
    ok: gitOk,
    detail: gitOk ? "disponível" : "não encontrado",
    ...(gitOk ? {} : { suggestion: "Instale o Git." }),
  });

  // ---- Perfil do projeto (detecção, sem assumir stack) ----
  const profile = await profileProject(cwd);
  logger.plain();
  logger.title("Projeto detectado");
  logger.plain(`  Linguagem      : ${profile.language}`);
  logger.plain(`  Gerenciador    : ${profile.packageManager ?? "—"}`);
  logger.plain(`  Framework      : ${profile.framework ?? "—"}`);
  logger.plain(
    `  Sinais         : ${[
      profile.hasTests && "testes",
      profile.hasDocker && "docker",
      profile.hasCI && "ci/cd",
      profile.hasDatabase && "banco/migrations",
      profile.hasFrontend && "frontend",
      profile.hasBackend && "backend/api",
    ]
      .filter(Boolean)
      .join(", ") || "nenhum detectado"}`,
  );

  // ---- Validações (detectadas/configuradas, não assumidas) ----
  if (config) {
    const resolved = await resolveValidationCommands(config, cwd);
    const entries = Object.entries(resolved.commands);
    logger.plain();
    logger.title(`Validações (${resolved.source})`);
    if (entries.length === 0) {
      logger.plain("  (nenhuma) — configure validation.commands ou adicione scripts.");
    } else {
      for (const [k, v] of entries) logger.plain(`  ${k}: ${v}`);
    }
  }

  // ---- Adapters sugeridos (NUNCA instala automaticamente) ----
  logger.plain();
  logger.title("Adapters sugeridos");
  if (profile.suggestedAdapters.length === 0) {
    logger.plain("  Nenhum (projeto genérico ou stack não reconhecida).");
  } else {
    for (const a of profile.suggestedAdapters) {
      const installed = config?.installedAdapters?.includes(a.name);
      logger.plain(
        `  ${a.name} [confiança: ${a.confidence}] — ${a.reason}${
          installed ? " (instalado)" : ""
        }`,
      );
    }
    logger.hint(
      "Instale manualmente quando fizer sentido: harness adapter add <nome>",
    );
  }

  if (profile.risks.length > 0) {
    logger.plain();
    logger.title("Riscos iniciais");
    for (const r of profile.risks) logger.plain(`  • ${r}`);
  }

  logger.plain();
  logger.title("Estrutura");
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
