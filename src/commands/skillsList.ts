import path from "node:path";
import fs from "fs-extra";
import chalk from "chalk";
import { resolveConfigured } from "../core/resolve.js";
import { listCoreSkillTemplates, skillSubPath } from "../core/templates.js";
import { rel } from "../core/paths.js";
import { logger } from "../core/logger.js";

interface SkillRef {
  category: string;
  name: string;
}

function parseRef(subPath: string): SkillRef {
  // subPath: "<categoria>/<skill>/SKILL.md"  ou  "<a>/<b>/<skill>/SKILL.md"
  const parts = subPath.split("/");
  const name = parts[parts.length - 2] ?? subPath;
  const category = parts.slice(0, parts.length - 2).join("/") || "(raiz)";
  return { category, name };
}

async function walkInstalled(dir: string): Promise<string[]> {
  if (!(await fs.pathExists(dir))) return [];
  const out: string[] = [];
  async function walk(d: string): Promise<void> {
    for (const e of (await fs.readdir(d, { withFileTypes: true })) as fs.Dirent[]) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name === "SKILL.md")
        out.push(path.relative(dir, full).split(path.sep).join("/"));
    }
  }
  await walk(dir);
  return out.sort();
}

/** `harness skills list` — skills instaladas e disponíveis, por categoria. */
export async function runSkillsList(): Promise<void> {
  const cwd = process.cwd();
  const { paths, config } = await resolveConfigured(cwd);

  logger.title("harness skills list");

  const installed = await walkInstalled(paths.skillsDir);
  const catalog = (await listCoreSkillTemplates()).map(skillSubPath);

  const byCat = new Map<string, string[]>();
  for (const sp of installed) {
    const { category, name } = parseRef(sp);
    byCat.set(category, [...(byCat.get(category) ?? []), name]);
  }

  logger.plain(`Instaladas em ${rel(cwd, paths.skillsDir)}: ${installed.length}`);
  if (installed.length === 0) {
    logger.hint("Rode `harness init` para instalar o core universal.");
  }
  for (const [cat, names] of [...byCat.entries()].sort()) {
    logger.plain(`\n  ${chalk.bold(cat)} (${names.length})`);
    for (const n of names.sort()) logger.plain(`    • ${n}`);
  }

  const missing = catalog.filter((c) => !installed.includes(c));
  logger.plain();
  logger.plain(
    `Catálogo universal: ${catalog.length} skill(s) — ${missing.length} não instalada(s).`,
  );
  if (config?.installedAdapters?.length) {
    logger.plain(
      `Adapters instalados: ${config.installedAdapters.join(", ")}`,
    );
  } else {
    logger.hint("Adapters opcionais: harness adapter list / harness adapter add <nome>");
  }
}
