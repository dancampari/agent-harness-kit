import path from "node:path";
import fs from "fs-extra";
import chalk from "chalk";
import { resolveConfigured } from "../core/resolve.js";
import {
  listAdapters,
  readAdapterManifest,
  listAdapterSkillTemplates,
  materializeTemplate,
} from "../core/templates.js";
import { profileProject } from "../core/profiler.js";
import { loadConfig } from "../core/config.js";
import { rel } from "../core/paths.js";
import { logger } from "../core/logger.js";

/** `harness adapter list` — adapters disponíveis (opcionais, não instalados). */
export async function runAdapterList(): Promise<void> {
  const cwd = process.cwd();
  const { config } = await resolveConfigured(cwd);
  const installed = new Set(config?.installedAdapters ?? []);
  const profile = await profileProject(cwd).catch(() => null);
  const suggested = new Map(
    (profile?.suggestedAdapters ?? []).map((s) => [s.name, s]),
  );

  logger.title("harness adapter list");
  const names = await listAdapters();
  if (names.length === 0) {
    logger.info("Nenhum adapter no pacote.");
    return;
  }
  for (const name of names) {
    const m = await readAdapterManifest(name);
    const tags = [
      installed.has(name) ? chalk.green("instalado") : null,
      suggested.has(name)
        ? chalk.yellow(`sugerido (${suggested.get(name)!.confidence})`)
        : null,
    ]
      .filter(Boolean)
      .join(" · ");
    logger.plain(
      `  ${chalk.bold(name)}${tags ? ` [${tags}]` : ""} — ${
        m?.description ?? "(sem descrição)"
      }`,
    );
  }
  logger.plain();
  logger.hint("Instale só quando precisar: harness adapter add <nome>");
  logger.hint("Adapters NÃO são instalados automaticamente.");
}

/** `harness adapter add <nome>` — instala skills específicas de uma stack. */
export async function runAdapterAdd(rawName: string): Promise<void> {
  const cwd = process.cwd();
  const name = rawName.trim().toLowerCase();
  const available = await listAdapters();
  if (!available.includes(name)) {
    logger.error(
      `Adapter "${name}" não existe. Disponíveis: ${available.join(", ")}`,
    );
    process.exitCode = 1;
    return;
  }

  const { paths } = await resolveConfigured(cwd);
  if (!(await fs.pathExists(paths.configFile))) {
    logger.error("Projeto não inicializado. Rode `harness init` primeiro.");
    process.exitCode = 1;
    return;
  }

  logger.title(`harness adapter add ${name}`);
  const manifest = await readAdapterManifest(name);
  const skillTpls = await listAdapterSkillTemplates(name);
  let created = 0;
  for (const relTpl of skillTpls) {
    // relTpl: adapters/<name>/skills/<skill>/SKILL.md
    const sub = relTpl.replace(`adapters/${name}/skills/`, "");
    const target = path.join(paths.skillsDir, "adapters", name, sub);
    const r = await materializeTemplate(relTpl, target, {}, false);
    if (r.action === "created") created += 1;
  }

  // Registra no config (installedAdapters) e em .harness/adapters/installed
  const config = await loadConfig(paths.configFile);
  if (!config.installedAdapters.includes(name)) {
    config.installedAdapters = [...config.installedAdapters, name].sort();
    await fs.writeJson(paths.configFile, config, { spaces: 2 });
  }
  const installedDir = path.join(paths.harnessDir, "adapters", "installed");
  await fs.ensureDir(installedDir);
  await fs.writeJson(
    path.join(installedDir, `${name}.json`),
    { name, installedAt: new Date().toISOString(), manifest },
    { spaces: 2 },
  );

  logger.success(
    `${created} skill(s) do adapter "${name}" em ${rel(
      cwd,
      path.join(paths.skillsDir, "adapters", name),
    )}`,
  );
  logger.step("Re-exporte se usar Codex/Claude: harness export codex|claude-code");
  logger.hint(
    "Skills de adapter são específicas de stack e ficam fora do core universal.",
  );
}
