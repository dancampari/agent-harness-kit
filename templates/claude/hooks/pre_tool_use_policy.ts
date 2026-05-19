/**
 * Claude Code hook: PreToolUse — pre_tool_use_policy
 * --------------------------------------------------
 * Bloqueia comandos destrutivos ANTES de executarem.
 *
 * Entrada (stdin, JSON do Claude Code), ex.:
 *   { "hook_event_name": "PreToolUse", "tool_name": "Bash",
 *     "tool_input": { "command": "rm -rf ...", "description": "..." } }
 *
 * Saída:
 *   - exit 0  => permitido
 *   - exit 2  => BLOQUEADO (stderr é devolvido ao Claude)
 *
 * Exemplo local, sem chamadas a API de IA.
 */

interface ClaudePreToolUse {
  tool_name?: string;
  tool_input?: { command?: string; [k: string]: unknown };
}

const DESTRUCTIVE_PATTERNS: Array<{ re: RegExp; reason: string }> = [
  { re: /\brm\s+-rf\b/i, reason: "remoção recursiva forçada (rm -rf)" },
  { re: /\bRemove-Item\b[^\n]*-Recurse[^\n]*-Force/i, reason: "Remove-Item -Recurse -Force" },
  { re: /\bgit\s+reset\s+--hard\b/i, reason: "git reset --hard (perde alterações)" },
  { re: /\bgit\s+clean\s+-[a-z]*f[a-z]*d?\b/i, reason: "git clean -fd (apaga arquivos)" },
  { re: /\bgit\s+checkout\s+--\s+\./i, reason: "git checkout -- . (descarta tudo)" },
  { re: /\b(rm|del|Remove-Item|unlink)\b[^\n]*\.env\b/i, reason: "remoção de .env" },
  { re: /\b(rm|del|Remove-Item)\b[^\n]*(migrations?|supabase[\/\\]migrations)/i, reason: "remoção de migrations" },
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
  if (!raw.trim()) return "";
  try {
    const data = JSON.parse(raw) as ClaudePreToolUse;
    if (data.tool_input?.command) return data.tool_input.command;
    return JSON.stringify(data.tool_input ?? {});
  } catch {
    return raw;
  }
}

async function main(): Promise<void> {
  const command = extractCommand(await readStdin());
  if (!command) process.exit(0);

  for (const { re, reason } of DESTRUCTIVE_PATTERNS) {
    if (re.test(command)) {
      console.error(
        `[harness:pre_tool_use_policy] BLOQUEADO — ${reason}\n` +
          `Comando: ${command}\n` +
          `Se for realmente necessário, execute manualmente e registre em .harness/decisions.md.`,
      );
      process.exit(2); // exit 2: Claude Code bloqueia e lê o stderr
    }
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("[harness:pre_tool_use_policy] erro no hook:", err);
  // Erro no hook não deve bloquear silenciosamente: não bloqueia.
  process.exit(0);
});
