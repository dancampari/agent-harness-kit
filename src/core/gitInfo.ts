import { execa } from "execa";

export interface GitChanges {
  available: boolean;
  changed: string[];
  deleted: string[];
}

/**
 * Lê alterações via `git status --porcelain` (best-effort, cross-platform).
 * Degrada com segurança: se git não existir ou não for um repo, retorna
 * available=false e listas vazias — o chamador usa changed-files.json.
 */
export async function gitChanges(cwd: string): Promise<GitChanges> {
  try {
    const result = await execa("git", ["status", "--porcelain"], {
      cwd,
      reject: false,
      windowsHide: true,
    });
    if ((result.exitCode ?? 1) !== 0) {
      return { available: false, changed: [], deleted: [] };
    }
    const changed: string[] = [];
    const deleted: string[] = [];
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
