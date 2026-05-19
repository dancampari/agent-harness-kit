import path from "node:path";
import fs from "fs-extra";
import { resolveProjectPaths } from "./paths.js";
import { loadConfig, readPackageName, readPackageScripts } from "./config.js";
import type {
  AgentTarget,
  HarnessConfig,
  PackageManager,
} from "../types/index.js";

export interface ProjectInfo {
  cwd: string;
  projectName: string;
  packageManager: PackageManager;
  hasPackageJson: boolean;
  scripts: Record<string, string>;
  alreadyInitialized: boolean;
  existingConfig: HarnessConfig | null;
}

/** Detecta o gerenciador de pacotes pelo lockfile (default pnpm). */
export async function detectPackageManager(
  cwd: string,
): Promise<PackageManager> {
  const checks: Array<[string, PackageManager]> = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lockb", "bun"],
    ["package-lock.json", "npm"],
  ];
  for (const [file, pm] of checks) {
    if (await fs.pathExists(path.join(cwd, file))) return pm;
  }
  return "pnpm";
}

/** Comando de validação conforme o gerenciador escolhido. */
export function validationCommand(
  pm: PackageManager,
  script: string,
): string {
  if (pm === "pnpm") return `pnpm ${script}`;
  if (pm === "yarn") return `yarn ${script}`;
  return `${pm} run ${script}`; // npm, bun
}

export function buildValidation(
  pm: PackageManager,
): Record<"lint" | "typecheck" | "build" | "test", string> {
  return {
    lint: validationCommand(pm, "lint"),
    typecheck: validationCommand(pm, "typecheck"),
    build: validationCommand(pm, "build"),
    test: validationCommand(pm, "test"),
  };
}

export async function detectProject(cwd: string): Promise<ProjectInfo> {
  const base = resolveProjectPaths(cwd);
  const hasPackageJson = await fs.pathExists(base.packageJson);
  const pkgName = await readPackageName(base.packageJson);
  const scripts = await readPackageScripts(base.packageJson);
  const existingConfig = (await fs.pathExists(base.configFile))
    ? await loadConfig(base.configFile).catch(() => null)
    : null;

  return {
    cwd,
    projectName:
      existingConfig?.projectName || pkgName || path.basename(cwd),
    packageManager:
      existingConfig?.packageManager ?? (await detectPackageManager(cwd)),
    hasPackageJson,
    scripts,
    alreadyInitialized: existingConfig !== null,
    existingConfig,
  };
}

export const ALL_TARGETS: Array<{
  value: AgentTarget;
  label: string;
  hint: string;
  hooks: boolean;
}> = [
  { value: "claude-code", label: "Claude Code", hint: "Anthropic — CLAUDE.md + .claude/", hooks: true },
  { value: "codex", label: "Codex", hint: "OpenAI — AGENTS.md + .codex/", hooks: true },
  { value: "cursor", label: "Cursor", hint: "AGENTS.md/skills (sem instalador de hooks)", hooks: false },
];
