// Executado pelo npm/pnpm no ciclo `prepare`:
//  - Instalação a partir do GitHub (`npm i -g github:owner/repo`): não há
//    `dist/`, então compilamos (devDependencies estão disponíveis nesse
//    cenário porque há script `prepare`).
//  - Tarball publicado no npm: `dist/` já vem pronto → não faz nada.
//  - Dev local após o primeiro build: `dist/` existe → não recompila à toa.
// Nunca usa comandos Unix exclusivos; funciona em Windows.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const builtEntry = join(root, "dist", "index.js");

if (existsSync(builtEntry)) {
  process.exit(0); // já construído (tarball npm ou build anterior)
}

console.log("[prepare] dist/ ausente — compilando o agent-harness-kit…");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCmd, ["run", "build"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  console.error(
    "[prepare] Falha ao compilar. Rode `npm run build` manualmente para diagnosticar.",
  );
  process.exit(result.status ?? 1);
}
process.exit(0);
