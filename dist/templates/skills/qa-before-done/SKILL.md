---
name: qa-before-done
description: Use SEMPRE antes de declarar uma tarefa concluída. Não use como substituto de testes reais nem para revisão de arquitetura.
---

# qa-before-done

## Objetivo

Impedir a vitória prematura do agente: garantir que a tarefa foi de fato
concluída, validada e sem pendências críticas.

## Quando usar

- Sempre, imediatamente antes de afirmar "concluído"
- Após qualquer correção que possa ter efeitos colaterais

## Quando não usar

- No meio da implementação (use ao final)
- Como desculpa para não escrever testes de verdade

## Regras obrigatórias

- Verificar todos os critérios de aceite (`.harness/acceptance-criteria.md`).
- Rodar as validações (`harness validate`).
- Revisar erros e mensagens de build/lint/test.
- Procurar TODOs críticos (`TODO`/`FIXME`/`XXX`/`HACK`).
- Conferir se a tarefa foi concluída de fato (não parcial).
- Gerar relatório de pendências (`harness done` / `harness report`).

## Checklist de validação

- [ ] Critérios de aceite todos marcados e verdadeiros
- [ ] `harness validate` passou (ou cada falha foi justificada)
- [ ] Sem TODOs críticos
- [ ] Sem arquivos modificados sem explicação
- [ ] Decisões registradas em `.harness/decisions.md`
- [ ] `harness done` sem bloqueios

## Exemplos

```txt
harness validate   # roda lint/typecheck/build/test
harness done       # bloqueia se algo crítico está pendente
harness report     # consolida o estado para revisão humana
```

## Anti-padrões

- ❌ "Acho que está funcionando" sem rodar validação
- ❌ Marcar critérios de aceite sem verificar
- ❌ Ignorar warning de build/lint
- ❌ Declarar pronto com TODO crítico no código
