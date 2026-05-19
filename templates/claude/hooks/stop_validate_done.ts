/**
 * Claude Code hook: Stop — stop_validate_done
 * -------------------------------------------
 * Ao tentar encerrar, faz checagens leves e BLOQUEIA a parada se houver
 * pendência crítica (critérios de aceite não marcados / sem relatório).
 *
 * Entrada (stdin, JSON do Claude Code), ex.:
 *   { "hook_event_name": "Stop", "stop_hook_active": false }
 *
 * Saída:
 *   - exit 0  => pode parar (sem pendência, ou já em loop de stop hook)
 *   - exit 2  => NÃO pode parar; stderr volta ao Claude para concluir o QA
 *
 * `stop_hook_active` é respeitado para evitar loop infinito de Stop.
 * Exemplo local, sem chamadas a API de IA.
 */

import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

const HARNESS = join(process.cwd(), ".harness");

interface ClaudeStop {
  stop_hook_active?: boolean;
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

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

async function collectWarnings(): Promise<string[]> {
  const warnings: string[] = [];
  const acceptancePath = join(HARNESS, "acceptance-criteria.md");
  if (!(await exists(acceptancePath))) {
    warnings.push("acceptance-criteria.md ausente — defina critérios de aceite.");
  } else {
    const text = await readFile(acceptancePath, "utf8");
    const unchecked = (text.match(/^\s*[-*]\s*\[ \]/gm) ?? []).length;
    if (unchecked > 0) {
      warnings.push(`${unchecked} critério(s) de aceite NÃO marcado(s).`);
    }
  }
  const hasReport =
    (await exists(join(HARNESS, "reports", "done-report.md"))) ||
    (await exists(join(HARNESS, "reports", "latest-report.md")));
  if (!hasReport) {
    warnings.push("Nenhum relatório — rode `harness done` ou `harness report`.");
  }
  return warnings;
}

async function main(): Promise<void> {
  let payload: ClaudeStop = {};
  try {
    const raw = await readStdin();
    if (raw.trim()) payload = JSON.parse(raw) as ClaudeStop;
  } catch {
    /* segue com payload vazio */
  }

  const warnings = await collectWarnings();
  if (warnings.length === 0) {
    process.exit(0);
  }

  const message =
    "[harness:stop_validate_done] Pendências antes de concluir:\n" +
    warnings.map((w) => `  - ${w}`).join("\n") +
    "\nResolva os itens e rode `harness done` antes de finalizar.";

  // Evita loop infinito: se já estamos dentro de um stop hook ativo, apenas
  // avisa e permite parar.
  if (payload.stop_hook_active === true) {
    console.error(message);
    process.exit(0);
  }

  console.error(message);
  process.exit(2); // bloqueia a parada e devolve a mensagem ao Claude
}

main().catch((err) => {
  console.error("[harness:stop_validate_done] erro no hook:", err);
  process.exit(0);
});
