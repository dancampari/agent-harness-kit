import {
  readStdin,
  parseHookPayload,
  agentFromFlag,
  emitJson,
} from "../core/hookIO.js";
import { resolveConfigured } from "../core/resolve.js";
import {
  readActiveRun,
  appendEvent,
  appendCommandLog,
  addChangedFiles,
  updateRun,
} from "../core/runStore.js";

const ERROR_SIGNALS = [
  /\berror\b/i,
  /\bfailed\b/i,
  /\bTS\d{3,}\b/,
  /\bELIFECYCLE\b/,
  /\b\d+ failing\b/i,
];

export interface HookOptions {
  agent?: string;
}

/**
 * `harness hook post-tool --agent <codex|claude>`
 * Registra o evento de uso de ferramenta. Nunca quebra o fluxo do agente:
 * qualquer erro interno resulta em exit 0.
 */
export async function runHookPostTool(options: HookOptions): Promise<void> {
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
    const runId = active.runId;

    await appendEvent(
      paths,
      runId,
      "tool_use",
      agent,
      `Ferramenta: ${payload.toolName || "desconhecida"}`,
      { event: payload.event, success: payload.success },
    );

    if (payload.command) {
      await appendCommandLog(paths, runId, payload.command);
      await appendEvent(paths, runId, "command", agent, payload.command, {
        success: payload.success,
      });
    }

    if (payload.files.length > 0) {
      await addChangedFiles(paths, runId, payload.files);
      await appendEvent(
        paths,
        runId,
        "file_change",
        agent,
        `Arquivos alterados: ${payload.files.join(", ")}`,
        { files: payload.files },
      );
      if (active.status === "created" || active.status === "planning") {
        await updateRun(paths, runId, { status: "implementing" });
      } else {
        await updateRun(paths, runId, { status: "files_changed" });
      }
    }

    const haystack = `${payload.stdout}\n${payload.stderr}`;
    const looksFailed =
      payload.success === false || ERROR_SIGNALS.some((re) => re.test(haystack));
    if (looksFailed) {
      await appendEvent(
        paths,
        runId,
        "error",
        agent,
        `Possível falha em ${payload.toolName || "ferramenta"}`,
        { stderr: payload.stderr.slice(0, 500) },
      );
      // Contexto não-bloqueante para o agente (post-tool nunca bloqueia).
      emitJson({
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          additionalContext:
            "harness detectou possível erro nesta etapa. Reveja antes de prosseguir; a conclusão será validada e poderá ser bloqueada.",
        },
      });
    }

    process.exitCode = 0;
  } catch {
    // Nunca quebrar o agente por erro interno do hook.
    process.exitCode = 0;
  }
}
