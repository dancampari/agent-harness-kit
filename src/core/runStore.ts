import path from "node:path";
import { randomUUID } from "node:crypto";
import fs from "fs-extra";
import { runDir, type ProjectPaths } from "./paths.js";
import { backupStamp } from "./date.js";
import type {
  AgentKind,
  CurrentRunPointer,
  HarnessEvent,
  HarnessEventType,
  RunRecord,
  RunStatus,
  ValidationDetail,
} from "../types/index.js";

/** ID legível e único: YYYYMMDD-HHmmss-<8 hex>. */
export function newRunId(date = new Date()): string {
  return `${backupStamp(date)}-${randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

function emptyRun(
  runId: string,
  feature: string,
  agent: AgentKind,
): RunRecord {
  return {
    runId,
    feature,
    agent,
    status: "created",
    score: 0,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    validations: {
      lint: "not_run",
      typecheck: "not_run",
      build: "not_run",
      test: "not_run",
    },
    filesChanged: [],
    eventsCount: 0,
    blockReason: null,
    reportPath: null,
  };
}

async function readJsonSafe<T>(file: string, fallback: T): Promise<T> {
  try {
    if (!(await fs.pathExists(file))) return fallback;
    return (await fs.readJson(file)) as T;
  } catch {
    return fallback;
  }
}

/** Cria a estrutura de uma nova execução e a marca como atual. */
export async function createRun(
  paths: ProjectPaths,
  feature: string,
  agent: AgentKind,
): Promise<RunRecord> {
  const runId = newRunId();
  const dir = runDir(paths, runId);
  await fs.ensureDir(dir);

  const record = emptyRun(runId, feature, agent);
  await fs.writeJson(path.join(dir, "run.json"), record, { spaces: 2 });
  await fs.writeFile(path.join(dir, "events.jsonl"), "");
  await fs.writeFile(path.join(dir, "commands.log"), "");
  await fs.writeJson(path.join(dir, "changed-files.json"), [], { spaces: 2 });
  await fs.writeJson(path.join(dir, "validation.json"), [], { spaces: 2 });
  await fs.writeFile(
    path.join(dir, "implementation-report.md"),
    `# Relatório de Implementação — ${feature}\n\n(status: created — relatório será preenchido ao concluir)\n`,
  );

  const pointer: CurrentRunPointer = {
    runId,
    feature,
    agent,
    startedAt: record.startedAt,
  };
  await fs.ensureDir(paths.harnessDir);
  await fs.writeJson(paths.currentRunFile, pointer, { spaces: 2 });

  return record;
}

export async function readCurrentRun(
  paths: ProjectPaths,
): Promise<CurrentRunPointer | null> {
  return readJsonSafe<CurrentRunPointer | null>(paths.currentRunFile, null);
}

export async function readRun(
  paths: ProjectPaths,
  runId: string,
): Promise<RunRecord | null> {
  return readJsonSafe<RunRecord | null>(
    path.join(runDir(paths, runId), "run.json"),
    null,
  );
}

/** Lê o RunRecord da execução atual (ou null se não houver). */
export async function readActiveRun(
  paths: ProjectPaths,
): Promise<RunRecord | null> {
  const pointer = await readCurrentRun(paths);
  if (!pointer?.runId) return null;
  return readRun(paths, pointer.runId);
}

/** Aplica um patch parcial ao run.json (merge raso + validations). */
export async function updateRun(
  paths: ProjectPaths,
  runId: string,
  patch: Partial<RunRecord>,
): Promise<RunRecord | null> {
  const file = path.join(runDir(paths, runId), "run.json");
  const current = await readJsonSafe<RunRecord | null>(file, null);
  if (!current) return null;
  const next: RunRecord = {
    ...current,
    ...patch,
    validations: { ...current.validations, ...(patch.validations ?? {}) },
  };
  await fs.writeJson(file, next, { spaces: 2 });
  return next;
}

export async function setRunStatus(
  paths: ProjectPaths,
  runId: string,
  status: RunStatus,
): Promise<void> {
  await updateRun(paths, runId, { status });
}

/** Acrescenta um evento ao events.jsonl e incrementa o contador. */
export async function appendEvent(
  paths: ProjectPaths,
  runId: string,
  type: HarnessEventType,
  agent: AgentKind,
  message: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const dir = runDir(paths, runId);
  const event: HarnessEvent = {
    timestamp: new Date().toISOString(),
    type,
    agent,
    message,
    metadata,
  };
  await fs.ensureDir(dir);
  await fs.appendFile(
    path.join(dir, "events.jsonl"),
    `${JSON.stringify(event)}\n`,
  );
  const run = await readRun(paths, runId);
  if (run) {
    await updateRun(paths, runId, { eventsCount: run.eventsCount + 1 });
  }
}

export async function readEvents(
  paths: ProjectPaths,
  runId: string,
  limit?: number,
): Promise<HarnessEvent[]> {
  const file = path.join(runDir(paths, runId), "events.jsonl");
  if (!(await fs.pathExists(file))) return [];
  const raw = await fs.readFile(file, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const events: HarnessEvent[] = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line) as HarnessEvent);
    } catch {
      /* ignora linha corrompida */
    }
  }
  return typeof limit === "number" ? events.slice(-limit) : events;
}

export async function appendCommandLog(
  paths: ProjectPaths,
  runId: string,
  line: string,
): Promise<void> {
  const file = path.join(runDir(paths, runId), "commands.log");
  await fs.ensureDir(path.dirname(file));
  await fs.appendFile(file, `${new Date().toISOString()}\t${line}\n`);
}

/** Mescla novos arquivos alterados (dedupe) em changed-files.json + run.json. */
export async function addChangedFiles(
  paths: ProjectPaths,
  runId: string,
  files: string[],
): Promise<string[]> {
  const dir = runDir(paths, runId);
  const file = path.join(dir, "changed-files.json");
  const current = await readJsonSafe<string[]>(file, []);
  const merged = [...new Set([...current, ...files.filter(Boolean)])].sort();
  await fs.writeJson(file, merged, { spaces: 2 });
  await updateRun(paths, runId, { filesChanged: merged });
  return merged;
}

export async function writeValidationJson(
  paths: ProjectPaths,
  runId: string,
  details: ValidationDetail[],
): Promise<void> {
  await fs.writeJson(
    path.join(runDir(paths, runId), "validation.json"),
    details,
    { spaces: 2 },
  );
}

/** Lista todas as execuções, mais recentes primeiro. */
export async function listRuns(paths: ProjectPaths): Promise<RunRecord[]> {
  if (!(await fs.pathExists(paths.runsDir))) return [];
  const entries = (await fs.readdir(paths.runsDir, {
    withFileTypes: true,
  })) as fs.Dirent[];
  const runs: RunRecord[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const record = await readRun(paths, entry.name);
    if (record) runs.push(record);
  }
  return runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function runReportPath(paths: ProjectPaths, runId: string): string {
  return path.join(runDir(paths, runId), "implementation-report.md");
}
