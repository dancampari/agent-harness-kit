import path from "node:path";
import { resolveProjectPaths, rel } from "../core/paths.js";
import { loadConfig } from "../core/config.js";
import { writeFileSafe, pathExists } from "../core/file-system.js";
import { readableStamp } from "../core/date.js";
import { logger } from "../core/logger.js";

function normalizeName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function skillTemplate(name: string): string {
  return `---
name: ${name}
description: Descreva claramente QUANDO usar e QUANDO NÃO usar esta skill.
---

# ${name}

> Criada em ${readableStamp()}

## Objetivo

(Explique o problema que esta skill resolve e o resultado esperado.)

## Quando usar

- (Situação 1)
- (Situação 2)

## Quando não usar

- (Situação onde aplicar esta skill seria errado)
- (Quando outra skill é mais adequada)

## Regras obrigatórias

- (Regra inegociável 1)
- (Regra inegociável 2)
- Não introduzir segredos hardcoded
- Não quebrar funcionalidades existentes sem justificativa
- Registrar decisões relevantes em \`.harness/decisions.md\`

## Checklist de validação

- [ ] (Verificação objetiva 1)
- [ ] (Verificação objetiva 2)
- [ ] Lint/typecheck/build/test executados ou justificados

## Exemplos

\`\`\`txt
(Exemplo de uso correto desta skill)
\`\`\`

## Anti-padrões

- ❌ (O que NÃO fazer 1)
- ❌ (O que NÃO fazer 2)
`;
}

/**
 * `harness skill new <nome>`
 * Cria uma nova skill com frontmatter e seções padronizadas.
 */
export async function runSkillNew(rawName: string): Promise<void> {
  const cwd = process.cwd();
  const name = normalizeName(rawName);
  if (!name) {
    logger.error("Nome de skill inválido. Uso: harness skill new <nome>");
    process.exitCode = 1;
    return;
  }

  const config = await loadConfig(
    path.join(cwd, ".harness", "harness.config.json"),
  ).catch(() => null);
  const paths = resolveProjectPaths(
    cwd,
    config?.paths.harness,
    config?.paths.skills,
    config?.paths.codexHooks,
  );

  const target = path.join(paths.skillsDir, name, "SKILL.md");
  if (await pathExists(target)) {
    logger.error(`Skill "${name}" já existe em ${rel(cwd, target)}.`);
    process.exitCode = 1;
    return;
  }

  await writeFileSafe(target, skillTemplate(name), false);
  logger.title("harness skill new");
  logger.success(`Skill criada: ${rel(cwd, target)}`);
  logger.step("Preencha Objetivo, Quando usar/não usar, Regras e Anti-padrões.");
  logger.hint("Skills bem definidas reduzem erros do agente.");
}
