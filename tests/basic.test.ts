import { describe, it, expect } from "vitest";
import {
  harnessConfigSchema,
  defaultConfig,
  parseAgentTargets,
} from "../src/core/config.js";
import { fileStamp, backupStamp } from "../src/core/date.js";
import { renderTemplate } from "../src/core/templates.js";
import { resolveProjectPaths, rel } from "../src/core/paths.js";

describe("config schema", () => {
  it("aplica defaults a um objeto vazio", () => {
    const cfg = harnessConfigSchema.parse({});
    expect(cfg.agentTargets).toEqual(["codex"]);
    expect(cfg.packageManager).toBe("pnpm");
    expect(cfg.validation.lint).toBe("pnpm lint");
    expect(cfg.paths.harness).toBe(".harness");
  });

  it("rejeita agentTarget inválido", () => {
    const result = harnessConfigSchema.safeParse({ agentTargets: ["gpt-9000"] });
    expect(result.success).toBe(false);
  });

  it("defaultConfig preenche o projectName", () => {
    const cfg = defaultConfig("meu-projeto");
    expect(cfg.projectName).toBe("meu-projeto");
    expect(cfg.agentTargets).toEqual(["codex"]);
  });

  it("defaultConfig aceita agentTargets explícitos", () => {
    const cfg = defaultConfig("p", ["codex", "claude-code"]);
    expect(cfg.agentTargets).toEqual(["codex", "claude-code"]);
  });

  it("expõe paths do Claude por padrão", () => {
    const cfg = harnessConfigSchema.parse({});
    expect(cfg.paths.claudeSkills).toBe(".claude/skills");
    expect(cfg.paths.claudeHooks).toBe(".claude/hooks");
  });
});

describe("parseAgentTargets", () => {
  it("faz parse de CSV e normaliza 'claude' -> 'claude-code'", () => {
    expect(parseAgentTargets("codex, claude")).toEqual(["codex", "claude-code"]);
  });

  it("remove duplicados", () => {
    expect(parseAgentTargets("codex,codex")).toEqual(["codex"]);
  });

  it("lança erro em alvo inválido", () => {
    expect(() => parseAgentTargets("gpt-9000")).toThrow(/inválido/i);
  });
});

describe("date helpers", () => {
  it("fileStamp tem formato YYYY-MM-DD-HH-mm", () => {
    const stamp = fileStamp(new Date("2026-05-18T09:07:00"));
    expect(stamp).toBe("2026-05-18-09-07");
  });

  it("backupStamp não contém caracteres inválidos para nome de arquivo", () => {
    const stamp = backupStamp(new Date("2026-05-18T09:07:05"));
    expect(stamp).toMatch(/^\d{8}-\d{6}$/);
  });
});

describe("template rendering", () => {
  it("substitui placeholders conhecidos", () => {
    const out = renderTemplate("Projeto: {{PROJECT_NAME}}", {
      PROJECT_NAME: "barberpro",
    });
    expect(out).toBe("Projeto: barberpro");
  });

  it("mantém placeholders desconhecidos intactos", () => {
    const out = renderTemplate("X {{UNKNOWN}}", { PROJECT_NAME: "y" });
    expect(out).toBe("X {{UNKNOWN}}");
  });
});

describe("project paths", () => {
  it("resolve caminhos relativos a partir do cwd", () => {
    const p = resolveProjectPaths("/proj");
    expect(rel("/proj", p.configFile)).toBe(".harness/harness.config.json");
    expect(rel("/proj", p.agentsFile)).toBe("AGENTS.md");
    expect(rel("/proj", p.skillsDir)).toBe(".agents/skills");
  });

  it("resolve caminhos do Claude Code", () => {
    const p = resolveProjectPaths("/proj");
    expect(rel("/proj", p.claudeFile)).toBe("CLAUDE.md");
    expect(rel("/proj", p.claudeSkillsDir)).toBe(".claude/skills");
    expect(rel("/proj", p.claudeHooksDir)).toBe(".claude/hooks");
    expect(rel("/proj", p.claudeDir)).toBe(".claude");
  });
});
