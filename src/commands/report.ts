import path from "node:path";
import fs from "fs-extra";
import { resolveProjectPaths, rel } from "../core/paths.js";
import { loadConfig } from "../core/config.js";
import { ensureDir, pathExists, readText, writeFileSafe } from "../core/file-system.js";
import { readAcceptanceStatus, timestampedReportName } from "../core/validators.js";
import { readableStamp } from "../core/date.js";
import { logger } from "../core/logger.js";

async function section(title: string, file: string): Promise<string> {
  if (!(await pathExists(file))) {
    return `## ${title}\n\n_(arquivo ausente: ${path.basename(file)})_\n`;
  }
  const text = (await readText(file)).trim();
  return `## ${title}\n\n${text || "_(vazio)_"}\n`;
}

/**
 * `harness report`
 * Consolida tarefa, critérios, validações, falhas, decisões e próximos
 * passos em um único markdown datado.
 */
export async function runReport(): Promise<void> {
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

  logger.title("harness report");
  await ensureDir(paths.reportsDir);

  const acceptance = await readAcceptanceStatus(paths.acceptanceCriteria);
  const latestValidation = path.join(paths.reportsDir, "latest-validation.md");
  const validationSummary = (await pathExists(latestValidation))
    ? (await readText(latestValidation)).trim()
    : "_(sem validação registrada — rode `harness validate`)_";

  const parts: string[] = [
    `# Relatório Consolidado`,
    "",
    `- Projeto: ${config.projectName || "(sem nome)"}`,
    `- Gerado em: ${readableStamp()}`,
    `- Critérios de aceite: ${
      acceptance.exists
        ? `${acceptance.checked}/${acceptance.total} marcados`
        : "ausente"
    }`,
    "",
    await section("Tarefa atual", paths.currentTask),
    await section("Critérios de aceite", paths.acceptanceCriteria),
    `## Validações executadas\n\n${validationSummary}\n`,
    await section("Falhas registradas", paths.failures),
    await section("Decisões", paths.decisions),
    "## Próximos passos\n\n" +
      (acceptance.allChecked
        ? "- Rodar `harness done` e revisar o done-report.\n"
        : "- Concluir critérios de aceite pendentes.\n- Rodar `harness validate` e `harness done`.\n"),
  ];

  const reportName = timestampedReportName("report");
  const reportPath = path.join(paths.reportsDir, reportName);
  await writeFileSafe(reportPath, parts.join("\n"), true);
  // mantém também um ponteiro estável para o último relatório
  await fs.writeFile(
    path.join(paths.reportsDir, "latest-report.md"),
    parts.join("\n"),
  );

  logger.success(`Relatório gerado: ${rel(cwd, reportPath)}`);
  logger.info(`Atalho: ${rel(cwd, path.join(paths.reportsDir, "latest-report.md"))}`);
}
