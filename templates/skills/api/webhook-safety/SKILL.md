---
name: webhook-safety
description: Use ao revisar recebimento de webhooks para verificação de origem, idempotência e segurança.
category: api
risk_level: high
---

# Objetivo
- Garantir que webhooks recebidos sejam autênticos, processados uma única vez e resilientes a reentregas.
- Prevenir fraude, duplicação de efeito e perda de eventos.

# Quando usar
- Ao implementar ou alterar um endpoint receptor de webhook.
- Ao integrar eventos que disparam efeitos colaterais.
- Antes de liberar qualquer entrada de evento externo.

# Quando não usar
- Projeto que não recebe webhooks.
- Endpoint interno sem origem externa não confiável.

# Regras obrigatórias
- A origem deve ser verificada (assinatura, segredo ou autenticação) antes de processar.
- O processamento deve ser idempotente usando um identificador único do evento.
- Eventos repetidos não podem gerar efeito colateral duplicado.
- Processamento pesado deve ocorrer fora do ciclo de resposta.
- Confirmar o recebimento rápido para evitar reentregas desnecessárias.

# Processo
1. Valide a assinatura ou credencial do evento recebido.
2. Extraia o identificador único do evento.
3. Verifique se o evento já foi processado e descarte duplicatas.
4. Registre o evento antes de aplicar efeitos.
5. Processe a lógica de negócio de forma assíncrona quando pesada.
6. Responda confirmando o recebimento e teste reentregas.

# Checklist
- [ ] Assinatura/origem verificada antes do processamento
- [ ] Identificador único usado para idempotência
- [ ] Reentrega não duplica efeito
- [ ] Evento registrado antes de aplicar efeito
- [ ] Processamento pesado fora da resposta
- [ ] Resposta de confirmação rápida

# Anti-padrões
- ❌ Processar o payload sem verificar a origem
- ❌ Confiar apenas no IP de origem como autenticação
- ❌ Aplicar efeito sem checar se o evento já foi tratado
- ❌ Fazer trabalho longo antes de responder ao remetente
- ❌ Tratar toda reentrega como um evento novo
