import path from "node:path";
import fs from "fs-extra";
import { getTemplatesDir } from "./paths.js";
import { writeFileSafe } from "./file-system.js";
import type { WriteResult } from "../types/index.js";

/** Lê o conteúdo bruto de um template (caminho relativo a templates/). */
export async function readTemplate(relPath: string): Promise<string> {
  const full = path.join(getTemplatesDir(), relPath);
  if (!(await fs.pathExists(full))) {
    throw new Error(`Template ausente: ${relPath}`);
  }
  return fs.readFile(full, "utf8");
}

/** Substitui placeholders {{CHAVE}} pelo valor informado. */
export function renderTemplate(
  content: string,
  vars: Record<string, string>,
): string {
  return content.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (match, key: string) => {
    return key in vars ? vars[key]! : match;
  });
}

/**
 * Copia um template para o destino aplicando placeholders e a proteção
 * contra sobrescrita de writeFileSafe.
 */
export async function materializeTemplate(
  relPath: string,
  target: string,
  vars: Record<string, string> = {},
  force = false,
): Promise<WriteResult> {
  const raw = await readTemplate(relPath);
  const content = renderTemplate(raw, vars);
  return writeFileSafe(target, content, force);
}

/** Caminho POSIX relativo (sempre com "/"). */
function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

/**
 * Lista recursivamente todos os SKILL.md sob `templates/skills`,
 * retornando caminhos relativos a `templates/` (ex.:
 * "skills/core/project-discovery/SKILL.md"). Universal: não há lista
 * fixa de skills no código — a categoria é a estrutura de pastas.
 */
export async function listCoreSkillTemplates(): Promise<string[]> {
  const root = path.join(getTemplatesDir(), "skills");
  if (!(await fs.pathExists(root))) return [];
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    const entries = (await fs.readdir(dir, {
      withFileTypes: true,
    })) as fs.Dirent[];
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name === "SKILL.md") {
        out.push(toPosix(path.relative(getTemplatesDir(), full)));
      }
    }
  }
  await walk(root);
  return out.sort();
}

/** Subcaminho da skill relativo a `skills/` (ex.: "core/x/SKILL.md"). */
export function skillSubPath(relTemplatePath: string): string {
  return relTemplatePath.replace(/^skills\//, "");
}

export interface AdapterManifest {
  name: string;
  description: string;
  detect?: { files?: string[]; dependencies?: string[] };
  skills?: string[];
}

/** Lista os nomes de adapters disponíveis no pacote. */
export async function listAdapters(): Promise<string[]> {
  const root = path.join(getTemplatesDir(), "adapters");
  if (!(await fs.pathExists(root))) return [];
  const entries = (await fs.readdir(root, {
    withFileTypes: true,
  })) as fs.Dirent[];
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

export async function readAdapterManifest(
  name: string,
): Promise<AdapterManifest | null> {
  const file = path.join(getTemplatesDir(), "adapters", name, "adapter.json");
  if (!(await fs.pathExists(file))) return null;
  try {
    return (await fs.readJson(file)) as AdapterManifest;
  } catch {
    return null;
  }
}

/**
 * Lista os SKILL.md de um adapter, relativos a `templates/`
 * (ex.: "adapters/nextjs/skills/x/SKILL.md").
 */
export async function listAdapterSkillTemplates(
  name: string,
): Promise<string[]> {
  const root = path.join(getTemplatesDir(), "adapters", name, "skills");
  if (!(await fs.pathExists(root))) return [];
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    const entries = (await fs.readdir(dir, {
      withFileTypes: true,
    })) as fs.Dirent[];
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name === "SKILL.md") {
        out.push(toPosix(path.relative(getTemplatesDir(), full)));
      }
    }
  }
  await walk(root);
  return out.sort();
}

export const HOOK_FILES = [
  "pre_tool_use_policy.ts",
  "post_tool_use_review.ts",
  "stop_validate_done.ts",
] as const;
