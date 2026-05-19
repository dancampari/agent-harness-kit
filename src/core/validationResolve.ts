import { profileProject } from "./profiler.js";
import type { HarnessConfig } from "../types/index.js";

export interface ResolvedValidation {
  commands: Record<string, string>;
  source: "configured" | "detected" | "none";
}

/**
 * Resolve os comandos de validação de forma adaptativa:
 *  1. `validation.commands` explícitos vencem (configurado pelo usuário).
 *  2. Senão, se `validation.autoDetect`, usa o que o profiler detectou.
 *  3. Senão, vazio (nada a validar).
 * Nunca assume stack.
 */
export async function resolveValidationCommands(
  config: HarnessConfig,
  cwd: string,
): Promise<ResolvedValidation> {
  const configured = config.validation?.commands ?? {};
  if (Object.keys(configured).length > 0) {
    return { commands: { ...configured }, source: "configured" };
  }
  if (config.validation?.autoDetect !== false) {
    const profile = await profileProject(cwd);
    if (Object.keys(profile.validationCommands).length > 0) {
      return { commands: { ...profile.validationCommands }, source: "detected" };
    }
  }
  return { commands: {}, source: "none" };
}
