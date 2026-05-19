// Copia a pasta `templates/` para `dist/templates/` após o build.
// Usa apenas APIs nativas do Node (cross-platform, sem comandos Unix).
import { cp, rm, access } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, "templates");
const dest = join(root, "dist", "templates");

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(src))) {
    console.error(`[copy-templates] pasta de origem não encontrada: ${src}`);
    process.exit(1);
  }
  if (await exists(dest)) {
    await rm(dest, { recursive: true, force: true });
  }
  await cp(src, dest, { recursive: true });
  console.log(`[copy-templates] templates copiados para ${dest}`);
}

main().catch((err) => {
  console.error("[copy-templates] falhou:", err);
  process.exit(1);
});
