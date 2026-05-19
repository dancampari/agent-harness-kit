export type AgentTarget = "codex" | "claude-code" | "cursor";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export interface ValidationCommands {
  lint?: string;
  typecheck?: string;
  build?: string;
  test?: string;
  [key: string]: string | undefined;
}

export interface HarnessPaths {
  harness: string;
  skills: string;
  codexHooks: string;
  claudeSkills: string;
  claudeHooks: string;
}

export interface HarnessConfig {
  projectName: string;
  agentTargets: AgentTarget[];
  packageManager: PackageManager;
  validation: ValidationCommands;
  paths: HarnessPaths;
}

export interface ValidationStepResult {
  name: string;
  command: string;
  status: "passed" | "failed" | "skipped";
  exitCode: number | null;
  durationMs: number;
  skippedReason?: string;
}

export interface ValidationRunResult {
  steps: ValidationStepResult[];
  passed: boolean;
  reportPath: string;
}

export interface DoctorCheck {
  label: string;
  ok: boolean;
  detail: string;
  suggestion?: string;
}

export interface WriteResult {
  path: string;
  action: "created" | "skipped" | "overwritten";
  backupPath?: string;
}

/* ----------------------------- Run / Hooks ----------------------------- */

export type AgentKind = "codex" | "claude" | "manual";

export type RunStatus =
  | "created"
  | "planning"
  | "implementing"
  | "files_changed"
  | "validating"
  | "needs_fix"
  | "failed"
  | "passed"
  | "reported"
  | "done";

export type ValidationState =
  | "not_run"
  | "passed"
  | "failed"
  | "skipped";

export interface RunValidations {
  lint: ValidationState;
  typecheck: ValidationState;
  build: ValidationState;
  test: ValidationState;
  [key: string]: ValidationState;
}

export interface RunRecord {
  runId: string;
  feature: string;
  agent: AgentKind;
  status: RunStatus;
  score: number;
  startedAt: string;
  finishedAt: string | null;
  validations: RunValidations;
  filesChanged: string[];
  eventsCount: number;
  blockReason: string | null;
  reportPath: string | null;
}

export type HarnessEventType =
  | "tool_use"
  | "command"
  | "file_change"
  | "validation"
  | "report"
  | "block"
  | "info"
  | "error";

export interface HarnessEvent {
  timestamp: string;
  type: HarnessEventType;
  agent: AgentKind;
  message: string;
  metadata: Record<string, unknown>;
}

export interface CurrentRunPointer {
  runId: string;
  feature: string;
  agent: AgentKind;
  startedAt: string;
}

export interface ValidationDetail {
  name: string;
  command: string;
  state: ValidationState;
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
  skippedReason?: string;
}

export interface Blocker {
  id: string;
  label: string;
  detail: string;
  severity: "critical" | "warning";
}
