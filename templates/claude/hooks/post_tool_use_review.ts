/**
 * Claude Code hook: PostToolUse — post_tool_use_review
 * ----------------------------------------------------
 * Registra comandos executados e alerta sobre falhas comuns.
 *
 * Entrada (stdin, JSON do Claude Code), ex.:
 *   { "tool_name": "Bash",
 *     "tool_input": { "command": "pnpm build" },
 *     "tool_response": { "stdout": "...", "stderr": "...", "interrupted": false } }
 *
 * - Acrescenta linha em `.harness/runs/commands.log`.
 * - exit 0 sempre (review observa, não bloqueia).
 *
 * Exemplo local, sem chamadas a API de IA.
 */

import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

interface ClaudePostToolUse {
  tool_name?: string;
  tool_input?: { command?: string; [k: string]: unknown };
  tool_response?: unknown;
}

const FAILURE_SIGNALS = [
  /\berror\b/i,
  /\bfailed\b/i,
  /\bfailing\b/i,
  /\bTS\d{3,}\b/,
  /\bELIFECYCLE\b/,
  /lint .*(problem|error)/i,
  /\b\d+ failing\b/i,
];

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return stripBom(Buffer.concat(chunks).toString("utf8"));
}

/** Remove BOM inicial (alguns shells/pipes o injetam) antes do JSON.parse. */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function flatten(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

async function main(): Promise<void> {
  const raw = await readStdin();
  if (!raw.trim()) process.exit(0);

  let data: ClaudePostToolUse;
  try {
    data = JSON.parse(raw) as ClaudePostToolUse;
  } catch {
    process.exit(0);
  }

  const command = data.tool_input?.command ?? `(${data.tool_name ?? "tool"})`;
  const logPath = join(process.cwd(), ".harness", "runs", "commands.log");
  await mkdir(dirname(logPath), { recursive: true });
  await appendFile(
    logPath,
    `${new Date().toISOString()}\t${data.tool_name ?? "?"}\t${command}\n`,
  );

  const haystack = flatten(data.tool_response);
  if (FAILURE_SIGNALS.some((re) => re.test(haystack))) {
    console.error(
      `[harness:post_tool_use_review] ⚠ possível falha em: ${command}\n` +
        `Não declare a tarefa concluída. Rode \`harness validate\` e revise o output.`,
    );
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("[harness:post_tool_use_review] erro no hook:", err);
  process.exit(0);
});
