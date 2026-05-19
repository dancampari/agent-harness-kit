import chalk from "chalk";
import ora, { type Ora } from "ora";

function stamp(): string {
  return chalk.dim(new Date().toISOString().slice(11, 19));
}

let quiet = false;

/** Silencia/restaura o logger (usado pelo assistente de instalação). */
export function setLoggerQuiet(value: boolean): void {
  quiet = value;
}

/** Executa `fn` com o logger silenciado, restaurando ao final. */
export async function withQuietLogger<T>(fn: () => Promise<T>): Promise<T> {
  const previous = quiet;
  quiet = true;
  try {
    return await fn();
  } finally {
    quiet = previous;
  }
}

export const logger = {
  info(message: string): void {
    if (quiet) return;
    console.log(`${stamp()} ${chalk.cyan("ℹ")} ${message}`);
  },
  success(message: string): void {
    if (quiet) return;
    console.log(`${stamp()} ${chalk.green("✔")} ${message}`);
  },
  warn(message: string): void {
    if (quiet) return;
    console.warn(`${stamp()} ${chalk.yellow("⚠")} ${message}`);
  },
  error(message: string): void {
    // Erros sempre aparecem, mesmo silenciado.
    console.error(`${stamp()} ${chalk.red("✖")} ${message}`);
  },
  step(message: string): void {
    if (quiet) return;
    console.log(`${stamp()} ${chalk.magenta("➜")} ${message}`);
  },
  title(message: string): void {
    if (quiet) return;
    console.log(`\n${chalk.bold.underline(message)}`);
  },
  plain(message = ""): void {
    if (quiet) return;
    console.log(message);
  },
  hint(message: string): void {
    if (quiet) return;
    console.log(`  ${chalk.dim(message)}`);
  },
};

export function spinner(text: string): Ora {
  return ora({ text, color: "cyan", isSilent: quiet });
}
