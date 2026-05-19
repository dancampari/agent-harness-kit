import path from "node:path";
import { resolveProjectPaths, rel } from "../core/paths.js";
import { loadConfig } from "../core/config.js";
import { ensureDir, pathExists, writeFileSafe } from "../core/file-system.js";
import {
  runValidation,
  readAcceptanceStatus,
  scanCriticalTodos,
} from "../core/validators.js";
import { readableStamp } from "../core/date.js";
import { logger } from "../core/logger.js";

interface Blocker {
  label: string;
  detail: string;
}

/**
 * `harness done`
 * Verificação anti-vitória-prematura: checa tarefa, critérios de aceite,
 * roda validação e bloqueia a conclusão se algo crítico estiver pendente.
 */
export async function runDone(): Promise<void> {
  const cwd = process.cwd();
  const config = await loadConfig(
    path.join(cwd, ".harness", "harness.config.json"),
  );
  const paths = resolveProjectPaths(
    cwd,
    config.paths.harness,
    config.paths.skills,
    config.paths.codexHooks,
  );

  logger.title("harness done");
  await ensureDir(paths.reportsDir);

  const blockers: Blocker[] = [];

  if (!(await pathExists(paths.currentTask))) {
    blockers.push({
      label: "current-task.md ausente",
      detail: 'Defina a tarefa com `harness task "..."`.',
    });
  }

  const acceptance = await readAcceptanceStatus(paths.acceptanceCriteria);
  if (!acceptance.exists) {
    blockers.push({
      label: "acceptance-criteria.md ausente",
      detail: "Critérios de aceite não foram definidos.",
    });
  } else if (!acceptance.allChecked) {
    blockers.push({
      label: "Critérios de aceite não cumpridos",
      detail: `${acceptance.unchecked} de ${acceptance.total} critério(s) sem marcar.`,
    });
  }

  logger.step("Rodando validações (harness validate)...");
  const validation = await runValidation(config, paths, "latest-validation.md");
  for (const step of validation.steps) {
    if (step.status === "failed") {
      blockers.push({
        label: `Validação falhou: ${step.name}`,
        detail: `\`${step.command}\` (exit ${step.exitCode ?? "?"})`,
      });
    }
  }

  const todos = await scanCriticalTodos(cwd);
  if (todos.count > 0) {
    blockers.push({
      label: "TODOs/FIXMEs críticos no código",
      detail: `${todos.count} marcador(es) em: ${todos.files.join(", ") || "vários arquivos"}`,
    });
  }

  const passed = blockers.length === 0;
  const reportPath = path.join(paths.reportsDir, "done-report.md");
  await writeDoneReport(reportPath, config.projectName, passed, blockers, {
    acceptance: acceptance.exists
      ? `${acceptance.checked}/${acceptance.total} marcados`
      : "ausente",
    validation: validation.passed ? "passou" : "falhou",
    todos: todos.count,
  });

  logger.plain();
  if (passed) {
    logger.success("Critérios de pronto satisfeitos. Tarefa pode ser concluída.");
    logger.info(`Relatório: ${rel(cwd, reportPath)}`);
    process.exitCode = 0;
    return;
  }

  logger.error("NÃO declare vitória. Pendências críticas encontradas:");
  for (const b of blockers) {
    logger.plain(`  ❌ ${b.label} — ${b.detail}`);
  }
  logger.info(`Relatório: ${rel(cwd, reportPath)}`);
  process.exitCode = 1;
}

async function writeDoneReport(
  reportPath: string,
  projectName: string,
  passed: boolean,
  blockers: Blocker[],
  summary: { acceptance: string; validation: string; todos: number },
): Promise<void> {
  const blockerList = blockers.length
    ? blockers.map((b) => `- ❌ **${b.label}** — ${b.detail}`).join("\n")
    : "- ✅ Nenhuma pendência crítica.";

  const content = `# Done Report

- Projeto: ${projectName || "(sem nome)"}
- Gerado em: ${readableStamp()}
- Veredito: ${passed ? "✅ PRONTO PARA CONCLUIR" : "❌ NÃO CONCLUIR AINDA"}

## Resumo

| Item | Estado |
|---|---|
| Critérios de aceite | ${summary.acceptance} |
| Validação | ${summary.validation} |
| TODOs críticos | ${summary.todos} |

## Pendências

${blockerList}

## Lembrete (AGENTS.md)

O agente não deve declarar vitória se: build falhou, lint falhou,
typecheck falhou, testes falharam, critérios de aceite não foram
marcados, há TODOs críticos ou há arquivos modificados sem explicação.
`;
  await writeFileSafe(reportPath, content, true);
}
