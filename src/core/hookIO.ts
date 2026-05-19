import type { AgentKind } from "../types/index.js";

export interface ParsedHookPayload {
  raw: Record<string, unknown>;
  event: string;
  toolName: string;
  command: string | null;
  files: string[];
  success: boolean | null;
  stdout: string;
  stderr: string;
  stopHookActive: boolean;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Lê todo o stdin (tolerante a BOM e a ausência de pipe). */
export async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return stripBom(Buffer.concat(chunks).toString("utf8")).trim();
}

function asString(value: unknown): string {
  if (value == null) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] != null) return obj[key];
  }
  return undefined;
}

/**
 * Normaliza payloads de hook do Codex e do Claude Code num formato único.
 * É tolerante: campos ausentes viram valores neutros (nunca lança).
 */
export function parseHookPayload(
  raw: string,
  agent: AgentKind,
): ParsedHookPayload {
  let data: Record<string, unknown> = {};
  try {
    if (raw) data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    data = {};
  }

  const toolInput = (pick(data, ["tool_input", "input", "arguments"]) ??
    {}) as Record<string, unknown>;
  const toolResponse = (pick(data, ["tool_response", "response", "result"]) ??
    {}) as Record<string, unknown>;

  const event = asString(
    pick(data, ["hook_event_name", "event", "eventName", "type"]),
  );
  const toolName = asString(pick(data, ["tool_name", "tool", "toolName"]));

  const command = (() => {
    const c = pick(toolInput, ["command", "cmd", "script"]);
    if (c) return asString(c);
    const top = pick(data, ["command", "cmd"]);
    return top ? asString(top) : null;
  })();

  const files: string[] = [];
  for (const key of ["file_path", "filePath", "path", "notebook_path"]) {
    const v = toolInput[key];
    if (typeof v === "string" && v.trim()) files.push(v);
  }
  const edits = toolInput["edits"];
  if (Array.isArray(edits)) {
    for (const e of edits) {
      const fp = (e as Record<string, unknown>)?.["file_path"];
      if (typeof fp === "string") files.push(fp);
    }
  }

  const exitCode = pick({ ...toolResponse, ...data }, [
    "exit_code",
    "exitCode",
    "code",
  ]);
  const successFlag = pick({ ...toolResponse, ...data }, [
    "success",
    "ok",
    "passed",
  ]);
  let success: boolean | null = null;
  if (typeof successFlag === "boolean") success = successFlag;
  else if (typeof exitCode === "number") success = exitCode === 0;

  return {
    raw: data,
    event,
    toolName,
    command,
    files: [...new Set(files)],
    success,
    stdout: asString(pick(toolResponse, ["stdout", "output", "content"])),
    stderr: asString(pick(toolResponse, ["stderr", "error"])),
    stopHookActive: data["stop_hook_active"] === true,
  };
}

/** Escreve um JSON no stdout (mecanismo de decisão dos hooks). */
export function emitJson(obj: unknown): void {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

/** Decisão de bloqueio (Codex e Claude usam `{decision,reason}` no stdout). */
export function emitBlock(reason: string): void {
  emitJson({ decision: "block", reason });
}

/** Saída neutra que não bloqueia o agente. */
export function emitPassthrough(extra?: Record<string, unknown>): void {
  emitJson({ decision: undefined, ...(extra ?? {}) });
}

export function agentFromFlag(value: string | undefined): AgentKind {
  const v = (value ?? "").toLowerCase();
  if (v === "claude" || v === "claude-code") return "claude";
  if (v === "codex") return "codex";
  return "manual";
}
