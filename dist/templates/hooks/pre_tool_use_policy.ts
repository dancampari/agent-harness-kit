/**
 * Hook de exemplo: pre_tool_use_policy
 * -------------------------------------
 * Objetivo: bloquear/alertar comandos destrutivos ANTES de executarem.
 *
 * Contrato (genérico, adapte ao seu agente):
 *  - Recebe via stdin um JSON com pelo menos { command?: string }.
 *  - Exit 0  => permitido.
 *  - Exit 1  => apenas alerta (não bloqueia).
 *  - Exit 2  => BLOQUEAR a execução.
 *
 * Este arquivo é apenas um EXEMPLO local. A CLI não configura sua máquina
 * globalmente. Não chama nenhuma API de IA.
 */

interface ToolUsePayload {
  command?: string;
  tool?: string;
  args?: string[];
}

const DESTRUCTIVE_PATTERNS: Array<{ re: RegExp; reason: string }> = [
  { re: /\brm\s+-rf\b/i, reason: "remoção recursiva forçada (rm -rf)" },
  { re: /\bRemove-Item\b[^\n]*-Recurse[^\n]*-Force/i, reason: "Remove-Item -Recurse -Force" },
  { re: /\bgit\s+reset\s+--hard\b/i, reason: "git reset --hard (perde alterações)" },
  { re: /\bgit\s+clean\s+-[a-z]*f[a-z]*d?\b/i, reason: "git clean -fd (apaga arquivos)" },
  { re: /\bgit\s+checkout\s+--\s+\./i, reason: "git checkout -- . (descarta tudo)" },
  { re: /(^|[\s/\\])\.env\b[^\n]*\b(rm|del|Remove-Item|unlink)\b/i, reason: "remoção de .env" },
  { re: /\b(rm|del|Remove-Item|unlink)\b[^\n]*\.env\b/i, reason: "remoção de .env" },
  { re: /\b(rm|del|Remove-Item)\b[^\n]*migrations?\b/i, reason: "remoção de migrations" },
  { re: /\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i, reason: "DROP destrutivo de banco" },
  { re: /\bgit\s+push\b[^\n]*--force(?!-with-lease)/i, reason: "git push --force sem lease" },
];

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return stripBom(Buffer.concat(chunks).toString("utf8"));
}

/** Remove BOM inicial (alguns shells/pipes o injetam) antes do JSON.parse. */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function extractCommand(raw: string): string {
  if (!raw.trim()) return process.argv.slice(2).join(" ");
  try {
    const data = JSON.parse(raw) as ToolUsePayload;
    return data.command ?? (data.args ? data.args.join(" ") : "");
  } catch {
    return raw;
  }
}

async function main(): Promise<void> {
  const command = extractCommand(await readStdin());
  if (!command) {
    process.exit(0);
  }

  for (const { re, reason } of DESTRUCTIVE_PATTERNS) {
    if (re.test(command)) {
      console.error(
        `[harness:pre_tool_use_policy] BLOQUEADO — ${reason}\n` +
          `Comando: ${command}\n` +
          `Se for realmente necessário, execute manualmente e registre em .harness/decisions.md.`,
      );
      process.exit(2);
    }
  }

  console.error("[harness:pre_tool_use_policy] OK");
  process.exit(0);
}

main().catch((err) => {
  console.error("[harness:pre_tool_use_policy] erro no hook:", err);
  // Em caso de erro do hook, NÃO bloqueia silenciosamente: apenas alerta.
  process.exit(1);
});
