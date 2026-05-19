import path from "node:path";
import fs from "fs-extra";
import { resolveProjectPaths, rel } from "../core/paths.js";
import { loadConfig } from "../core/config.js";
import { ensureDir, writeFileSafe, pathExists } from "../core/file-system.js";
import { readableStamp, fileStamp } from "../core/date.js";
import { logger } from "../core/logger.js";

function slugify(input: string): string {
  // Remove diacríticos via NFD e mantém apenas [a-z0-9-], sem regex literal
  // de combining marks (evita problemas de encoding de fonte).
  const deaccented = input.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  return deaccented
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

function currentTaskDoc(description: string): string {
  return `# Tarefa Atual

> Atualizado em ${readableStamp()}

## Objetivo

${description}

## Contexto

- (Preencha: por que esta tarefa existe, de onde veio a demanda)

## Escopo

- (O que ENTRA nesta tarefa)

## Fora de escopo

- (O que NÃO deve ser feito agora)

## Arquivos prováveis

- (Liste arquivos/módulos que provavelmente serão tocados)

## Riscos

- (Liste riscos técnicos, de dados, de multi-tenant, de segurança)

## Critérios de aceite

Ver e marcar em \`.harness/acceptance-criteria.md\`.

## Comandos de validação

- lint / typecheck / build / test conforme \`.harness/harness.config.json\`

## Definição de pronto

A tarefa só está pronta quando todos os critérios de aceite estiverem
marcados e \`harness done\` passar sem falhas.

## Instrução para o Codex

Leia \`AGENTS.md\` e \`.harness/current-task.md\`. Implemente a tarefa
seguindo as skills em \`.agents/skills/\`, em passos pequenos, e só
considere concluído após cumprir \`.harness/acceptance-criteria.md\` e
rodar as validações.
`;
}

function acceptanceDoc(description: string): string {
  return `# Critérios de Aceite

> Tarefa: ${description}
> Atualizado em ${readableStamp()}

Marque \`[x]\` somente quando o critério estiver realmente cumprido e verificado.

- [ ] A funcionalidade descrita no objetivo está implementada
- [ ] O comportamento foi validado manualmente ou por teste
- [ ] Nenhuma funcionalidade existente foi quebrada
- [ ] Lint executado ou justificado
- [ ] Typecheck executado ou justificado
- [ ] Build executado ou justificado
- [ ] Testes executados ou justificados
- [ ] Isolamento multi-tenant preservado (se aplicável)
- [ ] RLS/segurança Supabase preservados (se aplicável)
- [ ] Webhooks/integrações com idempotência (se aplicável)
- [ ] Decisões relevantes registradas em \`.harness/decisions.md\`
- [ ] Sem segredos hardcoded e sem TODOs críticos pendentes
`;
}

function runDoc(description: string): string {
  return `# Run — ${readableStamp()}

## Tarefa registrada

${description}

## Estado inicial

- Critérios de aceite gerados em \`.harness/acceptance-criteria.md\`
- current-task.md atualizado

## Notas durante a execução

- (O agente/dev registra aqui o progresso e decisões)

## Resultado

- (Preenchido ao concluir / via \`harness report\`)
`;
}

/**
 * `harness task "descrição"`
 * Cria/atualiza current-task.md, gera critérios de aceite iniciais e
 * registra um arquivo de run datado.
 */
export async function runTask(description: string): Promise<void> {
  const cwd = process.cwd();
  const trimmed = description.trim();
  if (!trimmed) {
    logger.error('Descrição da tarefa vazia. Uso: harness task "descrição da tarefa"');
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

  logger.title("harness task");

  await writeFileSafe(paths.currentTask, currentTaskDoc(trimmed), true);
  logger.success(`Atualizado ${rel(cwd, paths.currentTask)}`);

  await writeFileSafe(paths.acceptanceCriteria, acceptanceDoc(trimmed), true);
  logger.success(`Critérios de aceite iniciais em ${rel(cwd, paths.acceptanceCriteria)}`);

  await ensureDir(paths.runsDir);
  const runFile = path.join(
    paths.runsDir,
    `${fileStamp()}-task-${slugify(trimmed) || "task"}.md`,
  );
  await fs.writeFile(runFile, runDoc(trimmed));
  logger.success(`Run registrada em ${rel(cwd, runFile)}`);

  logger.title("Próximos passos");
  logger.step("Revise e detalhe .harness/current-task.md (contexto, escopo, riscos).");
  logger.step("Ajuste .harness/acceptance-criteria.md conforme a tarefa.");
  logger.step("Depois rode: harness export codex");
}
