import { z } from "zod";
import path from "node:path";
import fs from "fs-extra";
import type { AgentTarget, HarnessConfig } from "../types/index.js";

export const validationSchema = z
  .object({
    autoDetect: z.boolean().default(true),
    commands: z.record(z.string()).default({}),
  })
  .default({ autoDetect: true, commands: {} });

export const harnessConfigSchema = z.object({
  projectName: z.string().default(""),
  agentTargets: z
    .array(z.enum(["codex", "claude-code", "cursor"]))
    .min(1)
    .default(["codex"]),
  mode: z.string().default("universal"),
  installedAdapters: z.array(z.string()).default([]),
  // Opcional: dica de gerenciador. Não assume stack — apenas acelera a
  // detecção quando já é conhecido.
  packageManager: z
    .enum(["pnpm", "npm", "yarn", "bun"])
    .optional(),
  validation: validationSchema,
  paths: z
    .object({
      harness: z.string().default(".harness"),
      skills: z.string().default(".agents/skills"),
      codexHooks: z.string().default(".codex/hooks"),
      claudeSkills: z.string().default(".claude/skills"),
      claudeHooks: z.string().default(".claude/hooks"),
    })
    .default({
      harness: ".harness",
      skills: ".agents/skills",
      codexHooks: ".codex/hooks",
      claudeSkills: ".claude/skills",
      claudeHooks: ".claude/hooks",
    }),
});

export function parseHarnessConfig(raw: unknown): HarnessConfig {
  return harnessConfigSchema.parse(raw) as HarnessConfig;
}

export function defaultConfig(
  projectName: string,
  agentTargets?: AgentTarget[],
): HarnessConfig {
  const seed: Record<string, unknown> = {
    projectName,
    mode: "universal",
    installedAdapters: [],
    validation: { autoDetect: true, commands: {} },
  };
  if (agentTargets && agentTargets.length > 0) {
    seed.agentTargets = agentTargets;
  }
  return harnessConfigSchema.parse(seed) as HarnessConfig;
}

const VALID_TARGETS: AgentTarget[] = ["codex", "claude-code", "cursor"];

/** Faz parse de uma lista CSV de alvos (ex.: "codex,claude-code"). */
export function parseAgentTargets(input: string): AgentTarget[] {
  // Aceita vírgula e/ou espaço como separador: o PowerShell, sem aspas,
  // expande "a,b" em argumentos separados — tolerar isso evita erro chato.
  const parsed = input
    .split(/[\s,]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .map((t) => (t === "claude" ? "claude-code" : t));
  const targets = parsed.filter((t): t is AgentTarget =>
    (VALID_TARGETS as string[]).includes(t),
  );
  const invalid = parsed.filter(
    (t) => !(VALID_TARGETS as string[]).includes(t),
  );
  if (invalid.length > 0) {
    throw new Error(
      `Alvo(s) inválido(s): ${invalid.join(", ")}. ` +
        `Use: ${VALID_TARGETS.join(", ")}.`,
    );
  }
  return [...new Set(targets)];
}

/**
 * Carrega e valida o harness.config.json do projeto.
 * Lança erro claro caso o arquivo não exista ou seja inválido.
 */
export async function loadConfig(configFile: string): Promise<HarnessConfig> {
  if (!(await fs.pathExists(configFile))) {
    throw new Error(
      `harness.config.json não encontrado em ${configFile}. Rode \`harness init\` primeiro.`,
    );
  }
  let raw: unknown;
  try {
    raw = await fs.readJson(configFile);
  } catch {
    throw new Error(`harness.config.json inválido (JSON malformado): ${configFile}`);
  }
  const result = harnessConfigSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(raiz)"}: ${i.message}`)
      .join("\n");
    throw new Error(`harness.config.json inválido:\n${issues}`);
  }
  return result.data as HarnessConfig;
}

/** Lê os scripts declarados no package.json do projeto (vazio se não houver). */
export async function readPackageScripts(
  packageJson: string,
): Promise<Record<string, string>> {
  if (!(await fs.pathExists(packageJson))) return {};
  try {
    const pkg = (await fs.readJson(packageJson)) as {
      scripts?: Record<string, string>;
    };
    return pkg.scripts ?? {};
  } catch {
    return {};
  }
}

export async function readPackageName(packageJson: string): Promise<string> {
  if (!(await fs.pathExists(packageJson))) return "";
  try {
    const pkg = (await fs.readJson(packageJson)) as { name?: string };
    return pkg.name ?? "";
  } catch {
    return "";
  }
}

export function inferProjectName(cwd: string, pkgName: string): string {
  return pkgName || path.basename(cwd);
}
