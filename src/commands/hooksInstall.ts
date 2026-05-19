import path from "node:path";
import fs from "fs-extra";
import { resolveProjectPaths, rel, type ProjectPaths } from "../core/paths.js";
import { loadConfig } from "../core/config.js";
import { readTemplate, renderTemplate } from "../core/templates.js";
import { writeFileSafe } from "../core/file-system.js";
import { backupStamp } from "../core/date.js";
import { logger } from "../core/logger.js";

export interface HooksInstallOptions {
  force?: boolean;
}

interface WrapperSpec {
  file: string;
  subcommand: string;
}

const CODEX_WRAPPERS: WrapperSpec[] = [
  { file: "harness-post-tool.mjs", subcommand: "hook post-tool" },
  { file: "harness-stop.mjs", subcommand: "hook stop" },
  { file: "harness-prompt-submit.mjs", subcommand: "hook prompt-submit" },
];

const CLAUDE_WRAPPERS: WrapperSpec[] = [
  { file: "harness-post-tool.mjs", subcommand: "hook post-tool" },
  { file: "harness-stop.mjs", subcommand: "hook stop" },
  { file: "harness-task-completed.mjs", subcommand: "hook task-completed" },
];

async function resolvePaths(cwd: string): Promise<ProjectPaths> {
  const config = await loadConfig(
    resolveProjectPaths(cwd).configFile,
  ).catch(() => null);
  return config
    ? resolveProjectPaths(
        cwd,
        config.paths.harness,
        config.paths.skills,
        config.paths.codexHooks,
        config.paths.claudeSkills,
        config.paths.claudeHooks,
      )
    : resolveProjectPaths(cwd);
}

async function materializeWrappers(
  cwd: string,
  hooksDir: string,
  agent: "codex" | "claude",
  specs: WrapperSpec[],
  force: boolean,
): Promise<Record<string, string>> {
  const template = await readTemplate("integrations/hook-wrapper.mjs");
  const commandByFile: Record<string, string> = {};
  await fs.ensureDir(hooksDir);
  for (const spec of specs) {
    const content = renderTemplate(template, {
      SUBCOMMAND: spec.subcommand,
      AGENT: agent,
    });
    const target = path.join(hooksDir, spec.file);
    const result = await writeFileSafe(target, content, force);
    if (result.action === "created") {
      logger.success(`Criado ${rel(cwd, target)}`);
    }
    commandByFile[spec.file] = `node "${rel(cwd, target)}"`;
  }
  return commandByFile;
}

async function backupIfExists(file: string): Promise<string | null> {
  if (!(await fs.pathExists(file))) return null;
  const backup = `${file}.bak-${backupStamp()}`;
  await fs.copy(file, backup);
  return backup;
}

interface HookEntry {
  type?: string;
  command?: string;
}
interface HookGroup {
  matcher?: string;
  hooks?: HookEntry[];
}

/** true se algum grupo já contém exatamente este comando. */
function commandAlreadyWired(list: HookGroup[], command: string): boolean {
  return list.some((group) =>
    Array.isArray(group?.hooks)
      ? group.hooks.some((h) => h?.command === command)
      : false,
  );
}

function ensureGroup(
  config: Record<string, unknown>,
  event: string,
  command: string,
  matcher: string,
): boolean {
  const hooks = (config.hooks ??= {}) as Record<string, unknown>;
  const list = (hooks[event] ??= []) as HookGroup[];
  if (commandAlreadyWired(list, command)) return false;
  list.push({ matcher, hooks: [{ type: "command", command }] });
  return true;
}

/** `harness hooks install codex` */
export async function runHooksInstallCodex(
  options: HooksInstallOptions,
): Promise<void> {
  const cwd = process.cwd();
  const force = Boolean(options.force);
  const paths = await resolvePaths(cwd);

  logger.title("harness hooks install codex");
  const commands = await materializeWrappers(
    cwd,
    paths.codexHooksDir,
    "codex",
    CODEX_WRAPPERS,
    force,
  );

  const backup = await backupIfExists(paths.codexHooksConfig);
  if (backup) logger.warn(`Backup: ${rel(cwd, backup)}`);

  let json: Record<string, unknown> = {};
  if (await fs.pathExists(paths.codexHooksConfig)) {
    json = await fs.readJson(paths.codexHooksConfig).catch(() => ({}));
  }

  let added = 0;
  if (ensureGroup(json, "PostToolUse", commands["harness-post-tool.mjs"]!, "*"))
    added += 1;
  if (ensureGroup(json, "Stop", commands["harness-stop.mjs"]!, "*")) added += 1;
  if (
    ensureGroup(
      json,
      "UserPromptSubmit",
      commands["harness-prompt-submit.mjs"]!,
      "*",
    )
  )
    added += 1;

  await fs.ensureDir(path.dirname(paths.codexHooksConfig));
  await fs.writeJson(paths.codexHooksConfig, json, { spaces: 2 });
  logger.success(
    `${rel(cwd, paths.codexHooksConfig)} atualizado (${added} hook(s) novo(s), existentes preservados).`,
  );

  logger.title("Próximos passos (Codex)");
  logger.step("Revise .codex/hooks.json e ajuste ao schema da sua versão do Codex.");
  logger.step(
    "Se o Codex pedir, marque os hooks como confiáveis (trust) antes de usar.",
  );
  logger.step('Inicie a feature: harness feature start "<nome>"');
  logger.hint("Os hooks só registram/validam; nunca abrem UI (use `harness ui`).");
}

/** `harness hooks install claude` */
export async function runHooksInstallClaude(
  options: HooksInstallOptions,
): Promise<void> {
  const cwd = process.cwd();
  const force = Boolean(options.force);
  const paths = await resolvePaths(cwd);

  logger.title("harness hooks install claude");
  const commands = await materializeWrappers(
    cwd,
    paths.claudeHooksDir,
    "claude",
    CLAUDE_WRAPPERS,
    force,
  );

  const backup = await backupIfExists(paths.claudeSettings);
  if (backup) logger.warn(`Backup: ${rel(cwd, backup)}`);

  let settings: Record<string, unknown> = {};
  if (await fs.pathExists(paths.claudeSettings)) {
    settings = await fs.readJson(paths.claudeSettings).catch(() => ({}));
  }

  let added = 0;
  if (
    ensureGroup(settings, "PostToolUse", commands["harness-post-tool.mjs"]!, "*")
  )
    added += 1;
  if (ensureGroup(settings, "Stop", commands["harness-stop.mjs"]!, "")) added += 1;
  // "TaskCompleted" segue o pedido explícito; o Claude Code atual dispara o
  // ciclo de fim em "Stop" (já configurado acima e funcional).
  if (
    ensureGroup(
      settings,
      "TaskCompleted",
      commands["harness-task-completed.mjs"]!,
      "",
    )
  )
    added += 1;

  await fs.ensureDir(path.dirname(paths.claudeSettings));
  await fs.writeJson(paths.claudeSettings, settings, { spaces: 2 });
  logger.success(
    `${rel(cwd, paths.claudeSettings)} atualizado (${added} hook(s) novo(s), config existente preservada).`,
  );

  logger.title("Próximos passos (Claude Code)");
  logger.step("Revise .claude/settings.json (pode usar settings.local.json se preferir).");
  logger.step(
    "TaskCompleted não é nativo no Claude Code atual — o bloqueio real ocorre em Stop.",
  );
  logger.step('Inicie a feature: harness feature start "<nome>"');
  logger.hint("Os hooks só registram/validam; a UI é separada (`harness ui`).");
}
