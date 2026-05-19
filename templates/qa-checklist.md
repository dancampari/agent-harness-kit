# QA Checklist (antes de declarar pronto)

> Use junto com a skill `qa-before-done`.

## Funcional

- [ ] O objetivo da tarefa foi cumprido de fato (não parcialmente)
- [ ] Casos de erro tratados (input inválido, falha de rede, ausência de dados)
- [ ] Nenhuma regressão em fluxos existentes

## Qualidade

- [ ] `lint` executado ou justificado
- [ ] `typecheck` executado ou justificado
- [ ] `build` executado ou justificado
- [ ] `test` executado ou justificado
- [ ] Sem `TODO`/`FIXME`/`XXX`/`HACK` críticos remanescentes

## Segurança / dados

- [ ] Sem segredos hardcoded; variáveis de ambiente documentadas
- [ ] Multi-tenant preservado (sem vazamento entre tenants)
- [ ] RLS preservado (se Supabase)
- [ ] service role nunca exposto ao client

## Integrações

- [ ] Webhooks idempotentes
- [ ] Mensagens automáticas só com toggle/config explícita

## Registro

- [ ] Decisões relevantes em `.harness/decisions.md`
- [ ] Falhas encontradas registradas via `harness failure add`
- [ ] `harness done` executado e sem bloqueios
