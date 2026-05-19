import chalk from "chalk";
import { resolveConfigured } from "../core/resolve.js";
import { readActiveRun, readEvents } from "../core/runStore.js";
import { rel } from "../core/paths.js";
import { logger } from "../core/logger.js";
import type { ValidationState } from "../types/index.js";

function vIcon(state: ValidationState): string {
  if (state === "passed") return chalk.green("✅");
  if (state === "failed") return chalk.red("❌");
  if (state === "skipped") return chalk.yellow("⏭️");
  return chalk.dim("•");
}

function elapsed(startedAt: string, finishedAt: string | null): string {
  const end = finishedAt ? new Date(finishedAt) : new Date();
  const ms = end.getTime() - new Date(startedAt).getTime();
  if (Number.isNaN(ms) || ms < 0) return "-";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m${s % 60}s` : `${s}s`;
}

/** `harness status` — resumo da execução atual. */
export async function runStatus(): Promise<void> {
  const cwd = process.cwd();
  const { paths } = await resolveConfigured(cwd);
  const run = await readActiveRun(paths);

  logger.title("harness status");
  if (!run) {
    logger.info('Nenhuma execução ativa. Inicie: harness feature start "<nome>"');
    return;
  }

  logger.plain(`  Feature : ${chalk.bold(run.feature)}`);
  logger.plain(`  Run     : ${chalk.dim(run.runId)}`);
  logger.plain(`  Agente  : ${run.agent}`);
  logger.plain(`  Status  : ${chalk.cyan(run.status)}`);
  logger.plain(`  Score   : ${run.score}/100`);
  logger.plain(`  Tempo   : ${elapsed(run.startedAt, run.finishedAt)}`);
  logger.plain(
    `  Validações: lint ${vIcon(run.validations.lint)}  ` +
      `typecheck ${vIcon(run.validations.typecheck)}  ` +
      `build ${vIcon(run.validations.build)}  ` +
      `test ${vIcon(run.validations.test)}`,
  );
  logger.plain(`  Arquivos: ${run.filesChanged.length}`);
  logger.plain(`  Eventos : ${run.eventsCount}`);
  if (run.blockReason) {
    logger.plain();
    logger.warn("Bloqueio:");
    logger.plain(chalk.red(run.blockReason));
  }
  if (run.reportPath) {
    logger.plain();
    logger.info(`Relatório: ${rel(cwd, run.reportPath)}`);
  }

  const events = await readEvents(paths, run.runId, 5);
  if (events.length > 0) {
    logger.plain();
    logger.plain(chalk.dim("  Últimos eventos:"));
    for (const e of events) {
      logger.plain(
        `   ${chalk.dim(e.timestamp.slice(11, 19))} [${e.type}] ${e.message}`,
      );
    }
  }
}
