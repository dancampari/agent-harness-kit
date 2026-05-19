#!/usr/bin/env node
import {
  addChangedFiles,
  appendCommandLog,
  appendEvent,
  backupStamp,
  createRun,
  defaultConfig,
  elapsedLabel,
  fileStamp,
  getTemplatesDir,
  inferProjectName,
  listRuns,
  loadConfig,
  loadSnapshot,
  parseAgentTargets,
  readActiveRun,
  readCurrentRun,
  readEvents,
  readPackageName,
  readPackageScripts,
  readableStamp,
  rel,
  resolveConfigured,
  resolveProjectPaths,
  runReportPath,
  setRunStatus,
  updateRun,
  writeValidationJson
} from "./chunk-6WZQTTLJ.js";

// src/cli.ts
import { Command } from "commander";
import chalk8 from "chalk";

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
function spinner(text2) {
  return ora({ text: text2, color: "cyan", isSilent: quiet });
}

// src/commands/init.ts
import fs3 from "fs-extra";
import path3 from "path";

// src/core/file-system.ts
import fs from "fs-extra";
import path from "path";
async function ensureDir(dir) {
  await fs.ensureDir(dir);
}
async function ensureDirWithKeep(dir) {
  await fs.ensureDir(dir);
  const keep = path.join(dir, ".gitkeep");
  if (!await fs.pathExists(keep)) {
    await fs.writeFile(keep, "");
  }
}
async function pathExists(target) {
  return fs.pathExists(target);
}
async function readText(target) {
  return fs.readFile(target, "utf8");
}
async function writeFileSafe(target, content, force = false) {
  const exists = await fs.pathExists(target);
  if (!exists) {
    await fs.ensureDir(path.dirname(target));
    await fs.writeFile(target, content);
    return { path: target, action: "created" };
  }
  if (!force) {
    logger.warn(
      `J\xE1 existe: ${path.basename(target)} \u2014 preservado (use --force para sobrescrever com backup).`
    );
    return { path: target, action: "skipped" };
  }
  const backupPath = `${target}.bak-${backupStamp()}`;
  await fs.copy(target, backupPath);
  await fs.writeFile(target, content);
  logger.warn(
    `Sobrescrito: ${path.basename(target)} (backup em ${path.basename(backupPath)}).`
  );
  return { path: target, action: "overwritten", backupPath };
}
async function appendText(target, content) {
  await fs.ensureDir(path.dirname(target));
  if (!await fs.pathExists(target)) {
    await fs.writeFile(target, content);
    return;
  }
  await fs.appendFile(target, content);
}
async function writeJson(target, data) {
  await fs.ensureDir(path.dirname(target));
  await fs.writeJson(target, data, { spaces: 2 });
}

// src/core/templates.ts
import path2 from "path";
import fs2 from "fs-extra";
async function readTemplate(relPath) {
  const full = path2.join(getTemplatesDir(), relPath);
  if (!await fs2.pathExists(full)) {
    throw new Error(`Template ausente: ${relPath}`);
  }
  return fs2.readFile(full, "utf8");
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
var SKILL_DIRS = [
  "nextjs-supabase-builder",
  "supabase-rls-reviewer",
  "n8n-evolution-workflow",
  "qa-before-done",
  "multi-tenant-security-reviewer",
  "webhook-idempotency-reviewer"
];
var HOOK_FILES = [
  "pre_tool_use_policy.ts",
  "post_tool_use_review.ts",
  "stop_validate_done.ts"
];

// src/commands/init.ts
async function runInit(options) {
  const cwd = process.cwd();
  const force = Boolean(options.force);
  const paths = resolveProjectPaths(cwd);
  logger.title("harness init");
  logger.info(`Diret\xF3rio: ${cwd}`);
  const pkgName = await readPackageName(paths.packageJson);
  const projectName = inferProjectName(cwd, pkgName);
  const vars = { PROJECT_NAME: projectName };
  const requested = options.agent ? parseAgentTargets(options.agent) : void 0;
  const targets = requested ?? ["codex"];
  logger.info(`Alvos: ${targets.join(", ")}`);
  await ensureDirWithKeep(paths.runsDir);
  await ensureDirWithKeep(paths.reportsDir);
  await ensureDirWithKeep(paths.evalsDir);
  await ensureDirWithKeep(paths.skillsDir);
  if (targets.includes("codex")) await ensureDirWithKeep(paths.codexHooksDir);
  if (targets.includes("claude-code")) {
    await ensureDirWithKeep(paths.claudeSkillsDir);
    await ensureDirWithKeep(paths.claudeHooksDir);
  }
  logger.success("Estrutura de diret\xF3rios garantida.");
  const configExists = await pathExists(paths.configFile);
  if (!configExists || force) {
    if (configExists && force) {
      await fs3.copy(paths.configFile, `${paths.configFile}.bak-${Date.now()}`);
      logger.warn("harness.config.json sobrescrito (backup criado).");
    }
    await writeJson(paths.configFile, defaultConfig(projectName, targets));
    logger.success(`Criado ${rel(cwd, paths.configFile)}`);
  } else if (requested) {
    const current = await loadConfig(paths.configFile);
    if (JSON.stringify([...current.agentTargets].sort()) !== JSON.stringify([...targets].sort())) {
      await writeJson(paths.configFile, { ...current, agentTargets: targets });
      logger.warn(
        `agentTargets atualizado para [${targets.join(", ")}] (resto preservado).`
      );
    } else {
      logger.warn("harness.config.json j\xE1 existe \u2014 preservado.");
    }
  } else {
    logger.warn("harness.config.json j\xE1 existe \u2014 preservado.");
  }
  const docs = [
    ["project-context.md", paths.projectContext],
    ["current-task.md", paths.currentTask],
    ["acceptance-criteria.md", paths.acceptanceCriteria],
    ["qa-checklist.md", paths.qaChecklist],
    ["decisions.md", paths.decisions],
    ["failures.md", paths.failures]
  ];
  for (const [tpl, target] of docs) {
    const r = await materializeTemplate(tpl, target, vars, force);
    if (r.action === "created") logger.success(`Criado ${rel(cwd, target)}`);
  }
  const evals = [
    ["evals/regression-cases.yaml", path3.join(paths.evalsDir, "regression-cases.yaml")],
    ["evals/acceptance-tests.yaml", path3.join(paths.evalsDir, "acceptance-tests.yaml")]
  ];
  for (const [tpl, target] of evals) {
    const r = await materializeTemplate(tpl, target, vars, force);
    if (r.action === "created") logger.success(`Criado ${rel(cwd, target)}`);
  }
  {
    const r = await materializeTemplate("AGENTS.md", paths.agentsFile, vars, force);
    if (r.action === "created") logger.success(`Criado ${rel(cwd, paths.agentsFile)}`);
  }
  for (const skill of SKILL_DIRS) {
    const target = path3.join(paths.skillsDir, skill, "SKILL.md");
    const r = await materializeTemplate(`skills/${skill}/SKILL.md`, target, vars, force);
    if (r.action === "created") logger.success(`Criado ${rel(cwd, target)}`);
  }
  if (targets.includes("codex")) {
    for (const hook of HOOK_FILES) {
      const target = path3.join(paths.codexHooksDir, hook);
      const r2 = await materializeTemplate(`hooks/${hook}`, target, vars, force);
      if (r2.action === "created") logger.success(`Criado ${rel(cwd, target)}`);
    }
    const codexExample = path3.join(paths.codexDir, "hooks.example.json");
    const r = await materializeTemplate(
      "hooks/codex-hooks.example.json",
      codexExample,
      vars,
      force
    );
    if (r.action === "created") logger.success(`Criado ${rel(cwd, codexExample)}`);
  }
  if (targets.includes("claude-code")) {
    const claudeMd = await materializeTemplate(
      "CLAUDE.md",
      paths.claudeFile,
      vars,
      force
    );
    if (claudeMd.action === "created") {
      logger.success(`Criado ${rel(cwd, paths.claudeFile)}`);
    }
    for (const skill of SKILL_DIRS) {
      const target = path3.join(paths.claudeSkillsDir, skill, "SKILL.md");
      const r2 = await materializeTemplate(
        `skills/${skill}/SKILL.md`,
        target,
        vars,
        force
      );
      if (r2.action === "created") logger.success(`Criado ${rel(cwd, target)}`);
    }
    for (const hook of HOOK_FILES) {
      const target = path3.join(paths.claudeHooksDir, hook);
      const r2 = await materializeTemplate(`claude/hooks/${hook}`, target, vars, force);
      if (r2.action === "created") logger.success(`Criado ${rel(cwd, target)}`);
    }
    const settingsExample = path3.join(paths.claudeDir, "settings.example.json");
    const r = await materializeTemplate(
      "claude/settings.example.json",
      settingsExample,
      vars,
      force
    );
    if (r.action === "created") logger.success(`Criado ${rel(cwd, settingsExample)}`);
  }
  logger.title("Pr\xF3ximos passos");
  logger.step("1. Edite .harness/project-context.md com o contexto do projeto.");
  logger.step('2. Defina a tarefa: harness task "descri\xE7\xE3o da tarefa"');
  if (targets.includes("codex")) {
    logger.step("3. Exporte para o Codex:       harness export codex");
  }
  if (targets.includes("claude-code")) {
    logger.step("3. Exporte para o Claude Code: harness export claude-code");
  }
  logger.step("4. Implemente e depois rode:   harness validate");
  logger.step("5. Antes de concluir:          harness done");
  logger.plain();
  logger.hint("Dica: rode `harness doctor` para diagnosticar o projeto.");
}

// src/commands/install.ts
import fs6 from "fs-extra";
import * as p from "@clack/prompts";
import chalk4 from "chalk";

// src/core/projectDetect.ts
import path4 from "path";
import fs4 from "fs-extra";
async function detectPackageManager(cwd) {
  const checks = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lockb", "bun"],
    ["package-lock.json", "npm"]
  ];
  for (const [file, pm] of checks) {
    if (await fs4.pathExists(path4.join(cwd, file))) return pm;
  }
  return "pnpm";
}
function validationCommand(pm, script) {
  if (pm === "pnpm") return `pnpm ${script}`;
  if (pm === "yarn") return `yarn ${script}`;
  return `${pm} run ${script}`;
}
function buildValidation(pm) {
  return {
    lint: validationCommand(pm, "lint"),
    typecheck: validationCommand(pm, "typecheck"),
    build: validationCommand(pm, "build"),
    test: validationCommand(pm, "test")
  };
}
async function detectProject(cwd) {
  const base = resolveProjectPaths(cwd);
  const hasPackageJson = await fs4.pathExists(base.packageJson);
  const pkgName = await readPackageName(base.packageJson);
  const scripts = await readPackageScripts(base.packageJson);
  const existingConfig = await fs4.pathExists(base.configFile) ? await loadConfig(base.configFile).catch(() => null) : null;
  return {
    cwd,
    projectName: existingConfig?.projectName || pkgName || path4.basename(cwd),
    packageManager: existingConfig?.packageManager ?? await detectPackageManager(cwd),
    hasPackageJson,
    scripts,
    alreadyInitialized: existingConfig !== null,
    existingConfig
  };
}
var ALL_TARGETS = [
  { value: "claude-code", label: "Claude Code", hint: "Anthropic \u2014 CLAUDE.md + .claude/", hooks: true },
  { value: "codex", label: "Codex", hint: "OpenAI \u2014 AGENTS.md + .codex/", hooks: true },
  { value: "cursor", label: "Cursor", hint: "AGENTS.md/skills (sem instalador de hooks)", hooks: false }
];

// src/commands/exportCodex.ts
import path5 from "path";
import chalk2 from "chalk";
var CODEX_INSTRUCTION = 'codex "Leia AGENTS.md e .harness/current-task.md. Implemente a tarefa seguindo as skills dispon\xEDveis e s\xF3 considere conclu\xEDdo ap\xF3s cumprir .harness/acceptance-criteria.md."';
async function runExportCodex() {
  const cwd = process.cwd();
  const config = await loadConfig(
    path5.join(cwd, ".harness", "harness.config.json")
  ).catch(() => null);
  if (!config) {
    logger.error("harness.config.json n\xE3o encontrado. Rode `harness init` primeiro.");
    process.exitCode = 1;
    return;
  }
  const paths = resolveProjectPaths(
    cwd,
    config.paths.harness,
    config.paths.skills,
    config.paths.codexHooks
  );
  const vars = { PROJECT_NAME: config.projectName };
  logger.title("harness export codex");
  if (await pathExists(paths.agentsFile)) {
    logger.info("AGENTS.md j\xE1 existe \u2014 mantido (n\xE3o duplicado).");
  } else {
    await materializeTemplate("AGENTS.md", paths.agentsFile, vars, false);
    logger.success(`Criado ${rel(cwd, paths.agentsFile)}`);
  }
  let createdSkills = 0;
  for (const skill of SKILL_DIRS) {
    const target = path5.join(paths.skillsDir, skill, "SKILL.md");
    if (await pathExists(target)) continue;
    await materializeTemplate(`skills/${skill}/SKILL.md`, target, vars, false);
    createdSkills += 1;
  }
  logger.success(
    createdSkills === 0 ? `Skills j\xE1 presentes em ${rel(cwd, paths.skillsDir)}` : `${createdSkills} skill(s) criada(s) em ${rel(cwd, paths.skillsDir)}`
  );
  let createdHooks = 0;
  for (const hook of HOOK_FILES) {
    const target = path5.join(paths.codexHooksDir, hook);
    if (await pathExists(target)) continue;
    await materializeTemplate(`hooks/${hook}`, target, vars, false);
    createdHooks += 1;
  }
  const hooksExample = path5.join(paths.codexDir, "hooks.example.json");
  if (!await pathExists(hooksExample)) {
    await materializeTemplate(
      "hooks/codex-hooks.example.json",
      hooksExample,
      vars,
      false
    );
    createdHooks += 1;
  }
  logger.success(
    createdHooks === 0 ? `Hooks j\xE1 presentes em ${rel(cwd, paths.codexHooksDir)}` : `${createdHooks} arquivo(s) de hook criado(s) em ${rel(cwd, paths.codexHooksDir)}`
  );
  logger.title("Agora execute:");
  logger.plain(chalk2.greenBright(CODEX_INSTRUCTION));
  logger.plain();
  logger.hint(
    "Os hooks em .codex/ s\xE3o exemplos. Configure-os manualmente no Codex (veja .codex/hooks.example.json). A CLI n\xE3o altera sua m\xE1quina globalmente."
  );
}

// src/commands/exportClaude.ts
import path6 from "path";
import chalk3 from "chalk";
var CLAUDE_INSTRUCTION = 'claude "Leia CLAUDE.md e .harness/current-task.md. Implemente a tarefa seguindo as skills em .claude/skills/ e s\xF3 considere conclu\xEDdo ap\xF3s cumprir .harness/acceptance-criteria.md e rodar harness validate."';
async function runExportClaude() {
  const cwd = process.cwd();
  const config = await loadConfig(
    path6.join(cwd, ".harness", "harness.config.json")
  ).catch(() => null);
  if (!config) {
    logger.error("harness.config.json n\xE3o encontrado. Rode `harness init` primeiro.");
    process.exitCode = 1;
    return;
  }
  const paths = resolveProjectPaths(
    cwd,
    config.paths.harness,
    config.paths.skills,
    config.paths.codexHooks,
    config.paths.claudeSkills,
    config.paths.claudeHooks
  );
  const vars = { PROJECT_NAME: config.projectName };
  logger.title("harness export claude-code");
  if (!await pathExists(paths.agentsFile)) {
    await materializeTemplate("AGENTS.md", paths.agentsFile, vars, false);
    logger.success(`Criado ${rel(cwd, paths.agentsFile)} (fonte can\xF4nica)`);
  }
  if (await pathExists(paths.claudeFile)) {
    logger.info("CLAUDE.md j\xE1 existe \u2014 mantido (n\xE3o duplicado).");
  } else {
    await materializeTemplate("CLAUDE.md", paths.claudeFile, vars, false);
    logger.success(`Criado ${rel(cwd, paths.claudeFile)}`);
  }
  let createdSkills = 0;
  for (const skill of SKILL_DIRS) {
    const target = path6.join(paths.claudeSkillsDir, skill, "SKILL.md");
    if (await pathExists(target)) continue;
    await materializeTemplate(`skills/${skill}/SKILL.md`, target, vars, false);
    createdSkills += 1;
  }
  logger.success(
    createdSkills === 0 ? `Skills j\xE1 presentes em ${rel(cwd, paths.claudeSkillsDir)}` : `${createdSkills} skill(s) criada(s) em ${rel(cwd, paths.claudeSkillsDir)}`
  );
  let createdHooks = 0;
  for (const hook of HOOK_FILES) {
    const target = path6.join(paths.claudeHooksDir, hook);
    if (await pathExists(target)) continue;
    await materializeTemplate(`claude/hooks/${hook}`, target, vars, false);
    createdHooks += 1;
  }
  const settingsExample = path6.join(paths.claudeDir, "settings.example.json");
  if (!await pathExists(settingsExample)) {
    await materializeTemplate(
      "claude/settings.example.json",
      settingsExample,
      vars,
      false
    );
    createdHooks += 1;
  }
  logger.success(
    createdHooks === 0 ? `Hooks j\xE1 presentes em ${rel(cwd, paths.claudeHooksDir)}` : `${createdHooks} arquivo(s) de hook criado(s) em ${rel(cwd, paths.claudeHooksDir)}`
  );
  logger.title("Agora execute:");
  logger.plain(chalk3.greenBright(CLAUDE_INSTRUCTION));
  logger.plain();
  logger.hint(
    "Para ativar os hooks: copie .claude/settings.example.json para .claude/settings.json e revise. A CLI n\xE3o altera sua m\xE1quina globalmente."
  );
}

// src/commands/hooksInstall.ts
import path7 from "path";
import fs5 from "fs-extra";
var CODEX_WRAPPERS = [
  { file: "harness-post-tool.mjs", subcommand: "hook post-tool" },
  { file: "harness-stop.mjs", subcommand: "hook stop" },
  { file: "harness-prompt-submit.mjs", subcommand: "hook prompt-submit" }
];
var CLAUDE_WRAPPERS = [
  { file: "harness-post-tool.mjs", subcommand: "hook post-tool" },
  { file: "harness-stop.mjs", subcommand: "hook stop" },
  { file: "harness-task-completed.mjs", subcommand: "hook task-completed" }
];
async function resolvePaths(cwd) {
  const config = await loadConfig(
    resolveProjectPaths(cwd).configFile
  ).catch(() => null);
  return config ? resolveProjectPaths(
    cwd,
    config.paths.harness,
    config.paths.skills,
    config.paths.codexHooks,
    config.paths.claudeSkills,
    config.paths.claudeHooks
  ) : resolveProjectPaths(cwd);
}
async function materializeWrappers(cwd, hooksDir, agent, specs, force) {
  const template = await readTemplate("integrations/hook-wrapper.mjs");
  const commandByFile = {};
  await fs5.ensureDir(hooksDir);
  for (const spec of specs) {
    const content = renderTemplate(template, {
      SUBCOMMAND: spec.subcommand,
      AGENT: agent
    });
    const target = path7.join(hooksDir, spec.file);
    const result = await writeFileSafe(target, content, force);
    if (result.action === "created") {
      logger.success(`Criado ${rel(cwd, target)}`);
    }
    commandByFile[spec.file] = `node "${rel(cwd, target)}"`;
  }
  return commandByFile;
}
async function backupIfExists(file) {
  if (!await fs5.pathExists(file)) return null;
  const backup = `${file}.bak-${backupStamp()}`;
  await fs5.copy(file, backup);
  return backup;
}
function commandAlreadyWired(list, command) {
  return list.some(
    (group) => Array.isArray(group?.hooks) ? group.hooks.some((h) => h?.command === command) : false
  );
}
function ensureGroup(config, event, command, matcher) {
  const hooks = config.hooks ??= {};
  const list = hooks[event] ??= [];
  if (commandAlreadyWired(list, command)) return false;
  list.push({ matcher, hooks: [{ type: "command", command }] });
  return true;
}
async function runHooksInstallCodex(options) {
  const cwd = process.cwd();
  const force = Boolean(options.force);
  const paths = await resolvePaths(cwd);
  logger.title("harness hooks install codex");
  const commands = await materializeWrappers(
    cwd,
    paths.codexHooksDir,
    "codex",
    CODEX_WRAPPERS,
    force
  );
  const backup = await backupIfExists(paths.codexHooksConfig);
  if (backup) logger.warn(`Backup: ${rel(cwd, backup)}`);
  let json = {};
  if (await fs5.pathExists(paths.codexHooksConfig)) {
    json = await fs5.readJson(paths.codexHooksConfig).catch(() => ({}));
  }
  let added = 0;
  if (ensureGroup(json, "PostToolUse", commands["harness-post-tool.mjs"], "*"))
    added += 1;
  if (ensureGroup(json, "Stop", commands["harness-stop.mjs"], "*")) added += 1;
  if (ensureGroup(
    json,
    "UserPromptSubmit",
    commands["harness-prompt-submit.mjs"],
    "*"
  ))
    added += 1;
  await fs5.ensureDir(path7.dirname(paths.codexHooksConfig));
  await fs5.writeJson(paths.codexHooksConfig, json, { spaces: 2 });
  logger.success(
    `${rel(cwd, paths.codexHooksConfig)} atualizado (${added} hook(s) novo(s), existentes preservados).`
  );
  logger.title("Pr\xF3ximos passos (Codex)");
  logger.step("Revise .codex/hooks.json e ajuste ao schema da sua vers\xE3o do Codex.");
  logger.step(
    "Se o Codex pedir, marque os hooks como confi\xE1veis (trust) antes de usar."
  );
  logger.step('Inicie a feature: harness feature start "<nome>"');
  logger.hint("Os hooks s\xF3 registram/validam; nunca abrem UI (use `harness ui`).");
}
async function runHooksInstallClaude(options) {
  const cwd = process.cwd();
  const force = Boolean(options.force);
  const paths = await resolvePaths(cwd);
  logger.title("harness hooks install claude");
  const commands = await materializeWrappers(
    cwd,
    paths.claudeHooksDir,
    "claude",
    CLAUDE_WRAPPERS,
    force
  );
  const backup = await backupIfExists(paths.claudeSettings);
  if (backup) logger.warn(`Backup: ${rel(cwd, backup)}`);
  let settings = {};
  if (await fs5.pathExists(paths.claudeSettings)) {
    settings = await fs5.readJson(paths.claudeSettings).catch(() => ({}));
  }
  let added = 0;
  if (ensureGroup(settings, "PostToolUse", commands["harness-post-tool.mjs"], "*"))
    added += 1;
  if (ensureGroup(settings, "Stop", commands["harness-stop.mjs"], "")) added += 1;
  if (ensureGroup(
    settings,
    "TaskCompleted",
    commands["harness-task-completed.mjs"],
    ""
  ))
    added += 1;
  await fs5.ensureDir(path7.dirname(paths.claudeSettings));
  await fs5.writeJson(paths.claudeSettings, settings, { spaces: 2 });
  logger.success(
    `${rel(cwd, paths.claudeSettings)} atualizado (${added} hook(s) novo(s), config existente preservada).`
  );
  logger.title("Pr\xF3ximos passos (Claude Code)");
  logger.step("Revise .claude/settings.json (pode usar settings.local.json se preferir).");
  logger.step(
    "TaskCompleted n\xE3o \xE9 nativo no Claude Code atual \u2014 o bloqueio real ocorre em Stop."
  );
  logger.step('Inicie a feature: harness feature start "<nome>"');
  logger.hint("Os hooks s\xF3 registram/validam; a UI \xE9 separada (`harness ui`).");
}

// src/commands/install.ts
var PM_VALUES = ["pnpm", "npm", "yarn", "bun"];
function cancelAndExit() {
  p.cancel("Instala\xE7\xE3o cancelada. Nada foi alterado.");
  process.exit(0);
}
function supportsHooks(targets) {
  return targets.some((t) => t === "codex" || t === "claude-code");
}
async function planNonInteractive(cwd, options) {
  const info = await detectProject(cwd);
  const targets = options.agent ? parseAgentTargets(options.agent) : info.existingConfig?.agentTargets ?? ["codex"];
  const pm = options.pm && PM_VALUES.includes(options.pm) ? options.pm : info.packageManager;
  return {
    projectName: info.projectName,
    packageManager: pm,
    targets,
    validation: info.existingConfig?.validation ?? buildValidation(pm),
    installHooks: options.hooks !== false && supportsHooks(targets),
    force: Boolean(options.force)
  };
}
async function planInteractive(cwd, options) {
  const info = await detectProject(cwd);
  p.intro(chalk4.bgCyan(chalk4.black(" agent-harness-kit \xB7 install ")));
  p.note(
    [
      `Projeto      : ${chalk4.bold(info.projectName)}`,
      `Diret\xF3rio    : ${cwd}`,
      `package.json : ${info.hasPackageJson ? "encontrado" : chalk4.yellow("ausente")}`,
      `Gerenciador  : ${info.packageManager} (detectado)`,
      info.alreadyInitialized ? chalk4.yellow("J\xE1 inicializado \u2014 arquivos existentes ser\xE3o preservados.") : "Projeto novo para o harness."
    ].join("\n"),
    "Diagn\xF3stico"
  );
  const projectName = await p.text({
    message: "Nome do projeto",
    initialValue: info.projectName,
    validate: (v) => v.trim() ? void 0 : "Informe um nome."
  });
  if (p.isCancel(projectName)) cancelAndExit();
  const targetsAnswer = await p.multiselect({
    message: "Qual(is) CLI/agente voc\xEA usa neste projeto?",
    options: ALL_TARGETS.map((t) => ({
      value: t.value,
      label: t.label,
      hint: t.hint
    })),
    initialValues: info.existingConfig?.agentTargets ?? ["claude-code"],
    required: true
  });
  if (p.isCancel(targetsAnswer)) cancelAndExit();
  const targets = targetsAnswer;
  const pmAnswer = await p.select({
    message: "Gerenciador de pacotes (para os comandos de valida\xE7\xE3o)",
    options: PM_VALUES.map((v) => ({ value: v, label: v })),
    initialValue: info.packageManager
  });
  if (p.isCancel(pmAnswer)) cancelAndExit();
  const packageManager = pmAnswer;
  const defaults = buildValidation(packageManager);
  const useDefaults = await p.confirm({
    message: `Usar comandos de valida\xE7\xE3o padr\xE3o do ${packageManager}? (ex.: "${defaults.lint}")`,
    initialValue: true
  });
  if (p.isCancel(useDefaults)) cancelAndExit();
  let validation = { ...defaults };
  if (!useDefaults) {
    const custom = {};
    for (const key of ["lint", "typecheck", "build", "test"]) {
      const ans = await p.text({
        message: `Comando para "${key}" (vazio = n\xE3o usar)`,
        initialValue: defaults[key]
      });
      if (p.isCancel(ans)) cancelAndExit();
      const value = String(ans).trim();
      if (value) custom[key] = value;
    }
    validation = custom;
  }
  let installHooks = false;
  if (supportsHooks(targets)) {
    const hooksAnswer = await p.confirm({
      message: "Instalar os hooks de integra\xE7\xE3o agora (registro + valida\xE7\xE3o + bloqueio)?",
      initialValue: options.hooks !== false
    });
    if (p.isCancel(hooksAnswer)) cancelAndExit();
    installHooks = hooksAnswer === true;
  }
  let force = Boolean(options.force);
  if (info.alreadyInitialized && !force) {
    const fAnswer = await p.confirm({
      message: "Sobrescrever arquivos existentes (com backup .bak)? N\xE3o = preservar.",
      initialValue: false
    });
    if (p.isCancel(fAnswer)) cancelAndExit();
    force = fAnswer === true;
  }
  const plan = {
    projectName: String(projectName).trim(),
    packageManager,
    targets,
    validation,
    installHooks,
    force
  };
  const labels = targets.map((t) => ALL_TARGETS.find((x) => x.value === t)?.label ?? t).join(", ");
  p.note(
    [
      `Projeto      : ${plan.projectName}`,
      `Agentes      : ${labels}`,
      `Gerenciador  : ${plan.packageManager}`,
      `Valida\xE7\xF5es   : ${Object.entries(plan.validation).map(([k, v]) => `${k}="${v}"`).join("  ")}`,
      `Hooks        : ${plan.installHooks ? "instalar" : "n\xE3o"}`,
      `Arquivos     : ${plan.force ? "sobrescrever (backup)" : "preservar existentes"}`
    ].join("\n"),
    "Resumo da instala\xE7\xE3o"
  );
  const go = await p.confirm({
    message: "Aplicar esta configura\xE7\xE3o?",
    initialValue: true
  });
  if (p.isCancel(go) || go !== true) cancelAndExit();
  return plan;
}
async function applyPlan(cwd, plan) {
  const created = [];
  const s = p.spinner();
  s.start("Criando estrutura do harness\u2026");
  await withQuietLogger(
    () => runInit({ force: plan.force, agent: plan.targets.join(",") })
  );
  created.push(".harness/, AGENTS.md, .agents/skills/");
  s.stop("Estrutura do harness criada");
  s.start("Aplicando configura\xE7\xE3o (projeto, gerenciador, valida\xE7\xF5es)\u2026");
  const paths = resolveProjectPaths(cwd);
  const config = await loadConfig(paths.configFile);
  config.projectName = plan.projectName;
  config.packageManager = plan.packageManager;
  config.validation = plan.validation;
  config.agentTargets = plan.targets;
  await fs6.writeJson(paths.configFile, config, { spaces: 2 });
  s.stop("harness.config.json configurado");
  if (plan.targets.includes("codex")) {
    s.start("Exportando para o Codex\u2026");
    await withQuietLogger(() => runExportCodex());
    created.push("AGENTS.md + .codex/ (Codex)");
    s.stop("Codex preparado");
  }
  if (plan.targets.includes("claude-code")) {
    s.start("Exportando para o Claude Code\u2026");
    await withQuietLogger(() => runExportClaude());
    created.push("CLAUDE.md + .claude/ (Claude Code)");
    s.stop("Claude Code preparado");
  }
  if (plan.targets.includes("cursor")) {
    created.push("AGENTS.md + .agents/skills/ (Cursor \u2014 sem hooks)");
  }
  if (plan.installHooks) {
    if (plan.targets.includes("codex")) {
      s.start("Instalando hooks do Codex\u2026");
      await withQuietLogger(
        () => runHooksInstallCodex({ force: plan.force })
      );
      created.push(".codex/hooks.json + wrappers");
      s.stop("Hooks do Codex instalados");
    }
    if (plan.targets.includes("claude-code")) {
      s.start("Instalando hooks do Claude Code\u2026");
      await withQuietLogger(
        () => runHooksInstallClaude({ force: plan.force })
      );
      created.push(".claude/settings.json + wrappers");
      s.stop("Hooks do Claude Code instalados");
    }
  }
  return created;
}
async function runInstall(options) {
  const cwd = process.cwd();
  const interactive = Boolean(process.stdout.isTTY) && Boolean(process.stdin.isTTY) && !options.yes;
  if (!interactive) {
    if (!options.yes && !options.agent && !process.stdin.isTTY) {
      logger.error(
        "Sem terminal interativo. Rode num terminal real ou use:\n  harness install --yes --agent claude-code [--pm npm] [--force]"
      );
      process.exitCode = 1;
      return;
    }
    const plan2 = await planNonInteractive(cwd, options);
    logger.title("harness install (n\xE3o-interativo)");
    logger.info(`Agentes: ${plan2.targets.join(", ")}`);
    logger.info(`Gerenciador: ${plan2.packageManager}`);
    logger.info(`Hooks: ${plan2.installHooks ? "sim" : "n\xE3o"}`);
    const created2 = await applyPlan(cwd, plan2);
    logger.success("Instala\xE7\xE3o conclu\xEDda.");
    for (const c of created2) logger.step(c);
    logger.plain();
    logger.step('Pr\xF3ximo: harness feature start "<nome>" --agent <agente>');
    logger.step("Acompanhe:  harness ui");
    return;
  }
  const plan = await planInteractive(cwd, options);
  const created = await applyPlan(cwd, plan);
  p.note(created.map((c) => `\u2714 ${c}`).join("\n"), "Instalado");
  const agentForRun = plan.targets.includes("claude-code") ? "claude" : plan.targets.includes("codex") ? "codex" : "manual";
  p.outro(
    chalk4.green("Pronto! ") + `Comece com:  ${chalk4.cyan(
      `harness feature start "<nome>" --agent ${agentForRun}`
    )}  e acompanhe com  ${chalk4.cyan("harness ui")}.`
  );
}

// src/commands/task.ts
import path8 from "path";
import fs7 from "fs-extra";
function slugify(input) {
  const deaccented = input.normalize("NFD").replace(new RegExp("\\p{Diacritic}", "gu"), "");
  return deaccented.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50);
}
function currentTaskDoc(description) {
  return `# Tarefa Atual

> Atualizado em ${readableStamp()}

## Objetivo

${description}

## Contexto

- (Preencha: por que esta tarefa existe, de onde veio a demanda)

## Escopo

- (O que ENTRA nesta tarefa)

## Fora de escopo

- (O que N\xC3O deve ser feito agora)

## Arquivos prov\xE1veis

- (Liste arquivos/m\xF3dulos que provavelmente ser\xE3o tocados)

## Riscos

- (Liste riscos t\xE9cnicos, de dados, de multi-tenant, de seguran\xE7a)

## Crit\xE9rios de aceite

Ver e marcar em \`.harness/acceptance-criteria.md\`.

## Comandos de valida\xE7\xE3o

- lint / typecheck / build / test conforme \`.harness/harness.config.json\`

## Defini\xE7\xE3o de pronto

A tarefa s\xF3 est\xE1 pronta quando todos os crit\xE9rios de aceite estiverem
marcados e \`harness done\` passar sem falhas.

## Instru\xE7\xE3o para o Codex

Leia \`AGENTS.md\` e \`.harness/current-task.md\`. Implemente a tarefa
seguindo as skills em \`.agents/skills/\`, em passos pequenos, e s\xF3
considere conclu\xEDdo ap\xF3s cumprir \`.harness/acceptance-criteria.md\` e
rodar as valida\xE7\xF5es.
`;
}
function acceptanceDoc(description) {
  return `# Crit\xE9rios de Aceite

> Tarefa: ${description}
> Atualizado em ${readableStamp()}

Marque \`[x]\` somente quando o crit\xE9rio estiver realmente cumprido e verificado.

- [ ] A funcionalidade descrita no objetivo est\xE1 implementada
- [ ] O comportamento foi validado manualmente ou por teste
- [ ] Nenhuma funcionalidade existente foi quebrada
- [ ] Lint executado ou justificado
- [ ] Typecheck executado ou justificado
- [ ] Build executado ou justificado
- [ ] Testes executados ou justificados
- [ ] Isolamento multi-tenant preservado (se aplic\xE1vel)
- [ ] RLS/seguran\xE7a Supabase preservados (se aplic\xE1vel)
- [ ] Webhooks/integra\xE7\xF5es com idempot\xEAncia (se aplic\xE1vel)
- [ ] Decis\xF5es relevantes registradas em \`.harness/decisions.md\`
- [ ] Sem segredos hardcoded e sem TODOs cr\xEDticos pendentes
`;
}
function runDoc(description) {
  return `# Run \u2014 ${readableStamp()}

## Tarefa registrada

${description}

## Estado inicial

- Crit\xE9rios de aceite gerados em \`.harness/acceptance-criteria.md\`
- current-task.md atualizado

## Notas durante a execu\xE7\xE3o

- (O agente/dev registra aqui o progresso e decis\xF5es)

## Resultado

- (Preenchido ao concluir / via \`harness report\`)
`;
}
async function runTask(description) {
  const cwd = process.cwd();
  const trimmed = description.trim();
  if (!trimmed) {
    logger.error('Descri\xE7\xE3o da tarefa vazia. Uso: harness task "descri\xE7\xE3o da tarefa"');
    process.exitCode = 1;
    return;
  }
  const config = await loadConfig(
    path8.join(cwd, ".harness", "harness.config.json")
  ).catch(() => null);
  const paths = resolveProjectPaths(
    cwd,
    config?.paths.harness,
    config?.paths.skills,
    config?.paths.codexHooks
  );
  if (!await pathExists(paths.harnessDir)) {
    logger.error("Estrutura .harness/ n\xE3o encontrada. Rode `harness init` primeiro.");
    process.exitCode = 1;
    return;
  }
  logger.title("harness task");
  await writeFileSafe(paths.currentTask, currentTaskDoc(trimmed), true);
  logger.success(`Atualizado ${rel(cwd, paths.currentTask)}`);
  await writeFileSafe(paths.acceptanceCriteria, acceptanceDoc(trimmed), true);
  logger.success(`Crit\xE9rios de aceite iniciais em ${rel(cwd, paths.acceptanceCriteria)}`);
  await ensureDir(paths.runsDir);
  const runFile = path8.join(
    paths.runsDir,
    `${fileStamp()}-task-${slugify(trimmed) || "task"}.md`
  );
  await fs7.writeFile(runFile, runDoc(trimmed));
  logger.success(`Run registrada em ${rel(cwd, runFile)}`);
  logger.title("Pr\xF3ximos passos");
  logger.step("Revise e detalhe .harness/current-task.md (contexto, escopo, riscos).");
  logger.step("Ajuste .harness/acceptance-criteria.md conforme a tarefa.");
  logger.step("Depois rode: harness export codex");
}

// src/commands/validate.ts
import path10 from "path";

// src/core/validators.ts
import path9 from "path";
import fs8 from "fs-extra";

// src/core/command-runner.ts
import { execa } from "execa";
async function runCommand(command, cwd) {
  const start = Date.now();
  try {
    const result = await execa(command, {
      cwd,
      shell: true,
      reject: false,
      all: false,
      windowsHide: true
    });
    return {
      command,
      exitCode: result.exitCode ?? null,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      durationMs: Date.now() - start,
      failed: (result.exitCode ?? 1) !== 0
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      command,
      exitCode: null,
      stdout: "",
      stderr: message,
      durationMs: Date.now() - start,
      failed: true
    };
  }
}
async function isToolAvailable(tool) {
  const probe = process.platform === "win32" ? "--version" : "--version";
  try {
    const result = await execa(tool, [probe], {
      reject: false,
      windowsHide: true,
      shell: true
    });
    return (result.exitCode ?? 1) === 0;
  } catch {
    return false;
  }
}

// src/core/validators.ts
var VALIDATION_ORDER = ["lint", "typecheck", "build", "test"];
async function runValidation(config, paths, reportFileName = "latest-validation.md") {
  const scripts = await readPackageScripts(paths.packageJson);
  const steps = [];
  const keys = [
    ...VALIDATION_ORDER.filter((k) => config.validation[k]),
    ...Object.keys(config.validation).filter(
      (k) => !VALIDATION_ORDER.includes(k)
    )
  ];
  for (const key of keys) {
    const command = config.validation[key];
    if (!command) continue;
    const hasScript = Object.prototype.hasOwnProperty.call(scripts, key);
    if (!hasScript) {
      logger.warn(`"${key}" pulado: script "${key}" n\xE3o existe no package.json.`);
      steps.push({
        name: key,
        command,
        status: "skipped",
        exitCode: null,
        durationMs: 0,
        skippedReason: `script "${key}" ausente no package.json`
      });
      continue;
    }
    const spin = spinner(`Validando: ${key} (${command})`).start();
    const result = await runCommand(command, paths.cwd);
    if (result.failed) {
      spin.fail(`${key} falhou (exit ${result.exitCode ?? "?"})`);
    } else {
      spin.succeed(`${key} ok`);
    }
    steps.push({
      name: key,
      command,
      status: result.failed ? "failed" : "passed",
      exitCode: result.exitCode,
      durationMs: result.durationMs
    });
  }
  const passed = steps.every((s) => s.status !== "failed");
  const reportPath = path9.join(paths.reportsDir, reportFileName);
  await writeValidationReport(reportPath, config, steps, passed);
  return { steps, passed, reportPath };
}
async function writeValidationReport(reportPath, config, steps, passed) {
  const rows = steps.map((s) => {
    const icon = s.status === "passed" ? "\u2705" : s.status === "failed" ? "\u274C" : "\u23ED\uFE0F";
    const extra = s.status === "skipped" ? s.skippedReason ?? "pulado" : `exit ${s.exitCode ?? "?"} \xB7 ${s.durationMs}ms`;
    return `| ${icon} ${s.name} | \`${s.command}\` | ${s.status} | ${extra} |`;
  }).join("\n");
  const content = `# Relat\xF3rio de Valida\xE7\xE3o

- Projeto: ${config.projectName || "(sem nome)"}
- Gerado em: ${readableStamp()}
- Resultado geral: ${passed ? "\u2705 PASSOU" : "\u274C FALHOU"}

| Etapa | Comando | Status | Detalhe |
|---|---|---|---|
${rows || "| (nenhuma etapa configurada) | - | - | - |"}

> Gerado por agent-harness-kit. N\xE3o substitui revis\xE3o humana nem a defini\xE7\xE3o de pronto em AGENTS.md.
`;
  await writeFileSafe(reportPath, content, true);
}
async function readAcceptanceStatus(acceptancePath) {
  if (!await pathExists(acceptancePath)) {
    return { exists: false, total: 0, checked: 0, unchecked: 0, allChecked: false };
  }
  const text2 = await readText(acceptancePath);
  const checked = (text2.match(/^\s*[-*]\s*\[[xX]\]/gm) ?? []).length;
  const unchecked = (text2.match(/^\s*[-*]\s*\[ \]/gm) ?? []).length;
  const total = checked + unchecked;
  return {
    exists: true,
    total,
    checked,
    unchecked,
    allChecked: total > 0 && unchecked === 0
  };
}
var SCAN_EXTENSIONS = /* @__PURE__ */ new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".vue",
  ".svelte",
  ".py",
  ".go"
]);
var SCAN_IGNORE = /* @__PURE__ */ new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo",
  ".harness",
  ".agents",
  ".codex"
]);
async function scanCriticalTodos(cwd, maxFiles = 2e3) {
  const pattern = /\b(TODO|FIXME|XXX|HACK)\b/;
  const files = [];
  let count = 0;
  let visited = 0;
  async function walk(dir) {
    if (visited >= maxFiles) return;
    let entries;
    try {
      entries = await fs8.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path9.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SCAN_IGNORE.has(entry.name)) continue;
        await walk(full);
      } else if (SCAN_EXTENSIONS.has(path9.extname(entry.name))) {
        visited += 1;
        if (visited >= maxFiles) return;
        try {
          const text2 = await fs8.readFile(full, "utf8");
          const matches = text2.match(new RegExp(pattern, "g"));
          if (matches) {
            count += matches.length;
            files.push(path9.relative(cwd, full).split(path9.sep).join("/"));
          }
        } catch {
        }
      }
    }
  }
  await walk(cwd);
  return { count, files: files.slice(0, 20) };
}
function timestampedReportName(prefix) {
  return `${prefix}-${fileStamp()}.md`;
}

// src/commands/validate.ts
async function runValidate() {
  const cwd = process.cwd();
  const config = await loadConfig(
    path10.join(cwd, ".harness", "harness.config.json")
  );
  const paths = resolveProjectPaths(
    cwd,
    config.paths.harness,
    config.paths.skills,
    config.paths.codexHooks
  );
  logger.title("harness validate");
  await ensureDir(paths.reportsDir);
  const result = await runValidation(config, paths, "latest-validation.md");
  logger.plain();
  for (const step of result.steps) {
    const icon = step.status === "passed" ? "\u2705" : step.status === "failed" ? "\u274C" : "\u23ED\uFE0F";
    logger.plain(`  ${icon} ${step.name} \u2014 ${step.status}`);
  }
  logger.plain();
  logger.info(`Relat\xF3rio: ${rel(cwd, result.reportPath)}`);
  if (result.passed) {
    logger.success("Todas as valida\xE7\xF5es passaram.");
    process.exitCode = 0;
  } else {
    logger.error("Valida\xE7\xE3o falhou. N\xE3o declare a tarefa como conclu\xEDda.");
    process.exitCode = 1;
  }
}

// src/commands/done.ts
import path11 from "path";
async function runDone() {
  const cwd = process.cwd();
  const config = await loadConfig(
    path11.join(cwd, ".harness", "harness.config.json")
  );
  const paths = resolveProjectPaths(
    cwd,
    config.paths.harness,
    config.paths.skills,
    config.paths.codexHooks
  );
  logger.title("harness done");
  await ensureDir(paths.reportsDir);
  const blockers = [];
  if (!await pathExists(paths.currentTask)) {
    blockers.push({
      label: "current-task.md ausente",
      detail: 'Defina a tarefa com `harness task "..."`.'
    });
  }
  const acceptance = await readAcceptanceStatus(paths.acceptanceCriteria);
  if (!acceptance.exists) {
    blockers.push({
      label: "acceptance-criteria.md ausente",
      detail: "Crit\xE9rios de aceite n\xE3o foram definidos."
    });
  } else if (!acceptance.allChecked) {
    blockers.push({
      label: "Crit\xE9rios de aceite n\xE3o cumpridos",
      detail: `${acceptance.unchecked} de ${acceptance.total} crit\xE9rio(s) sem marcar.`
    });
  }
  logger.step("Rodando valida\xE7\xF5es (harness validate)...");
  const validation = await runValidation(config, paths, "latest-validation.md");
  for (const step of validation.steps) {
    if (step.status === "failed") {
      blockers.push({
        label: `Valida\xE7\xE3o falhou: ${step.name}`,
        detail: `\`${step.command}\` (exit ${step.exitCode ?? "?"})`
      });
    }
  }
  const todos = await scanCriticalTodos(cwd);
  if (todos.count > 0) {
    blockers.push({
      label: "TODOs/FIXMEs cr\xEDticos no c\xF3digo",
      detail: `${todos.count} marcador(es) em: ${todos.files.join(", ") || "v\xE1rios arquivos"}`
    });
  }
  const passed = blockers.length === 0;
  const reportPath = path11.join(paths.reportsDir, "done-report.md");
  await writeDoneReport(reportPath, config.projectName, passed, blockers, {
    acceptance: acceptance.exists ? `${acceptance.checked}/${acceptance.total} marcados` : "ausente",
    validation: validation.passed ? "passou" : "falhou",
    todos: todos.count
  });
  logger.plain();
  if (passed) {
    logger.success("Crit\xE9rios de pronto satisfeitos. Tarefa pode ser conclu\xEDda.");
    logger.info(`Relat\xF3rio: ${rel(cwd, reportPath)}`);
    process.exitCode = 0;
    return;
  }
  logger.error("N\xC3O declare vit\xF3ria. Pend\xEAncias cr\xEDticas encontradas:");
  for (const b of blockers) {
    logger.plain(`  \u274C ${b.label} \u2014 ${b.detail}`);
  }
  logger.info(`Relat\xF3rio: ${rel(cwd, reportPath)}`);
  process.exitCode = 1;
}
async function writeDoneReport(reportPath, projectName, passed, blockers, summary) {
  const blockerList = blockers.length ? blockers.map((b) => `- \u274C **${b.label}** \u2014 ${b.detail}`).join("\n") : "- \u2705 Nenhuma pend\xEAncia cr\xEDtica.";
  const content = `# Done Report

- Projeto: ${projectName || "(sem nome)"}
- Gerado em: ${readableStamp()}
- Veredito: ${passed ? "\u2705 PRONTO PARA CONCLUIR" : "\u274C N\xC3O CONCLUIR AINDA"}

## Resumo

| Item | Estado |
|---|---|
| Crit\xE9rios de aceite | ${summary.acceptance} |
| Valida\xE7\xE3o | ${summary.validation} |
| TODOs cr\xEDticos | ${summary.todos} |

## Pend\xEAncias

${blockerList}

## Lembrete (AGENTS.md)

O agente n\xE3o deve declarar vit\xF3ria se: build falhou, lint falhou,
typecheck falhou, testes falharam, crit\xE9rios de aceite n\xE3o foram
marcados, h\xE1 TODOs cr\xEDticos ou h\xE1 arquivos modificados sem explica\xE7\xE3o.
`;
  await writeFileSafe(reportPath, content, true);
}

// src/commands/report.ts
import path12 from "path";
import fs9 from "fs-extra";
async function section(title, file) {
  if (!await pathExists(file)) {
    return `## ${title}

_(arquivo ausente: ${path12.basename(file)})_
`;
  }
  const text2 = (await readText(file)).trim();
  return `## ${title}

${text2 || "_(vazio)_"}
`;
}
async function runReport() {
  const cwd = process.cwd();
  const config = await loadConfig(
    path12.join(cwd, ".harness", "harness.config.json")
  );
  const paths = resolveProjectPaths(
    cwd,
    config.paths.harness,
    config.paths.skills,
    config.paths.codexHooks
  );
  logger.title("harness report");
  await ensureDir(paths.reportsDir);
  const acceptance = await readAcceptanceStatus(paths.acceptanceCriteria);
  const latestValidation = path12.join(paths.reportsDir, "latest-validation.md");
  const validationSummary = await pathExists(latestValidation) ? (await readText(latestValidation)).trim() : "_(sem valida\xE7\xE3o registrada \u2014 rode `harness validate`)_";
  const parts = [
    `# Relat\xF3rio Consolidado`,
    "",
    `- Projeto: ${config.projectName || "(sem nome)"}`,
    `- Gerado em: ${readableStamp()}`,
    `- Crit\xE9rios de aceite: ${acceptance.exists ? `${acceptance.checked}/${acceptance.total} marcados` : "ausente"}`,
    "",
    await section("Tarefa atual", paths.currentTask),
    await section("Crit\xE9rios de aceite", paths.acceptanceCriteria),
    `## Valida\xE7\xF5es executadas

${validationSummary}
`,
    await section("Falhas registradas", paths.failures),
    await section("Decis\xF5es", paths.decisions),
    "## Pr\xF3ximos passos\n\n" + (acceptance.allChecked ? "- Rodar `harness done` e revisar o done-report.\n" : "- Concluir crit\xE9rios de aceite pendentes.\n- Rodar `harness validate` e `harness done`.\n")
  ];
  const reportName = timestampedReportName("report");
  const reportPath = path12.join(paths.reportsDir, reportName);
  await writeFileSafe(reportPath, parts.join("\n"), true);
  await fs9.writeFile(
    path12.join(paths.reportsDir, "latest-report.md"),
    parts.join("\n")
  );
  logger.success(`Relat\xF3rio gerado: ${rel(cwd, reportPath)}`);
  logger.info(`Atalho: ${rel(cwd, path12.join(paths.reportsDir, "latest-report.md"))}`);
}

// src/commands/doctor.ts
import path13 from "path";
async function runDoctor() {
  const cwd = process.cwd();
  const checks = [];
  logger.title("harness doctor");
  const bootPaths = resolveProjectPaths(cwd);
  const config = await pathExists(bootPaths.configFile) ? await loadConfig(bootPaths.configFile).catch(() => null) : null;
  const targets = config?.agentTargets ?? ["codex"];
  const paths = config ? resolveProjectPaths(
    cwd,
    config.paths.harness,
    config.paths.skills,
    config.paths.codexHooks,
    config.paths.claudeSkills,
    config.paths.claudeHooks
  ) : bootPaths;
  const check = async (label, target, suggestion) => {
    const ok = await pathExists(target);
    checks.push({
      label,
      ok,
      detail: ok ? "encontrado" : "ausente",
      ...ok ? {} : { suggestion }
    });
  };
  await check("package.json", paths.packageJson, "Inicialize o projeto Node (pnpm init).");
  await check(".git", path13.join(cwd, ".git"), "Inicialize o git: git init.");
  await check("AGENTS.md", paths.agentsFile, "Rode `harness init` (fonte can\xF4nica).");
  await check(".harness/", paths.harnessDir, "Rode `harness init`.");
  await check(".agents/skills/", paths.skillsDir, "Rode `harness init`.");
  await check("harness.config.json", paths.configFile, "Rode `harness init`.");
  logger.info(`Alvos configurados: ${targets.join(", ")}`);
  if (targets.includes("codex")) {
    await check(".codex/hooks/", paths.codexHooksDir, "Rode `harness export codex`.");
  }
  if (targets.includes("claude-code")) {
    await check("CLAUDE.md", paths.claudeFile, "Rode `harness export claude-code`.");
    await check(".claude/skills/", paths.claudeSkillsDir, "Rode `harness export claude-code`.");
    await check(".claude/hooks/", paths.claudeHooksDir, "Rode `harness export claude-code`.");
  }
  const pnpmOk = await isToolAvailable("pnpm");
  checks.push({
    label: "pnpm no PATH",
    ok: pnpmOk,
    detail: pnpmOk ? "dispon\xEDvel" : "n\xE3o encontrado",
    ...pnpmOk ? {} : { suggestion: "Instale o pnpm: npm i -g pnpm" }
  });
  const gitOk = await isToolAvailable("git");
  checks.push({
    label: "git no PATH",
    ok: gitOk,
    detail: gitOk ? "dispon\xEDvel" : "n\xE3o encontrado",
    ...gitOk ? {} : { suggestion: "Instale o Git." }
  });
  if (await pathExists(paths.configFile)) {
    try {
      const config2 = await loadConfig(paths.configFile);
      const scripts = await readPackageScripts(paths.packageJson);
      for (const key of Object.keys(config2.validation)) {
        if (!config2.validation[key]) continue;
        const present = Object.prototype.hasOwnProperty.call(scripts, key);
        checks.push({
          label: `script "${key}" no package.json`,
          ok: present,
          detail: present ? "definido" : "ausente",
          ...present ? {} : {
            suggestion: `Adicione um script "${key}" ou ajuste validation.${key} no harness.config.json.`
          }
        });
      }
    } catch (error) {
      checks.push({
        label: "harness.config.json v\xE1lido",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
        suggestion: "Corrija o JSON conforme o schema."
      });
    }
  }
  logger.plain();
  let problems = 0;
  for (const c of checks) {
    if (c.ok) {
      logger.plain(`  \u2705 ${c.label} \u2014 ${c.detail}`);
    } else {
      problems += 1;
      logger.plain(`  \u274C ${c.label} \u2014 ${c.detail}`);
      if (c.suggestion) logger.hint(`     \u2192 ${c.suggestion}`);
    }
  }
  logger.plain();
  if (problems === 0) {
    logger.success("Diagn\xF3stico OK: projeto pronto para o harness.");
    process.exitCode = 0;
  } else {
    logger.warn(`${problems} problema(s) encontrado(s). Veja as sugest\xF5es acima.`);
    process.exitCode = 1;
  }
}

// src/commands/skillNew.ts
import path14 from "path";
function normalizeName(raw) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function skillTemplate(name) {
  return `---
name: ${name}
description: Descreva claramente QUANDO usar e QUANDO N\xC3O usar esta skill.
---

# ${name}

> Criada em ${readableStamp()}

## Objetivo

(Explique o problema que esta skill resolve e o resultado esperado.)

## Quando usar

- (Situa\xE7\xE3o 1)
- (Situa\xE7\xE3o 2)

## Quando n\xE3o usar

- (Situa\xE7\xE3o onde aplicar esta skill seria errado)
- (Quando outra skill \xE9 mais adequada)

## Regras obrigat\xF3rias

- (Regra inegoci\xE1vel 1)
- (Regra inegoci\xE1vel 2)
- N\xE3o introduzir segredos hardcoded
- N\xE3o quebrar funcionalidades existentes sem justificativa
- Registrar decis\xF5es relevantes em \`.harness/decisions.md\`

## Checklist de valida\xE7\xE3o

- [ ] (Verifica\xE7\xE3o objetiva 1)
- [ ] (Verifica\xE7\xE3o objetiva 2)
- [ ] Lint/typecheck/build/test executados ou justificados

## Exemplos

\`\`\`txt
(Exemplo de uso correto desta skill)
\`\`\`

## Anti-padr\xF5es

- \u274C (O que N\xC3O fazer 1)
- \u274C (O que N\xC3O fazer 2)
`;
}
async function runSkillNew(rawName) {
  const cwd = process.cwd();
  const name = normalizeName(rawName);
  if (!name) {
    logger.error("Nome de skill inv\xE1lido. Uso: harness skill new <nome>");
    process.exitCode = 1;
    return;
  }
  const config = await loadConfig(
    path14.join(cwd, ".harness", "harness.config.json")
  ).catch(() => null);
  const paths = resolveProjectPaths(
    cwd,
    config?.paths.harness,
    config?.paths.skills,
    config?.paths.codexHooks
  );
  const target = path14.join(paths.skillsDir, name, "SKILL.md");
  if (await pathExists(target)) {
    logger.error(`Skill "${name}" j\xE1 existe em ${rel(cwd, target)}.`);
    process.exitCode = 1;
    return;
  }
  await writeFileSafe(target, skillTemplate(name), false);
  logger.title("harness skill new");
  logger.success(`Skill criada: ${rel(cwd, target)}`);
  logger.step("Preencha Objetivo, Quando usar/n\xE3o usar, Regras e Anti-padr\xF5es.");
  logger.hint("Skills bem definidas reduzem erros do agente.");
}

// src/commands/failureAdd.ts
import path15 from "path";
async function runFailureAdd(description) {
  const cwd = process.cwd();
  const trimmed = description.trim();
  if (!trimmed) {
    logger.error('Descri\xE7\xE3o vazia. Uso: harness failure add "descri\xE7\xE3o da falha"');
    process.exitCode = 1;
    return;
  }
  const config = await loadConfig(
    path15.join(cwd, ".harness", "harness.config.json")
  ).catch(() => null);
  const paths = resolveProjectPaths(
    cwd,
    config?.paths.harness,
    config?.paths.skills,
    config?.paths.codexHooks
  );
  if (!await pathExists(paths.harnessDir)) {
    logger.error("Estrutura .harness/ n\xE3o encontrada. Rode `harness init` primeiro.");
    process.exitCode = 1;
    return;
  }
  const entry = `
---

## Falha \u2014 ${readableStamp()}

- **Descri\xE7\xE3o:** ${trimmed}
- **Causa prov\xE1vel:** (preencher)
- **Impacto:** (preencher)
- **Nova regra preventiva:** (preencher \u2014 esta regra deve refletir em AGENTS.md)
- **Skill que deve ser atualizada:** (nome da skill em .agents/skills/)
`;
  const header = await pathExists(paths.failures) ? "" : `# Falhas Registradas

> Cada falha vira regra preventiva. Atualize AGENTS.md e a skill indicada.
`;
  await appendText(paths.failures, header + entry);
  logger.title("harness failure add");
  logger.success(`Falha registrada em ${rel(cwd, paths.failures)}`);
  logger.step("Preencha causa, impacto e a regra preventiva.");
  logger.step("Reflita a nova regra em AGENTS.md e na skill indicada.");
}

// src/commands/featureStart.ts
import fs10 from "fs-extra";
function normalizeAgent(value) {
  const v = (value ?? "manual").toLowerCase();
  if (v === "codex") return "codex";
  if (v === "claude" || v === "claude-code") return "claude";
  return "manual";
}
async function resolvePaths2(cwd) {
  const config = await loadConfig(
    resolveProjectPaths(cwd).configFile
  ).catch(() => null);
  return config ? resolveProjectPaths(
    cwd,
    config.paths.harness,
    config.paths.skills,
    config.paths.codexHooks,
    config.paths.claudeSkills,
    config.paths.claudeHooks
  ) : resolveProjectPaths(cwd);
}
async function runFeatureStart(name, options) {
  const cwd = process.cwd();
  const feature = name.trim();
  if (!feature) {
    logger.error('Nome vazio. Uso: harness feature start "<nome>"');
    process.exitCode = 1;
    return;
  }
  const paths = await resolvePaths2(cwd);
  if (!await fs10.pathExists(paths.harnessDir)) {
    logger.error("Estrutura .harness/ n\xE3o encontrada. Rode `harness init` primeiro.");
    process.exitCode = 1;
    return;
  }
  const agent = normalizeAgent(options.agent);
  const run = await createRun(paths, feature, agent);
  await appendEvent(paths, run.runId, "info", agent, `Feature iniciada: ${feature}`);
  await fs10.writeFile(
    paths.currentTask,
    `# Tarefa Atual

> Run: ${run.runId}
> Agente: ${agent}
> Iniciada em ${readableStamp()}

## Objetivo

${feature}

## Instru\xE7\xE3o para o agente

Implemente a feature seguindo \`AGENTS.md\`/\`CLAUDE.md\` e as skills.
Os hooks do harness registram eventos e, ao tentar finalizar, rodam
valida\xE7\xF5es e bloqueiam a conclus\xE3o se houver pend\xEAncias cr\xEDticas.
Marque os crit\xE9rios em \`.harness/acceptance-criteria.md\`.
`
  );
  logger.title("harness feature start");
  logger.success(`Run criada: ${run.runId}`);
  logger.info(`Feature: ${feature}`);
  logger.info(`Agente: ${agent}`);
  logger.info(`Diret\xF3rio: ${rel(cwd, paths.runsDir)}/${run.runId}`);
  logger.plain();
  logger.step("Acompanhe em tempo real:  harness ui");
  logger.step("Status resumido:          harness status");
}

// src/core/hookIO.ts
function stripBom(text2) {
  return text2.charCodeAt(0) === 65279 ? text2.slice(1) : text2;
}
async function readStdin() {
  if (process.stdin.isTTY) return "";
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return stripBom(Buffer.concat(chunks).toString("utf8")).trim();
}
function asString(value) {
  if (value == null) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}
function pick(obj, keys) {
  for (const key of keys) {
    if (obj[key] != null) return obj[key];
  }
  return void 0;
}
function parseHookPayload(raw, agent) {
  let data = {};
  try {
    if (raw) data = JSON.parse(raw);
  } catch {
    data = {};
  }
  const toolInput = pick(data, ["tool_input", "input", "arguments"]) ?? {};
  const toolResponse = pick(data, ["tool_response", "response", "result"]) ?? {};
  const event = asString(
    pick(data, ["hook_event_name", "event", "eventName", "type"])
  );
  const toolName = asString(pick(data, ["tool_name", "tool", "toolName"]));
  const command = (() => {
    const c = pick(toolInput, ["command", "cmd", "script"]);
    if (c) return asString(c);
    const top = pick(data, ["command", "cmd"]);
    return top ? asString(top) : null;
  })();
  const files = [];
  for (const key of ["file_path", "filePath", "path", "notebook_path"]) {
    const v = toolInput[key];
    if (typeof v === "string" && v.trim()) files.push(v);
  }
  const edits = toolInput["edits"];
  if (Array.isArray(edits)) {
    for (const e of edits) {
      const fp = e?.["file_path"];
      if (typeof fp === "string") files.push(fp);
    }
  }
  const exitCode = pick({ ...toolResponse, ...data }, [
    "exit_code",
    "exitCode",
    "code"
  ]);
  const successFlag = pick({ ...toolResponse, ...data }, [
    "success",
    "ok",
    "passed"
  ]);
  let success = null;
  if (typeof successFlag === "boolean") success = successFlag;
  else if (typeof exitCode === "number") success = exitCode === 0;
  return {
    raw: data,
    event,
    toolName,
    command,
    files: [...new Set(files)],
    success,
    stdout: asString(pick(toolResponse, ["stdout", "output", "content"])),
    stderr: asString(pick(toolResponse, ["stderr", "error"])),
    stopHookActive: data["stop_hook_active"] === true
  };
}
function emitJson(obj) {
  process.stdout.write(`${JSON.stringify(obj)}
`);
}
function emitBlock(reason) {
  emitJson({ decision: "block", reason });
}
function agentFromFlag(value) {
  const v = (value ?? "").toLowerCase();
  if (v === "claude" || v === "claude-code") return "claude";
  if (v === "codex") return "codex";
  return "manual";
}

// src/commands/hookPostTool.ts
var ERROR_SIGNALS = [
  /\berror\b/i,
  /\bfailed\b/i,
  /\bTS\d{3,}\b/,
  /\bELIFECYCLE\b/,
  /\b\d+ failing\b/i
];
async function runHookPostTool(options) {
  try {
    const agent = agentFromFlag(options.agent);
    const raw = await readStdin();
    const payload = parseHookPayload(raw, agent);
    const { paths } = await resolveConfigured(process.cwd());
    const active = await readActiveRun(paths);
    if (!active) {
      process.exitCode = 0;
      return;
    }
    const runId = active.runId;
    await appendEvent(
      paths,
      runId,
      "tool_use",
      agent,
      `Ferramenta: ${payload.toolName || "desconhecida"}`,
      { event: payload.event, success: payload.success }
    );
    if (payload.command) {
      await appendCommandLog(paths, runId, payload.command);
      await appendEvent(paths, runId, "command", agent, payload.command, {
        success: payload.success
      });
    }
    if (payload.files.length > 0) {
      await addChangedFiles(paths, runId, payload.files);
      await appendEvent(
        paths,
        runId,
        "file_change",
        agent,
        `Arquivos alterados: ${payload.files.join(", ")}`,
        { files: payload.files }
      );
      if (active.status === "created" || active.status === "planning") {
        await updateRun(paths, runId, { status: "implementing" });
      } else {
        await updateRun(paths, runId, { status: "files_changed" });
      }
    }
    const haystack = `${payload.stdout}
${payload.stderr}`;
    const looksFailed = payload.success === false || ERROR_SIGNALS.some((re) => re.test(haystack));
    if (looksFailed) {
      await appendEvent(
        paths,
        runId,
        "error",
        agent,
        `Poss\xEDvel falha em ${payload.toolName || "ferramenta"}`,
        { stderr: payload.stderr.slice(0, 500) }
      );
      emitJson({
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          additionalContext: "harness detectou poss\xEDvel erro nesta etapa. Reveja antes de prosseguir; a conclus\xE3o ser\xE1 validada e poder\xE1 ser bloqueada."
        }
      });
    }
    process.exitCode = 0;
  } catch {
    process.exitCode = 0;
  }
}

// src/core/validationRun.ts
var ORDER = ["lint", "typecheck", "build", "test"];
var MAX_CAPTURE = 8e3;
function clamp(text2) {
  return text2.length > MAX_CAPTURE ? `${text2.slice(0, MAX_CAPTURE)}
\u2026[truncado]` : text2;
}
async function runFeatureValidation(config, paths, runId) {
  const scripts = await readPackageScripts(paths.packageJson);
  const keys = [
    ...ORDER.filter((k) => config.validation[k]),
    ...Object.keys(config.validation).filter(
      (k) => !ORDER.includes(k) && config.validation[k]
    )
  ];
  const details = [];
  const validations = {
    lint: "not_run",
    typecheck: "not_run",
    build: "not_run",
    test: "not_run"
  };
  for (const key of keys) {
    const command = config.validation[key];
    if (!command) continue;
    if (!Object.prototype.hasOwnProperty.call(scripts, key)) {
      const state2 = "skipped";
      validations[key] = state2;
      details.push({
        name: key,
        command,
        state: state2,
        exitCode: null,
        durationMs: 0,
        stdout: "",
        stderr: "",
        skippedReason: `script "${key}" ausente no package.json`
      });
      continue;
    }
    const result = await runCommand(command, paths.cwd);
    const state = result.failed ? "failed" : "passed";
    validations[key] = state;
    details.push({
      name: key,
      command,
      state,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      stdout: clamp(result.stdout),
      stderr: clamp(result.stderr)
    });
  }
  await writeValidationJson(paths, runId, details);
  await updateRun(paths, runId, { validations });
  const passed = details.every((d) => d.state !== "failed");
  return { details, validations, passed };
}

// src/core/blockers.ts
import path16 from "path";
import fs11 from "fs-extra";

// src/core/gitInfo.ts
import { execa as execa2 } from "execa";
async function gitChanges(cwd) {
  try {
    const result = await execa2("git", ["status", "--porcelain"], {
      cwd,
      reject: false,
      windowsHide: true
    });
    if ((result.exitCode ?? 1) !== 0) {
      return { available: false, changed: [], deleted: [] };
    }
    const changed = [];
    const deleted = [];
    for (const line of (result.stdout ?? "").split(/\r?\n/)) {
      if (!line.trim()) continue;
      const status = line.slice(0, 2);
      const file = line.slice(3).trim().replace(/^"|"$/g, "");
      if (!file) continue;
      if (status.includes("D")) deleted.push(file);
      else changed.push(file);
    }
    return { available: true, changed, deleted };
  } catch {
    return { available: false, changed: [], deleted: [] };
  }
}

// src/core/blockers.ts
var ENV_RE = /(^|[\\/])\.env(\.|$)/i;
var MIGRATION_RE = /migrations?[\\/]/i;
var AUTH_RE = /(auth|rls|policy|policies|middleware|session|permission)/i;
var WEBHOOK_RE = /webhook/i;
var IDEMPOTENT_RE = /(idempoten|dedupe|deduplicat|event[_-]?id|already.?processed)/i;
var TENANT_RE = /tenant_id/i;
var CREATE_TABLE_RE = /create\s+table/i;
async function readIfExists(file) {
  try {
    if (!await fs11.pathExists(file)) return "";
    const stat = await fs11.stat(file);
    if (!stat.isFile() || stat.size > 1e6) return "";
    return await fs11.readFile(file, "utf8");
  } catch {
    return "";
  }
}
function hasRealDecisionEntry(decisionsText) {
  return /^##\s+\d{4}-\d{2}-\d{2}/m.test(decisionsText);
}
async function evaluateBlockers(paths, _config, details, recordedFiles) {
  const blockers = [];
  for (const d of details) {
    if (d.state === "failed") {
      blockers.push({
        id: `validation-${d.name}`,
        label: `Valida\xE7\xE3o falhou: ${d.name}`,
        detail: `\`${d.command}\` (exit ${d.exitCode ?? "?"})`,
        severity: "critical"
      });
    }
  }
  const acceptance = await readAcceptanceStatus(paths.acceptanceCriteria);
  if (!acceptance.exists) {
    blockers.push({
      id: "acceptance-missing",
      label: "Crit\xE9rios de aceite ausentes",
      detail: "acceptance-criteria.md n\xE3o encontrado.",
      severity: "critical"
    });
  } else if (!acceptance.allChecked) {
    blockers.push({
      id: "acceptance-unchecked",
      label: "Crit\xE9rios de aceite n\xE3o cumpridos",
      detail: `${acceptance.unchecked}/${acceptance.total} sem marcar.`,
      severity: "critical"
    });
  }
  const git = await gitChanges(paths.cwd);
  const changedFiles = [
    .../* @__PURE__ */ new Set([...git.changed, ...recordedFiles])
  ].filter(Boolean);
  const deletedFiles = [...new Set(git.deleted)];
  const envTouched = [...changedFiles, ...deletedFiles].filter(
    (f) => ENV_RE.test(f)
  );
  if (envTouched.length > 0) {
    blockers.push({
      id: "env-changed",
      label: ".env foi alterado",
      detail: envTouched.join(", "),
      severity: "critical"
    });
  }
  const migrationsDeleted = deletedFiles.filter((f) => MIGRATION_RE.test(f));
  if (migrationsDeleted.length > 0) {
    blockers.push({
      id: "migrations-deleted",
      label: "Migrations foram apagadas",
      detail: migrationsDeleted.join(", "),
      severity: "critical"
    });
  }
  const todos = await scanCriticalTodos(paths.cwd);
  if (todos.count > 0) {
    blockers.push({
      id: "critical-todo",
      label: "TODO/FIXME cr\xEDtico no c\xF3digo",
      detail: `${todos.count} marcador(es): ${todos.files.slice(0, 5).join(", ")}`,
      severity: "critical"
    });
  }
  const authChanged = changedFiles.filter((f) => AUTH_RE.test(f));
  if (authChanged.length > 0) {
    const decisionsText = await readIfExists(paths.decisions);
    if (!hasRealDecisionEntry(decisionsText)) {
      blockers.push({
        id: "auth-without-decision",
        label: "Altera\xE7\xE3o de auth/RLS sem registro em decisions.md",
        detail: authChanged.slice(0, 5).join(", "),
        severity: "critical"
      });
    }
  }
  const sqlChanged = changedFiles.filter((f) => /\.sql$/i.test(f));
  for (const rel2 of sqlChanged.slice(0, 30)) {
    const content = await readIfExists(path16.join(paths.cwd, rel2));
    if (CREATE_TABLE_RE.test(content) && !TENANT_RE.test(content)) {
      blockers.push({
        id: "tenant-missing",
        label: "Tabela criada sem tenant_id (multi-tenant)",
        detail: rel2,
        severity: "critical"
      });
    }
  }
  const webhookChanged = changedFiles.filter(
    (f) => WEBHOOK_RE.test(f) && /\.(t|j)sx?$/i.test(f)
  );
  for (const rel2 of webhookChanged.slice(0, 30)) {
    const content = await readIfExists(path16.join(paths.cwd, rel2));
    if (content && !IDEMPOTENT_RE.test(content)) {
      blockers.push({
        id: "webhook-no-idempotency",
        label: "Webhook sem idempot\xEAncia aparente",
        detail: rel2,
        severity: "critical"
      });
    }
  }
  const critical = blockers.filter((b) => b.severity === "critical").length;
  const warning = blockers.filter((b) => b.severity === "warning").length;
  const failedValidations = details.filter((d) => d.state === "failed").length;
  const score = Math.max(
    0,
    Math.min(
      100,
      100 - critical * 20 - warning * 8 - failedValidations * 5
    )
  );
  return {
    blockers,
    score,
    changedFiles,
    deletedFiles,
    acceptanceAllChecked: acceptance.allChecked
  };
}

// src/core/runReport.ts
import path17 from "path";
import fs12 from "fs-extra";
function validationsTable(details) {
  if (details.length === 0) return "_(nenhuma valida\xE7\xE3o configurada)_";
  const rows = details.map((d) => {
    const icon = d.state === "passed" ? "\u2705" : d.state === "failed" ? "\u274C" : "\u23ED\uFE0F";
    const extra = d.state === "skipped" ? d.skippedReason ?? "pulado" : `exit ${d.exitCode ?? "?"} \xB7 ${d.durationMs}ms`;
    return `| ${icon} ${d.name} | \`${d.command}\` | ${d.state} | ${extra} |`;
  }).join("\n");
  return `| Etapa | Comando | Estado | Detalhe |
|---|---|---|---|
${rows}`;
}
function blockersList(blockers) {
  if (blockers.length === 0) return "- \u2705 Nenhuma pend\xEAncia cr\xEDtica.";
  return blockers.map(
    (b) => `- ${b.severity === "critical" ? "\u274C" : "\u26A0\uFE0F"} **${b.label}** \u2014 ${b.detail}`
  ).join("\n");
}
function fixesList(blockers) {
  if (blockers.length === 0) return "- Nada pendente.";
  return blockers.map((b) => `- [ ] Resolver: ${b.label} (${b.detail})`).join("\n");
}
async function writeImplementationReport(paths, input) {
  const { run, details, blockers, changedFiles, partial } = input;
  const acceptance = await readAcceptanceStatus(paths.acceptanceCriteria);
  let decisions = "";
  try {
    if (await fs12.pathExists(paths.decisions)) {
      decisions = (await fs12.readFile(paths.decisions, "utf8")).trim();
    }
  } catch {
  }
  const filesBlock = changedFiles.length > 0 ? changedFiles.map((f) => `- \`${f}\``).join("\n") : "_(nenhum arquivo registrado)_";
  const nextSteps = partial ? "- Corrigir os itens de **Corre\xE7\xF5es necess\xE1rias**.\n- Rodar novamente o agente ou `harness hook stop` ao finalizar.\n" : "- Revis\xE3o humana final.\n- Merge/entrega conforme o fluxo do projeto.\n";
  const content = `# Relat\xF3rio de Implementa\xE7\xE3o \u2014 ${run.feature}

- Gerado em: ${readableStamp()}
- Agente: ${run.agent}
- Run: ${run.runId}
- Status final: **${run.status}**${partial ? " (parcial)" : ""}
- Score de qualidade: **${run.score}/100**

## Arquivos alterados

${filesBlock}

## Valida\xE7\xF5es executadas

${validationsTable(details)}

## Falhas encontradas

${blockersList(blockers)}

## Corre\xE7\xF5es necess\xE1rias

${fixesList(blockers)}

## Crit\xE9rios de aceite

${acceptance.exists ? `${acceptance.checked}/${acceptance.total} marcados${acceptance.allChecked ? " \u2705" : " \u2014 pendentes \u274C"}` : "_(acceptance-criteria.md ausente)_"}

## Decis\xF5es t\xE9cnicas

${decisions || "_(decisions.md vazio \u2014 registre decis\xF5es relevantes)_"}

## Pr\xF3ximos passos

${nextSteps}
> Gerado por agent-harness-kit. N\xE3o substitui revis\xE3o humana.
`;
  const reportPath = runReportPath(paths, run.runId);
  await fs12.ensureDir(path17.dirname(reportPath));
  await fs12.writeFile(reportPath, content);
  await fs12.ensureDir(paths.reportsDir);
  await fs12.writeFile(paths.reportsLatest, content);
  return reportPath;
}

// src/core/featureFinalize.ts
function buildReason(blockers) {
  const critical = blockers.filter((b) => b.severity === "critical");
  const head = "Conclus\xE3o bloqueada pelo harness: pend\xEAncias cr\xEDticas encontradas.";
  const items = critical.slice(0, 8).map((b) => `\u2022 ${b.label} \u2014 ${b.detail}`).join("\n");
  return `${head}
${items}
Rode \`harness status\` e corrija antes de finalizar.`;
}
async function finalizeFeature(cwd, agent) {
  const config = await loadConfig(
    resolveProjectPaths(cwd).configFile
  ).catch(() => null);
  const paths = config ? resolveProjectPaths(
    cwd,
    config.paths.harness,
    config.paths.skills,
    config.paths.codexHooks,
    config.paths.claudeSkills,
    config.paths.claudeHooks
  ) : resolveProjectPaths(cwd);
  const active = await readActiveRun(paths);
  if (!active || !config) {
    return {
      hadActiveRun: false,
      passed: true,
      run: active,
      blockers: [],
      reason: ""
    };
  }
  const runId = active.runId;
  await setRunStatus(paths, runId, "validating");
  await appendEvent(paths, runId, "validation", agent, "Valida\xE7\xF5es iniciadas");
  const validation = await runFeatureValidation(config, paths, runId);
  await appendEvent(
    paths,
    runId,
    "validation",
    agent,
    `Valida\xE7\xF5es: ${validation.passed ? "passou" : "falhou"}`,
    { validations: validation.validations }
  );
  const evaluation = await evaluateBlockers(
    paths,
    config,
    validation.details,
    active.filesChanged
  );
  const passed = validation.passed && evaluation.blockers.length === 0;
  const reason = passed ? "" : buildReason(evaluation.blockers);
  const finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  let updated = await updateRun(paths, runId, {
    status: passed ? "passed" : "needs_fix",
    score: evaluation.score,
    blockReason: passed ? null : reason,
    finishedAt,
    filesChanged: evaluation.changedFiles
  });
  const reportPath = await writeImplementationReport(paths, {
    run: updated ?? active,
    details: validation.details,
    blockers: evaluation.blockers,
    changedFiles: evaluation.changedFiles,
    partial: !passed
  });
  updated = await updateRun(paths, runId, {
    reportPath,
    status: passed ? "done" : "needs_fix"
  });
  await appendEvent(
    paths,
    runId,
    passed ? "report" : "block",
    agent,
    passed ? "Feature conclu\xEDda e relat\xF3rio gerado" : "Conclus\xE3o bloqueada \u2014 relat\xF3rio parcial gerado",
    { reportPath, score: evaluation.score }
  );
  return {
    hadActiveRun: true,
    passed,
    run: updated,
    blockers: evaluation.blockers,
    reason
  };
}

// src/commands/hookStop.ts
async function runHookStop(options) {
  const agent = agentFromFlag(options.agent);
  try {
    await readStdin();
    const outcome = await finalizeFeature(process.cwd(), agent);
    if (!outcome.hadActiveRun) {
      process.exitCode = 0;
      return;
    }
    if (outcome.passed) {
      process.exitCode = 0;
      return;
    }
    emitBlock(outcome.reason);
    process.exitCode = 0;
  } catch (error) {
    process.stderr.write(
      `[harness:hook stop] erro interno ignorado: ${error instanceof Error ? error.message : String(error)}
`
    );
    process.exitCode = 0;
  }
}

// src/commands/hookTaskCompleted.ts
async function runHookTaskCompleted(options) {
  const agent = agentFromFlag(options.agent ?? "claude");
  try {
    await readStdin();
    const outcome = await finalizeFeature(process.cwd(), agent);
    if (!outcome.hadActiveRun || outcome.passed) {
      process.exitCode = 0;
      return;
    }
    process.stderr.write(`${outcome.reason}
`);
    process.exitCode = 2;
  } catch (error) {
    process.stderr.write(
      `[harness:hook task-completed] erro interno ignorado: ${error instanceof Error ? error.message : String(error)}
`
    );
    process.exitCode = 0;
  }
}

// src/commands/hookPromptSubmit.ts
async function runHookPromptSubmit(options) {
  try {
    const agent = agentFromFlag(options.agent);
    const raw = await readStdin();
    const payload = parseHookPayload(raw, agent);
    const { paths } = await resolveConfigured(process.cwd());
    const active = await readActiveRun(paths);
    if (!active) {
      process.exitCode = 0;
      return;
    }
    await appendEvent(
      paths,
      active.runId,
      "info",
      agent,
      "Prompt enviado ao agente",
      { event: payload.event || "UserPromptSubmit" }
    );
    if (active.status === "created") {
      await updateRun(paths, active.runId, { status: "planning" });
    }
    process.exitCode = 0;
  } catch {
    process.exitCode = 0;
  }
}

// src/commands/ui.ts
import chalk5 from "chalk";
async function renderFallback(cwd, note2) {
  const snap = await loadSnapshot(cwd);
  if (note2) logger.warn(note2);
  logger.title(`Agent Harness \u2014 ${snap.projectName}`);
  if (!snap.hasActiveRun || !snap.active) {
    logger.info('Nenhuma execu\xE7\xE3o ativa. Inicie: harness feature start "<nome>"');
  } else {
    const r = snap.active;
    logger.plain(`  Feature : ${chalk5.bold(r.feature)}`);
    logger.plain(`  Status  : ${chalk5.cyan(r.status)} \xB7 score ${r.score}/100`);
    logger.plain(`  Agente  : ${r.agent} \xB7 ${elapsedLabel(r.startedAt, r.finishedAt)}`);
    logger.plain(
      `  Valida\xE7\xF5es: lint=${r.validations.lint} typecheck=${r.validations.typecheck} build=${r.validations.build} test=${r.validations.test}`
    );
    logger.plain(`  Arquivos: ${r.filesChanged.length} \xB7 Eventos: ${r.eventsCount}`);
    if (r.blockReason) {
      logger.warn("Bloqueio:");
      logger.plain(chalk5.red(r.blockReason));
    }
    for (const e of snap.events.slice(-6)) {
      logger.plain(
        `   ${chalk5.dim(e.timestamp.slice(11, 19))} [${e.type}] ${e.message}`
      );
    }
  }
  if (snap.runs.length > 0) {
    logger.plain();
    logger.plain(chalk5.dim("  Execu\xE7\xF5es:"));
    for (const r of snap.runs.slice(0, 5)) {
      logger.plain(`   ${r.runId}  ${r.status}  score=${r.score}  ${r.feature}`);
    }
  }
}
async function runUi(options) {
  const cwd = process.cwd();
  if (options.once) {
    await renderFallback(cwd);
    return;
  }
  if (!process.stdout.isTTY) {
    await renderFallback(
      cwd,
      "Sem TTY interativo \u2014 exibindo snapshot textual (use `harness ui` num terminal real)."
    );
    return;
  }
  try {
    const [{ render }, { createElement }, { App }] = await Promise.all([
      import("ink"),
      import("react"),
      import("./App-XTFCNFNT.js")
    ]);
    const instance = render(createElement(App, { cwd }));
    await instance.waitUntilExit();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await renderFallback(
      cwd,
      `N\xE3o foi poss\xEDvel abrir a TUI (${message}). Fallback textual:`
    );
  }
}

// src/commands/runsList.ts
import chalk6 from "chalk";
function statusColor(status) {
  if (status === "done" || status === "passed") return chalk6.green(status);
  if (status === "needs_fix" || status === "failed") return chalk6.red(status);
  if (status === "validating") return chalk6.yellow(status);
  return chalk6.cyan(status);
}
async function runRunsList() {
  const cwd = process.cwd();
  const { paths } = await resolveConfigured(cwd);
  const runs = await listRuns(paths);
  const current = await readCurrentRun(paths);
  logger.title("harness runs");
  if (runs.length === 0) {
    logger.info('Nenhuma execu\xE7\xE3o. Crie uma com: harness feature start "<nome>"');
    return;
  }
  for (const r of runs) {
    const marker = current?.runId === r.runId ? chalk6.bold("\u27A4 ") : "  ";
    logger.plain(
      `${marker}${chalk6.dim(r.runId)}  ${statusColor(r.status)}  score=${r.score}  agent=${r.agent}`
    );
    logger.plain(`    feature: ${r.feature}`);
    logger.plain(
      `    in\xEDcio: ${r.startedAt}  fim: ${r.finishedAt ?? "-"}`
    );
    logger.plain(
      `    relat\xF3rio: ${r.reportPath ? rel(cwd, r.reportPath) : "-"}`
    );
  }
  logger.plain();
  logger.hint("Detalhe visual em tempo real: harness ui");
}

// src/commands/statusCmd.ts
import chalk7 from "chalk";
function vIcon(state) {
  if (state === "passed") return chalk7.green("\u2705");
  if (state === "failed") return chalk7.red("\u274C");
  if (state === "skipped") return chalk7.yellow("\u23ED\uFE0F");
  return chalk7.dim("\u2022");
}
function elapsed(startedAt, finishedAt) {
  const end = finishedAt ? new Date(finishedAt) : /* @__PURE__ */ new Date();
  const ms = end.getTime() - new Date(startedAt).getTime();
  if (Number.isNaN(ms) || ms < 0) return "-";
  const s = Math.floor(ms / 1e3);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m${s % 60}s` : `${s}s`;
}
async function runStatus() {
  const cwd = process.cwd();
  const { paths } = await resolveConfigured(cwd);
  const run = await readActiveRun(paths);
  logger.title("harness status");
  if (!run) {
    logger.info('Nenhuma execu\xE7\xE3o ativa. Inicie: harness feature start "<nome>"');
    return;
  }
  logger.plain(`  Feature : ${chalk7.bold(run.feature)}`);
  logger.plain(`  Run     : ${chalk7.dim(run.runId)}`);
  logger.plain(`  Agente  : ${run.agent}`);
  logger.plain(`  Status  : ${chalk7.cyan(run.status)}`);
  logger.plain(`  Score   : ${run.score}/100`);
  logger.plain(`  Tempo   : ${elapsed(run.startedAt, run.finishedAt)}`);
  logger.plain(
    `  Valida\xE7\xF5es: lint ${vIcon(run.validations.lint)}  typecheck ${vIcon(run.validations.typecheck)}  build ${vIcon(run.validations.build)}  test ${vIcon(run.validations.test)}`
  );
  logger.plain(`  Arquivos: ${run.filesChanged.length}`);
  logger.plain(`  Eventos : ${run.eventsCount}`);
  if (run.blockReason) {
    logger.plain();
    logger.warn("Bloqueio:");
    logger.plain(chalk7.red(run.blockReason));
  }
  if (run.reportPath) {
    logger.plain();
    logger.info(`Relat\xF3rio: ${rel(cwd, run.reportPath)}`);
  }
  const events = await readEvents(paths, run.runId, 5);
  if (events.length > 0) {
    logger.plain();
    logger.plain(chalk7.dim("  \xDAltimos eventos:"));
    for (const e of events) {
      logger.plain(
        `   ${chalk7.dim(e.timestamp.slice(11, 19))} [${e.type}] ${e.message}`
      );
    }
  }
}

// src/commands/reportLatest.ts
import fs13 from "fs-extra";
async function runReportLatest() {
  const cwd = process.cwd();
  const { paths } = await resolveConfigured(cwd);
  let file = paths.reportsLatest;
  if (!await fs13.pathExists(file)) {
    const active = await readActiveRun(paths);
    if (active) {
      const candidate = runReportPath(paths, active.runId);
      if (await fs13.pathExists(candidate)) file = candidate;
    }
  }
  if (!await fs13.pathExists(file)) {
    logger.warn(
      "Nenhum relat\xF3rio encontrado. Rode `harness feature start` e finalize a feature (ou `harness done`)."
    );
    process.exitCode = 1;
    return;
  }
  const content = await fs13.readFile(file, "utf8");
  logger.info(`Relat\xF3rio: ${rel(cwd, file)}`);
  logger.plain();
  logger.plain(content);
}

// src/cli.ts
var VERSION = "0.1.0";
async function guard(action) {
  try {
    await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message);
    process.exitCode = 1;
  }
}
function buildProgram() {
  const program = new Command();
  program.name("harness").description(
    "Agent Harness Kit \u2014 prepara, versiona e valida estruturas de Harness Engineering para agentes (Codex/Claude Code/Cursor). N\xE3o usa nenhuma API de LLM."
  ).version(VERSION, "-v, --version", "exibe a vers\xE3o");
  program.command("install").description(
    "Assistente de instala\xE7\xE3o: pergunta o agente (Codex/Claude/Cursor) e configura tudo"
  ).option("-a, --agent <targets>", "alvos (csv) \u2014 pula a pergunta de agente").option("--pm <gerenciador>", "pnpm | npm | yarn | bun \u2014 pula a pergunta").option("-y, --yes", "n\xE3o-interativo: usa flags + defaults detectados", false).option("-f, --force", "sobrescreve arquivos existentes criando backup", false).option("--no-hooks", "n\xE3o instala os hooks de integra\xE7\xE3o").action((opts) => guard(() => runInstall(opts)));
  program.command("init").description("Cria a estrutura de harness no diret\xF3rio atual").option("-f, --force", "sobrescreve arquivos existentes criando backup", false).option(
    "-a, --agent <targets>",
    "alvos separados por v\xEDrgula (codex, claude-code, cursor)"
  ).action((opts) => guard(() => runInit(opts)));
  program.command("task").argument("<descricao>", "descri\xE7\xE3o da tarefa").description("Cria/atualiza current-task.md e gera crit\xE9rios de aceite").action((descricao) => guard(() => runTask(descricao)));
  const exportCmd = program.command("export").description("Exporta a estrutura para um agente alvo (codex, claude-code)");
  exportCmd.command("codex").description("Garante AGENTS.md/skills/hooks e imprime a instru\xE7\xE3o do Codex").action(() => guard(() => runExportCodex()));
  exportCmd.command("claude-code").alias("claude").description("Garante CLAUDE.md/.claude/skills/.claude/hooks e imprime a instru\xE7\xE3o do Claude Code").action(() => guard(() => runExportClaude()));
  program.command("validate").description("Executa os comandos de valida\xE7\xE3o configurados").action(() => guard(() => runValidate()));
  program.command("done").description("Checagem anti-vit\xF3ria-prematura antes de concluir a tarefa").action(() => guard(() => runDone()));
  const reportCmd = program.command("report").description("Consolida tarefa, valida\xE7\xF5es, falhas e decis\xF5es em markdown").action(() => guard(() => runReport()));
  reportCmd.command("latest").description("Imprime o relat\xF3rio mais recente no terminal").action(() => guard(() => runReportLatest()));
  program.command("doctor").description("Diagnostica a sa\xFAde do projeto para o harness").action(() => guard(() => runDoctor()));
  const skillCmd = program.command("skill").description("Gerencia skills");
  skillCmd.command("new").argument("<nome>", "nome da nova skill (kebab-case)").description("Cria uma nova skill com frontmatter e se\xE7\xF5es padronizadas").action((nome) => guard(() => runSkillNew(nome)));
  const failureCmd = program.command("failure").description("Gerencia o registro de falhas");
  failureCmd.command("add").argument("<descricao>", "descri\xE7\xE3o da falha").description("Registra uma falha estruturada em failures.md").action((descricao) => guard(() => runFailureAdd(descricao)));
  const hooksCmd = program.command("hooks").description("Instala hooks locais de integra\xE7\xE3o (Codex / Claude Code)");
  const hooksInstall = hooksCmd.command("install").description("Instala hooks para um agente");
  hooksInstall.command("codex").description("Instala hooks do harness no Codex (.codex/hooks.json)").option("-f, --force", "sobrescreve wrappers existentes criando backup", false).action((opts) => guard(() => runHooksInstallCodex(opts)));
  hooksInstall.command("claude").description("Instala hooks do harness no Claude Code (.claude/settings.json)").option("-f, --force", "sobrescreve wrappers existentes criando backup", false).action((opts) => guard(() => runHooksInstallClaude(opts)));
  const featureCmd = program.command("feature").description("Gerencia execu\xE7\xF5es de feature (runs)");
  featureCmd.command("start").argument("<nome>", "nome da feature").description("Inicia uma nova execu\xE7\xE3o e a marca como atual").option(
    "-a, --agent <agente>",
    "agente respons\xE1vel (codex | claude | manual)",
    "manual"
  ).action(
    (nome, opts) => guard(() => runFeatureStart(nome, opts))
  );
  const hookCmd = program.command("hook").description("Endpoints chamados pelos hooks dos agentes (l\xEA stdin)");
  hookCmd.command("post-tool").description("Registra uso de ferramenta (n\xE3o bloqueia)").option("--agent <agente>", "codex | claude", "manual").action((opts) => guard(() => runHookPostTool(opts)));
  hookCmd.command("stop").description("Valida e bloqueia a conclus\xE3o se houver pend\xEAncias").option("--agent <agente>", "codex | claude", "manual").action((opts) => guard(() => runHookStop(opts)));
  hookCmd.command("task-completed").description("Equivalente ao stop para Claude Code (exit 2 ao bloquear)").option("--agent <agente>", "claude", "claude").action((opts) => guard(() => runHookTaskCompleted(opts)));
  hookCmd.command("prompt-submit").description("Registra envio de prompt (UserPromptSubmit, n\xE3o bloqueia)").option("--agent <agente>", "codex | claude", "manual").action((opts) => guard(() => runHookPromptSubmit(opts)));
  program.command("ui").description("Abre a TUI (somente leitura) de acompanhamento das execu\xE7\xF5es").option("--once", "imprime um snapshot textual e sai", false).action((opts) => guard(() => runUi(opts)));
  program.command("runs").description("Lista as execu\xE7\xF5es registradas").action(() => guard(() => runRunsList()));
  program.command("status").description("Mostra o status resumido da execu\xE7\xE3o atual").action(() => guard(() => runStatus()));
  program.addHelpText(
    "after",
    `
Exemplos:
  ${chalk8.cyan("harness install")}                 ${chalk8.dim(
      "# assistente interativo (recomendado)"
    )}
  ${chalk8.cyan(
      "harness install --yes --agent claude-code --pm npm"
    )}
  ${chalk8.cyan(
      'harness feature start "QR Code Evolution por barbearia" --agent claude'
    )}
  ${chalk8.cyan("harness ui")}
  ${chalk8.cyan(
      "harness status"
    )}
  ${chalk8.cyan("harness report latest")}
`
  );
  return program;
}
async function runCli(argv) {
  const program = buildProgram();
  await program.parseAsync(argv);
}

// src/index.ts
runCli(process.argv).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message);
  process.exit(1);
});
//# sourceMappingURL=index.js.map