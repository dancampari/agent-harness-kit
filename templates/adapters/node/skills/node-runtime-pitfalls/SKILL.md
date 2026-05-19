---
name: node-runtime-pitfalls
description: Use ao revisar código Node.js quanto a async, streams, vazamentos e tratamento de erros.
category: adapter:node
risk_level: high
---

# Objetivo
Detectar armadilhas comuns de runtime Node.js que causam crashes, vazamentos ou comportamento não determinístico.

# Quando usar
- Código com `async/await`, Promises, streams ou event emitters.
- Manipulação de processos, sinais ou variáveis globais.
- Operações de I/O intensivas ou de longa duração.

# Quando não usar
- Código puramente frontend sem runtime Node.
- Scripts triviais sem assíncrono ou I/O.

# Regras obrigatórias
- Toda Promise deve ter tratamento de erro (`try/catch` ou `.catch`); nada de rejeições não tratadas.
- `await` dentro de loops sequenciais deve ser justificado; preferir `Promise.all` quando independente.
- Streams devem tratar `error` e usar `pipeline` em vez de `pipe` encadeado.
- Não bloquear o event loop com operações síncronas pesadas (`fs.readFileSync` em request handler).
- Listeners de eventos devem ser removidos para evitar vazamento de memória.

# Processo
1. Mapeie fluxos assíncronos e verifique propagação de erros.
2. Identifique `await` em loop e avalie paralelização segura.
3. Revise streams: tratamento de `error` e backpressure.
4. Procure chamadas síncronas bloqueantes em caminhos quentes.
5. Cheque `process.on('unhandledRejection')` e `uncaughtException` para observabilidade.

# Checklist
- [ ] Sem rejeições de Promise não tratadas.
- [ ] Sem bloqueio do event loop em handlers.
- [ ] Streams com `error` tratado e backpressure.
- [ ] Listeners removidos quando aplicável.
- [ ] Paralelização aplicada onde seguro.

# Anti-padrões
- `forEach(async ...)` esperando sequenciamento.
- `JSON.parse` de entrada não confiável sem `try/catch`.
- `fs.readFileSync` em rota HTTP.
- Engolir erros com `.catch(() => {})` vazio.
