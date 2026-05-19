import chalk from "chalk";
import { resolveConfigured } from "../core/resolve.js";
import { listRuns, readCurrentRun } from "../core/runStore.js";
import { rel } from "../core/paths.js";
import { logger } from "../core/logger.js";
import type { RunStatus } from "../types/index.js";

function statusColor(status: RunStatus): string {
  if (status === "done" || status === "passed") return chalk.green(status);
  if (status === "needs_fix" || status === "failed") return chalk.red(status);
  if (status === "validating") return chalk.yellow(status);
  return chalk.cyan(status);
}

/** `harness runs` — lista as execuções. */
export async function runRunsList(): Promise<void> {
  const cwd = process.cwd();
  const { paths } = await resolveConfigured(cwd);
  const runs = await listRuns(paths);
  const current = await readCurrentRun(paths);

  logger.title("harness runs");
  if (runs.length === 0) {
    logger.info('Nenhuma execução. Crie uma com: harness feature start "<nome>"');
    return;
  }

  for (const r of runs) {
    const marker = current?.runId === r.runId ? chalk.bold("➤ ") : "  ";
    logger.plain(
      `${marker}${chalk.dim(r.runId)}  ${statusColor(r.status)}  ` +
        `score=${r.score}  agent=${r.agent}`,
    );
    logger.plain(`    feature: ${r.feature}`);
    logger.plain(
      `    início: ${r.startedAt}  fim: ${r.finishedAt ?? "-"}`,
    );
    logger.plain(
      `    relatório: ${r.reportPath ? rel(cwd, r.reportPath) : "-"}`,
    );
  }
  logger.plain();
  logger.hint("Detalhe visual em tempo real: harness ui");
}
