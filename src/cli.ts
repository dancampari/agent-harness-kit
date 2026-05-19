import { Command } from "commander";
import chalk from "chalk";
import { logger } from "./core/logger.js";
import { runInit } from "./commands/init.js";
import { runInstall } from "./commands/install.js";
import { runTask } from "./commands/task.js";
import { runExportCodex } from "./commands/exportCodex.js";
import { runExportClaude } from "./commands/exportClaude.js";
import { runValidate } from "./commands/validate.js";
import { runDone } from "./commands/done.js";
import { runReport } from "./commands/report.js";
import { runDoctor } from "./commands/doctor.js";
import { runSkillNew } from "./commands/skillNew.js";
import { runFailureAdd } from "./commands/failureAdd.js";
import {
  runHooksInstallCodex,
  runHooksInstallClaude,
} from "./commands/hooksInstall.js";
import { runFeatureStart } from "./commands/featureStart.js";
import { runHookPostTool } from "./commands/hookPostTool.js";
import { runHookStop } from "./commands/hookStop.js";
import { runHookTaskCompleted } from "./commands/hookTaskCompleted.js";
import { runHookPromptSubmit } from "./commands/hookPromptSubmit.js";
import { runUi } from "./commands/ui.js";
import { runRunsList } from "./commands/runsList.js";
import { runStatus } from "./commands/statusCmd.js";
import { runReportLatest } from "./commands/reportLatest.js";
import { runSkillsList } from "./commands/skillsList.js";
import { runAdapterList, runAdapterAdd } from "./commands/adapter.js";

const VERSION = "0.1.0";

async function guard(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message);
    process.exitCode = 1;
  }
}

export function buildProgram(): Command {
  const program = new Command();

  program
    .name("harness")
    .description(
      "Agent Harness Kit — prepara, versiona e valida estruturas de Harness " +
        "Engineering para agentes (Codex/Claude Code/Cursor). Não usa nenhuma API de LLM.",
    )
    .version(VERSION, "-v, --version", "exibe a versão");

  program
    .command("install")
    .description(
      "Assistente de instalação: pergunta o agente (Codex/Claude/Cursor) e configura tudo",
    )
    .option("-a, --agent <targets>", "alvos (csv) — pula a pergunta de agente")
    .option("--pm <gerenciador>", "pnpm | npm | yarn | bun — pula a pergunta")
    .option("-y, --yes", "não-interativo: usa flags + defaults detectados", false)
    .option("-f, --force", "sobrescreve arquivos existentes criando backup", false)
    .option("--no-hooks", "não instala os hooks de integração")
    .action((opts) => guard(() => runInstall(opts)));

  program
    .command("init")
    .description("Cria a estrutura de harness no diretório atual")
    .option("-f, --force", "sobrescreve arquivos existentes criando backup", false)
    .option(
      "-a, --agent <targets>",
      "alvos separados por vírgula (codex, claude-code, cursor)",
    )
    .action((opts) => guard(() => runInit(opts)));

  program
    .command("task")
    .argument("<descricao>", "descrição da tarefa")
    .description("Cria/atualiza current-task.md e gera critérios de aceite")
    .action((descricao: string) => guard(() => runTask(descricao)));

  const exportCmd = program
    .command("export")
    .description("Exporta a estrutura para um agente alvo (codex, claude-code)");
  exportCmd
    .command("codex")
    .description("Garante AGENTS.md/skills/hooks e imprime a instrução do Codex")
    .action(() => guard(() => runExportCodex()));
  exportCmd
    .command("claude-code")
    .alias("claude")
    .description("Garante CLAUDE.md/.claude/skills/.claude/hooks e imprime a instrução do Claude Code")
    .action(() => guard(() => runExportClaude()));

  program
    .command("validate")
    .description("Executa os comandos de validação configurados")
    .action(() => guard(() => runValidate()));

  program
    .command("done")
    .description("Checagem anti-vitória-prematura antes de concluir a tarefa")
    .action(() => guard(() => runDone()));

  const reportCmd = program
    .command("report")
    .description("Consolida tarefa, validações, falhas e decisões em markdown")
    .action(() => guard(() => runReport()));
  reportCmd
    .command("latest")
    .description("Imprime o relatório mais recente no terminal")
    .action(() => guard(() => runReportLatest()));

  program
    .command("doctor")
    .description("Diagnostica a saúde do projeto para o harness")
    .action(() => guard(() => runDoctor()));

  const skillCmd = program.command("skill").description("Gerencia skills");
  skillCmd
    .command("new")
    .argument("<nome>", "nome da nova skill (kebab-case)")
    .description("Cria skill universal ou de adapter (frontmatter + seções)")
    .option("--adapter <stack>", "cria como skill de adapter (stack específica)")
    .option("--category <cat>", "categoria da skill universal (default: custom)")
    .option("--risk <nivel>", "low | medium | high (default: medium)")
    .action((nome: string, opts) => guard(() => runSkillNew(nome, opts)));

  const skillsCmd = program
    .command("skills")
    .description("Lista skills (instaladas, catálogo, categoria)");
  skillsCmd
    .command("list")
    .description("Lista skills instaladas e disponíveis por categoria")
    .action(() => guard(() => runSkillsList()));

  const adapterCmd = program
    .command("adapter")
    .description("Gerencia adapters opcionais por stack (fora do core)");
  adapterCmd
    .command("list")
    .description("Lista adapters disponíveis e sugeridos")
    .action(() => guard(() => runAdapterList()));
  adapterCmd
    .command("add")
    .argument("<nome>", "nome do adapter (ex.: node, python, nextjs)")
    .description("Instala as skills de um adapter (somente quando você pede)")
    .action((nome: string) => guard(() => runAdapterAdd(nome)));

  const failureCmd = program
    .command("failure")
    .description("Gerencia o registro de falhas");
  failureCmd
    .command("add")
    .argument("<descricao>", "descrição da falha")
    .description("Registra uma falha estruturada em failures.md")
    .action((descricao: string) => guard(() => runFailureAdd(descricao)));

  /* ----------------------- Integração por hooks ----------------------- */

  const hooksCmd = program
    .command("hooks")
    .description("Instala hooks locais de integração (Codex / Claude Code)");
  const hooksInstall = hooksCmd
    .command("install")
    .description("Instala hooks para um agente");
  hooksInstall
    .command("codex")
    .description("Instala hooks do harness no Codex (.codex/hooks.json)")
    .option("-f, --force", "sobrescreve wrappers existentes criando backup", false)
    .action((opts) => guard(() => runHooksInstallCodex(opts)));
  hooksInstall
    .command("claude")
    .description("Instala hooks do harness no Claude Code (.claude/settings.json)")
    .option("-f, --force", "sobrescreve wrappers existentes criando backup", false)
    .action((opts) => guard(() => runHooksInstallClaude(opts)));

  const featureCmd = program
    .command("feature")
    .description("Gerencia execuções de feature (runs)");
  featureCmd
    .command("start")
    .argument("<nome>", "nome da feature")
    .description("Inicia uma nova execução e a marca como atual")
    .option(
      "-a, --agent <agente>",
      "agente responsável (codex | claude | manual)",
      "manual",
    )
    .action((nome: string, opts) =>
      guard(() => runFeatureStart(nome, opts)),
    );

  const hookCmd = program
    .command("hook")
    .description("Endpoints chamados pelos hooks dos agentes (lê stdin)");
  hookCmd
    .command("post-tool")
    .description("Registra uso de ferramenta (não bloqueia)")
    .option("--agent <agente>", "codex | claude", "manual")
    .action((opts) => guard(() => runHookPostTool(opts)));
  hookCmd
    .command("stop")
    .description("Valida e bloqueia a conclusão se houver pendências")
    .option("--agent <agente>", "codex | claude", "manual")
    .action((opts) => guard(() => runHookStop(opts)));
  hookCmd
    .command("task-completed")
    .description("Equivalente ao stop para Claude Code (exit 2 ao bloquear)")
    .option("--agent <agente>", "claude", "claude")
    .action((opts) => guard(() => runHookTaskCompleted(opts)));
  hookCmd
    .command("prompt-submit")
    .description("Registra envio de prompt (UserPromptSubmit, não bloqueia)")
    .option("--agent <agente>", "codex | claude", "manual")
    .action((opts) => guard(() => runHookPromptSubmit(opts)));

  /* --------------------------- Observação ----------------------------- */

  program
    .command("ui")
    .description("Abre a TUI (somente leitura) de acompanhamento das execuções")
    .option("--once", "imprime um snapshot textual e sai", false)
    .action((opts) => guard(() => runUi(opts)));

  program
    .command("runs")
    .description("Lista as execuções registradas")
    .action(() => guard(() => runRunsList()));

  program
    .command("status")
    .description("Mostra o status resumido da execução atual")
    .action(() => guard(() => runStatus()));

  program.addHelpText(
    "after",
    `\nExemplos:\n  ${chalk.cyan("harness install")}                 ${chalk.dim(
      "# assistente interativo (recomendado)",
    )}\n  ${chalk.cyan(
      "harness install --yes --agent claude-code --pm npm",
    )}\n  ${chalk.cyan(
      'harness feature start "QR Code Evolution por barbearia" --agent claude',
    )}\n  ${chalk.cyan("harness ui")}\n  ${chalk.cyan(
      "harness status",
    )}\n  ${chalk.cyan("harness report latest")}\n`,
  );

  return program;
}

export async function runCli(argv: string[]): Promise<void> {
  const program = buildProgram();
  await program.parseAsync(argv);
}
