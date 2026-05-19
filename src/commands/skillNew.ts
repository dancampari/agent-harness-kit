import path from "node:path";
import { resolveConfigured } from "../core/resolve.js";
import { rel } from "../core/paths.js";
import { writeFileSafe, pathExists } from "../core/file-system.js";
import { logger } from "../core/logger.js";

export interface SkillNewOptions {
  adapter?: string;
  category?: string;
  risk?: string;
}

function normalizeName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function skillTemplate(
  name: string,
  category: string,
  risk: string,
): string {
  return `---
name: ${name}
description: Descreva claramente QUANDO usar esta skill.
category: ${category}
risk_level: ${risk}
---

# Objetivo

(Que problema esta skill resolve e o resultado esperado.)

# Quando usar

- (Situação 1)
- (Situação 2)

# Quando não usar

- (Quando aplicar esta skill seria errado)
- (Quando outra skill é mais adequada)

# Regras obrigatórias

- (Regra inegociável 1)
- Não introduzir segredos hardcoded
- Não quebrar funcionalidades existentes sem justificativa
- Registrar decisões relevantes em \`.harness/decisions.md\`

# Processo

1. (Passo 1)
2. (Passo 2)
3. (Passo 3)

# Checklist

- [ ] (Verificação objetiva 1)
- [ ] (Verificação objetiva 2)
- [ ] Validações disponíveis executadas ou justificadas

# Anti-padrões

- ❌ (O que NÃO fazer 1)
- ❌ (O que NÃO fazer 2)
`;
}

const VALID_RISK = new Set(["low", "medium", "high"]);

/**
 * `harness skill new <nome> [--adapter <stack>] [--category <cat>]`
 * Cria uma skill universal (default: category "custom") ou uma skill de
 * adapter (`.agents/skills/adapters/<stack>/<nome>/SKILL.md`).
 */
export async function runSkillNew(
  rawName: string,
  options: SkillNewOptions,
): Promise<void> {
  const cwd = process.cwd();
  const name = normalizeName(rawName);
  if (!name) {
    logger.error("Nome inválido. Uso: harness skill new <nome> [--adapter <stack>]");
    process.exitCode = 1;
    return;
  }
  const risk = VALID_RISK.has(options.risk ?? "")
    ? (options.risk as string)
    : "medium";

  const { paths } = await resolveConfigured(cwd);

  let target: string;
  let category: string;
  if (options.adapter) {
    const adapter = normalizeName(options.adapter);
    category = `adapter:${adapter}`;
    target = path.join(paths.skillsDir, "adapters", adapter, name, "SKILL.md");
  } else {
    category = normalizeName(options.category ?? "custom") || "custom";
    target = path.join(paths.skillsDir, category, name, "SKILL.md");
  }

  if (await pathExists(target)) {
    logger.error(`Skill já existe em ${rel(cwd, target)}.`);
    process.exitCode = 1;
    return;
  }

  await writeFileSafe(target, skillTemplate(name, category, risk), false);
  logger.title("harness skill new");
  logger.success(`Skill criada: ${rel(cwd, target)}`);
  logger.info(`category: ${category} · risk_level: ${risk}`);
  if (options.adapter) {
    logger.hint("Skill de adapter (específica de stack) — fora do core universal.");
  } else {
    logger.hint("Skill universal — mantenha-a genérica e reutilizável.");
  }
}
