import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "fs-extra";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolve a pasta de templates funcionando tanto em dev (tsx, src/core)
 * quanto após o build (bundle em dist/, templates copiados para dist/templates).
 * Não usa caminhos hardcoded: testa candidatos e valida pela presença do AGENTS.md.
 */
export function getTemplatesDir(): string {
  const candidates = [
    path.join(moduleDir, "templates"),
    path.join(moduleDir, "..", "templates"),
    path.join(moduleDir, "..", "..", "templates"),
    path.join(moduleDir, "..", "..", "..", "templates"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "AGENTS.md"))) {
      return candidate;
    }
  }
  throw new Error(
    "Não foi possível localizar a pasta de templates. Rode `pnpm build` ou verifique a instalação.",
  );
}

export interface ProjectPaths {
  cwd: string;
  harnessDir: string;
  runsDir: string;
  reportsDir: string;
  evalsDir: string;
  skillsDir: string;
  codexDir: string;
  codexHooksDir: string;
  claudeDir: string;
  claudeSkillsDir: string;
  claudeHooksDir: string;
  claudeFile: string;
  agentsFile: string;
  configFile: string;
  projectContext: string;
  currentTask: string;
  acceptanceCriteria: string;
  qaChecklist: string;
  decisions: string;
  failures: string;
  packageJson: string;
  currentRunFile: string;
  reportsLatest: string;
  codexHooksConfig: string;
  claudeSettings: string;
}

/**
 * Monta os caminhos do projeto de destino a partir do cwd.
 * `harnessRel`/`skillsRel`/`codexHooksRel` vêm do harness.config.json
 * (com defaults) para manter tudo configurável e relativo.
 */
export function resolveProjectPaths(
  cwd: string,
  harnessRel = ".harness",
  skillsRel = ".agents/skills",
  codexHooksRel = ".codex/hooks",
  claudeSkillsRel = ".claude/skills",
  claudeHooksRel = ".claude/hooks",
): ProjectPaths {
  const harnessDir = path.join(cwd, harnessRel);
  const codexHooksDir = path.join(cwd, codexHooksRel);
  const claudeHooksDir = path.join(cwd, claudeHooksRel);
  return {
    cwd,
    harnessDir,
    runsDir: path.join(harnessDir, "runs"),
    reportsDir: path.join(harnessDir, "reports"),
    evalsDir: path.join(harnessDir, "evals"),
    skillsDir: path.join(cwd, skillsRel),
    codexDir: path.dirname(codexHooksDir),
    codexHooksDir,
    claudeHooksDir,
    claudeSkillsDir: path.join(cwd, claudeSkillsRel),
    claudeDir: path.dirname(claudeHooksDir),
    claudeFile: path.join(cwd, "CLAUDE.md"),
    agentsFile: path.join(cwd, "AGENTS.md"),
    configFile: path.join(harnessDir, "harness.config.json"),
    projectContext: path.join(harnessDir, "project-context.md"),
    currentTask: path.join(harnessDir, "current-task.md"),
    acceptanceCriteria: path.join(harnessDir, "acceptance-criteria.md"),
    qaChecklist: path.join(harnessDir, "qa-checklist.md"),
    decisions: path.join(harnessDir, "decisions.md"),
    failures: path.join(harnessDir, "failures.md"),
    packageJson: path.join(cwd, "package.json"),
    currentRunFile: path.join(harnessDir, "current-run.json"),
    reportsLatest: path.join(harnessDir, "reports", "latest.md"),
    codexHooksConfig: path.join(path.dirname(codexHooksDir), "hooks.json"),
    claudeSettings: path.join(path.dirname(claudeHooksDir), "settings.json"),
  };
}

/** Diretório de uma execução específica. */
export function runDir(paths: ProjectPaths, runId: string): string {
  return path.join(paths.runsDir, runId);
}

/** Caminho relativo amigável para logs (sempre com "/"). */
export function rel(cwd: string, target: string): string {
  return path.relative(cwd, target).split(path.sep).join("/") || ".";
}
