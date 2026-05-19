import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  platform: "node",
  outDir: "dist",
  clean: true,
  dts: false,
  sourcemap: true,
  // splitting habilitado para suportar import() preguiçoso da TUI (ink/react),
  // evitando carregar React/ink em invocações de hook.
  splitting: true,
  shims: false,
  // Não empacotar node_modules: ink/react/yoga-wasm/chokidar são resolvidos
  // em runtime a partir do node_modules do pacote (evita problemas de bundle).
  skipNodeModulesBundle: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
