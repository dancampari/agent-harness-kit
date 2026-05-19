import path from "node:path";
import { resolveProjectPaths, rel } from "../core/paths.js";
import { loadConfig } from "../core/config.js";
import { ensureDir } from "../core/file-system.js";
import { runValidation } from "../core/validators.js";
import { logger } from "../core/logger.js";

/**
 * `harness validate`
 * Executa os comandos de validação do harness.config.json, gera relatório
 * e define exit code 1 se qualquer etapa falhar.
 */
export async function runValidate(): Promise<void> {
  const cwd = process.cwd();
  const config = await loadConfig(
    path.join(cwd, ".harness", "harness.config.json"),
  );
  const paths = resolveProjectPaths(
    cwd,
    config.paths.harness,
    config.paths.skills,
    config.paths.codexHooks,
  );

  logger.title("harness validate");
  await ensureDir(paths.reportsDir);

  const result = await runValidation(config, paths, "latest-validation.md");

  logger.plain();
  for (const step of result.steps) {
    const icon =
      step.status === "passed" ? "✅" : step.status === "failed" ? "❌" : "⏭️";
    logger.plain(`  ${icon} ${step.name} — ${step.status}`);
  }
  logger.plain();
  logger.info(`Relatório: ${rel(cwd, result.reportPath)}`);

  if (result.passed) {
    logger.success("Todas as validações passaram.");
    process.exitCode = 0;
  } else {
    logger.error("Validação falhou. Não declare a tarefa como concluída.");
    process.exitCode = 1;
  }
}
