import fs from "fs-extra";
import path from "node:path";
import { backupStamp } from "./date.js";
import { logger } from "./logger.js";
import type { WriteResult } from "../types/index.js";

export async function ensureDir(dir: string): Promise<void> {
  await fs.ensureDir(dir);
}

/** Cria diretório e adiciona um .gitkeep para versionar pastas vazias. */
export async function ensureDirWithKeep(dir: string): Promise<void> {
  await fs.ensureDir(dir);
  const keep = path.join(dir, ".gitkeep");
  if (!(await fs.pathExists(keep))) {
    await fs.writeFile(keep, "");
  }
}

export async function pathExists(target: string): Promise<boolean> {
  return fs.pathExists(target);
}

export async function readText(target: string): Promise<string> {
  return fs.readFile(target, "utf8");
}

/**
 * Escreve um arquivo protegendo conteúdo existente.
 * - Se o arquivo não existe: cria.
 * - Se existe e force=false: NÃO sobrescreve (apenas avisa e pula).
 * - Se existe e force=true: cria backup `.bak-<timestamp>` e sobrescreve.
 */
export async function writeFileSafe(
  target: string,
  content: string,
  force = false,
): Promise<WriteResult> {
  const exists = await fs.pathExists(target);
  if (!exists) {
    await fs.ensureDir(path.dirname(target));
    await fs.writeFile(target, content);
    return { path: target, action: "created" };
  }
  if (!force) {
    logger.warn(
      `Já existe: ${path.basename(target)} — preservado (use --force para sobrescrever com backup).`,
    );
    return { path: target, action: "skipped" };
  }
  const backupPath = `${target}.bak-${backupStamp()}`;
  await fs.copy(target, backupPath);
  await fs.writeFile(target, content);
  logger.warn(
    `Sobrescrito: ${path.basename(target)} (backup em ${path.basename(backupPath)}).`,
  );
  return { path: target, action: "overwritten", backupPath };
}

/** Acrescenta conteúdo ao final de um arquivo, criando-o se necessário. */
export async function appendText(target: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(target));
  if (!(await fs.pathExists(target))) {
    await fs.writeFile(target, content);
    return;
  }
  await fs.appendFile(target, content);
}

export async function readJson<T>(target: string): Promise<T> {
  return fs.readJson(target) as Promise<T>;
}

export async function writeJson(target: string, data: unknown): Promise<void> {
  await fs.ensureDir(path.dirname(target));
  await fs.writeJson(target, data, { spaces: 2 });
}
