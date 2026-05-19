import { useEffect, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import chokidar, { type FSWatcher } from "chokidar";
import { loadSnapshot, elapsedLabel, type UiSnapshot } from "../core/uiSnapshot.js";
import type { RunStatus, ValidationState } from "../types/index.js";

function statusColor(status: RunStatus): string {
  if (status === "done" || status === "passed") return "green";
  if (status === "needs_fix" || status === "failed") return "red";
  if (status === "validating") return "yellow";
  return "cyan";
}

function vMark(state: ValidationState): { text: string; color: string } {
  if (state === "passed") return { text: "passed", color: "green" };
  if (state === "failed") return { text: "failed", color: "red" };
  if (state === "skipped") return { text: "skipped", color: "yellow" };
  return { text: "not_run", color: "gray" };
}

export interface AppProps {
  cwd: string;
}

export function App({ cwd }: AppProps): JSX.Element {
  const { exit } = useApp();
  const [snap, setSnap] = useState<UiSnapshot | null>(null);
  const [, setTick] = useState(0);

  useInput((input, key) => {
    if (input === "q" || (key.ctrl && input === "c")) exit();
  });

  useEffect(() => {
    let watcher: FSWatcher | undefined;
    let disposed = false;

    const refresh = async (): Promise<void> => {
      const next = await loadSnapshot(cwd);
      if (!disposed) setSnap(next);
      if (!disposed && !watcher && next.watchPaths.length > 0) {
        watcher = chokidar.watch(next.watchPaths, {
          ignoreInitial: true,
          depth: 3,
        });
        watcher.on("all", () => {
          void refresh();
        });
      }
    };

    void refresh();
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      disposed = true;
      clearInterval(timer);
      if (watcher) void watcher.close();
    };
  }, [cwd]);

  if (!snap) {
    return (
      <Text>
        <Text color="cyan">harness ui</Text> — carregando…
      </Text>
    );
  }

  const run = snap.active;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box>
        <Text color="cyan" bold>
          ▣ Agent Harness Kit
        </Text>
        <Text> — projeto </Text>
        <Text bold>{snap.projectName}</Text>
        <Text dimColor> (q para sair)</Text>
      </Box>

      {!snap.hasActiveRun || !run ? (
        <Box marginTop={1} flexDirection="column">
          <Text color="yellow">Nenhuma execução ativa.</Text>
          <Text dimColor>
            Inicie com: harness feature start "&lt;nome&gt;"
          </Text>
        </Box>
      ) : (
        <Box marginTop={1} flexDirection="column">
          <Box>
            <Text>Feature: </Text>
            <Text bold>{run.feature}</Text>
          </Box>
          <Box>
            <Text>Status: </Text>
            <Text color={statusColor(run.status)} bold>
              {run.status}
            </Text>
            <Text> · score </Text>
            <Text bold>{run.score}/100</Text>
            <Text> · agente {run.agent}</Text>
            <Text> · {elapsedLabel(run.startedAt, run.finishedAt)}</Text>
          </Box>
          <Box marginTop={1}>
            <Text>Validações: </Text>
            {(["lint", "typecheck", "build", "test"] as const).map((k) => {
              const m = vMark(run.validations[k]);
              return (
                <Text key={k}>
                  {k}=
                  <Text color={m.color}>{m.text}</Text>
                  {"  "}
                </Text>
              );
            })}
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text dimColor>
              Arquivos alterados ({run.filesChanged.length}):
            </Text>
            {run.filesChanged.slice(0, 6).map((f) => (
              <Text key={f}> • {f}</Text>
            ))}
            {run.filesChanged.length === 0 && <Text dimColor> (nenhum)</Text>}
          </Box>
          {run.blockReason && (
            <Box
              marginTop={1}
              flexDirection="column"
              borderStyle="round"
              borderColor="red"
              paddingX={1}
            >
              <Text color="red" bold>
                Bloqueio de conclusão
              </Text>
              <Text color="red">{run.blockReason}</Text>
            </Box>
          )}
          <Box marginTop={1} flexDirection="column">
            <Text dimColor>Últimos eventos:</Text>
            {snap.events.slice(-8).map((e, i) => (
              <Text key={`${e.timestamp}-${i}`}>
                <Text dimColor>{e.timestamp.slice(11, 19)} </Text>
                <Text color="magenta">[{e.type}]</Text> {e.message}
              </Text>
            ))}
            {snap.events.length === 0 && <Text dimColor> (sem eventos)</Text>}
          </Box>
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>Execuções recentes:</Text>
        {snap.runs.slice(0, 5).map((r) => (
          <Text key={r.runId}>
            <Text dimColor>{r.runId}</Text>{" "}
            <Text color={statusColor(r.status)}>{r.status}</Text> score=
            {r.score} — {r.feature}
          </Text>
        ))}
        {snap.runs.length === 0 && <Text dimColor> (nenhuma)</Text>}
      </Box>

      {snap.reportExcerpt && (
        <Box
          marginTop={1}
          flexDirection="column"
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
        >
          <Text dimColor>Relatório mais recente (trecho):</Text>
          {snap.reportExcerpt.split("\n").slice(0, 10).map((l, i) => (
            <Text key={i}>{l}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
