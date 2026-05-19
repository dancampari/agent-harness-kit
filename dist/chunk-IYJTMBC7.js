#!/usr/bin/env node

// src/core/logger.ts
import chalk from "chalk";
import ora from "ora";
function stamp() {
  return chalk.dim((/* @__PURE__ */ new Date()).toISOString().slice(11, 19));
}
var quiet = false;
async function withQuietLogger(fn) {
  const previous = quiet;
  quiet = true;
  try {
    return await fn();
  } finally {
    quiet = previous;
  }
}
var logger = {
  info(message) {
    if (quiet) return;
    console.log(`${stamp()} ${chalk.cyan("\u2139")} ${message}`);
  },
  success(message) {
    if (quiet) return;
    console.log(`${stamp()} ${chalk.green("\u2714")} ${message}`);
  },
  warn(message) {
    if (quiet) return;
    console.warn(`${stamp()} ${chalk.yellow("\u26A0")} ${message}`);
  },
  error(message) {
    console.error(`${stamp()} ${chalk.red("\u2716")} ${message}`);
  },
  step(message) {
    if (quiet) return;
    console.log(`${stamp()} ${chalk.magenta("\u279C")} ${message}`);
  },
  title(message) {
    if (quiet) return;
    console.log(`
${chalk.bold.underline(message)}`);
  },
  plain(message = "") {
    if (quiet) return;
    console.log(message);
  },
  hint(message) {
    if (quiet) return;
    console.log(`  ${chalk.dim(message)}`);
  }
};
function spinner(text) {
  return ora({ text, color: "cyan", isSilent: quiet });
}

// src/core/uiSnapshot.ts
import fs7 from "fs-extra";
import path7 from "path";

// src/core/config.ts
import { z } from "zod";
import path from "path";
import fs from "fs-extra";
var validationSchema = z.object({
  autoDetect: z.boolean().default(true),
  commands: z.record(z.string()).default({})
}).default({ autoDetect: true, commands: {} });
var harnessConfigSchema = z.object({
  projectName: z.string().default(""),
  agentTargets: z.array(z.enum(["codex", "claude-code", "cursor"])).min(1).default(["codex"]),
  mode: z.string().default("universal"),
  installedAdapters: z.array(z.string()).default([]),
  // Opcional: dica de gerenciador. Não assume stack — apenas acelera a
  // detecção quando já é conhecido.
  packageManager: z.enum(["pnpm", "npm", "yarn", "bun"]).optional(),
  validation: validationSchema,
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
  const seed = {
    projectName,
    mode: "universal",
    installedAdapters: [],
    validation: { autoDetect: true, commands: {} }
  };
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

// src/core/profiler.ts
import path5 from "path";
import fs5 from "fs-extra";

// src/core/templates.ts
import path4 from "path";
import fs4 from "fs-extra";

// src/core/file-system.ts
import fs3 from "fs-extra";
import path3 from "path";

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

// src/core/file-system.ts
async function ensureDir(dir) {
  await fs3.ensureDir(dir);
}
async function ensureDirWithKeep(dir) {
  await fs3.ensureDir(dir);
  const keep = path3.join(dir, ".gitkeep");
  if (!await fs3.pathExists(keep)) {
    await fs3.writeFile(keep, "");
  }
}
async function pathExists(target) {
  return fs3.pathExists(target);
}
async function readText(target) {
  return fs3.readFile(target, "utf8");
}
async function writeFileSafe(target, content, force = false) {
  const exists2 = await fs3.pathExists(target);
  if (!exists2) {
    await fs3.ensureDir(path3.dirname(target));
    await fs3.writeFile(target, content);
    return { path: target, action: "created" };
  }
  if (!force) {
    logger.warn(
      `J\xE1 existe: ${path3.basename(target)} \u2014 preservado (use --force para sobrescrever com backup).`
    );
    return { path: target, action: "skipped" };
  }
  const backupPath = `${target}.bak-${backupStamp()}`;
  await fs3.copy(target, backupPath);
  await fs3.writeFile(target, content);
  logger.warn(
    `Sobrescrito: ${path3.basename(target)} (backup em ${path3.basename(backupPath)}).`
  );
  return { path: target, action: "overwritten", backupPath };
}
async function appendText(target, content) {
  await fs3.ensureDir(path3.dirname(target));
  if (!await fs3.pathExists(target)) {
    await fs3.writeFile(target, content);
    return;
  }
  await fs3.appendFile(target, content);
}
async function writeJson(target, data) {
  await fs3.ensureDir(path3.dirname(target));
  await fs3.writeJson(target, data, { spaces: 2 });
}

// src/core/templates.ts
async function readTemplate(relPath) {
  const full = path4.join(getTemplatesDir(), relPath);
  if (!await fs4.pathExists(full)) {
    throw new Error(`Template ausente: ${relPath}`);
  }
  return fs4.readFile(full, "utf8");
}
function renderTemplate(content, vars) {
  return content.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (match, key) => {
    return key in vars ? vars[key] : match;
  });
}
async function materializeTemplate(relPath, target, vars = {}, force = false) {
  const raw = await readTemplate(relPath);
  const content = renderTemplate(raw, vars);
  return writeFileSafe(target, content, force);
}
function toPosix(p) {
  return p.split(path4.sep).join("/");
}
async function listCoreSkillTemplates() {
  const root = path4.join(getTemplatesDir(), "skills");
  if (!await fs4.pathExists(root)) return [];
  const out = [];
  async function walk(dir) {
    const entries = await fs4.readdir(dir, {
      withFileTypes: true
    });
    for (const e of entries) {
      const full = path4.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name === "SKILL.md") {
        out.push(toPosix(path4.relative(getTemplatesDir(), full)));
      }
    }
  }
  await walk(root);
  return out.sort();
}
function skillSubPath(relTemplatePath) {
  return relTemplatePath.replace(/^skills\//, "");
}
async function listAdapters() {
  const root = path4.join(getTemplatesDir(), "adapters");
  if (!await fs4.pathExists(root)) return [];
  const entries = await fs4.readdir(root, {
    withFileTypes: true
  });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}
async function readAdapterManifest(name) {
  const file = path4.join(getTemplatesDir(), "adapters", name, "adapter.json");
  if (!await fs4.pathExists(file)) return null;
  try {
    return await fs4.readJson(file);
  } catch {
    return null;
  }
}
async function listAdapterSkillTemplates(name) {
  const root = path4.join(getTemplatesDir(), "adapters", name, "skills");
  if (!await fs4.pathExists(root)) return [];
  const out = [];
  async function walk(dir) {
    const entries = await fs4.readdir(dir, {
      withFileTypes: true
    });
    for (const e of entries) {
      const full = path4.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name === "SKILL.md") {
        out.push(toPosix(path4.relative(getTemplatesDir(), full)));
      }
    }
  }
  await walk(root);
  return out.sort();
}
var HOOK_FILES = [
  "pre_tool_use_policy.ts",
  "post_tool_use_review.ts",
  "stop_validate_done.ts"
];

// src/core/profiler.ts
async function exists(cwd, rel2) {
  return fs5.pathExists(path5.join(cwd, rel2));
}
async function readJsonSafe(file) {
  try {
    return await fs5.readJson(file);
  } catch {
    return null;
  }
}
async function detectPackageManager(cwd) {
  const pairs = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lockb", "bun"],
    ["package-lock.json", "npm"]
  ];
  for (const [file, pm] of pairs) {
    if (await exists(cwd, file)) return pm;
  }
  return await exists(cwd, "package.json") ? "npm" : null;
}
function nodeRun(pm, script) {
  if (pm === "pnpm") return `pnpm ${script}`;
  if (pm === "yarn") return `yarn ${script}`;
  return `${pm} run ${script}`;
}
async function profileProject(cwd) {
  const risks = [];
  const validationCommands = {};
  const pkg = await exists(cwd, "package.json") ? await readJsonSafe(path5.join(cwd, "package.json")) : null;
  const scripts = pkg?.scripts ?? {};
  const deps = { ...pkg?.dependencies ?? {}, ...pkg?.devDependencies ?? {} };
  let language = "unknown";
  if (pkg) language = await exists(cwd, "tsconfig.json") ? "typescript" : "node";
  else if (await exists(cwd, "pyproject.toml") || await exists(cwd, "requirements.txt"))
    language = "python";
  else if (await exists(cwd, "go.mod")) language = "go";
  else if (await exists(cwd, "Cargo.toml")) language = "rust";
  else if (await exists(cwd, "composer.json")) language = "php";
  else if (await exists(cwd, "pom.xml") || await exists(cwd, "build.gradle") || await exists(cwd, "build.gradle.kts"))
    language = "java";
  const packageManager = pkg ? await detectPackageManager(cwd) : null;
  let framework = null;
  if (deps["next"]) framework = "next";
  else if (deps["nuxt"]) framework = "nuxt";
  else if (deps["@angular/core"]) framework = "angular";
  else if (deps["react"]) framework = "react";
  else if (deps["vue"]) framework = "vue";
  else if (deps["svelte"]) framework = "svelte";
  else if (deps["express"] || deps["fastify"] || deps["@nestjs/core"])
    framework = "node-backend";
  else if (language === "python" && await exists(cwd, "manage.py"))
    framework = "django";
  const hasDocker = await exists(cwd, "Dockerfile") || await exists(cwd, "docker-compose.yml") || await exists(cwd, "compose.yaml");
  const hasCI = await exists(cwd, ".github/workflows") || await exists(cwd, ".gitlab-ci.yml") || await exists(cwd, "azure-pipelines.yml");
  const hasDatabase = await exists(cwd, "migrations") || await exists(cwd, "db/migrations") || await exists(cwd, "prisma") || await exists(cwd, "alembic.ini") || Object.keys(deps).some((d) => /(prisma|knex|typeorm|sequelize|drizzle)/i.test(d));
  const hasFrontend = Boolean(framework && ["next", "nuxt", "angular", "react", "vue", "svelte"].includes(framework)) || await exists(cwd, "index.html") || await exists(cwd, "public/index.html");
  const hasBackend = framework === "node-backend" || framework === "django" || await exists(cwd, "src/server") || Object.keys(deps).some((d) => /(express|fastify|nestjs|koa|hapi)/i.test(d));
  const hasTests = Object.keys(scripts).includes("test") || Object.keys(deps).some(
    (d) => /(vitest|jest|mocha|ava|pytest|playwright|cypress)/i.test(d)
  ) || await exists(cwd, "tests") || await exists(cwd, "test") || await exists(cwd, "__tests__");
  if (pkg && packageManager) {
    for (const k of ["lint", "typecheck", "build", "test"]) {
      if (scripts[k]) validationCommands[k] = nodeRun(packageManager, k);
    }
  } else if (language === "python") {
    if (Object.keys(deps).length === 0) {
    }
    if (await exists(cwd, "pyproject.toml")) {
      validationCommands.test = "pytest -q";
    } else if (await exists(cwd, "pytest.ini")) {
      validationCommands.test = "pytest -q";
    }
  } else if (language === "go") {
    validationCommands.lint = "go vet ./...";
    validationCommands.build = "go build ./...";
    validationCommands.test = "go test ./...";
  } else if (language === "rust") {
    validationCommands.lint = "cargo clippy --quiet";
    validationCommands.build = "cargo build --quiet";
    validationCommands.test = "cargo test --quiet";
  } else if (language === "php" && await exists(cwd, "vendor/bin/phpunit")) {
    validationCommands.test = "vendor/bin/phpunit";
  }
  if (!hasTests) risks.push("Sem testes detectados \u2014 risco de regress\xE3o.");
  if (Object.keys(validationCommands).length === 0)
    risks.push("Nenhum comando de valida\xE7\xE3o detectado \u2014 configure em harness.config.json.");
  if (hasDatabase)
    risks.push("H\xE1 banco/migrations \u2014 cuidado com mudan\xE7as de schema e dados.");
  if (!hasCI) risks.push("Sem CI/CD detectado \u2014 valida\xE7\xE3o depende de execu\xE7\xE3o manual.");
  if (language === "unknown")
    risks.push("Linguagem n\xE3o detectada \u2014 confirme a stack antes de validar.");
  const suggestedAdapters = [];
  for (const name of await listAdapters()) {
    const manifest = await readAdapterManifest(name);
    if (!manifest?.detect) continue;
    let fileHit = "";
    for (const f of manifest.detect.files ?? []) {
      if (await exists(cwd, f)) {
        fileHit = f;
        break;
      }
    }
    const depHit = (manifest.detect.dependencies ?? []).find((d) => deps[d]);
    if (fileHit) {
      suggestedAdapters.push({
        name,
        confidence: "high",
        reason: `arquivo "${fileHit}" presente`
      });
    } else if (depHit) {
      suggestedAdapters.push({
        name,
        confidence: "medium",
        reason: `depend\xEAncia "${depHit}" presente`
      });
    }
  }
  return {
    cwd,
    language,
    packageManager,
    framework,
    scripts,
    hasTests,
    hasDocker,
    hasCI,
    hasDatabase,
    hasFrontend,
    hasBackend,
    validationCommands,
    risks,
    suggestedAdapters
  };
}

// src/core/runStore.ts
import path6 from "path";
import { randomUUID } from "crypto";
import fs6 from "fs-extra";
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
async function readJsonSafe2(file, fallback) {
  try {
    if (!await fs6.pathExists(file)) return fallback;
    return await fs6.readJson(file);
  } catch {
    return fallback;
  }
}
async function createRun(paths, feature, agent) {
  const runId = newRunId();
  const dir = runDir(paths, runId);
  await fs6.ensureDir(dir);
  const record = emptyRun(runId, feature, agent);
  await fs6.writeJson(path6.join(dir, "run.json"), record, { spaces: 2 });
  await fs6.writeFile(path6.join(dir, "events.jsonl"), "");
  await fs6.writeFile(path6.join(dir, "commands.log"), "");
  await fs6.writeJson(path6.join(dir, "changed-files.json"), [], { spaces: 2 });
  await fs6.writeJson(path6.join(dir, "validation.json"), [], { spaces: 2 });
  await fs6.writeFile(
    path6.join(dir, "implementation-report.md"),
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
  await fs6.ensureDir(paths.harnessDir);
  await fs6.writeJson(paths.currentRunFile, pointer, { spaces: 2 });
  return record;
}
async function readCurrentRun(paths) {
  return readJsonSafe2(paths.currentRunFile, null);
}
async function readRun(paths, runId) {
  return readJsonSafe2(
    path6.join(runDir(paths, runId), "run.json"),
    null
  );
}
async function readActiveRun(paths) {
  const pointer = await readCurrentRun(paths);
  if (!pointer?.runId) return null;
  return readRun(paths, pointer.runId);
}
async function updateRun(paths, runId, patch) {
  const file = path6.join(runDir(paths, runId), "run.json");
  const current = await readJsonSafe2(file, null);
  if (!current) return null;
  const next = {
    ...current,
    ...patch,
    validations: { ...current.validations, ...patch.validations ?? {} }
  };
  await fs6.writeJson(file, next, { spaces: 2 });
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
  await fs6.ensureDir(dir);
  await fs6.appendFile(
    path6.join(dir, "events.jsonl"),
    `${JSON.stringify(event)}
`
  );
  const run = await readRun(paths, runId);
  if (run) {
    await updateRun(paths, runId, { eventsCount: run.eventsCount + 1 });
  }
}
async function readEvents(paths, runId, limit) {
  const file = path6.join(runDir(paths, runId), "events.jsonl");
  if (!await fs6.pathExists(file)) return [];
  const raw = await fs6.readFile(file, "utf8");
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
  const file = path6.join(runDir(paths, runId), "commands.log");
  await fs6.ensureDir(path6.dirname(file));
  await fs6.appendFile(file, `${(/* @__PURE__ */ new Date()).toISOString()}	${line}
`);
}
async function addChangedFiles(paths, runId, files) {
  const dir = runDir(paths, runId);
  const file = path6.join(dir, "changed-files.json");
  const current = await readJsonSafe2(file, []);
  const merged = [.../* @__PURE__ */ new Set([...current, ...files.filter(Boolean)])].sort();
  await fs6.writeJson(file, merged, { spaces: 2 });
  await updateRun(paths, runId, { filesChanged: merged });
  return merged;
}
async function writeValidationJson(paths, runId, details) {
  await fs6.writeJson(
    path6.join(runDir(paths, runId), "validation.json"),
    details,
    { spaces: 2 }
  );
}
async function listRuns(paths) {
  if (!await fs6.pathExists(paths.runsDir)) return [];
  const entries = await fs6.readdir(paths.runsDir, {
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
  return path6.join(runDir(paths, runId), "implementation-report.md");
}

// src/core/uiSnapshot.ts
async function countSkills(skillsDir) {
  if (!await fs7.pathExists(skillsDir)) return 0;
  let n = 0;
  async function walk(d) {
    for (const e of await fs7.readdir(d, { withFileTypes: true })) {
      const full = path7.join(d, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name === "SKILL.md") n += 1;
    }
  }
  await walk(skillsDir);
  return n;
}
async function loadSnapshot(cwd) {
  try {
    const { paths, config } = await resolveConfigured(cwd);
    const pointer = await readCurrentRun(paths);
    const active = await readActiveRun(paths);
    const runs = await listRuns(paths);
    const events = active ? await readEvents(paths, active.runId, 12) : [];
    const profile = await profileProject(cwd).catch(() => null);
    const stack = profile ? `${profile.language}${profile.framework ? ` \xB7 ${profile.framework}` : ""}${profile.packageManager ? ` \xB7 ${profile.packageManager}` : ""}` : "n\xE3o detectada";
    const skillCount = await countSkills(paths.skillsDir);
    let reportExcerpt = "";
    try {
      if (await fs7.pathExists(paths.reportsLatest)) {
        reportExcerpt = (await fs7.readFile(paths.reportsLatest, "utf8")).split(/\r?\n/).slice(0, 24).join("\n");
      }
    } catch {
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
        paths.reportsLatest
      ]
    };
  } catch {
    return {
      projectName: "(indispon\xEDvel)",
      cwd,
      stack: "n\xE3o detectada",
      skillCount: 0,
      installedAdapters: [],
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
  withQuietLogger,
  logger,
  spinner,
  resolveProjectPaths,
  rel,
  fileStamp,
  readableStamp,
  backupStamp,
  ensureDir,
  ensureDirWithKeep,
  pathExists,
  readText,
  writeFileSafe,
  appendText,
  writeJson,
  readTemplate,
  renderTemplate,
  materializeTemplate,
  listCoreSkillTemplates,
  skillSubPath,
  listAdapters,
  readAdapterManifest,
  listAdapterSkillTemplates,
  HOOK_FILES,
  defaultConfig,
  parseAgentTargets,
  loadConfig,
  readPackageScripts,
  readPackageName,
  inferProjectName,
  profileProject,
  resolveConfigured,
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
  loadSnapshot,
  elapsedLabel
};
//# sourceMappingURL=chunk-IYJTMBC7.js.map