import { readStdin, parseHookPayload, agentFromFlag } from "../core/hookIO.js";
import { resolveConfigured } from "../core/resolve.js";
import { readActiveRun, appendEvent, updateRun } from "../core/runStore.js";
import type { HookOptions } from "./hookPostTool.js";

/**
 * `harness hook prompt-submit --agent <codex|claude>`
 * UserPromptSubmit: apenas registra o evento (não bloqueia, sem UI).
 */
export async function runHookPromptSubmit(
  options: HookOptions,
): Promise<void> {
  try {
    const agent = agentFromFlag(options.agent);
    const raw = await readStdin();
    const payload = parseHookPayload(raw, agent);

    const { paths } = await resolveConfigured(process.cwd());
    const active = await readActiveRun(paths);
    if (!active) {
      process.exitCode = 0;
      return;
    }
    await appendEvent(
      paths,
      active.runId,
      "info",
      agent,
      "Prompt enviado ao agente",
      { event: payload.event || "UserPromptSubmit" },
    );
    if (active.status === "created") {
      await updateRun(paths, active.runId, { status: "planning" });
    }
    process.exitCode = 0;
  } catch {
    process.exitCode = 0;
  }
}
