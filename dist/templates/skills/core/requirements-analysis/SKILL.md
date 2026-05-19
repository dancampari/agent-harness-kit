---
name: requirements-analysis
description: Use para transformar um pedido em requisitos claros e sem ambiguidade antes de planejar.
category: core
risk_level: low
---

# Objetivo
Converter um pedido informal em requisitos explícitos, testáveis e priorizados.
Eliminar ambiguidades que causariam entrega errada ou incompleta.

# Quando usar
- Ao receber um pedido vago ou amplo.
- Antes de planejar implementação não trivial.
- Quando há múltiplas interpretações possíveis do pedido.
- Quando restrições e limites não estão explícitos.
- Antes de estimar esforço.

# Quando não usar
- Pedido já totalmente especificado e inequívoco.
- Correção mínima com escopo óbvio.

# Regras obrigatórias
- Separe o que foi pedido do que foi inferido.
- Liste requisitos funcionais e não funcionais distintamente.
- Torne cada requisito verificável.
- Identifique restrições, dependências e o que está fora de escopo.
- Não preencha lacunas com suposições silenciosas; pergunte ou registre.
- Priorize: essencial versus desejável.

# Processo
1. Reescreva o pedido com suas próprias palavras.
2. Extraia requisitos funcionais.
3. Extraia requisitos não funcionais e restrições.
4. Liste ambiguidades e perguntas em aberto.
5. Defina explicitamente o que está fora de escopo.
6. Priorize os requisitos.

# Checklist
- [ ] Pedido reescrito e confirmado.
- [ ] Requisitos funcionais listados.
- [ ] Requisitos não funcionais listados.
- [ ] Cada requisito é verificável.
- [ ] Ambiguidades registradas ou resolvidas.
- [ ] Fora de escopo definido.
- [ ] Prioridades atribuídas.

# Anti-padrões
- ❌ Tratar um pedido vago como especificação final.
- ❌ Misturar requisito com solução técnica.
- ❌ Ignorar requisitos não funcionais.
- ❌ Esconder suposições no código.
