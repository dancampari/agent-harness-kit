import path from "node:path";
import fs from "fs-extra";
import { listAdapters, readAdapterManifest } from "./templates.js";

export type Confidence = "low" | "medium" | "high";

export interface AdapterSuggestion {
  name: string;
  confidence: Confidence;
  reason: string;
}

export interface ProjectProfile {
  cwd: string;
  language: string;
  packageManager: string | null;
  framework: string | null;
  scripts: Record<string, string>;
  hasTests: boolean;
  hasDocker: boolean;
  hasCI: boolean;
  hasDatabase: boolean;
  hasFrontend: boolean;
  hasBackend: boolean;
  validationCommands: Record<string, string>;
  risks: string[];
  suggestedAdapters: AdapterSuggestion[];
}

async function exists(cwd: string, rel: string): Promise<boolean> {
  return fs.pathExists(path.join(cwd, rel));
}

async function readJsonSafe<T>(file: string): Promise<T | null> {
  try {
    return (await fs.readJson(file)) as T;
  } catch {
    return null;
  }
}

async function detectPackageManager(cwd: string): Promise<string | null> {
  const pairs: Array<[string, string]> = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lockb", "bun"],
    ["package-lock.json", "npm"],
  ];
  for (const [file, pm] of pairs) {
    if (await exists(cwd, file)) return pm;
  }
  return (await exists(cwd, "package.json")) ? "npm" : null;
}

function nodeRun(pm: string, script: string): string {
  if (pm === "pnpm") return `pnpm ${script}`;
  if (pm === "yarn") return `yarn ${script}`;
  return `${pm} run ${script}`; // npm, bun
}

/**
 * Perfila o projeto SEM assumir stack: deduz a partir de arquivos
 * indicadores. Tudo é best-effort; o que não for detectado fica vazio.
 */
export async function profileProject(cwd: string): Promise<ProjectProfile> {
  const risks: string[] = [];
  const validationCommands: Record<string, string> = {};

  const pkg = (await exists(cwd, "package.json"))
    ? await readJsonSafe<{
        scripts?: Record<string, string>;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      }>(path.join(cwd, "package.json"))
    : null;
  const scripts = pkg?.scripts ?? {};
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };

  // Linguagem
  let language = "unknown";
  if (pkg) language = (await exists(cwd, "tsconfig.json")) ? "typescript" : "node";
  else if (
    (await exists(cwd, "pyproject.toml")) ||
    (await exists(cwd, "requirements.txt"))
  )
    language = "python";
  else if (await exists(cwd, "go.mod")) language = "go";
  else if (await exists(cwd, "Cargo.toml")) language = "rust";
  else if (await exists(cwd, "composer.json")) language = "php";
  else if (
    (await exists(cwd, "pom.xml")) ||
    (await exists(cwd, "build.gradle")) ||
    (await exists(cwd, "build.gradle.kts"))
  )
    language = "java";

  const packageManager = pkg ? await detectPackageManager(cwd) : null;

  // Framework (best-effort, sem assumir)
  let framework: string | null = null;
  if (deps["next"]) framework = "next";
  else if (deps["nuxt"]) framework = "nuxt";
  else if (deps["@angular/core"]) framework = "angular";
  else if (deps["react"]) framework = "react";
  else if (deps["vue"]) framework = "vue";
  else if (deps["svelte"]) framework = "svelte";
  else if (deps["express"] || deps["fastify"] || deps["@nestjs/core"])
    framework = "node-backend";
  else if (language === "python" && (await exists(cwd, "manage.py")))
    framework = "django";

  // Sinais do projeto
  const hasDocker =
    (await exists(cwd, "Dockerfile")) ||
    (await exists(cwd, "docker-compose.yml")) ||
    (await exists(cwd, "compose.yaml"));
  const hasCI =
    (await exists(cwd, ".github/workflows")) ||
    (await exists(cwd, ".gitlab-ci.yml")) ||
    (await exists(cwd, "azure-pipelines.yml"));
  const hasDatabase =
    (await exists(cwd, "migrations")) ||
    (await exists(cwd, "db/migrations")) ||
    (await exists(cwd, "prisma")) ||
    (await exists(cwd, "alembic.ini")) ||
    Object.keys(deps).some((d) => /(prisma|knex|typeorm|sequelize|drizzle)/i.test(d));
  const hasFrontend =
    Boolean(framework && ["next", "nuxt", "angular", "react", "vue", "svelte"].includes(framework)) ||
    (await exists(cwd, "index.html")) ||
    (await exists(cwd, "public/index.html"));
  const hasBackend =
    framework === "node-backend" ||
    framework === "django" ||
    (await exists(cwd, "src/server")) ||
    Object.keys(deps).some((d) => /(express|fastify|nestjs|koa|hapi)/i.test(d));

  // Testes
  const hasTests =
    Object.keys(scripts).includes("test") ||
    Object.keys(deps).some((d) =>
      /(vitest|jest|mocha|ava|pytest|playwright|cypress)/i.test(d),
    ) ||
    (await exists(cwd, "tests")) ||
    (await exists(cwd, "test")) ||
    (await exists(cwd, "__tests__"));

  // Comandos de validação detectados (somente o que existe de fato)
  if (pkg && packageManager) {
    for (const k of ["lint", "typecheck", "build", "test"]) {
      if (scripts[k]) validationCommands[k] = nodeRun(packageManager, k);
    }
  } else if (language === "python") {
    if (Object.keys(deps).length === 0) {
      // sem package.json; usa heurísticas de ferramentas comuns
    }
    if (await exists(cwd, "pyproject.toml")) {
      validationCommands.test = "pytest -q";
    } else if (await exists(cwd, "pytest.ini")) {
      validationCommands.test = "pytest -q";
    }
  } else if (language === "go") {
    validationCommands.lint = "go vet ./...";
    validationCommands.build = "go build ./...";
    validationCommands.test = "go test ./...";
  } else if (language === "rust") {
    validationCommands.lint = "cargo clippy --quiet";
    validationCommands.build = "cargo build --quiet";
    validationCommands.test = "cargo test --quiet";
  } else if (language === "php" && (await exists(cwd, "vendor/bin/phpunit"))) {
    validationCommands.test = "vendor/bin/phpunit";
  }

  // Riscos universais
  if (!hasTests) risks.push("Sem testes detectados — risco de regressão.");
  if (Object.keys(validationCommands).length === 0)
    risks.push("Nenhum comando de validação detectado — configure em harness.config.json.");
  if (hasDatabase)
    risks.push("Há banco/migrations — cuidado com mudanças de schema e dados.");
  if (!hasCI) risks.push("Sem CI/CD detectado — validação depende de execução manual.");
  if (language === "unknown")
    risks.push("Linguagem não detectada — confirme a stack antes de validar.");

  // Sugestão de adapters (a partir dos manifestos; só sugere com sinal)
  const suggestedAdapters: AdapterSuggestion[] = [];
  for (const name of await listAdapters()) {
    const manifest = await readAdapterManifest(name);
    if (!manifest?.detect) continue;
    let fileHit = "";
    for (const f of manifest.detect.files ?? []) {
      if (await exists(cwd, f)) {
        fileHit = f;
        break;
      }
    }
    const depHit = (manifest.detect.dependencies ?? []).find((d) => deps[d]);
    if (fileHit) {
      suggestedAdapters.push({
        name,
        confidence: "high",
        reason: `arquivo "${fileHit}" presente`,
      });
    } else if (depHit) {
      suggestedAdapters.push({
        name,
        confidence: "medium",
        reason: `dependência "${depHit}" presente`,
      });
    }
  }

  return {
    cwd,
    language,
    packageManager,
    framework,
    scripts,
    hasTests,
    hasDocker,
    hasCI,
    hasDatabase,
    hasFrontend,
    hasBackend,
    validationCommands,
    risks,
    suggestedAdapters,
  };
}
