#!/usr/bin/env node
/**
 * Wrapper de hook gerado pelo agent-harness-kit.
 * NÃO contém lógica de negócio: apenas repassa o stdin do agente para
 *   `harness {{SUBCOMMAND}} --agent {{AGENT}}`
 * e espelha stdout/stderr/exit code. Não abre UI. Não chama API de LLM.
 *
 * Resolução do executável (sem caminho absoluto hardcoded):
 *   1. env HARNESS_CMD
 *   2. `harness` no PATH
 *   3. `npx --yes harness` (fallback)
 *
 * Em falha de spawn, sai com código 0 para NÃO travar o agente
 * (a decisão de bloqueio vem do próprio `harness`, não do wrapper).
 */
import { spawn } from "node:child_process";

const SUBCOMMAND = "{{SUBCOMMAND}}".split(" ");
const AGENT = "{{AGENT}}";

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve("");
    const chunks = [];
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    process.stdin.on("error", () => resolve(""));
  });
}

// shell:true com UMA string (sem array de args) evita o DEP0190 e o ruído
// no stderr que o agente veria a cada hook. Os args são tokens fixos sem
// espaços, então concatenar é seguro.
function run(commandLine, input) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(commandLine, { shell: true, windowsHide: true });
    } catch {
      return resolve({ spawnFailed: true, code: 0 });
    }
    child.on("error", () => resolve({ spawnFailed: true, code: 0 }));
    if (child.stdout) child.stdout.pipe(process.stdout);
    if (child.stderr) child.stderr.pipe(process.stderr);
    if (child.stdin) {
      child.stdin.on("error", () => {});
      child.stdin.end(input);
    }
    child.on("close", (code) => resolve({ spawnFailed: false, code: code ?? 0 }));
  });
}

(async () => {
  const input = await readStdin();
  const argStr = [...SUBCOMMAND, "--agent", AGENT].join(" ");

  const envCmd = process.env.HARNESS_CMD;
  let result;
  if (envCmd) {
    result = await run(`${envCmd} ${argStr}`, input);
  } else {
    result = await run(`harness ${argStr}`, input);
    if (result.spawnFailed) {
      result = await run(`npx --yes harness ${argStr}`, input);
    }
  }

  if (result.spawnFailed) {
    process.stderr.write(
      "[harness-hook] CLI 'harness' indisponível — hook ignorado (agente não bloqueado).\n",
    );
    process.exit(0);
  }
  process.exit(result.code);
})();
