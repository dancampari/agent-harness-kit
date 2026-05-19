import fs from "fs-extra";
import path from "node:path";
import { resolveConfigured } from "./resolve.js";
import { profileProject } from "./profiler.js";
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
  stack: string;
  skillCount: number;
  installedAdapters: string[];
  hasActiveRun: boolean;
  active: RunRecord | null;
  runs: RunRecord[];
  events: HarnessEvent[];
  reportExcerpt: string;
  watchPaths: string[];
}

async function countSkills(skillsDir: string): Promise<number> {
  if (!(await fs.pathExists(skillsDir))) return 0;
  let n = 0;
  async function walk(d: string): Promise<void> {
    for (const e of (await fs.readdir(d, { withFileTypes: true })) as fs.Dirent[]) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name === "SKILL.md") n += 1;
    }
  }
  await walk(skillsDir);
  return n;
}

/** Lê todo o estado necessário para a UI (somente leitura, nunca lança). */
export async function loadSnapshot(cwd: string): Promise<UiSnapshot> {
  try {
    const { paths, config } = await resolveConfigured(cwd);
    const pointer = await readCurrentRun(paths);
    const active = await readActiveRun(paths);
    const runs = await listRuns(paths);
    const events = active ? await readEvents(paths, active.runId, 12) : [];
    const profile = await profileProject(cwd).catch(() => null);
    const stack = profile
      ? `${profile.language}${
          profile.framework ? ` · ${profile.framework}` : ""
        }${profile.packageManager ? ` · ${profile.packageManager}` : ""}`
      : "não detectada";
    const skillCount = await countSkills(paths.skillsDir);

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
      stack,
      skillCount,
      installedAdapters: config?.installedAdapters ?? [],
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
      stack: "não detectada",
      skillCount: 0,
      installedAdapters: [],
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
