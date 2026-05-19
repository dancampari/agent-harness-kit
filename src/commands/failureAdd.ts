import path from "node:path";
import { resolveProjectPaths, rel } from "../core/paths.js";
import { loadConfig } from "../core/config.js";
import { appendText, pathExists } from "../core/file-system.js";
import { readableStamp } from "../core/date.js";
import { logger } from "../core/logger.js";

/**
 * `harness failure add "descrição"`
 * Acrescenta uma falha estruturada em failures.md para alimentar futuras
 * instruções no AGENTS.md e nas skills.
 */
export async function runFailureAdd(description: string): Promise<void> {
  const cwd = process.cwd();
  const trimmed = description.trim();
  if (!trimmed) {
    logger.error('Descrição vazia. Uso: harness failure add "descrição da falha"');
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

  if (!(await pathExists(paths.harnessDir))) {
    logger.error("Estrutura .harness/ não encontrada. Rode `harness init` primeiro.");
    process.exitCode = 1;
    return;
  }

  const entry = `
---

## Falha — ${readableStamp()}

- **Descrição:** ${trimmed}
- **Causa provável:** (preencher)
- **Impacto:** (preencher)
- **Nova regra preventiva:** (preencher — esta regra deve refletir em AGENTS.md)
- **Skill que deve ser atualizada:** (nome da skill em .agents/skills/)
`;

  const header = (await pathExists(paths.failures))
    ? ""
    : `# Falhas Registradas\n\n> Cada falha vira regra preventiva. Atualize AGENTS.md e a skill indicada.\n`;

  await appendText(paths.failures, header + entry);

  logger.title("harness failure add");
  logger.success(`Falha registrada em ${rel(cwd, paths.failures)}`);
  logger.step("Preencha causa, impacto e a regra preventiva.");
  logger.step("Reflita a nova regra em AGENTS.md e na skill indicada.");
}
