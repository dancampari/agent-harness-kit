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

export const SKILL_DIRS = [
  "nextjs-supabase-builder",
  "supabase-rls-reviewer",
  "n8n-evolution-workflow",
  "qa-before-done",
  "multi-tenant-security-reviewer",
  "webhook-idempotency-reviewer",
] as const;

export const HOOK_FILES = [
  "pre_tool_use_policy.ts",
  "post_tool_use_review.ts",
  "stop_validate_done.ts",
] as const;
