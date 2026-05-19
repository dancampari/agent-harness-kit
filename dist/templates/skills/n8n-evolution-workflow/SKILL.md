---
name: n8n-evolution-workflow
description: Use para padronizar workflows n8n integrados à Evolution API v2 (WhatsApp). Não use para lógica de aplicação fora do n8n nem para revisão de RLS (use supabase-rls-reviewer).
---

# n8n-evolution-workflow

## Objetivo

Padronizar workflows n8n para integração confiável com a Evolution API v2,
com idempotência, logs e separação de mensagens transacionais x promocionais.

## Quando usar

- Criar/editar um workflow n8n que fala com a Evolution API v2
- Configurar webhooks de entrada de mensagens
- Disparar mensagens (transacionais ou campanhas)

## Quando não usar

- A integração não passa por n8n
- A tarefa é só backend/app sem orquestração n8n

## Regras obrigatórias

- Preferir nós nativos do n8n quando disponíveis.
- Usar placeholders para credenciais (nunca tokens hardcoded).
- Documentar webhooks (URL, payload, segurança).
- Garantir idempotência (chave por messageId/evento).
- Registrar logs de cada execução relevante.
- Separar mensagens transacionais de promocionais.
- Respeitar toggles de ativação de mensagens (não enviar sem opt-in/config).

## Checklist de validação

- [ ] Credenciais via credential store / placeholder, não hardcoded
- [ ] Webhook documentado (incluindo verificação de origem)
- [ ] Deduplicação por chave idempotente implementada
- [ ] Logs/observabilidade no fluxo
- [ ] Toggle de envio respeitado
- [ ] Transacional e promocional em fluxos/segmentos distintos

## Exemplos

```txt
Webhook (Evolution) -> Normalizar payload -> Checar idempotência
  -> [novo] processar + log -> responder 200
  -> [duplicado] log + responder 200 (sem reprocessar)
```

## Anti-padrões

- ❌ Token da Evolution colado no nó
- ❌ Workflow que reenvia em retry sem deduplicar
- ❌ Campanha promocional sem checar toggle/opt-in
- ❌ Falha silenciosa sem log
