import { loadConfig } from "./config.js";
import { resolveProjectPaths, type ProjectPaths } from "./paths.js";
import type { HarnessConfig } from "../types/index.js";

/**
 * Resolve os caminhos do projeto aplicando o harness.config.json quando
 * existir (caso contrário usa os defaults). Nunca lança.
 */
export async function resolveConfigured(
  cwd: string,
): Promise<{ paths: ProjectPaths; config: HarnessConfig | null }> {
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
      config.paths.claudeHooks,
    ),
    config,
  };
}
