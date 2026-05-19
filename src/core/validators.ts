import path from "node:path";
import fs from "fs-extra";
import { runCommand } from "./command-runner.js";
import { resolveValidationCommands } from "./validationResolve.js";
import { readableStamp, fileStamp } from "./date.js";
import { writeFileSafe, pathExists, readText } from "./file-system.js";
import { logger, spinner } from "./logger.js";
import type {
  HarnessConfig,
  ValidationRunResult,
  ValidationStepResult,
} from "../types/index.js";
import type { ProjectPaths } from "./paths.js";

const VALIDATION_ORDER = ["lint", "typecheck", "build", "test"] as const;

/**
 * Executa os comandos de validação configurados. Comandos cujo script
 * correspondente não existe no package.json são pulados com aviso.
 */
export async function runValidation(
  config: HarnessConfig,
  paths: ProjectPaths,
  reportFileName = "latest-validation.md",
): Promise<ValidationRunResult> {
  const resolved = await resolveValidationCommands(config, paths.cwd);
  const commandMap = resolved.commands;
  const steps: ValidationStepResult[] = [];

  const keys = [
    ...VALIDATION_ORDER.filter((k) => commandMap[k]),
    ...Object.keys(commandMap).filter(
      (k) => !VALIDATION_ORDER.includes(k as (typeof VALIDATION_ORDER)[number]),
    ),
  ];

  if (keys.length === 0) {
    logger.warn(
      "Nenhum comando de validação detectado/configurado. " +
        "Defina validation.commands em harness.config.json ou use um adapter.",
    );
  }

  for (const key of keys) {
    const command = commandMap[key];
    if (!command) continue;

    const spin = spinner(`Validando: ${key} (${command})`).start();
    const result = await runCommand(command, paths.cwd);
    if (result.failed) {
      spin.fail(`${key} falhou (exit ${result.exitCode ?? "?"})`);
    } else {
      spin.succeed(`${key} ok`);
    }
    steps.push({
      name: key,
      command,
      status: result.failed ? "failed" : "passed",
      exitCode: result.exitCode,
      durationMs: result.durationMs,
    });
  }

  const passed = steps.every((s) => s.status !== "failed");
  const reportPath = path.join(paths.reportsDir, reportFileName);
  await writeValidationReport(reportPath, config, steps, passed);

  return { steps, passed, reportPath };
}

async function writeValidationReport(
  reportPath: string,
  config: HarnessConfig,
  steps: ValidationStepResult[],
  passed: boolean,
): Promise<void> {
  const rows = steps
    .map((s) => {
      const icon =
        s.status === "passed" ? "✅" : s.status === "failed" ? "❌" : "⏭️";
      const extra =
        s.status === "skipped"
          ? s.skippedReason ?? "pulado"
          : `exit ${s.exitCode ?? "?"} · ${s.durationMs}ms`;
      return `| ${icon} ${s.name} | \`${s.command}\` | ${s.status} | ${extra} |`;
    })
    .join("\n");

  const content = `# Relatório de Validação

- Projeto: ${config.projectName || "(sem nome)"}
- Gerado em: ${readableStamp()}
- Resultado geral: ${passed ? "✅ PASSOU" : "❌ FALHOU"}

| Etapa | Comando | Status | Detalhe |
|---|---|---|---|
${rows || "| (nenhuma etapa configurada) | - | - | - |"}

> Gerado por agent-harness-kit. Não substitui revisão humana nem a definição de pronto em AGENTS.md.
`;
  await writeFileSafe(reportPath, content, true);
}

export interface AcceptanceStatus {
  exists: boolean;
  total: number;
  checked: number;
  unchecked: number;
  allChecked: boolean;
}

/** Conta checkboxes marcados/desmarcados em acceptance-criteria.md. */
export async function readAcceptanceStatus(
  acceptancePath: string,
): Promise<AcceptanceStatus> {
  if (!(await pathExists(acceptancePath))) {
    return { exists: false, total: 0, checked: 0, unchecked: 0, allChecked: false };
  }
  const text = await readText(acceptancePath);
  const checked = (text.match(/^\s*[-*]\s*\[[xX]\]/gm) ?? []).length;
  const unchecked = (text.match(/^\s*[-*]\s*\[ \]/gm) ?? []).length;
  const total = checked + unchecked;
  return {
    exists: true,
    total,
    checked,
    unchecked,
    allChecked: total > 0 && unchecked === 0,
  };
}

export interface TodoScan {
  count: number;
  files: string[];
}

const SCAN_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".vue", ".svelte", ".py", ".go",
]);
const SCAN_IGNORE = new Set([
  "node_modules", ".git", "dist", "build", ".next", "coverage", ".turbo",
  ".harness", ".agents", ".codex",
]);

/** Procura marcadores críticos (TODO/FIXME/XXX/HACK) no código-fonte. */
export async function scanCriticalTodos(
  cwd: string,
  maxFiles = 2000,
): Promise<TodoScan> {
  const pattern = /\b(TODO|FIXME|XXX|HACK)\b/;
  const files: string[] = [];
  let count = 0;
  let visited = 0;

  async function walk(dir: string): Promise<void> {
    if (visited >= maxFiles) return;
    let entries: fs.Dirent[];
    try {
      entries = (await fs.readdir(dir, { withFileTypes: true })) as fs.Dirent[];
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SCAN_IGNORE.has(entry.name)) continue;
        await walk(full);
      } else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
        visited += 1;
        if (visited >= maxFiles) return;
        try {
          const text = await fs.readFile(full, "utf8");
          const matches = text.match(new RegExp(pattern, "g"));
          if (matches) {
            count += matches.length;
            files.push(path.relative(cwd, full).split(path.sep).join("/"));
          }
        } catch {
          /* ignora arquivos ilegíveis */
        }
      }
    }
  }

  await walk(cwd);
  return { count, files: files.slice(0, 20) };
}

export function timestampedReportName(prefix: string): string {
  return `${prefix}-${fileStamp()}.md`;
}
