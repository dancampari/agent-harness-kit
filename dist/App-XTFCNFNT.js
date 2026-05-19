#!/usr/bin/env node
import {
  elapsedLabel,
  loadSnapshot
} from "./chunk-6WZQTTLJ.js";

// src/ui/App.tsx
import { useEffect, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import chokidar from "chokidar";
import { jsx, jsxs } from "react/jsx-runtime";
function statusColor(status) {
  if (status === "done" || status === "passed") return "green";
  if (status === "needs_fix" || status === "failed") return "red";
  if (status === "validating") return "yellow";
  return "cyan";
}
function vMark(state) {
  if (state === "passed") return { text: "passed", color: "green" };
  if (state === "failed") return { text: "failed", color: "red" };
  if (state === "skipped") return { text: "skipped", color: "yellow" };
  return { text: "not_run", color: "gray" };
}
function App({ cwd }) {
  const { exit } = useApp();
  const [snap, setSnap] = useState(null);
  const [, setTick] = useState(0);
  useInput((input, key) => {
    if (input === "q" || key.ctrl && input === "c") exit();
  });
  useEffect(() => {
    let watcher;
    let disposed = false;
    const refresh = async () => {
      const next = await loadSnapshot(cwd);
      if (!disposed) setSnap(next);
      if (!disposed && !watcher && next.watchPaths.length > 0) {
        watcher = chokidar.watch(next.watchPaths, {
          ignoreInitial: true,
          depth: 3
        });
        watcher.on("all", () => {
          void refresh();
        });
      }
    };
    void refresh();
    const timer = setInterval(() => setTick((t) => t + 1), 1e3);
    return () => {
      disposed = true;
      clearInterval(timer);
      if (watcher) void watcher.close();
    };
  }, [cwd]);
  if (!snap) {
    return /* @__PURE__ */ jsxs(Text, { children: [
      /* @__PURE__ */ jsx(Text, { color: "cyan", children: "harness ui" }),
      " \u2014 carregando\u2026"
    ] });
  }
  const run = snap.active;
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", paddingX: 1, children: [
    /* @__PURE__ */ jsxs(Box, { children: [
      /* @__PURE__ */ jsx(Text, { color: "cyan", bold: true, children: "\u25A3 Agent Harness Kit" }),
      /* @__PURE__ */ jsx(Text, { children: " \u2014 projeto " }),
      /* @__PURE__ */ jsx(Text, { bold: true, children: snap.projectName }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " (q para sair)" })
    ] }),
    !snap.hasActiveRun || !run ? /* @__PURE__ */ jsxs(Box, { marginTop: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Text, { color: "yellow", children: "Nenhuma execu\xE7\xE3o ativa." }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: 'Inicie com: harness feature start "<nome>"' })
    ] }) : /* @__PURE__ */ jsxs(Box, { marginTop: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsxs(Box, { children: [
        /* @__PURE__ */ jsx(Text, { children: "Feature: " }),
        /* @__PURE__ */ jsx(Text, { bold: true, children: run.feature })
      ] }),
      /* @__PURE__ */ jsxs(Box, { children: [
        /* @__PURE__ */ jsx(Text, { children: "Status: " }),
        /* @__PURE__ */ jsx(Text, { color: statusColor(run.status), bold: true, children: run.status }),
        /* @__PURE__ */ jsx(Text, { children: " \xB7 score " }),
        /* @__PURE__ */ jsxs(Text, { bold: true, children: [
          run.score,
          "/100"
        ] }),
        /* @__PURE__ */ jsxs(Text, { children: [
          " \xB7 agente ",
          run.agent
        ] }),
        /* @__PURE__ */ jsxs(Text, { children: [
          " \xB7 ",
          elapsedLabel(run.startedAt, run.finishedAt)
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Box, { marginTop: 1, children: [
        /* @__PURE__ */ jsx(Text, { children: "Valida\xE7\xF5es: " }),
        ["lint", "typecheck", "build", "test"].map((k) => {
          const m = vMark(run.validations[k]);
          return /* @__PURE__ */ jsxs(Text, { children: [
            k,
            "=",
            /* @__PURE__ */ jsx(Text, { color: m.color, children: m.text }),
            "  "
          ] }, k);
        })
      ] }),
      /* @__PURE__ */ jsxs(Box, { marginTop: 1, flexDirection: "column", children: [
        /* @__PURE__ */ jsxs(Text, { dimColor: true, children: [
          "Arquivos alterados (",
          run.filesChanged.length,
          "):"
        ] }),
        run.filesChanged.slice(0, 6).map((f) => /* @__PURE__ */ jsxs(Text, { children: [
          " \u2022 ",
          f
        ] }, f)),
        run.filesChanged.length === 0 && /* @__PURE__ */ jsx(Text, { dimColor: true, children: " (nenhum)" })
      ] }),
      run.blockReason && /* @__PURE__ */ jsxs(
        Box,
        {
          marginTop: 1,
          flexDirection: "column",
          borderStyle: "round",
          borderColor: "red",
          paddingX: 1,
          children: [
            /* @__PURE__ */ jsx(Text, { color: "red", bold: true, children: "Bloqueio de conclus\xE3o" }),
            /* @__PURE__ */ jsx(Text, { color: "red", children: run.blockReason })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(Box, { marginTop: 1, flexDirection: "column", children: [
        /* @__PURE__ */ jsx(Text, { dimColor: true, children: "\xDAltimos eventos:" }),
        snap.events.slice(-8).map((e, i) => /* @__PURE__ */ jsxs(Text, { children: [
          /* @__PURE__ */ jsxs(Text, { dimColor: true, children: [
            e.timestamp.slice(11, 19),
            " "
          ] }),
          /* @__PURE__ */ jsxs(Text, { color: "magenta", children: [
            "[",
            e.type,
            "]"
          ] }),
          " ",
          e.message
        ] }, `${e.timestamp}-${i}`)),
        snap.events.length === 0 && /* @__PURE__ */ jsx(Text, { dimColor: true, children: " (sem eventos)" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Box, { marginTop: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: "Execu\xE7\xF5es recentes:" }),
      snap.runs.slice(0, 5).map((r) => /* @__PURE__ */ jsxs(Text, { children: [
        /* @__PURE__ */ jsx(Text, { dimColor: true, children: r.runId }),
        " ",
        /* @__PURE__ */ jsx(Text, { color: statusColor(r.status), children: r.status }),
        " score=",
        r.score,
        " \u2014 ",
        r.feature
      ] }, r.runId)),
      snap.runs.length === 0 && /* @__PURE__ */ jsx(Text, { dimColor: true, children: " (nenhuma)" })
    ] }),
    snap.reportExcerpt && /* @__PURE__ */ jsxs(
      Box,
      {
        marginTop: 1,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: "gray",
        paddingX: 1,
        children: [
          /* @__PURE__ */ jsx(Text, { dimColor: true, children: "Relat\xF3rio mais recente (trecho):" }),
          snap.reportExcerpt.split("\n").slice(0, 10).map((l, i) => /* @__PURE__ */ jsx(Text, { children: l }, i))
        ]
      }
    )
  ] });
}
export {
  App
};
//# sourceMappingURL=App-XTFCNFNT.js.map