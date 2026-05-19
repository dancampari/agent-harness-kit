import { execa } from "execa";

export interface RunResult {
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  failed: boolean;
}

/**
 * Executa um comando local via shell (cross-platform: Windows PowerShell,
 * cmd, bash). Não lança exceção em falha — devolve o resultado para o
 * chamador decidir o exit code.
 */
export async function runCommand(
  command: string,
  cwd: string,
): Promise<RunResult> {
  const start = Date.now();
  try {
    const result = await execa(command, {
      cwd,
      shell: true,
      reject: false,
      all: false,
      windowsHide: true,
    });
    return {
      command,
      exitCode: result.exitCode ?? null,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      durationMs: Date.now() - start,
      failed: (result.exitCode ?? 1) !== 0,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      command,
      exitCode: null,
      stdout: "",
      stderr: message,
      durationMs: Date.now() - start,
      failed: true,
    };
  }
}

/** Verifica se um executável está disponível no PATH (ex.: pnpm, git). */
export async function isToolAvailable(tool: string): Promise<boolean> {
  const probe = process.platform === "win32" ? "--version" : "--version";
  try {
    const result = await execa(tool, [probe], {
      reject: false,
      windowsHide: true,
      shell: true,
    });
    return (result.exitCode ?? 1) === 0;
  } catch {
    return false;
  }
}
