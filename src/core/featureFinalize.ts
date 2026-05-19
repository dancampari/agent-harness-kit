import { loadConfig } from "./config.js";
import { resolveProjectPaths, type ProjectPaths } from "./paths.js";
import {
  readActiveRun,
  updateRun,
  appendEvent,
  setRunStatus,
} from "./runStore.js";
import { runFeatureValidation } from "./validationRun.js";
import { evaluateBlockers } from "./blockers.js";
import { writeImplementationReport } from "./runReport.js";
import type { AgentKind, Blocker, RunRecord } from "../types/index.js";

export interface FinalizeOutcome {
  hadActiveRun: boolean;
  passed: boolean;
  run: RunRecord | null;
  blockers: Blocker[];
  reason: string;
}

function buildReason(blockers: Blocker[]): string {
  const critical = blockers.filter((b) => b.severity === "critical");
  const head =
    "Conclusão bloqueada pelo harness: pendências críticas encontradas.";
  const items = critical
    .slice(0, 8)
    .map((b) => `• ${b.label} — ${b.detail}`)
    .join("\n");
  return `${head}\n${items}\nRode \`harness status\` e corrija antes de finalizar.`;
}

/**
 * Núcleo compartilhado por `hook stop` e `hook task-completed`:
 * valida, avalia bloqueios, gera relatório e atualiza o run.json.
 */
export async function finalizeFeature(
  cwd: string,
  agent: AgentKind,
): Promise<FinalizeOutcome> {
  const config = await loadConfig(
    resolveProjectPaths(cwd).configFile,
  ).catch(() => null);

  const paths: ProjectPaths = config
    ? resolveProjectPaths(
        cwd,
        config.paths.harness,
        config.paths.skills,
        config.paths.codexHooks,
        config.paths.claudeSkills,
        config.paths.claudeHooks,
      )
    : resolveProjectPaths(cwd);

  const active = await readActiveRun(paths);
  if (!active || !config) {
    return {
      hadActiveRun: false,
      passed: true,
      run: active,
      blockers: [],
      reason: "",
    };
  }

  const runId = active.runId;
  await setRunStatus(paths, runId, "validating");
  await appendEvent(paths, runId, "validation", agent, "Validações iniciadas");

  const validation = await runFeatureValidation(config, paths, runId);
  await appendEvent(
    paths,
    runId,
    "validation",
    agent,
    `Validações: ${validation.passed ? "passou" : "falhou"}`,
    { validations: validation.validations },
  );

  const evaluation = await evaluateBlockers(
    paths,
    config,
    validation.details,
    active.filesChanged,
  );

  const passed =
    validation.passed && evaluation.blockers.length === 0;
  const reason = passed ? "" : buildReason(evaluation.blockers);

  const finishedAt = new Date().toISOString();
  let updated = await updateRun(paths, runId, {
    status: passed ? "passed" : "needs_fix",
    score: evaluation.score,
    blockReason: passed ? null : reason,
    finishedAt,
    filesChanged: evaluation.changedFiles,
  });

  const reportPath = await writeImplementationReport(paths, {
    run: updated ?? active,
    details: validation.details,
    blockers: evaluation.blockers,
    changedFiles: evaluation.changedFiles,
    partial: !passed,
  });

  updated = await updateRun(paths, runId, {
    reportPath,
    status: passed ? "done" : "needs_fix",
  });
  await appendEvent(
    paths,
    runId,
    passed ? "report" : "block",
    agent,
    passed
      ? "Feature concluída e relatório gerado"
      : "Conclusão bloqueada — relatório parcial gerado",
    { reportPath, score: evaluation.score },
  );

  return {
    hadActiveRun: true,
    passed,
    run: updated,
    blockers: evaluation.blockers,
    reason,
  };
}
