import { readStdin, agentFromFlag, emitBlock } from "../core/hookIO.js";
import { finalizeFeature } from "../core/featureFinalize.js";
import type { HookOptions } from "./hookPostTool.js";

/**
 * `harness hook stop --agent <codex|claude>`
 * Detecta a tentativa de finalizar a feature. Sem execução ativa →
 * sucesso sem bloquear. Com execução ativa → valida e, se houver
 * pendências, devolve `{decision:"block",reason}` (Codex e Claude).
 */
export async function runHookStop(options: HookOptions): Promise<void> {
  const agent = agentFromFlag(options.agent);
  try {
    await readStdin(); // consome o payload (não é necessário processá-lo)
    const outcome = await finalizeFeature(process.cwd(), agent);

    if (!outcome.hadActiveRun) {
      process.exitCode = 0;
      return;
    }
    if (outcome.passed) {
      process.exitCode = 0;
      return;
    }
    emitBlock(outcome.reason);
    process.exitCode = 0;
  } catch (error) {
    // Erro interno do hook não deve travar o agente para sempre.
    process.stderr.write(
      `[harness:hook stop] erro interno ignorado: ${
        error instanceof Error ? error.message : String(error)
      }\n`,
    );
    process.exitCode = 0;
  }
}
