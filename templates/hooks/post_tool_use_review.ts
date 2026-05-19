/**
 * Hook de exemplo: post_tool_use_review
 * --------------------------------------
 * Objetivo: registrar comandos executados e alertar sobre falhas comuns.
 *
 * - Acrescenta uma linha em `.harness/runs/commands.log`.
 * - Detecta sinais de falha no output (build/lint/test).
 * - Exit 0 sempre (review não bloqueia; apenas observa e alerta).
 *
 * Exemplo local, sem chamadas a API de IA.
 */

import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

interface PostPayload {
  command?: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
}

const FAILURE_SIGNALS = [
  /\berror\b/i,
  /\bfailed\b/i,
  /\bfailing\b/i,
  /\bTS\d{3,}\b/, // erros do TypeScript
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

function parse(raw: string): PostPayload {
  try {
    return JSON.parse(raw) as PostPayload;
  } catch {
    return { command: raw.trim() };
  }
}

async function main(): Promise<void> {
  const payload = parse(await readStdin());
  const command = payload.command ?? process.argv.slice(2).join(" ");
  if (!command) process.exit(0);

  const logPath = join(process.cwd(), ".harness", "runs", "commands.log");
  await mkdir(dirname(logPath), { recursive: true });
  const stamp = new Date().toISOString();
  await appendFile(
    logPath,
    `${stamp}\tcode=${payload.exitCode ?? "?"}\t${command}\n`,
  );

  const haystack = `${payload.stdout ?? ""}\n${payload.stderr ?? ""}`;
  const failedByCode =
    typeof payload.exitCode === "number" && payload.exitCode !== 0;
  const failedBySignal = FAILURE_SIGNALS.some((re) => re.test(haystack));

  if (failedByCode || failedBySignal) {
    console.error(
      `[harness:post_tool_use_review] ⚠ possível falha detectada em: ${command}\n` +
        `Não declare a tarefa concluída. Rode \`harness validate\` e revise o output.`,
    );
  } else {
    console.error("[harness:post_tool_use_review] registrado.");
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("[harness:post_tool_use_review] erro no hook:", err);
  process.exit(0);
});
