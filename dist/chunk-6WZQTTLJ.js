#!/usr/bin/env node

// src/core/uiSnapshot.ts
import fs4 from "fs-extra";

// src/core/config.ts
import { z } from "zod";
import path from "path";
import fs from "fs-extra";
var validationSchema = z.object({
  lint: z.string().optional(),
  typecheck: z.string().optional(),
  build: z.string().optional(),
  test: z.string().optional()
}).catchall(z.string());
var harnessConfigSchema = z.object({
  projectName: z.string().default(""),
  agentTargets: z.array(z.enum(["codex", "claude-code", "cursor"])).min(1).default(["codex"]),
  packageManager: z.enum(["pnpm", "npm", "yarn", "bun"]).default("pnpm"),
  validation: validationSchema.default({
    lint: "pnpm lint",
    typecheck: "pnpm typecheck",
    build: "pnpm build",
    test: "pnpm test"
  }),
  paths: z.object({
    harness: z.string().default(".harness"),
    skills: z.string().default(".agents/skills"),
    codexHooks: z.string().default(".codex/hooks"),
    claudeSkills: z.string().default(".claude/skills"),
    claudeHooks: z.string().default(".claude/hooks")
  }).default({
    harness: ".harness",
    skills: ".agents/skills",
    codexHooks: ".codex/hooks",
    claudeSkills: ".claude/skills",
    claudeHooks: ".claude/hooks"
  })
});
function defaultConfig(projectName, agentTargets) {
  const seed = { projectName };
  if (agentTargets && agentTargets.length > 0) {
    seed.agentTargets = agentTargets;
  }
  return harnessConfigSchema.parse(seed);
}
var VALID_TARGETS = ["codex", "claude-code", "cursor"];
function parseAgentTargets(input) {
  const parsed = input.split(/[\s,]+/).map((t) => t.trim().toLowerCase()).filter(Boolean).map((t) => t === "claude" ? "claude-code" : t);
  const targets = parsed.filter(
    (t) => VALID_TARGETS.includes(t)
  );
  const invalid = parsed.filter(
    (t) => !VALID_TARGETS.includes(t)
  );
  if (invalid.length > 0) {
    throw new Error(
      `Alvo(s) inv\xE1lido(s): ${invalid.join(", ")}. Use: ${VALID_TARGETS.join(", ")}.`
    );
  }
  return [...new Set(targets)];
}
async function loadConfig(configFile) {
  if (!await fs.pathExists(configFile)) {
    throw new Error(
      `harness.config.json n\xE3o encontrado em ${configFile}. Rode \`harness init\` primeiro.`
    );
  }
  let raw;
  try {
    raw = await fs.readJson(configFile);
  } catch {
    throw new Error(`harness.config.json inv\xE1lido (JSON malformado): ${configFile}`);
  }
  const result = harnessConfigSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join(".") || "(raiz)"}: ${i.message}`).join("\n");
    throw new Error(`harness.config.json inv\xE1lido:
${issues}`);
  }
  return result.data;
}
async function readPackageScripts(packageJson) {
  if (!await fs.pathExists(packageJson)) return {};
  try {
    const pkg = await fs.readJson(packageJson);
    return pkg.scripts ?? {};
  } catch {
    return {};
  }
}
async function readPackageName(packageJson) {
  if (!await fs.pathExists(packageJson)) return "";
  try {
    const pkg = await fs.readJson(packageJson);
    return pkg.name ?? "";
  } catch {
    return "";
  }
}
function inferProjectName(cwd, pkgName) {
  return pkgName || path.basename(cwd);
}

// src/core/paths.ts
import { fileURLToPath } from "url";
import path2 from "path";
import fs2 from "fs-extra";
var moduleDir = path2.dirname(fileURLToPath(import.meta.url));
function getTemplatesDir() {
  const candidates = [
    path2.join(moduleDir, "templates"),
    path2.join(moduleDir, "..", "templates"),
    path2.join(moduleDir, "..", "..", "templates"),
    path2.join(moduleDir, "..", "..", "..", "templates")
  ];
  for (const candidate of candidates) {
    if (fs2.existsSync(path2.join(candidate, "AGENTS.md"))) {
      return candidate;
    }
  }
  throw new Error(
    "N\xE3o foi poss\xEDvel localizar a pasta de templates. Rode `pnpm build` ou verifique a instala\xE7\xE3o."
  );
}
function resolveProjectPaths(cwd, harnessRel = ".harness", skillsRel = ".agents/skills", codexHooksRel = ".codex/hooks", claudeSkillsRel = ".claude/skills", claudeHooksRel = ".claude/hooks") {
  const harnessDir = path2.join(cwd, harnessRel);
  const codexHooksDir = path2.join(cwd, codexHooksRel);
  const claudeHooksDir = path2.join(cwd, claudeHooksRel);
  return {
    cwd,
    harnessDir,
    runsDir: path2.join(harnessDir, "runs"),
    reportsDir: path2.join(harnessDir, "reports"),
    evalsDir: path2.join(harnessDir, "evals"),
    skillsDir: path2.join(cwd, skillsRel),
    codexDir: path2.dirname(codexHooksDir),
    codexHooksDir,
    claudeHooksDir,
    claudeSkillsDir: path2.join(cwd, claudeSkillsRel),
    claudeDir: path2.dirname(claudeHooksDir),
    claudeFile: path2.join(cwd, "CLAUDE.md"),
    agentsFile: path2.join(cwd, "AGENTS.md"),
    configFile: path2.join(harnessDir, "harness.config.json"),
    projectContext: path2.join(harnessDir, "project-context.md"),
    currentTask: path2.join(harnessDir, "current-task.md"),
    acceptanceCriteria: path2.join(harnessDir, "acceptance-criteria.md"),
    qaChecklist: path2.join(harnessDir, "qa-checklist.md"),
    decisions: path2.join(harnessDir, "decisions.md"),
    failures: path2.join(harnessDir, "failures.md"),
    packageJson: path2.join(cwd, "package.json"),
    currentRunFile: path2.join(harnessDir, "current-run.json"),
    reportsLatest: path2.join(harnessDir, "reports", "latest.md"),
    codexHooksConfig: path2.join(path2.dirname(codexHooksDir), "hooks.json"),
    claudeSettings: path2.join(path2.dirname(claudeHooksDir), "settings.json")
  };
}
function runDir(paths, runId) {
  return path2.join(paths.runsDir, runId);
}
function rel(cwd, target) {
  return path2.relative(cwd, target).split(path2.sep).join("/") || ".";
}

// src/core/resolve.ts
async function resolveConfigured(cwd) {
  const base = resolveProjectPaths(cwd);
  const config = await loadConfig(base.configFile).catch(() => null);
  if (!config) return { paths: base, config: null };
  return {
    paths: resolveProjectPaths(
      cwd,
      config.paths.harness,
      config.paths.skills,
      config.paths.codexHooks,
      config.paths.claudeSkills,
      config.paths.claudeHooks
    ),
    config
  };
}

// src/core/runStore.ts
import path3 from "path";
import { randomUUID } from "crypto";
import fs3 from "fs-extra";

// src/core/date.ts
function pad(value) {
  return value.toString().padStart(2, "0");
}
function fileStamp(date = /* @__PURE__ */ new Date()) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes())
  ].join("-");
}
function readableStamp(date = /* @__PURE__ */ new Date()) {
  const d = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const t = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${d} ${t}`;
}
function backupStamp(date = /* @__PURE__ */ new Date()) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

// src/core/runStore.ts
function newRunId(date = /* @__PURE__ */ new Date()) {
  return `${backupStamp(date)}-${randomUUID().replace(/-/g, "").slice(0, 8)}`;
}
function emptyRun(runId, feature, agent) {
  return {
    runId,
    feature,
    agent,
    status: "created",
    score: 0,
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    finishedAt: null,
    validations: {
      lint: "not_run",
      typecheck: "not_run",
      build: "not_run",
      test: "not_run"
    },
    filesChanged: [],
    eventsCount: 0,
    blockReason: null,
    reportPath: null
  };
}
async function readJsonSafe(file, fallback) {
  try {
    if (!await fs3.pathExists(file)) return fallback;
    return await fs3.readJson(file);
  } catch {
    return fallback;
  }
}
async function createRun(paths, feature, agent) {
  const runId = newRunId();
  const dir = runDir(paths, runId);
  await fs3.ensureDir(dir);
  const record = emptyRun(runId, feature, agent);
  await fs3.writeJson(path3.join(dir, "run.json"), record, { spaces: 2 });
  await fs3.writeFile(path3.join(dir, "events.jsonl"), "");
  await fs3.writeFile(path3.join(dir, "commands.log"), "");
  await fs3.writeJson(path3.join(dir, "changed-files.json"), [], { spaces: 2 });
  await fs3.writeJson(path3.join(dir, "validation.json"), [], { spaces: 2 });
  await fs3.writeFile(
    path3.join(dir, "implementation-report.md"),
    `# Relat\xF3rio de Implementa\xE7\xE3o \u2014 ${feature}

(status: created \u2014 relat\xF3rio ser\xE1 preenchido ao concluir)
`
  );
  const pointer = {
    runId,
    feature,
    agent,
    startedAt: record.startedAt
  };
  await fs3.ensureDir(paths.harnessDir);
  await fs3.writeJson(paths.currentRunFile, pointer, { spaces: 2 });
  return record;
}
async function readCurrentRun(paths) {
  return readJsonSafe(paths.currentRunFile, null);
}
async function readRun(paths, runId) {
  return readJsonSafe(
    path3.join(runDir(paths, runId), "run.json"),
    null
  );
}
async function readActiveRun(paths) {
  const pointer = await readCurrentRun(paths);
  if (!pointer?.runId) return null;
  return readRun(paths, pointer.runId);
}
async function updateRun(paths, runId, patch) {
  const file = path3.join(runDir(paths, runId), "run.json");
  const current = await readJsonSafe(file, null);
  if (!current) return null;
  const next = {
    ...current,
    ...patch,
    validations: { ...current.validations, ...patch.validations ?? {} }
  };
  await fs3.writeJson(file, next, { spaces: 2 });
  return next;
}
async function setRunStatus(paths, runId, status) {
  await updateRun(paths, runId, { status });
}
async function appendEvent(paths, runId, type, agent, message, metadata = {}) {
  const dir = runDir(paths, runId);
  const event = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    type,
    agent,
    message,
    metadata
  };
  await fs3.ensureDir(dir);
  await fs3.appendFile(
    path3.join(dir, "events.jsonl"),
    `${JSON.stringify(event)}
`
  );
  const run = await readRun(paths, runId);
  if (run) {
    await updateRun(paths, runId, { eventsCount: run.eventsCount + 1 });
  }
}
async function readEvents(paths, runId, limit) {
  const file = path3.join(runDir(paths, runId), "events.jsonl");
  if (!await fs3.pathExists(file)) return [];
  const raw = await fs3.readFile(file, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const events = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line));
    } catch {
    }
  }
  return typeof limit === "number" ? events.slice(-limit) : events;
}
async function appendCommandLog(paths, runId, line) {
  const file = path3.join(runDir(paths, runId), "commands.log");
  await fs3.ensureDir(path3.dirname(file));
  await fs3.appendFile(file, `${(/* @__PURE__ */ new Date()).toISOString()}	${line}
`);
}
async function addChangedFiles(paths, runId, files) {
  const dir = runDir(paths, runId);
  const file = path3.join(dir, "changed-files.json");
  const current = await readJsonSafe(file, []);
  const merged = [.../* @__PURE__ */ new Set([...current, ...files.filter(Boolean)])].sort();
  await fs3.writeJson(file, merged, { spaces: 2 });
  await updateRun(paths, runId, { filesChanged: merged });
  return merged;
}
async function writeValidationJson(paths, runId, details) {
  await fs3.writeJson(
    path3.join(runDir(paths, runId), "validation.json"),
    details,
    { spaces: 2 }
  );
}
async function listRuns(paths) {
  if (!await fs3.pathExists(paths.runsDir)) return [];
  const entries = await fs3.readdir(paths.runsDir, {
    withFileTypes: true
  });
  const runs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const record = await readRun(paths, entry.name);
    if (record) runs.push(record);
  }
  return runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}
function runReportPath(paths, runId) {
  return path3.join(runDir(paths, runId), "implementation-report.md");
}

// src/core/uiSnapshot.ts
async function loadSnapshot(cwd) {
  try {
    const { paths, config } = await resolveConfigured(cwd);
    const pointer = await readCurrentRun(paths);
    const active = await readActiveRun(paths);
    const runs = await listRuns(paths);
    const events = active ? await readEvents(paths, active.runId, 12) : [];
    let reportExcerpt = "";
    try {
      if (await fs4.pathExists(paths.reportsLatest)) {
        reportExcerpt = (await fs4.readFile(paths.reportsLatest, "utf8")).split(/\r?\n/).slice(0, 24).join("\n");
      }
    } catch {
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
        paths.reportsLatest
      ]
    };
  } catch {
    return {
      projectName: "(indispon\xEDvel)",
      cwd,
      hasActiveRun: false,
      active: null,
      runs: [],
      events: [],
      reportExcerpt: "",
      watchPaths: []
    };
  }
}
function elapsedLabel(startedAt, finishedAt) {
  const end = finishedAt ? new Date(finishedAt) : /* @__PURE__ */ new Date();
  const ms = end.getTime() - new Date(startedAt).getTime();
  if (Number.isNaN(ms) || ms < 0) return "-";
  const s = Math.floor(ms / 1e3);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h${m % 60}m`;
  return m > 0 ? `${m}m${s % 60}s` : `${s}s`;
}

export {
  getTemplatesDir,
  resolveProjectPaths,
  rel,
  fileStamp,
  readableStamp,
  backupStamp,
  defaultConfig,
  parseAgentTargets,
  loadConfig,
  readPackageScripts,
  readPackageName,
  inferProjectName,
  createRun,
  readCurrentRun,
  readActiveRun,
  updateRun,
  setRunStatus,
  appendEvent,
  readEvents,
  appendCommandLog,
  addChangedFiles,
  writeValidationJson,
  listRuns,
  runReportPath,
  resolveConfigured,
  loadSnapshot,
  elapsedLabel
};
//# sourceMappingURL=chunk-6WZQTTLJ.js.map