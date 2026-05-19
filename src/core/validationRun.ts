import { runCommand } from "./command-runner.js";
import { writeValidationJson, updateRun } from "./runStore.js";
import { resolveValidationCommands } from "./validationResolve.js";
import type { ProjectPaths } from "./paths.js";
import type {
  HarnessConfig,
  RunValidations,
  ValidationDetail,
  ValidationState,
} from "../types/index.js";

const ORDER = ["lint", "typecheck", "build", "test"] as const;

export interface FeatureValidationResult {
  details: ValidationDetail[];
  validations: RunValidations;
  passed: boolean;
}

const MAX_CAPTURE = 8000;

function clamp(text: string): string {
  return text.length > MAX_CAPTURE
    ? `${text.slice(0, MAX_CAPTURE)}\n…[truncado]`
    : text;
}

/**
 * Executa as validações configuradas capturando stdout/stderr/exit code.
 * Scripts ausentes no package.json viram "skipped". Persiste validation.json
 * e atualiza o mapa de validações do run.json.
 */
export async function runFeatureValidation(
  config: HarnessConfig,
  paths: ProjectPaths,
  runId: string,
): Promise<FeatureValidationResult> {
  const resolved = await resolveValidationCommands(config, paths.cwd);
  const commandMap = resolved.commands;
  const keys = [
    ...ORDER.filter((k) => commandMap[k]),
    ...Object.keys(commandMap).filter(
      (k) => !ORDER.includes(k as (typeof ORDER)[number]) && commandMap[k],
    ),
  ];

  const details: ValidationDetail[] = [];
  const validations: RunValidations = {
    lint: "not_run",
    typecheck: "not_run",
    build: "not_run",
    test: "not_run",
  };

  for (const key of keys) {
    const command = commandMap[key];
    if (!command) continue;

    const result = await runCommand(command, paths.cwd);
    const state: ValidationState = result.failed ? "failed" : "passed";
    validations[key] = state;
    details.push({
      name: key,
      command,
      state,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      stdout: clamp(result.stdout),
      stderr: clamp(result.stderr),
    });
  }

  await writeValidationJson(paths, runId, details);
  await updateRun(paths, runId, { validations });

  const passed = details.every((d) => d.state !== "failed");
  return { details, validations, passed };
}
