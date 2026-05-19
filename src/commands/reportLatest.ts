import fs from "fs-extra";
import { resolveConfigured } from "../core/resolve.js";
import { readActiveRun, runReportPath } from "../core/runStore.js";
import { rel } from "../core/paths.js";
import { logger } from "../core/logger.js";

/** `harness report latest` — imprime o relatório mais recente. */
export async function runReportLatest(): Promise<void> {
  const cwd = process.cwd();
  const { paths } = await resolveConfigured(cwd);

  let file = paths.reportsLatest;
  if (!(await fs.pathExists(file))) {
    const active = await readActiveRun(paths);
    if (active) {
      const candidate = runReportPath(paths, active.runId);
      if (await fs.pathExists(candidate)) file = candidate;
    }
  }

  if (!(await fs.pathExists(file))) {
    logger.warn(
      "Nenhum relatório encontrado. Rode `harness feature start` e finalize a feature (ou `harness done`).",
    );
    process.exitCode = 1;
    return;
  }

  const content = await fs.readFile(file, "utf8");
  logger.info(`Relatório: ${rel(cwd, file)}`);
  logger.plain();
  logger.plain(content);
}
