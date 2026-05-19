import path from "node:path";
import fs from "fs-extra";
import { readableStamp } from "./date.js";
import { runReportPath } from "./runStore.js";
import { readAcceptanceStatus } from "./validators.js";
import type { ProjectPaths } from "./paths.js";
import type {
  Blocker,
  RunRecord,
  ValidationDetail,
} from "../types/index.js";

export interface ReportInput {
  run: RunRecord;
  details: ValidationDetail[];
  blockers: Blocker[];
  changedFiles: string[];
  partial: boolean;
}

function validationsTable(details: ValidationDetail[]): string {
  if (details.length === 0) return "_(nenhuma validação configurada)_";
  const rows = details
    .map((d) => {
      const icon =
        d.state === "passed" ? "✅" : d.state === "failed" ? "❌" : "⏭️";
      const extra =
        d.state === "skipped"
          ? d.skippedReason ?? "pulado"
          : `exit ${d.exitCode ?? "?"} · ${d.durationMs}ms`;
      return `| ${icon} ${d.name} | \`${d.command}\` | ${d.state} | ${extra} |`;
    })
    .join("\n");
  return `| Etapa | Comando | Estado | Detalhe |\n|---|---|---|---|\n${rows}`;
}

function blockersList(blockers: Blocker[]): string {
  if (blockers.length === 0) return "- ✅ Nenhuma pendência crítica.";
  return blockers
    .map(
      (b) =>
        `- ${b.severity === "critical" ? "❌" : "⚠️"} **${b.label}** — ${b.detail}`,
    )
    .join("\n");
}

function fixesList(blockers: Blocker[]): string {
  if (blockers.length === 0) return "- Nada pendente.";
  return blockers.map((b) => `- [ ] Resolver: ${b.label} (${b.detail})`).join("\n");
}

/**
 * Gera o implementation-report.md da execução e atualiza
 * .harness/reports/latest.md. Retorna o caminho do relatório do run.
 */
export async function writeImplementationReport(
  paths: ProjectPaths,
  input: ReportInput,
): Promise<string> {
  const { run, details, blockers, changedFiles, partial } = input;
  const acceptance = await readAcceptanceStatus(paths.acceptanceCriteria);
  let decisions = "";
  try {
    if (await fs.pathExists(paths.decisions)) {
      decisions = (await fs.readFile(paths.decisions, "utf8")).trim();
    }
  } catch {
    /* ignora */
  }

  const filesBlock =
    changedFiles.length > 0
      ? changedFiles.map((f) => `- \`${f}\``).join("\n")
      : "_(nenhum arquivo registrado)_";

  const nextSteps = partial
    ? "- Corrigir os itens de **Correções necessárias**.\n- Rodar novamente o agente ou `harness hook stop` ao finalizar.\n"
    : "- Revisão humana final.\n- Merge/entrega conforme o fluxo do projeto.\n";

  const content = `# Relatório de Implementação — ${run.feature}

- Gerado em: ${readableStamp()}
- Agente: ${run.agent}
- Run: ${run.runId}
- Status final: **${run.status}**${partial ? " (parcial)" : ""}
- Score de qualidade: **${run.score}/100**

## Arquivos alterados

${filesBlock}

## Validações executadas

${validationsTable(details)}

## Falhas encontradas

${blockersList(blockers)}

## Correções necessárias

${fixesList(blockers)}

## Critérios de aceite

${
  acceptance.exists
    ? `${acceptance.checked}/${acceptance.total} marcados${
        acceptance.allChecked ? " ✅" : " — pendentes ❌"
      }`
    : "_(acceptance-criteria.md ausente)_"
}

## Decisões técnicas

${decisions || "_(decisions.md vazio — registre decisões relevantes)_"}

## Próximos passos

${nextSteps}
> Gerado por agent-harness-kit. Não substitui revisão humana.
`;

  const reportPath = runReportPath(paths, run.runId);
  await fs.ensureDir(path.dirname(reportPath));
  await fs.writeFile(reportPath, content);

  await fs.ensureDir(paths.reportsDir);
  await fs.writeFile(paths.reportsLatest, content);

  return reportPath;
}
