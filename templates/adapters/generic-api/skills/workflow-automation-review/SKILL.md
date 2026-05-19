---
name: workflow-automation-review
description: Use ao revisar automações de workflow (ex.: n8n, Evolution): idempotência, webhooks e credenciais.
category: adapter:generic-api
risk_level: high
---

# Objetivo
Garantir automações de workflow confiáveis e seguras (idempotência, webhooks, credenciais por placeholder).

# Quando usar
- Construção/alteração de workflows em n8n, Evolution ou orquestradores similares.
- Nós que recebem webhooks ou disparam ações externas (mensagens, gravações).
- Manipulação de credenciais e segredos em automações exportadas/versionadas.

# Quando não usar
- Lógica de aplicação fora de orquestradores de workflow.
- Mudanças sem impacto em execução de fluxo.

# Regras obrigatórias
- Operações de escrita/efeito externo devem ser idempotentes (chave de deduplicação/idempotência).
- Webhooks de entrada devem validar origem (assinatura/token secreto), não confiar só na URL.
- Credenciais NUNCA embutidas no JSON do workflow versionado; usar placeholders/credenciais do orquestrador.
- Tratar reentrega/duplicação de eventos (webhooks podem chegar mais de uma vez).
- Falhas devem ter retry controlado e caminho de erro explícito (sem loop infinito).

# Processo
1. Mapeie gatilhos (webhook, cron) e ações com efeito externo.
2. Verifique idempotência em cada ação de escrita.
3. Confirme validação de assinatura/token nos webhooks.
4. Procure credenciais embutidas; exija placeholders.
5. Revise tratamento de erro, retry e dedupe de eventos.

# Checklist
- [ ] Ações externas idempotentes.
- [ ] Webhooks com validação de origem.
- [ ] Credenciais por placeholder, não no JSON.
- [ ] Reentrega de eventos tratada.
- [ ] Retry controlado + caminho de erro.

# Anti-padrões
- Workflow exportado com token da Evolution/API no JSON.
- Webhook que age sem validar assinatura.
- Reprocessar evento duplicado criando registro repetido.
- Nó de erro reenfileirando para si mesmo sem limite.
