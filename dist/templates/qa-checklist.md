# QA Checklist (antes de declarar pronto)

> Use junto com as skills `agent-behavior/no-premature-victory` e
> `core/validation-before-done`. Universal — não assume stack.

## Funcional

- [ ] O objetivo da tarefa foi cumprido de fato (não parcialmente)
- [ ] Casos de erro tratados (entrada inválida, falha externa, ausência de dados)
- [ ] Nenhuma regressão em fluxos existentes

## Qualidade

- [ ] Validações disponíveis executadas (lint/typecheck/build/test) ou justificadas
- [ ] Sem `TODO`/`FIXME`/`XXX`/`HACK` críticos remanescentes
- [ ] Complexidade/duplicação não pioraram sem motivo

## Segurança / dados

- [ ] Sem segredos hardcoded; configuração sensível fora do código
- [ ] Limites de autenticação/autorização respeitados
- [ ] Isolamento de dados preservado quando houver múltiplos donos/tenants
- [ ] Entradas validadas nas fronteiras do sistema

## Integrações (se aplicável)

- [ ] Chamadas externas com tratamento de erro e timeout/retry adequados
- [ ] Operações sensíveis idempotentes (sem efeito duplicado)

## Registro

- [ ] Decisões relevantes em `.harness/decisions.md`
- [ ] Falhas encontradas registradas via `harness failure add`
- [ ] `harness done` executado e sem bloqueios
