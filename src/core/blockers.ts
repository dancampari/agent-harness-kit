import path from "node:path";
import fs from "fs-extra";
import { readAcceptanceStatus, scanCriticalTodos } from "./validators.js";
import { gitChanges } from "./gitInfo.js";
import type { ProjectPaths } from "./paths.js";
import type {
  Blocker,
  HarnessConfig,
  ValidationDetail,
} from "../types/index.js";

export interface BlockerEvaluation {
  blockers: Blocker[];
  score: number;
  changedFiles: string[];
  deletedFiles: string[];
  acceptanceAllChecked: boolean;
}

const ENV_RE = /(^|[\\/])\.env(\.|$)/i;
const MIGRATION_RE = /migrations?[\\/]/i;
const AUTH_RE = /(auth|rls|policy|policies|middleware|session|permission)/i;
const WEBHOOK_RE = /webhook/i;
const IDEMPOTENT_RE = /(idempoten|dedupe|deduplicat|event[_-]?id|already.?processed)/i;
const TENANT_RE = /tenant_id/i;
const CREATE_TABLE_RE = /create\s+table/i;

async function readIfExists(file: string): Promise<string> {
  try {
    if (!(await fs.pathExists(file))) return "";
    const stat = await fs.stat(file);
    if (!stat.isFile() || stat.size > 1_000_000) return "";
    return await fs.readFile(file, "utf8");
  } catch {
    return "";
  }
}

function hasRealDecisionEntry(decisionsText: string): boolean {
  // Considera "registro real" uma entrada ADR datada (## YYYY-MM-DD ...).
  return /^##\s+\d{4}-\d{2}-\d{2}/m.test(decisionsText);
}

/**
 * Avalia os critérios de bloqueio no fim da feature e calcula um score.
 * Heurísticas de conteúdo (RLS/tenant/webhook) são best-effort e
 * propositalmente conservadoras — sinalizam para revisão, não acusam.
 */
export async function evaluateBlockers(
  paths: ProjectPaths,
  _config: HarnessConfig,
  details: ValidationDetail[],
  recordedFiles: string[],
): Promise<BlockerEvaluation> {
  const blockers: Blocker[] = [];

  // 1. Validações que falharam
  for (const d of details) {
    if (d.state === "failed") {
      blockers.push({
        id: `validation-${d.name}`,
        label: `Validação falhou: ${d.name}`,
        detail: `\`${d.command}\` (exit ${d.exitCode ?? "?"})`,
        severity: "critical",
      });
    }
  }

  // 2. Critérios de aceite
  const acceptance = await readAcceptanceStatus(paths.acceptanceCriteria);
  if (!acceptance.exists) {
    blockers.push({
      id: "acceptance-missing",
      label: "Critérios de aceite ausentes",
      detail: "acceptance-criteria.md não encontrado.",
      severity: "critical",
    });
  } else if (!acceptance.allChecked) {
    blockers.push({
      id: "acceptance-unchecked",
      label: "Critérios de aceite não cumpridos",
      detail: `${acceptance.unchecked}/${acceptance.total} sem marcar.`,
      severity: "critical",
    });
  }

  // Conjunto de arquivos alterados (git + registrados nos eventos)
  const git = await gitChanges(paths.cwd);
  const changedFiles = [
    ...new Set([...git.changed, ...recordedFiles]),
  ].filter(Boolean);
  const deletedFiles = [...new Set(git.deleted)];

  // 3. .env alterado/removido
  const envTouched = [...changedFiles, ...deletedFiles].filter((f) =>
    ENV_RE.test(f),
  );
  if (envTouched.length > 0) {
    blockers.push({
      id: "env-changed",
      label: ".env foi alterado",
      detail: envTouched.join(", "),
      severity: "critical",
    });
  }

  // 4. Migrations apagadas
  const migrationsDeleted = deletedFiles.filter((f) => MIGRATION_RE.test(f));
  if (migrationsDeleted.length > 0) {
    blockers.push({
      id: "migrations-deleted",
      label: "Migrations foram apagadas",
      detail: migrationsDeleted.join(", "),
      severity: "critical",
    });
  }

  // 5. TODO crítico
  const todos = await scanCriticalTodos(paths.cwd);
  if (todos.count > 0) {
    blockers.push({
      id: "critical-todo",
      label: "TODO/FIXME crítico no código",
      detail: `${todos.count} marcador(es): ${todos.files.slice(0, 5).join(", ")}`,
      severity: "critical",
    });
  }

  // 6. auth/RLS alterado sem registro em decisions.md
  const authChanged = changedFiles.filter((f) => AUTH_RE.test(f));
  if (authChanged.length > 0) {
    const decisionsText = await readIfExists(paths.decisions);
    if (!hasRealDecisionEntry(decisionsText)) {
      blockers.push({
        id: "auth-without-decision",
        label: "Alteração de auth/RLS sem registro em decisions.md",
        detail: authChanged.slice(0, 5).join(", "),
        severity: "critical",
      });
    }
  }

  // 7. Multi-tenant: CREATE TABLE sem tenant_id em arquivos SQL alterados
  const sqlChanged = changedFiles.filter((f) => /\.sql$/i.test(f));
  for (const rel of sqlChanged.slice(0, 30)) {
    const content = await readIfExists(path.join(paths.cwd, rel));
    if (CREATE_TABLE_RE.test(content) && !TENANT_RE.test(content)) {
      blockers.push({
        id: "tenant-missing",
        label: "Tabela criada sem tenant_id (multi-tenant)",
        detail: rel,
        severity: "critical",
      });
    }
  }

  // 8. Webhook sem idempotência
  const webhookChanged = changedFiles.filter(
    (f) => WEBHOOK_RE.test(f) && /\.(t|j)sx?$/i.test(f),
  );
  for (const rel of webhookChanged.slice(0, 30)) {
    const content = await readIfExists(path.join(paths.cwd, rel));
    if (content && !IDEMPOTENT_RE.test(content)) {
      blockers.push({
        id: "webhook-no-idempotency",
        label: "Webhook sem idempotência aparente",
        detail: rel,
        severity: "critical",
      });
    }
  }

  const critical = blockers.filter((b) => b.severity === "critical").length;
  const warning = blockers.filter((b) => b.severity === "warning").length;
  const failedValidations = details.filter((d) => d.state === "failed").length;
  const score = Math.max(
    0,
    Math.min(
      100,
      100 - critical * 20 - warning * 8 - failedValidations * 5,
    ),
  );

  return {
    blockers,
    score,
    changedFiles,
    deletedFiles,
    acceptanceAllChecked: acceptance.allChecked,
  };
}
