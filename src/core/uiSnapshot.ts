import fs from "fs-extra";
import { resolveConfigured } from "./resolve.js";
import {
  listRuns,
  readActiveRun,
  readCurrentRun,
  readEvents,
} from "./runStore.js";
import type {
  HarnessEvent,
  RunRecord,
} from "../types/index.js";

export interface UiSnapshot {
  projectName: string;
  cwd: string;
  hasActiveRun: boolean;
  active: RunRecord | null;
  runs: RunRecord[];
  events: HarnessEvent[];
  reportExcerpt: string;
  watchPaths: string[];
}

/** Lê todo o estado necessário para a UI (somente leitura, nunca lança). */
export async function loadSnapshot(cwd: string): Promise<UiSnapshot> {
  try {
    const { paths, config } = await resolveConfigured(cwd);
    const pointer = await readCurrentRun(paths);
    const active = await readActiveRun(paths);
    const runs = await listRuns(paths);
    const events = active ? await readEvents(paths, active.runId, 12) : [];

    let reportExcerpt = "";
    try {
      if (await fs.pathExists(paths.reportsLatest)) {
        reportExcerpt = (await fs.readFile(paths.reportsLatest, "utf8"))
          .split(/\r?\n/)
          .slice(0, 24)
          .join("\n");
      }
    } catch {
      /* ignora */
    }

    return {
      projectName: config?.projectName || "(sem nome)",
      cwd,
      hasActiveRun: Boolean(pointer && active),
      active,
      runs,
      events,
      reportExcerpt,
      watchPaths: [
        paths.currentRunFile,
        paths.runsDir,
        paths.reportsLatest,
      ],
    };
  } catch {
    return {
      projectName: "(indisponível)",
      cwd,
      hasActiveRun: false,
      active: null,
      runs: [],
      events: [],
      reportExcerpt: "",
      watchPaths: [],
    };
  }
}

export function elapsedLabel(
  startedAt: string,
  finishedAt: string | null,
): string {
  const end = finishedAt ? new Date(finishedAt) : new Date();
  const ms = end.getTime() - new Date(startedAt).getTime();
  if (Number.isNaN(ms) || ms < 0) return "-";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h${m % 60}m`;
  return m > 0 ? `${m}m${s % 60}s` : `${s}s`;
}
