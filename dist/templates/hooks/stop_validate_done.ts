/**
 * Hook de exemplo: stop_validate_done
 * ------------------------------------
 * Objetivo: ao FINAL da sessão do agente, rodar checagens leves e avisar
 * se a tarefa não tem relatório ou se os critérios de aceite não foram
 * marcados.
 *
 * - Não roda build/test pesados aqui (use `harness done` para isso).
 * - Exit 0: nada crítico pendente.
 * - Exit 1: alertas (não bloqueia o agente, mas sinaliza).
 *
 * Exemplo local, sem chamadas a API de IA.
 */

import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

const HARNESS = join(process.cwd(), ".harness");

async function exists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const warnings: string[] = [];

  const acceptancePath = join(HARNESS, "acceptance-criteria.md");
  if (!(await exists(acceptancePath))) {
    warnings.push("acceptance-criteria.md ausente — defina critérios de aceite.");
  } else {
    const text = await readFile(acceptancePath, "utf8");
    const unchecked = (text.match(/^\s*[-*]\s*\[ \]/gm) ?? []).length;
    if (unchecked > 0) {
      warnings.push(
        `${unchecked} critério(s) de aceite NÃO marcado(s). Não declare vitória.`,
      );
    }
  }

  const hasDoneReport = await exists(join(HARNESS, "reports", "done-report.md"));
  const hasAnyReport =
    hasDoneReport || (await exists(join(HARNESS, "reports", "latest-report.md")));
  if (!hasAnyReport) {
    warnings.push(
      "Nenhum relatório encontrado. Rode `harness done` ou `harness report`.",
    );
  }

  if (warnings.length === 0) {
    console.error("[harness:stop_validate_done] OK — sem pendências leves.");
    process.exit(0);
  }

  console.error("[harness:stop_validate_done] ⚠ Pendências antes de concluir:");
  for (const w of warnings) console.error(`  - ${w}`);
  console.error("Sugestão: rode `harness done` antes de afirmar conclusão.");
  process.exit(1);
}

main().catch((err) => {
  console.error("[harness:stop_validate_done] erro no hook:", err);
  process.exit(1);
});
