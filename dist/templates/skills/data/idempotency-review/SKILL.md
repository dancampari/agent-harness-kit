---
name: idempotency-review
description: Use ao revisar processamento de eventos, webhooks ou retries para evitar efeitos de duplicação.
category: data
risk_level: high
---

# Objetivo
- Garantir que reprocessar a mesma operação não cause efeitos duplicados.
- Tornar webhooks, eventos e retries seguros sob entrega "pelo menos uma vez".
- Proteger consistência de dados diante de mensagens repetidas ou fora de ordem.

# Quando usar
- Ao consumir webhooks, eventos ou mensagens de filas.
- Ao implementar retries de operações com efeitos colaterais.
- Ao revisar fluxos onde a mesma requisição pode chegar mais de uma vez.

# Quando não usar
- Operações puramente de leitura sem efeito colateral.
- Cálculos determinísticos sem persistência ou ação externa.

# Regras obrigatórias
- Cada operação com efeito colateral tem chave de idempotência estável.
- Resultado de uma chave já processada é reutilizado, não reexecutado.
- Detecção de duplicata ocorre de forma atômica com o efeito.
- Ordem fora de sequência não corrompe estado final.
- Falhas parciais são seguras para reexecução completa.

# Processo
1. Identificar operações com efeito colateral no fluxo.
2. Definir a chave de idempotência derivada do evento, não do recebimento.
3. Registrar e checar a chave de forma atômica com o efeito.
4. Garantir reuso do resultado anterior em reentregas.
5. Testar entregas duplicadas, fora de ordem e retries após falha parcial.

# Checklist
- [ ] Operações com efeito colateral mapeadas.
- [ ] Chave de idempotência estável e derivada do evento.
- [ ] Verificação de duplicata atômica com a aplicação do efeito.
- [ ] Reentrega retorna resultado anterior sem reexecutar.
- [ ] Eventos fora de ordem não corrompem o estado.
- [ ] Retries após falha parcial são seguros.

# Anti-padrões
❌ Usar timestamp de recebimento como chave de idempotência.
❌ Checar duplicata e aplicar efeito em passos não atômicos.
❌ Assumir entrega exatamente uma vez.
❌ Reexecutar efeitos colaterais a cada retry sem deduplicação.
❌ Ignorar eventos fora de ordem no projeto do estado.
