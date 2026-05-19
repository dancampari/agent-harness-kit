import path from "node:path";
import fs from "fs-extra";
import { resolveProjectPaths, rel } from "../core/paths.js";
import { loadConfig } from "../core/config.js";
import { ensureDir, pathExists, readText, writeFileSafe } from "../core/file-system.js";
import { readAcceptanceStatus, timestampedReportName } from "../core/validators.js";
import { profileProject } from "../core/profiler.js";
import { resolveValidationCommands } from "../core/validationResolve.js";
import { readableStamp } from "../core/date.js";
import { logger } from "../core/logger.js";

async function countInstalledSkills(skillsDir: string): Promise<number> {
  if (!(await fs.pathExists(skillsDir))) return 0;
  let n = 0;
  async function walk(d: string): Promise<void> {
    for (const e of (await fs.readdir(d, { withFileTypes: true })) as fs.Dirent[]) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name === "SKILL.md") n += 1;
    }
  }
  await walk(skillsDir);
  return n;
}

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

  const profile = await profileProject(cwd).catch(() => null);
  const resolved = await resolveValidationCommands(config, cwd);
  const skillCount = await countInstalledSkills(paths.skillsDir);

  const stackBlock = profile
    ? [
        `## Stack detectada\n`,
        `- Linguagem: ${profile.language}`,
        `- Gerenciador: ${profile.packageManager ?? "—"}`,
        `- Framework: ${profile.framework ?? "—"}`,
        `- Sinais: ${[
          profile.hasTests && "testes",
          profile.hasDocker && "docker",
          profile.hasCI && "ci/cd",
          profile.hasDatabase && "banco",
          profile.hasFrontend && "frontend",
          profile.hasBackend && "backend",
        ]
          .filter(Boolean)
          .join(", ") || "—"}`,
        "",
      ].join("\n")
    : "## Stack detectada\n\n_(não detectada)_\n";

  const skillsBlock = [
    `## Skills e adapters\n`,
    `- Skills instaladas: ${skillCount}`,
    `- Adapters instalados: ${
      config.installedAdapters.length
        ? config.installedAdapters.join(", ")
        : "nenhum"
    }`,
    `- Adapters sugeridos: ${
      profile?.suggestedAdapters.length
        ? profile.suggestedAdapters
            .map((a) => `${a.name} (${a.confidence})`)
            .join(", ")
        : "nenhum"
    }`,
    "",
  ].join("\n");

  const valBlock = [
    `## Validações disponíveis (${resolved.source})\n`,
    Object.entries(resolved.commands).length
      ? Object.entries(resolved.commands)
          .map(([k, v]) => `- ${k}: \`${v}\``)
          .join("\n")
      : "_(nenhuma detectada/configurada)_",
    "",
    profile && profile.risks.length
      ? `### Riscos universais\n\n${profile.risks
          .map((r) => `- ${r}`)
          .join("\n")}\n`
      : "",
  ].join("\n");

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
    stackBlock,
    skillsBlock,
    valBlock,
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
