import chalk from "chalk";
import { loadSnapshot, elapsedLabel } from "../core/uiSnapshot.js";
import { logger } from "../core/logger.js";

export interface UiOptions {
  once?: boolean;
}

/** Render textual de fallback (sem Ink): somente leitura, uma passada. */
async function renderFallback(cwd: string, note?: string): Promise<void> {
  const snap = await loadSnapshot(cwd);
  if (note) logger.warn(note);
  logger.title(`Agent Harness — ${snap.projectName}`);

  if (!snap.hasActiveRun || !snap.active) {
    logger.info('Nenhuma execução ativa. Inicie: harness feature start "<nome>"');
  } else {
    const r = snap.active;
    logger.plain(`  Feature : ${chalk.bold(r.feature)}`);
    logger.plain(`  Status  : ${chalk.cyan(r.status)} · score ${r.score}/100`);
    logger.plain(`  Agente  : ${r.agent} · ${elapsedLabel(r.startedAt, r.finishedAt)}`);
    logger.plain(
      `  Validações: lint=${r.validations.lint} typecheck=${r.validations.typecheck} ` +
        `build=${r.validations.build} test=${r.validations.test}`,
    );
    logger.plain(`  Arquivos: ${r.filesChanged.length} · Eventos: ${r.eventsCount}`);
    if (r.blockReason) {
      logger.warn("Bloqueio:");
      logger.plain(chalk.red(r.blockReason));
    }
    for (const e of snap.events.slice(-6)) {
      logger.plain(
        `   ${chalk.dim(e.timestamp.slice(11, 19))} [${e.type}] ${e.message}`,
      );
    }
  }

  if (snap.runs.length > 0) {
    logger.plain();
    logger.plain(chalk.dim("  Execuções:"));
    for (const r of snap.runs.slice(0, 5)) {
      logger.plain(`   ${r.runId}  ${r.status}  score=${r.score}  ${r.feature}`);
    }
  }
}

/**
 * `harness ui` — TUI somente leitura (Ink/React) com observação em tempo
 * real. Fallback automático para texto se não houver TTY ou se o Ink
 * falhar. Sai com q ou Ctrl+C.
 */
export async function runUi(options: UiOptions): Promise<void> {
  const cwd = process.cwd();

  if (options.once) {
    await renderFallback(cwd);
    return;
  }

  if (!process.stdout.isTTY) {
    await renderFallback(
      cwd,
      "Sem TTY interativo — exibindo snapshot textual (use `harness ui` num terminal real).",
    );
    return;
  }

  try {
    const [{ render }, { createElement }, { App }] = await Promise.all([
      import("ink"),
      import("react"),
      import("../ui/App.js"),
    ]);
    const instance = render(createElement(App, { cwd }));
    await instance.waitUntilExit();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await renderFallback(
      cwd,
      `Não foi possível abrir a TUI (${message}). Fallback textual:`,
    );
  }
}
