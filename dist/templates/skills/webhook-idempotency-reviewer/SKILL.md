---
name: webhook-idempotency-reviewer
description: Use ao implementar ou revisar qualquer webhook/consumidor de eventos. Não use para chamadas request/response síncronas simples sem reentrega.
---

# webhook-idempotency-reviewer

## Objetivo

Evitar processamento duplicado de webhooks e eventos, garantindo respostas
previsíveis e reprocessamento seguro.

## Quando usar

- Implementar um endpoint que recebe webhooks (pagamentos, Evolution, etc.)
- Consumir filas/eventos com possibilidade de reentrega
- Revisar integrações que disparam efeitos colaterais

## Quando não usar

- Endpoint puramente síncrono sem reentrega nem efeito colateral duplicável

## Regras obrigatórias

- Todo webhook relevante deve ter chave idempotente (event id / hash).
- Eventos recebidos devem ser registrados (persistidos).
- Eventos duplicados devem ser ignorados ou tratados com segurança.
- Webhooks devem retornar respostas previsíveis (ex.: 200 mesmo em duplicado).
- Falhas devem ser reprocessáveis quando aplicável (retry seguro).

## Checklist de validação

- [ ] Chave idempotente extraída e persistida
- [ ] Verificação "já processei este evento?" antes do efeito colateral
- [ ] Duplicado responde sucesso sem reexecutar o efeito
- [ ] Assinatura/origem do webhook verificada
- [ ] Falha transitória é reprocessável (sem duplicar efeito)
- [ ] Respostas HTTP consistentes e documentadas

## Exemplos

```ts
const seen = await store.has(event.id);
if (seen) return ok(); // idempotente: não reprocessa
await store.markProcessing(event.id);
await handle(event);
await store.markDone(event.id);
return ok();
```

## Anti-padrões

- ❌ Processar efeito colateral antes de checar duplicidade
- ❌ Retornar 500 em duplicado (provoca retries infinitos)
- ❌ Não persistir o evento recebido
- ❌ Retry que duplica cobrança/mensagem
