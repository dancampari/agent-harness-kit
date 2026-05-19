import { readStdin, agentFromFlag } from "../core/hookIO.js";
import { finalizeFeature } from "../core/featureFinalize.js";
import type { HookOptions } from "./hookPostTool.js";

/**
 * `harness hook task-completed --agent claude`
 * Equivalente ao stop, porém específico para o Claude Code: em falha
 * retorna exit code 2 com a mensagem no stderr (Claude devolve ao
 * modelo); em sucesso, exit 0.
 */
export async function runHookTaskCompleted(
  options: HookOptions,
): Promise<void> {
  const agent = agentFromFlag(options.agent ?? "claude");
  try {
    await readStdin();
    const outcome = await finalizeFeature(process.cwd(), agent);

    if (!outcome.hadActiveRun || outcome.passed) {
      process.exitCode = 0;
      return;
    }
    process.stderr.write(`${outcome.reason}\n`);
    process.exitCode = 2;
  } catch (error) {
    process.stderr.write(
      `[harness:hook task-completed] erro interno ignorado: ${
        error instanceof Error ? error.message : String(error)
      }\n`,
    );
    process.exitCode = 0;
  }
}
