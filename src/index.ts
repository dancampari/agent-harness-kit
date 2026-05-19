// Shebang é injetado pelo tsup (banner) no build — não duplicar aqui.
import { runCli } from "./cli.js";
import { logger } from "./core/logger.js";

runCli(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message);
  process.exit(1);
});
